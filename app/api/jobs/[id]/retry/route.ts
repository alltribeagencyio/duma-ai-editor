import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

// POST /api/jobs/[id]/retry - Retry a failed job
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

    const jobId = params.id

    // Get the existing job
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    })

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Verify user owns this job
    if (job.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Only allow retry for failed jobs
    if (job.status !== 'failed') {
      return NextResponse.json(
        { error: 'Can only retry failed jobs' },
        { status: 400 }
      )
    }

    // Reset job status to pending
    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'pending',
        errorMessage: null,
        startedAt: null,
        completedAt: null,
        outputData: Prisma.JsonNull,
      },
    })

    // Send webhook to n8n with the same data as original job
    const webhookUrl = process.env.N8N_WEBHOOK_URL
    console.log('🔄 Retry - Webhook URL:', webhookUrl)

    if (webhookUrl) {
      const webhookPayload = {
        jobId: job.id,
        userId: user.id,
        userEmail: user.email,
        imageUrls: job.inputImages,
        prompt: job.prompt,
        callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhook/callback`,
      }

      console.log('🔄 Retry - Sending webhook payload:', JSON.stringify(webhookPayload, null, 2))

      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webhookPayload),
        })

        console.log('🔄 Retry - Webhook response status:', response.status)
        const responseText = await response.text()
        console.log('🔄 Retry - Webhook response:', responseText)

        if (response.ok) {
          // Update job status to processing
          await prisma.job.update({
            where: { id: job.id },
            data: { status: 'processing', startedAt: new Date() },
          })
          console.log('✅ Retry - Job status updated to processing')
        } else {
          console.error('❌ Retry - Webhook returned error status:', response.status)
          // Reset to failed if webhook fails
          await prisma.job.update({
            where: { id: job.id },
            data: {
              status: 'failed',
              errorMessage: `Webhook failed with status ${response.status}`,
            },
          })
        }
      } catch (webhookError) {
        console.error('❌ Retry - Error sending webhook:', webhookError)
        // Reset to failed if webhook fails
        await prisma.job.update({
          where: { id: job.id },
          data: {
            status: 'failed',
            errorMessage: 'Failed to trigger retry workflow',
          },
        })
        throw webhookError
      }
    } else {
      console.log('⚠️  Retry - No webhook URL configured')
      return NextResponse.json(
        { error: 'Webhook URL not configured' },
        { status: 500 }
      )
    }

    return NextResponse.json({ job: updatedJob })
  } catch (error) {
    console.error('Error retrying job:', error)
    return NextResponse.json(
      { error: 'Failed to retry job' },
      { status: 500 }
    )
  }
}
