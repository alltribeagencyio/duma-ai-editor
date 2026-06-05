import { NextRequest, NextResponse } from 'next/server'
import { rotateSession, clearAuthCookies } from '@/lib/auth/session'

export const runtime = 'nodejs'

// POST /api/auth/refresh — rotates the refresh token and issues a new access token.
export async function POST(req: NextRequest) {
  try {
    const user = await rotateSession({
      userAgent: req.headers.get('user-agent'),
      ipAddress: req.headers.get('x-forwarded-for') || req.ip,
    })

    if (!user) {
      clearAuthCookies()
      return NextResponse.json({ error: 'Session expired' }, { status: 401 })
    }

    return NextResponse.json({ user: { id: user.id, email: user.email } })
  } catch (error) {
    console.error('Refresh error:', error)
    return NextResponse.json({ error: 'Failed to refresh session' }, { status: 500 })
  }
}
