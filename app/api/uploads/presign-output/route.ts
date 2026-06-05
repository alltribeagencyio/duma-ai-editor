import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  ALLOWED_IMAGE_TYPES,
  getPresignedUploadUrl,
  isR2Configured,
  outputKey,
} from '@/lib/r2'
import { verifyWebhookSecret } from '@/lib/webhook-auth'

export const runtime = 'nodejs'

const MAX_OUTPUTS = 20

// POST /api/uploads/presign-output  (called by n8n)
// Headers: X-Webhook-Secret: <WEBHOOK_CALLBACK_SECRET>
// Body: { jobId, contentType?, count? }
// Returns presigned PUT URLs n8n uploads each generated image to directly.
export async function POST(req: NextRequest) {
  try {
    if (!isR2Configured()) {
      return NextResponse.json({ error: 'Storage is not configured' }, { status: 503 })
    }

    if (!verifyWebhookSecret(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => null)
    const jobId: string | undefined = body?.jobId
    const contentType: string = (body?.contentType || 'image/png').toLowerCase()
    const count: number = Math.min(Math.max(parseInt(body?.count, 10) || 1, 1), MAX_OUTPUTS)

    if (!jobId) {
      return NextResponse.json({ error: 'Missing jobId' }, { status: 400 })
    }

    if (!ALLOWED_IMAGE_TYPES[contentType]) {
      return NextResponse.json(
        { error: `Unsupported contentType: ${contentType}` },
        { status: 400 }
      )
    }

    // Ensure the job exists (don't let arbitrary keys be created)
    const job = await prisma.job.findUnique({ where: { id: jobId }, select: { id: true } })
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    const uploads = await Promise.all(
      Array.from({ length: count }, () =>
        getPresignedUploadUrl(outputKey(jobId, contentType), contentType, 900)
      )
    )

    return NextResponse.json({ uploads })
  } catch (error) {
    console.error('Error creating output presign URLs:', error)
    return NextResponse.json({ error: 'Failed to create upload URLs' }, { status: 500 })
  }
}
