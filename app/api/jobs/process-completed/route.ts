import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { pricingService } from '@/lib/pricing'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { verifyWebhookSecret } from '@/lib/webhook-auth'

/**
 * Background job processor for completed jobs
 * This handles credit deduction for jobs that N8N completes directly in the database
 * without calling the webhook callback endpoint
 *
 * Should be called periodically (e.g., via cron job or client polling)
 */
export async function POST(req: NextRequest) {
  try {
    // Require either a logged-in user (client polling) or the cron/webhook secret.
    // Prevents anonymous callers from triggering global credit-deduction sweeps.
    if (!verifyWebhookSecret(req)) {
      const supabase = createRouteHandlerClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    console.log('🔄 Processing completed jobs without credit deductions...')

    // Find all completed jobs that haven't had credits deducted
    const jobs = await prisma.job.findMany({
      where: {
        status: 'completed',
        creditDeducted: false
      },
      orderBy: { completedAt: 'desc' },
      take: 50, // Process max 50 at a time to avoid timeout
      select: {
        id: true,
        userId: true,
        outputData: true,
        inputImages: true,
        createdAt: true,
        isReEdit: true,
      }
    })

    // Filter to only those with actual output data
    const jobsWithOutput = jobs.filter(job =>
      job.outputData && Array.isArray(job.outputData) && job.outputData.length > 0
    )

    if (jobsWithOutput.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No jobs to process',
        processed: 0
      })
    }

    console.log(`📋 Found ${jobsWithOutput.length} jobs to process`)

    let successful = 0
    let failed = 0
    const errors: string[] = []

    for (const job of jobsWithOutput) {
      try {
        const numberOfImages = job.outputData.length

        console.log(`💳 Processing job ${job.id}: ${numberOfImages} images for user ${job.userId}`)

        // Use pricing service to deduct credits
        const result = await pricingService.deductCredits(
          job.userId,
          numberOfImages,
          job.id
        )

        // Create legacy credit usage log
        await prisma.creditUsage.create({
          data: {
            userId: job.userId,
            jobId: job.id,
            amount: numberOfImages,
            type: job.isReEdit ? 're_edit' : 'new_job',
            description: `Auto-processed: ${numberOfImages} image${numberOfImages > 1 ? 's' : ''} - $${result.costUSD.toFixed(2)}`,
          },
        })

        // Mark job as credit deducted
        await prisma.job.update({
          where: { id: job.id },
          data: { creditDeducted: true }
        })

        console.log(`✅ Successfully processed job ${job.id}`)
        successful++

      } catch (error: any) {
        console.error(`❌ Failed to process job ${job.id}:`, error.message)
        failed++
        errors.push(`Job ${job.id}: ${error.message}`)

        // If insufficient credits, mark job appropriately
        if (error.message === 'Insufficient credits') {
          await prisma.job.update({
            where: { id: job.id },
            data: {
              status: 'failed',
              errorMessage: 'Insufficient credits to complete job',
              creditDeducted: false
            }
          })
        }
      }
    }

    console.log(`📊 Processing complete: ${successful} successful, ${failed} failed`)

    return NextResponse.json({
      success: true,
      processed: successful,
      failed,
      total: jobsWithOutput.length,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('❌ Error processing completed jobs:', error)
    return NextResponse.json(
      { error: 'Failed to process completed jobs' },
      { status: 500 }
    )
  }
}
