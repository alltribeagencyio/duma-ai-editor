'use client'

/**
 * Client-side direct-to-R2 upload.
 *
 * Flow per submit:
 *  1. Convert any HEIC/HEIF files to JPEG in the browser (replaces server-side heic-convert).
 *  2. Ask the app for presigned PUT URLs (/api/uploads/presign).
 *  3. PUT each file straight to R2 (no bytes through our serverless functions).
 *  4. Return the resulting public CDN URLs.
 */

const HEIC_TYPES = ['image/heic', 'image/heif']

function isHeic(file: File): boolean {
  return (
    HEIC_TYPES.includes(file.type.toLowerCase()) ||
    /\.(heic|heif)$/i.test(file.name)
  )
}

/** Convert a HEIC/HEIF File to a JPEG File (browser-only, dynamically imported). */
async function convertHeicToJpeg(file: File): Promise<File> {
  const heic2any = (await import('heic2any')).default
  const blob = (await heic2any({
    blob: file,
    toType: 'image/jpeg',
    quality: 0.9,
  })) as Blob
  const name = file.name.replace(/\.(heic|heif)$/i, '.jpg')
  return new File([blob], name, { type: 'image/jpeg' })
}

interface PresignedUpload {
  uploadUrl: string
  publicUrl: string
  key: string
}

function putToR2(
  upload: PresignedUpload,
  file: File,
  onProgress?: (loaded: number, total: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', upload.uploadUrl)
    xhr.setRequestHeader('Content-Type', file.type)

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) onProgress(e.loaded, e.total)
    })
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve()
      else reject(new Error(`Upload failed (${xhr.status})`))
    })
    xhr.addEventListener('error', () => reject(new Error('Network error during upload')))
    xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')))
    xhr.send(file)
  })
}

/**
 * Upload an array of image Files to R2 and return their public URLs (in order).
 * `onProgress` reports overall 0–100 across all files.
 */
export async function uploadImagesToR2(
  files: File[],
  onProgress?: (percent: number) => void
): Promise<string[]> {
  if (files.length === 0) return []

  // 1. Normalize HEIC -> JPEG
  const prepared = await Promise.all(
    files.map((f) => (isHeic(f) ? convertHeicToJpeg(f) : Promise.resolve(f)))
  )

  // 2. Request presigned URLs
  const res = await fetch('/api/uploads/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      files: prepared.map((f) => ({ contentType: f.type, size: f.size })),
    }),
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'Could not start upload')
  }

  const { uploads } = (await res.json()) as { uploads: PresignedUpload[] }

  // 3. Upload all files in parallel, tracking aggregate progress
  const totalBytes = prepared.reduce((sum, f) => sum + f.size, 0) || 1
  const loadedPerFile = new Array(prepared.length).fill(0)

  await Promise.all(
    prepared.map((file, i) =>
      putToR2(uploads[i], file, (loaded) => {
        loadedPerFile[i] = loaded
        if (onProgress) {
          const loadedTotal = loadedPerFile.reduce((a, b) => a + b, 0)
          onProgress(Math.min(100, Math.round((loadedTotal / totalBytes) * 100)))
        }
      })
    )
  )

  // 4. Return public CDN URLs in original order
  return uploads.map((u) => u.publicUrl)
}
