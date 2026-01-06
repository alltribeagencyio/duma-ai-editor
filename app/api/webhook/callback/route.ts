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

    // Update job in database
    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: {
        status,
        outputData,
        completedAt: status === 'completed' ? new Date() : null,
        errorMessage: errorMessage || null,
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
