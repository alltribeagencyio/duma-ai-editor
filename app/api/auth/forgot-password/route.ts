import { NextRequest, NextResponse } from 'next/server'
import { createHash, randomBytes } from 'crypto'
import { prisma } from '@/lib/prisma'
import { isValidEmail } from '@/lib/security'
import { sendCustomerNotification } from '@/lib/notifications'

export const runtime = 'nodejs'

const RESET_TTL_MS = 60 * 60 * 1000 // 1 hour

// POST /api/auth/forgot-password
// Always responds 200 with a generic message (no account enumeration).
export async function POST(req: NextRequest) {
  const generic = NextResponse.json({
    message: 'If an account exists for that email, a password reset link has been sent.',
  })

  try {
    const body = await req.json().catch(() => null)
    const email = String(body?.email || '').trim().toLowerCase()

    if (!isValidEmail(email)) {
      // Still return generic success shape to avoid probing.
      return generic
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, fullName: true },
    })

    if (!user) {
      return generic
    }

    // Invalidate any outstanding tokens for this user, then mint a fresh one.
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    })

    const token = randomBytes(32).toString('base64url')
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: createHash('sha256').update(token).digest('hex'),
        expiresAt: new Date(Date.now() + RESET_TTL_MS),
      },
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
    const resetLink = `${appUrl}/reset-password?token=${token}`

    // Delivery is handled by the n8n notifications workflow.
    await sendCustomerNotification('password_reset', {
      email: user.email,
      userName: user.fullName,
      resetLink,
      expiresInMinutes: RESET_TTL_MS / 60000,
    })

    return generic
  } catch (error) {
    console.error('Forgot-password error:', error)
    // Never reveal internal errors here; keep the response generic.
    return generic
  }
}
