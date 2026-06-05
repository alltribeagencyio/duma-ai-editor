import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, validatePasswordStrength } from '@/lib/auth/password'
import { issueSession } from '@/lib/auth/session'
import { isValidEmail, sanitizeInput } from '@/lib/security'
import { sendCustomerNotification } from '@/lib/notifications'

export const runtime = 'nodejs'

// POST /api/auth/register
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const email = String(body?.email || '').trim().toLowerCase()
    const password = String(body?.password || '')
    const fullName = body?.fullName ? sanitizeInput(String(body.fullName)).slice(0, 120) : null

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'A valid email is required' }, { status: 400 })
    }

    const pwError = validatePasswordStrength(password)
    if (pwError) {
      return NextResponse.json({ error: pwError }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } })
    if (existing) {
      // Avoid leaking which emails exist with a specific message; still must signal conflict.
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
    }

    const passwordHash = await hashPassword(password)

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName: fullName || email.split('@')[0],
      },
      select: { id: true, email: true, role: true, isAdmin: true, isSuperAdmin: true, fullName: true },
    })

    await issueSession(user, {
      userAgent: req.headers.get('user-agent'),
      ipAddress: req.headers.get('x-forwarded-for') || req.ip,
    })

    // Fire-and-forget welcome notification via n8n (non-blocking).
    sendCustomerNotification('welcome', {
      email: user.email,
      userName: user.fullName,
    }).catch(() => {})

    return NextResponse.json(
      { user: { id: user.id, email: user.email, fullName: user.fullName } },
      { status: 201 }
    )
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
  }
}
