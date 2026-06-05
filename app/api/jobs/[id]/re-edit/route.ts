import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { selectWebhookForUser } from '@/lib/webhooks/selector'
import { pricingService } from '@/lib/pricing'

// POST /api/jobs/[id]/re-edit - Create a re-edit job from an existing completed job
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: jobId } = params
    const body = await req.json()
    const { prompt, promptType, presetId, brandPromptId, selectedImageUrl } = body

    // Get the original job
    const originalJob = await prisma.job.findFirst({
      where: {
        id: jobId,
        userId: user.id,
        status: 'completed'
      }
    })

    if (!originalJob) {
      return NextResponse.json(
        { error: 'Original job not found or not accessible' },
        { status: 404 }
      )
    }

    // Check if user has sufficient credits using new pricing service
    const hasSufficientCredits = await pricingService.checkSufficientCredits(user.id, 1)

    if (!hasSufficientCredits) {
      // Get user credit info for detailed error message
      const creditInfo = await pricingService.getUserCreditInfo(user.id)

      return NextResponse.json(
        {
          error: 'Insufficient credits for re-editing',
          creditBalance: creditInfo.creditBalance,
          ratePerImage: creditInfo.ratePerImage,
          imagesAvailable: creditInfo.imagesAvailable
        },
        { status: 400 }
      )
    }

    // Select appropriate webhook for user
    const selectedWebhook = await selectWebhookForUser({
      userId: user.id,
      webhookType: 'image_processing',
    })

    // Create re-edit job
    // IMPORTANT: Credits will be deducted ONLY on successful completion via webhook callback
    const reEditJob = await prisma.job.create({
      data: {
        userId: user.id,
        prompt,
        promptType,
        presetId,
        brandPromptId,
        parentJobId: originalJob.id,
        isReEdit: true,
        creditsCost: 1,
        creditDeducted: false, // Credits not deducted yet
        webhookId: selectedWebhook.webhookId || null,
        // Use selected image as input, or fallback to original images
        inputImages: selectedImageUrl ? [selectedImageUrl] : originalJob.inputImages,
        productName: originalJob.productName,
        productCategory: originalJob.productCategory,
        productSku: originalJob.productSku,
        phone: originalJob.phone,
        notifyByEmail: originalJob.notifyByEmail,
        status: 'pending',
      },
    })

    // REMOVED: Credit deduction - now happens in webhook callback on successful completion
    // This prevents charging users for failed jobs

    // Send webhook to n8n for processing
    const webhookUrl = selectedWebhook.webhookUrl
    console.log('📤 Re-edit webhook:', selectedWebhook)
    if (webhookUrl) {
      const webhookPayload = {
        jobId: reEditJob.id,
        userId: user.id,
        userEmail: user.email,
        imageUrls: reEditJob.inputImages,
        prompt,
        promptType,
        presetId,
        productName: reEditJob.productName,
        productCategory: reEditJob.productCategory,
        productSku: reEditJob.productSku,
        isReEdit: true,
        originalJobId: originalJob.id,
        callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhook/callback`,
      }

      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(webhookPayload),
        })

        if (response.ok) {
          await prisma.job.update({
            where: { id: reEditJob.id },
            data: { status: 'processing', startedAt: new Date() },
          })
        }
      } catch (webhookError) {
        console.error('Webhook error:', webhookError)
      }
    }

    return NextResponse.json({ job: reEditJob }, { status: 201 })
  } catch (error) {
    console.error('Error creating re-edit job:', error)
    return NextResponse.json(
      { error: 'Failed to create re-edit job' },
      { status: 500 }
    )
  }
}