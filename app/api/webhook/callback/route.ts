import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { pricingService } from '@/lib/pricing'

// POST /api/webhook/callback - Receive n8n results
export async function POST(req: NextRequest) {
  try {
    console.log('📥 Received webhook callback from n8n')

    const startTime = Date.now()
    const body = await req.json()
    console.log('📥 Callback payload:', JSON.stringify(body, null, 2))

    const { jobId, status, outputImages, errorMessage, executionId, executionUrl } = body

    // Validation
    if (!jobId) {
      console.error('❌ Missing jobId in callback')
      return NextResponse.json(
        { error: 'Missing jobId' },
        { status: 400 }
      )
    }

    if (!status) {
      console.error('❌ Missing status in callback')
      return NextResponse.json(
        { error: 'Missing status' },
        { status: 400 }
      )
    }

    // Verify job exists
    const existingJob = await prisma.job.findUnique({
      where: { id: jobId },
    })

    if (!existingJob) {
      console.error('❌ Job not found:', jobId)
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    console.log('📝 Updating job:', jobId, 'to status:', status)

    // Prepare output data
    const outputData = outputImages
      ? { images: outputImages, timestamp: new Date().toISOString() }
      : Prisma.JsonNull

    // CRITICAL FIX: Deduct credits ONLY on successful completion if not already deducted
    if (status === 'completed' && !existingJob.creditDeducted) {
      const numberOfImages = outputImages?.length || existingJob.creditsCost || 1

      console.log('💳 Deducting credits for', numberOfImages, 'images from user:', existingJob.userId)

      try {
        // Use new pricing service for credit deduction
        const deductionResult = await pricingService.deductCredits(
          existingJob.userId,
          numberOfImages,
          existingJob.id
        )

        console.log(`✅ Credits deducted: $${deductionResult.costUSD.toFixed(2)} (${numberOfImages} images)`)

        // Legacy credit usage log (kept for backward compatibility)
        await prisma.creditUsage.create({
          data: {
            userId: existingJob.userId,
            jobId: existingJob.id,
            amount: numberOfImages,
            type: existingJob.isReEdit ? 're_edit' : 'new_job',
            description: `Job ${existingJob.id} completed successfully - $${deductionResult.costUSD.toFixed(2)}`,
          },
        })
      } catch (error: any) {
        console.error('❌ Error deducting credits:', error)

        // If insufficient credits, mark job as failed
        if (error.message === 'Insufficient credits') {
          await prisma.job.update({
            where: { id: jobId },
            data: {
              status: 'failed',
              errorMessage: 'Insufficient credits to complete job'
            }
          })

          return NextResponse.json(
            { error: 'Insufficient credits' },
            { status: 400 }
          )
        }

        // For other errors, still mark job as completed but log the error
        console.error('⚠️ Job completed but credit deduction failed')
      }
    } else if (status === 'completed' && existingJob.creditDeducted) {
      console.log('ℹ️ Credits already deducted for this job, skipping')
    } else if (status === 'failed') {
      console.log('ℹ️ Job failed, no credits deducted')
    }

    // Update job in database
    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: {
        status,
        outputData,
        ...(status === 'completed' && { completedAt: new Date() }),
        ...(errorMessage && { errorMessage }),
        creditDeducted: status === 'completed' ? true : false,
      },
    })

    console.log('✅ Job updated successfully:', updatedJob.id)
    console.log('✅ Status:', updatedJob.status)
    console.log('✅ Output images count:', outputImages?.length || 0)

    // Create workflow log entry
    const duration = Date.now() - startTime
    await prisma.workflowLog.create({
      data: {
        userId: existingJob.userId,
        jobId: existingJob.id,
        ...(existingJob.webhookId && { webhookId: existingJob.webhookId }),
        workflowType: 'image_processing',
        ...(executionId && { executionId }),
        ...(executionUrl && { executionUrl }),
        status,
        requestPayload: null, // Request was sent from job creation
        responsePayload: body as any,
        ...(errorMessage && { errorMessage }),
        duration,
        completedAt: new Date(),
      },
    })

    console.log('📊 Workflow log created')

    // TODO: Send email notification if job.notifyByEmail is true
    // This would require setting up an email service like SendGrid, Resend, etc.

    return NextResponse.json({
      success: true,
      jobId: updatedJob.id,
      status: updatedJob.status,
    })
  } catch (error) {
    console.error('❌ Error processing webhook callback:', error)
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    )
  }
}
