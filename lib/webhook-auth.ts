import { timingSafeEqual } from 'crypto'
import type { NextRequest } from 'next/server'

/**
 * Shared-secret auth for endpoints called by n8n (callback + output presign).
 * n8n must send the secret in the `X-Webhook-Secret` header (or
 * `Authorization: Bearer <secret>`).
 */

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ab.length !== bb.length) return false
  return timingSafeEqual(ab, bb)
}

export function getWebhookSecret(): string | undefined {
  return process.env.WEBHOOK_CALLBACK_SECRET
}

/** Returns true if the request carries the correct shared secret. */
export function verifyWebhookSecret(req: NextRequest): boolean {
  const secret = getWebhookSecret()
  // Fail closed: if no secret is configured, reject (forces correct setup).
  if (!secret) {
    console.error('WEBHOOK_CALLBACK_SECRET is not set — rejecting webhook request')
    return false
  }

  const provided =
    req.headers.get('x-webhook-secret') ||
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
    ''

  if (!provided) return false
  return safeEqual(provided, secret)
}
