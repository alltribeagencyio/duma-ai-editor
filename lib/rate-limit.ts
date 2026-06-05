import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

/**
 * Aggressive, cross-instance rate limiting backed by Upstash Redis.
 * Edge-compatible (REST-based) so it can run in middleware.
 *
 * If Upstash isn't configured (local dev), limiting is skipped with a warning
 * rather than blocking requests.
 */

type Category = 'auth' | 'sensitive' | 'webhook' | 'general'

const LIMITS: Record<Category, { tokens: number; window: `${number} m` | `${number} s` }> = {
  auth: { tokens: 5, window: '1 m' }, // login/register/reset — brute-force defense
  sensitive: { tokens: 10, window: '1 m' }, // uploads, job creation, purchases
  webhook: { tokens: 60, window: '1 m' }, // n8n callbacks (also secret-protected)
  general: { tokens: 60, window: '1 m' }, // everything else under /api
}

const url = process.env.UPSTASH_REDIS_REST_URL
const token = process.env.UPSTASH_REDIS_REST_TOKEN
const redis = url && token ? new Redis({ url, token }) : null

let warned = false
const limiters = new Map<Category, Ratelimit>()

function getLimiter(category: Category): Ratelimit | null {
  if (!redis) {
    if (!warned) {
      console.warn('[rate-limit] UPSTASH_REDIS_REST_URL/TOKEN not set — rate limiting disabled')
      warned = true
    }
    return null
  }
  let limiter = limiters.get(category)
  if (!limiter) {
    const cfg = LIMITS[category]
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(cfg.tokens, cfg.window),
      prefix: `rl:${category}`,
      analytics: false,
    })
    limiters.set(category, limiter)
  }
  return limiter
}

export async function checkRateLimit(
  identifier: string,
  category: Category
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  const limiter = getLimiter(category)
  if (!limiter) {
    return { success: true, limit: 0, remaining: 0, reset: 0 }
  }
  const res = await limiter.limit(identifier)
  return { success: res.success, limit: res.limit, remaining: res.remaining, reset: res.reset }
}

/** Pick the rate-limit bucket for an /api request, or null to skip. */
export function categoryForRequest(pathname: string, method: string): Category | null {
  if (
    pathname === '/api/auth/login' ||
    pathname === '/api/auth/register' ||
    pathname === '/api/auth/forgot-password' ||
    pathname === '/api/auth/reset-password'
  ) {
    return 'auth'
  }
  if (pathname === '/api/webhook/callback' || pathname === '/api/uploads/presign-output') {
    return 'webhook'
  }
  if (
    pathname === '/api/uploads/presign' ||
    pathname.startsWith('/api/credits/purchase') ||
    pathname.includes('/re-edit') ||
    (pathname === '/api/jobs' && method === 'POST')
  ) {
    return 'sensitive'
  }
  if (pathname.startsWith('/api/')) return 'general'
  return null
}
