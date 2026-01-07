import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

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

    // Get user profile to check credits
    const userProfile = await prisma.user.findUnique({
      where: { id: user.id }
    })

    if (!userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Check if user has enough credits
    const totalCredits = userProfile.monthlyCredits + userProfile.practiceCredits
    const availableCredits = totalCredits - userProfile.creditsUsed

    if (availableCredits < 1) {
      return NextResponse.json(
        { error: 'Insufficient credits for re-editing' },
        { status: 400 }
      )
    }

    // Create re-edit job
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

    // Update user credits
    await prisma.user.update({
      where: { id: user.id },
      data: {
        creditsUsed: userProfile.creditsUsed + 1
      }
    })

    // Log credit usage
    await prisma.creditUsage.create({
      data: {
        userId: user.id,
        jobId: reEditJob.id,
        amount: 1,
        type: 're_edit',
        description: `Re-edit of job ${originalJob.id}`
      }
    })

    // Send webhook to n8n for processing
    const webhookUrl = process.env.N8N_WEBHOOK_URL
    if (webhookUrl) {
      const webhookPayload = {
        jobId: reEditJob.id,
        userId: user.id,
        userEmail: user.email,
        imageUrls: reEditJob.inputImages,
        prompt,
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
          headers: { 'Content-Type': 'application/json' },
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