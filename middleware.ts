import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

// Security headers for enhanced protection
const securityHeaders = {
  'X-DNS-Prefetch-Control': 'on',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
}

// Simple in-memory rate limiting (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(ip: string, limit: number = 100, window: number = 60000): boolean {
  const now = Date.now()
  const record = rateLimitStore.get(ip)

  if (!record || now > record.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + window })
    return true
  }

  if (record.count >= limit) {
    return false
  }

  record.count++
  return true
}

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({
    request: req,
  })

  // Apply security headers to all responses
  Object.entries(securityHeaders).forEach(([key, value]) => {
    res.headers.set(key, value)
  })

  // Rate limiting for API routes
  if (req.nextUrl.pathname.startsWith('/api')) {
    const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown'

    if (!checkRateLimit(ip)) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: {
          'Retry-After': '60',
          ...Object.fromEntries(Object.entries(securityHeaders)),
        },
      })
    }
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
          res = NextResponse.next({
            request: req,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Protected routes that require authentication
  const protectedRoutes = ['/dashboard', '/new', '/jobs', '/history', '/profile', '/analytics', '/subscription', '/prompts', '/help']
  const isProtectedRoute = protectedRoutes.some(route => req.nextUrl.pathname.startsWith(route))

  // If no session and trying to access protected routes, redirect to login
  if (!session && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // If session exists, check onboarding status for certain routes
  if (session) {
    // If trying to access auth pages, redirect to dashboard
    if (req.nextUrl.pathname.startsWith('/login') || req.nextUrl.pathname.startsWith('/signup')) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // Check if user needs to complete onboarding (except for onboarding page itself)
    if (!req.nextUrl.pathname.startsWith('/onboarding') && isProtectedRoute) {
      try {
        const userProfile = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { hasCompletedOnboarding: true }
        })

        if (!userProfile?.hasCompletedOnboarding) {
          return NextResponse.redirect(new URL('/onboarding', req.url))
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error)
        // Continue without redirect if database check fails
      }
    }

    // If user has completed onboarding and tries to access onboarding page, redirect to dashboard
    if (req.nextUrl.pathname.startsWith('/onboarding')) {
      try {
        const userProfile = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { hasCompletedOnboarding: true }
        })

        if (userProfile?.hasCompletedOnboarding) {
          return NextResponse.redirect(new URL('/dashboard', req.url))
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error)
      }
    }
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
    '/onboarding/:path*',
    '/login',
    '/signup',
    '/api/:path*'
  ],
}
