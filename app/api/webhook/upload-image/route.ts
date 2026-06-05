import { NextRequest, NextResponse } from 'next/server'
import {
  ALLOWED_IMAGE_TYPES,
  isR2Configured,
  outputKey,
  putObject,
} from '@/lib/r2'
import { verifyOptionalWebhookSecret } from '@/lib/webhook-auth'
import { appendOutputImage } from '@/lib/jobs/complete'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Vercel serverless caps request bodies around 4.5MB. Most edited images are
// well under this; if outputs get larger, switch to the presign + direct-PUT
// flow (/api/uploads/presign-output) which has no such limit.
const MAX_BYTES = 4 * 1024 * 1024

/**
 * POST /api/webhook/upload-image?jobId=<id>&total=<n>   (called by n8n, 1 node)
 *
 * Single-node streaming upload: n8n sends the raw edited image bytes as the
 * request body. The app uploads them to Cloudflare R2 server-side (R2 creds
 * stay in the app — none needed in n8n) and appends the resulting public URL to
 * the job, auto-completing when all images are in.
 *
 * Headers: Content-Type: image/png | image/jpeg | image/webp
 *          (optional) X-Webhook-Secret: <WEBHOOK_CALLBACK_SECRET>
 * Body: raw image binary
 */
export async function POST(req: NextRequest) {
  try {
    if (!isR2Configured()) {
      return NextResponse.json({ error: 'Storage is not configured' }, { status: 503 })
    }

    if (!verifyOptionalWebhookSecret(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const jobId = searchParams.get('jobId') || undefined
    const totalParam = searchParams.get('total')
    const total = totalParam ? parseInt(totalParam, 10) || undefined : undefined

    if (!jobId) {
      return NextResponse.json({ error: 'Missing jobId (query param)' }, { status: 400 })
    }

    const contentType = (req.headers.get('content-type') || 'image/png')
      .split(';')[0]
      .trim()
      .toLowerCase()

    if (!ALLOWED_IMAGE_TYPES[contentType]) {
      return NextResponse.json(
        { error: `Unsupported Content-Type: ${contentType}` },
        { status: 400 }
      )
    }

    const bytes = Buffer.from(await req.arrayBuffer())
    if (bytes.length === 0) {
      return NextResponse.json({ error: 'Empty request body' }, { status: 400 })
    }
    if (bytes.length > MAX_BYTES) {
      return NextResponse.json(
        { error: 'Image too large for direct upload — use the presign flow' },
        { status: 413 }
      )
    }

    // Upload to R2, then record the public URL against the job.
    const key = outputKey(jobId, contentType)
    const { publicUrl } = await putObject(key, bytes, contentType)

    const result = await appendOutputImage(jobId, publicUrl, total)
    if (!result) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }
    if (result.insufficientCredits) {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 400 })
    }

    console.log(`📥 upload-image: job ${jobId} now has ${result.received}/${result.total} images`)

    return NextResponse.json({
      success: true,
      jobId,
      publicUrl,
      received: result.received,
      total: result.total,
      completed: result.completed,
    })
  } catch (error) {
    console.error('❌ Error in upload-image:', error)
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
  }
}
