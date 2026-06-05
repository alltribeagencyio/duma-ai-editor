import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { selectWebhookForUser } from '@/lib/webhooks/selector'
import { pricingService } from '@/lib/pricing'
import { sanitizePrompt } from '@/lib/security'

const MAX_IMAGES = 10

function isValidHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}

// GET /api/jobs - List all jobs for the authenticated user
export async function GET(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Bound the result set to avoid unbounded scans as job history grows.
    const { searchParams } = new URL(req.url)
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '100', 10) || 100, 1), 200)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10) || 0, 0)

    const jobs = await prisma.job.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    })

    return NextResponse.json({ jobs })
  } catch (error) {
    console.error('Error fetching jobs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    )
  }
}

// POST /api/jobs - Create a new job
export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Images are uploaded directly to R2 from the browser; the API now receives
    // only the resulting URLs as JSON.
    const body = await req.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const promptType = body.promptType as string
    const presetId = (body.presetId as string) || null
    const phone = (body.phone as string) || null
    const notifyByEmail = body.notifyByEmail !== false
    const productName = (body.productName as string) || null
    const productCategory = (body.productCategory as string) || null
    const productSku = (body.productSku as string) || null
    const prompt = sanitizePrompt(body.prompt as string, 2000)

    const rawUrls = Array.isArray(body.imageUrls) ? (body.imageUrls as string[]) : []
    const imageUrls = rawUrls.filter((u) => typeof u === 'string' && isValidHttpUrl(u))

    // Validate required fields
    if (!prompt || !promptType || imageUrls.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields or no images provided' },
        { status: 400 }
      )
    }

    if (rawUrls.length !== imageUrls.length) {
      return NextResponse.json({ error: 'One or more image URLs are invalid' }, { status: 400 })
    }

    if (imageUrls.length > MAX_IMAGES) {
      return NextResponse.json(
        { error: `Maximum ${MAX_IMAGES} images per job` },
        { status: 400 }
      )
    }

    // Total number of images to process
    const totalImages = imageUrls.length

    // Check if user has sufficient credits BEFORE processing
    const hasSufficientCredits = await pricingService.checkSufficientCredits(user.id, totalImages)

    if (!hasSufficientCredits) {
      // Get user credit info for detailed error message
      const creditInfo = await pricingService.getUserCreditInfo(user.id)
      return NextResponse.json(
        {
          error: 'Insufficient credits',
          message: `You need credits for ${totalImages} image${totalImages > 1 ? 's' : ''} but only have $${creditInfo.creditBalance.toFixed(2)} (${creditInfo.imagesAvailable} images available). Please purchase more credits to continue.`,
          creditBalance: creditInfo.creditBalance,
          imagesAvailable: creditInfo.imagesAvailable,
          imagesRequested: totalImages
        },
        { status: 402 } // 402 Payment Required
      )
    }

    // Images already live in R2 (uploaded directly from the browser) or are
    // external URLs the user supplied. No server-side upload needed.
    const inputImageUrls: string[] = imageUrls

    // Select appropriate webhook for user
    const selectedWebhook = await selectWebhookForUser({
      userId: user.id,
      webhookType: 'image_processing',
    })

    console.log('📤 Selected webhook:', selectedWebhook)
    console.log('📤 N8N_WEBHOOK_URL from env:', process.env.N8N_WEBHOOK_URL)

    // Create job in database
    const job = await prisma.job.create({
      data: {
        userId: user.id,
        prompt,
        promptType,
        presetId,
        phone,
        notifyByEmail,
        productName,
        productCategory,
        productSku,
        inputImages: inputImageUrls,
        status: 'pending',
        webhookId: selectedWebhook.webhookId || null,
        creditDeducted: false, // Credits will be deducted on successful completion
      },
    })

    // Send webhook to n8n
    const webhookUrl = selectedWebhook.webhookUrl
    console.log('📤 Webhook URL:', webhookUrl)
    console.log('📤 Webhook ID:', selectedWebhook.webhookId || 'fallback (env)')
    console.log('📤 Webhook Name:', selectedWebhook.webhookName || 'N8N_WEBHOOK_URL')

    if (webhookUrl) {
      const webhookPayload = {
        jobId: job.id,
        userId: user.id,
        userEmail: user.email,
        imageUrls: inputImageUrls,
        prompt,
        productName,
        productCategory,
        productSku,
        callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhook/callback`,
      }

      console.log('📤 Sending webhook to:', webhookUrl)
      console.log('📤 Webhook payload:', JSON.stringify(webhookPayload, null, 2))

      try {
        // Create AbortController for timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'DumaAI-ImageEditor/1.0',
            'X-Webhook-Secret': process.env.WEBHOOK_CALLBACK_SECRET || '',
          },
          body: JSON.stringify(webhookPayload),
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        console.log('📤 Webhook response status:', response.status)
        const responseText = await response.text()
        console.log('📤 Webhook response body:', responseText)

        if (response.ok) {
          // Update job status to processing
          await prisma.job.update({
            where: { id: job.id },
            data: { status: 'processing', startedAt: new Date() },
          })
          console.log('✅ Job status updated to processing')
        } else {
          console.error('❌ Webhook returned error status:', response.status)
          console.error('❌ Response body:', responseText)
        }
      } catch (webhookError) {
        console.error('❌ Error sending webhook:', webhookError)
        if (webhookError instanceof Error) {
          console.error('❌ Error details:', webhookError.message)
          console.error('❌ Error stack:', webhookError.stack)

          // Check if it was a timeout
          if (webhookError.name === 'AbortError') {
            console.error('❌ Webhook request timed out after 10 seconds')
          }
        }
        // Don't fail the whole request if webhook fails
      }
    } else {
      console.error('⚠️  No webhook URL configured! Please check:')
      console.error('   - N8N_WEBHOOK_URL environment variable')
      console.error('   - User webhook settings in admin panel')
    }

    return NextResponse.json({ job }, { status: 201 })
  } catch (error) {
    console.error('Error creating job:', error)
    return NextResponse.json(
      { error: 'Failed to create job' },
      { status: 500 }
    )
  }
}
