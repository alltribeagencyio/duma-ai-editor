import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyAccessToken } from '@/lib/auth/jwt'
import { ACCESS_COOKIE, REFRESH_COOKIE } from '@/lib/auth/constants'
import { checkRateLimit, categoryForRequest } from '@/lib/rate-limit'

// Content Security Policy — restricts the dangerous sinks without breaking Next
// or the "add image by URL" feature (which fetches arbitrary image hosts).
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "img-src 'self' data: blob: https:",
  "media-src 'self' https:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "font-src 'self' data:",
  "connect-src 'self' https: blob:",
  "form-action 'self'",
].join('; ')

// Security headers for enhanced protection
const securityHeaders = {
  'X-DNS-Prefetch-Control': 'on',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': csp,
}

const protectedRoutes = [
  '/dashboard', '/new', '/jobs', '/history', '/profile', '/analytics',
  '/subscription', '/prompts', '/help', '/admin', '/onboarding',
]
const authPages = ['/login', '/signup']

export async function middleware(req: NextRequest) {
  const res = NextResponse.next({ request: req })

  Object.entries(securityHeaders).forEach(([key, value]) => res.headers.set(key, value))

  const { pathname } = req.nextUrl

  // Rate limiting for API routes (aggressive, per-category, cross-instance via Upstash)
  if (pathname.startsWith('/api')) {
    const ip =
      req.ip ||
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      'unknown'
    const category = categoryForRequest(pathname, req.method)
    if (category) {
      const { success, limit, remaining, reset } = await checkRateLimit(ip, category)
      if (!success) {
        return new NextResponse('Too Many Requests', {
          status: 429,
          headers: {
            'Retry-After': '60',
            'X-RateLimit-Limit': String(limit),
            'X-RateLimit-Remaining': String(remaining),
            'X-RateLimit-Reset': String(reset),
            ...securityHeaders,
          },
        })
      }
    }
    // API routes perform their own auth; don't gate them here.
    return res
  }

  // Determine auth state from the access token; fall back to refresh-cookie
  // presence so a momentarily-expired access token doesn't bounce the user
  // (the client refreshes it). Sensitive data is still gated server-side.
  const accessToken = req.cookies.get(ACCESS_COOKIE)?.value
  const hasValidAccess = accessToken ? Boolean(await verifyAccessToken(accessToken)) : false
  const hasRefresh = Boolean(req.cookies.get(REFRESH_COOKIE)?.value)
  const isAuthenticated = hasValidAccess || hasRefresh

  const isProtected = protectedRoutes.some((r) => pathname.startsWith(r))
  const isAuthPage = authPages.some((r) => pathname.startsWith(r))

  if (!isAuthenticated && isProtected) {
    const url = new URL('/login', req.url)
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  if (isAuthenticated && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return res
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/new/:path*',
    '/jobs/:path*',
    '/history/:path*',
    '/profile/:path*',
    '/analytics/:path*',
    '/subscription/:path*',
    '/prompts/:path*',
    '/help/:path*',
    '/admin/:path*',
    '/onboarding/:path*',
    '/login',
    '/signup',
    '/api/:path*',
  ],
}
