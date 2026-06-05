import { prisma } from '@/lib/prisma'

/**
 * Stale-job cleanup.
 *
 * n8n processes images and writes results straight to the DB (it never calls
 * back). If n8n fails or never returns, a job would otherwise sit in
 * `pending`/`processing` forever and the user just sees a spinner.
 *
 * Rule: a job is "stale" once it has been waiting longer than
 * (5 minutes × number of input images) with no output image written.
 * Such jobs are marked `failed` so the user can retry.
 */
const PER_IMAGE_TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes per image

export async function markStaleJobsFailed(): Promise<number> {
  const candidates = await prisma.job.findMany({
    where: { status: { in: ['pending', 'processing'] } },
    select: {
      id: true,
      createdAt: true,
      startedAt: true,
      inputImages: true,
      outputData: true,
    },
    take: 200,
  })

  const now = Date.now()
  const staleIds = candidates
    .filter((job) => {
      // If outputs already landed, it's effectively done — let the normal flow handle it.
      const hasOutput = Array.isArray(job.outputData) && job.outputData.length > 0
      if (hasOutput) return false

      const base = (job.startedAt ?? job.createdAt).getTime()
      const images = Math.max(job.inputImages?.length ?? 1, 1)
      return now - base > images * PER_IMAGE_TIMEOUT_MS
    })
    .map((job) => job.id)

  if (staleIds.length === 0) return 0

  const result = await prisma.job.updateMany({
    where: { id: { in: staleIds }, status: { in: ['pending', 'processing'] } },
    data: {
      status: 'failed',
      errorMessage:
        'Timed out — no result was returned in time (5 min per image). Please retry.',
    },
  })

  return result.count
}
