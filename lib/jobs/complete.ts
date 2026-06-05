import { prisma } from '@/lib/prisma'
import { pricingService } from '@/lib/pricing'

export interface AppendResult {
  received: number
  total: number
  completed: boolean
  insufficientCredits?: boolean
}

/**
 * Append one finished output image to a job (streaming completion).
 *
 * Pushes the URL onto outputData atomically, bumps a pending job to
 * `processing`, and — once the number of outputs reaches `total` (or the input
 * count) — flips the job to `completed` exactly once and deducts credits for
 * the whole job. Shared by the per-image callback and the server-side upload
 * endpoint. Returns null if the job doesn't exist.
 */
export async function appendOutputImage(
  jobId: string,
  imageUrl: string,
  totalOverride?: number
): Promise<AppendResult | null> {
  const job = await prisma.job.findUnique({ where: { id: jobId } })
  if (!job) return null

  const updated = await prisma.job.update({
    where: { id: jobId },
    data: {
      outputData: { push: imageUrl },
      ...(job.status === 'pending' ? { status: 'processing', startedAt: new Date() } : {}),
    },
  })

  const total = totalOverride || job.inputImages?.length || 1
  const received = updated.outputData.length
  let completed = false

  if (received >= total) {
    // Race-safe: only the request that actually transitions the row deducts.
    const finished = await prisma.job.updateMany({
      where: { id: jobId, status: { not: 'completed' } },
      data: { status: 'completed', completedAt: new Date() },
    })

    if (finished.count === 1) {
      completed = true

      if (!job.creditDeducted) {
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
            return { received, total, completed: false, insufficientCredits: true }
          }
          console.error('⚠️ Job completed but credit deduction failed:', err)
        }
      }
    }
  }

  return { received, total, completed }
}
