import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, validatePasswordStrength } from '@/lib/auth/password'
import { isValidEmail } from '@/lib/security'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const userProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { isAdmin: true, isSuperAdmin: true }
    })

    if (!userProfile?.isAdmin && !userProfile?.isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { email: rawEmail, fullName, password, monthlyCredits, subscriptionTier } = body
    const email = String(rawEmail || '').trim().toLowerCase()

    // Validate required fields
    if (!isValidEmail(email) || !password) {
      return NextResponse.json(
        { error: 'A valid email and password are required' },
        { status: 400 }
      )
    }

    const pwError = validatePasswordStrength(password)
    if (pwError) {
      return NextResponse.json({ error: pwError }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } })
    if (existing) {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 })
    }

    const passwordHash = await hashPassword(password)

    // Create user directly (native auth — password stored as bcrypt hash).
    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
        emailVerified: true,
        emailVerifiedAt: new Date(),
        fullName: fullName || null,
        monthlyCredits: monthlyCredits || 100,
        subscriptionTier: subscriptionTier || 'starter',
        subscriptionStatus: 'active',
        hasCompletedOnboarding: true,
        creditsUsed: 0,
        notificationsEmail: true,
        notificationsWhatsApp: false
      }
    })

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        monthlyCredits: newUser.monthlyCredits,
        subscriptionTier: newUser.subscriptionTier
      }
    })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}
