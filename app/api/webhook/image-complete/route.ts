import { NextRequest, NextResponse } from 'next/server'
import { verifyOptionalWebhookSecret } from '@/lib/webhook-auth'
import { appendOutputImage } from '@/lib/jobs/complete'

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
    if (!verifyOptionalWebhookSecret(req)) {
      console.error('❌ Rejected image-complete: invalid webhook secret')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => null)
    const jobId: string | undefined = body?.jobId
    const imageUrl: string | undefined = body?.imageUrl

    if (!jobId || !imageUrl) {
      return NextResponse.json({ error: 'Missing jobId or imageUrl' }, { status: 400 })
    }

    const total = Number(body?.total) || undefined
    const result = await appendOutputImage(jobId, imageUrl, total)

    if (!result) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }
    if (result.insufficientCredits) {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 400 })
    }

    console.log(`📥 image-complete: job ${jobId} now has ${result.received}/${result.total} images`)

    return NextResponse.json({
      success: true,
      jobId,
      received: result.received,
      total: result.total,
      completed: result.completed,
    })
  } catch (error) {
    console.error('❌ Error in image-complete:', error)
    return NextResponse.json({ error: 'Failed to record image' }, { status: 500 })
  }
}
