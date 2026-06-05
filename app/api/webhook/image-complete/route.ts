import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { pricingService } from '@/lib/pricing'
import { verifyWebhookSecret } from '@/lib/webhook-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/webhook/image-complete  (called by n8n once PER edited image)
 *
 * Streaming completion: n8n calls this each time it finishes editing + uploading
 * one image to R2. We append that single URL to the job's outputData so the job
 * page (which polls every 2s) shows images as they arrive. When the number of
 * outputs reaches the number of inputs (or the `total` n8n sends), the job flips
 * to `completed` exactly once and credits are deducted for the whole job.
 *
 * Headers: X-Webhook-Secret: <WEBHOOK_CALLBACK_SECRET>
 * Body: { jobId: string, imageUrl: string, total?: number }
 */
export async function POST(req: NextRequest) {
  try {
    if (!verifyWebhookSecret(req)) {
      console.error('❌ Rejected image-complete: invalid or missing webhook secret')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => null)
    const jobId: string | undefined = body?.jobId
    const imageUrl: string | undefined = body?.imageUrl

    if (!jobId || !imageUrl) {
      return NextResponse.json({ error: 'Missing jobId or imageUrl' }, { status: 400 })
    }

    const job = await prisma.job.findUnique({ where: { id: jobId } })
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Append this finished image atomically; bump to `processing` if still pending.
    const updated = await prisma.job.update({
      where: { id: jobId },
      data: {
        outputData: { push: imageUrl },
        ...(job.status === 'pending' ? { status: 'processing', startedAt: new Date() } : {}),
      },
    })

    const total = Number(body?.total) || job.inputImages?.length || 1
    const received = updated.outputData.length

    console.log(`📥 image-complete: job ${jobId} now has ${received}/${total} images`)

    // Once every image is in, flip to completed exactly once (race-safe across
    // images that finish at the same moment) and deduct credits for the job.
    if (received >= total) {
      const finished = await prisma.job.updateMany({
        where: { id: jobId, status: { not: 'completed' } },
        data: { status: 'completed', completedAt: new Date() },
      })

      if (finished.count === 1 && !job.creditDeducted) {
        try {
          const result = await pricingService.deductCredits(job.userId, total, job.id)
          await prisma.job.update({
            where: { id: jobId },
            data: { creditDeducted: true },
          })
          await prisma.creditUsage.create({
            data: {
              userId: job.userId,
              jobId: job.id,
              amount: total,
              type: job.isReEdit ? 're_edit' : 'new_job',
              description: `Job ${job.id} completed successfully - $${result.costUSD.toFixed(2)}`,
            },
          })
          console.log(`✅ Job ${jobId} completed; credits deducted ($${result.costUSD.toFixed(2)})`)
        } catch (err: any) {
          if (err?.message === 'Insufficient credits') {
            await prisma.job.update({
              where: { id: jobId },
              data: { status: 'failed', errorMessage: 'Insufficient credits to complete job' },
            })
            return NextResponse.json({ error: 'Insufficient credits' }, { status: 400 })
          }
          console.error('⚠️ Job completed but credit deduction failed:', err)
        }
      }
    }

    return NextResponse.json({ success: true, jobId, received, total })
  } catch (error) {
    console.error('❌ Error in image-complete:', error)
    return NextResponse.json({ error: 'Failed to record image' }, { status: 500 })
  }
}
