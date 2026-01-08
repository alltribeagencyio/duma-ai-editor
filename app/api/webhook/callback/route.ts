import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

// POST /api/webhook/callback - Receive n8n results
export async function POST(req: NextRequest) {
  try {
    console.log('📥 Received webhook callback from n8n')

    const body = await req.json()
    console.log('📥 Callback payload:', JSON.stringify(body, null, 2))

    const { jobId, status, outputImages, errorMessage } = body

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

    // Verify job exists and get user info
    const existingJob = await prisma.job.findUnique({
      where: { id: jobId },
      include: { user: true },
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
      const creditsCost = existingJob.creditsCost || 1

      console.log('💳 Deducting credits:', creditsCost, 'from user:', existingJob.userId)

      // Deduct credits from user
      await prisma.user.update({
        where: { id: existingJob.userId },
        data: {
          creditsUsed: {
            increment: creditsCost,
          },
        },
      })

      // Log credit usage
      await prisma.creditUsage.create({
        data: {
          userId: existingJob.userId,
          jobId: existingJob.id,
          amount: creditsCost,
          type: existingJob.isReEdit ? 're_edit' : 'new_job',
          description: `Job ${existingJob.id} completed successfully`,
        },
      })

      console.log('✅ Credits deducted and logged')
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
        completedAt: status === 'completed' ? new Date() : null,
        errorMessage: errorMessage || null,
        creditDeducted: status === 'completed' ? true : false,
      },
    })

    console.log('✅ Job updated successfully:', updatedJob.id)
    console.log('✅ Status:', updatedJob.status)
    console.log('✅ Output images count:', outputImages?.length || 0)

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
