import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import heicConvert from 'heic-convert'
import { selectWebhookForUser } from '@/lib/webhooks/selector'

// Helper function to convert HEIC to JPEG
async function convertHeicToJpeg(file: File): Promise<{ buffer: Buffer; fileName: string }> {
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const outputBuffer = await heicConvert({
    buffer,
    format: 'JPEG',
    quality: 0.9,
  })

  // Change file extension to .jpg
  const fileName = file.name.replace(/\.(heic|HEIC)$/i, '.jpg')

  return {
    buffer: Buffer.from(outputBuffer),
    fileName,
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

    const jobs = await prisma.job.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
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

    const formData = await req.formData()
    const prompt = formData.get('prompt') as string
    const promptType = formData.get('promptType') as string
    const presetId = formData.get('presetId') as string | null
    const phone = formData.get('phone') as string | null
    const notifyByEmail = formData.get('notifyByEmail') === 'true'
    const productName = formData.get('productName') as string | null
    const productCategory = formData.get('productCategory') as string | null
    const productSku = formData.get('productSku') as string | null
    const images = formData.getAll('images') as File[]
    const imageUrlsJson = formData.get('imageUrls') as string | null

    // Parse image URLs if provided
    let imageUrls: string[] = []
    if (imageUrlsJson) {
      try {
        imageUrls = JSON.parse(imageUrlsJson)
      } catch (e) {
        console.error('Failed to parse imageUrls:', e)
      }
    }

    // Must have at least one image (file or URL)
    if (!prompt || !promptType || (images.length === 0 && imageUrls.length === 0)) {
      return NextResponse.json(
        { error: 'Missing required fields or no images provided' },
        { status: 400 }
      )
    }

    // Collect all input image URLs
    const inputImageUrls: string[] = []

    // Upload file images to Supabase Storage
    for (let i = 0; i < images.length; i++) {
      const file = images[i]
      let uploadData: Buffer | File = file
      let uploadFileName = file.name

      // Check if file is HEIC and convert to JPEG
      if (file.name.match(/\.(heic|HEIC)$/i)) {
        console.log(`🔄 Converting HEIC to JPEG: ${file.name}`)
        const converted = await convertHeicToJpeg(file)
        uploadData = converted.buffer
        uploadFileName = converted.fileName
        console.log(`✅ Converted to: ${uploadFileName}`)
      }

      const fileName = `${user.id}/${Date.now()}-${i}-${uploadFileName}`

      const { data, error } = await supabase.storage
        .from('temp-images')
        .upload(fileName, uploadData, {
          contentType: uploadFileName.endsWith('.jpg') ? 'image/jpeg' : undefined,
        })

      if (error) {
        console.error('Error uploading image:', error)
        throw new Error('Failed to upload image')
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('temp-images').getPublicUrl(fileName)

      inputImageUrls.push(publicUrl)
    }

    // Add URL images directly (no upload needed)
    inputImageUrls.push(...imageUrls)

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
