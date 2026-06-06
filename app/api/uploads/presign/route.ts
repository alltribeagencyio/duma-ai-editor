import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import {
  ALLOWED_IMAGE_TYPES,
  MAX_UPLOAD_BYTES,
  getPresignedUploadUrl,
  inputKey,
  isR2Configured,
} from '@/lib/r2'

export const runtime = 'nodejs'

const MAX_FILES = 10

interface RequestedFile {
  contentType: string
  size?: number
}

// POST /api/uploads/presign
// Body: { files: [{ contentType, size }] }
// Returns presigned PUT URLs the browser uploads directly to R2.
export async function POST(req: NextRequest) {
  try {
    if (!isR2Configured()) {
      return NextResponse.json(
        { error: 'Storage is not configured' },
        { status: 503 }
      )
    }

    const supabase = createRouteHandlerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => null)
    const files: RequestedFile[] = body?.files

    if (!Array.isArray(files) || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Maximum ${MAX_FILES} images per request` },
        { status: 400 }
      )
    }

    // Validate every file before signing anything
    for (const file of files) {
      const contentType = (file?.contentType || '').toLowerCase()
      if (!ALLOWED_IMAGE_TYPES[contentType]) {
        return NextResponse.json(
          { error: `Unsupported file type: ${file?.contentType || 'unknown'}` },
          { status: 400 }
        )
      }
      if (typeof file.size === 'number' && file.size > MAX_UPLOAD_BYTES) {
        return NextResponse.json(
          { error: `File exceeds ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)}MB limit` },
          { status: 400 }
        )
      }
    }

    const uploads = await Promise.all(
      files.map((file) => {
        const contentType = file.contentType.toLowerCase()
        return getPresignedUploadUrl(inputKey(user.id, contentType), contentType)
      })
    )

    // Record each upload so it shows in the Uploads tab regardless of whether a
    // job is ever created. Best-effort — never block the upload on this.
    prisma.upload
      .createMany({
        data: uploads.map((u, i) => ({
          userId: user.id,
          key: u.key,
          url: u.publicUrl,
          contentType: files[i].contentType.toLowerCase(),
        })),
        skipDuplicates: true,
      })
      .catch((err) => console.error('Failed to record uploads:', err))

    return NextResponse.json({ uploads })
  } catch (error) {
    console.error('Error creating presigned upload URLs:', error)
    return NextResponse.json(
      { error: 'Failed to create upload URLs' },
      { status: 500 }
    )
  }
}
