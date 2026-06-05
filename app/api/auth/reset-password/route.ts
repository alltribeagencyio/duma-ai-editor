import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { prisma } from '@/lib/prisma'
import { hashPassword, validatePasswordStrength } from '@/lib/auth/password'

export const runtime = 'nodejs'

// POST /api/auth/reset-password
// Body: { token, password }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const token = String(body?.token || '')
    const password = String(body?.password || '')

    if (!token) {
      return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 })
    }

    const pwError = validatePasswordStrength(password)
    if (pwError) {
      return NextResponse.json({ error: pwError }, { status: 400 })
    }

    const tokenHash = createHash('sha256').update(token).digest('hex')
    const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } })

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 })
    }

    const passwordHash = await hashPassword(password)

    // Update password, consume token, and revoke all existing sessions for safety.
    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
      prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
      prisma.session.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Reset-password error:', error)
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 })
  }
}
