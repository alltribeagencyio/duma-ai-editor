import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/auth/password'
import { issueSession } from '@/lib/auth/session'
import { isValidEmail } from '@/lib/security'

export const runtime = 'nodejs'

// POST /api/auth/login
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const email = String(body?.email || '').trim().toLowerCase()
    const password = String(body?.password || '')

    if (!isValidEmail(email) || !password) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        role: true,
        isAdmin: true,
        isSuperAdmin: true,
        passwordHash: true,
        fullName: true,
      },
    })

    // Generic error to avoid revealing whether the email exists.
    const invalid = NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })

    if (!user || !user.passwordHash) return invalid

    const ok = await verifyPassword(password, user.passwordHash)
    if (!ok) return invalid

    await issueSession(user, {
      userAgent: req.headers.get('user-agent'),
      ipAddress: req.headers.get('x-forwarded-for') || req.ip,
    })

    await prisma.user
      .update({ where: { id: user.id }, data: { lastLoginAt: new Date(), lastActiveAt: new Date() } })
      .catch(() => {})

    return NextResponse.json({
      user: { id: user.id, email: user.email, fullName: user.fullName },
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Failed to sign in' }, { status: 500 })
  }
}
