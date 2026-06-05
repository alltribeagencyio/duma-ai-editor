import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { randomUUID } from 'crypto'

/**
 * Cloudflare R2 storage client (S3-compatible).
 *
 * Inputs are uploaded directly from the browser via presigned PUT URLs.
 * Outputs are uploaded by n8n via presigned PUT URLs (see /api/uploads/presign-output).
 * Reads are served from a public custom domain (R2_PUBLIC_DOMAIN) behind Cloudflare CDN.
 */

const accountId = process.env.R2_ACCOUNT_ID
const accessKeyId = process.env.R2_ACCESS_KEY_ID
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY

export const R2_BUCKET = process.env.R2_BUCKET || ''
const R2_PUBLIC_DOMAIN = (process.env.R2_PUBLIC_DOMAIN || '').replace(/\/+$/, '')

// Allowed image content types -> canonical file extension
export const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024 // 25MB (direct-to-R2 removes the Vercel 4.5MB limit)

let _client: S3Client | null = null

function getR2Client(): S3Client {
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      'R2 is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY.'
    )
  }
  if (!_client) {
    _client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    })
  }
  return _client
}

export function isR2Configured(): boolean {
  return Boolean(accountId && accessKeyId && secretAccessKey && R2_BUCKET && R2_PUBLIC_DOMAIN)
}

/** Build the public CDN URL for a stored object key. */
export function getPublicUrl(key: string): string {
  const domain = R2_PUBLIC_DOMAIN.startsWith('http')
    ? R2_PUBLIC_DOMAIN
    : `https://${R2_PUBLIC_DOMAIN}`
  return `${domain}/${key}`
}

/** True if `url` points at our R2 public domain. */
export function isR2PublicUrl(url: string): boolean {
  if (!R2_PUBLIC_DOMAIN) return false
  try {
    const host = new URL(getPublicUrl('')).hostname
    return new URL(url).hostname === host
  } catch {
    return false
  }
}

function extensionFor(contentType: string): string {
  return ALLOWED_IMAGE_TYPES[contentType.toLowerCase()] || 'bin'
}

/** Key for a user-uploaded input image. */
export function inputKey(userId: string, contentType: string): string {
  return `inputs/${userId}/${randomUUID()}.${extensionFor(contentType)}`
}

/** Key for an AI-generated output image belonging to a job. */
export function outputKey(jobId: string, contentType: string): string {
  return `outputs/${jobId}/${randomUUID()}.${extensionFor(contentType)}`
}

export interface PresignedUpload {
  uploadUrl: string
  publicUrl: string
  key: string
}

/** Create a short-lived presigned PUT URL the client/n8n can upload to directly. */
export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 300
): Promise<PresignedUpload> {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    ContentType: contentType,
  })
  const uploadUrl = await getSignedUrl(getR2Client(), command, { expiresIn })
  return { uploadUrl, publicUrl: getPublicUrl(key), key }
}

/** Server-side upload (used as a fallback path / for ingesting bytes). */
export async function putObject(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<{ key: string; publicUrl: string }> {
  await getR2Client().send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  )
  return { key, publicUrl: getPublicUrl(key) }
}
