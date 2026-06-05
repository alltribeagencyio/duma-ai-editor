import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/session'

export const runtime = 'nodejs'

// GET /api/auth/me — current authenticated user's profile.
export async function GET() {
  try {
    const auth = await getCurrentUser()
    if (!auth) {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatar: true,
        role: true,
        isAdmin: true,
        isSuperAdmin: true,
        pricingPlan: true,
        creditBalance: true,
        hasCompletedOnboarding: true,
      },
    })

    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Me error:', error)
    return NextResponse.json({ error: 'Failed to load user' }, { status: 500 })
  }
}
