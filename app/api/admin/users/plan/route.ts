import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

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
    const adminProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { isAdmin: true }
    })

    if (!adminProfile?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { userId, pricingPlan } = await request.json()

    if (!userId || !pricingPlan) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!['personal', 'business'].includes(pricingPlan)) {
      return NextResponse.json(
        { error: 'Invalid pricing plan. Must be "personal" or "business"' },
        { status: 400 }
      )
    }

    // Update the user's pricing plan
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { pricingPlan },
      select: {
        id: true,
        email: true,
        pricingPlan: true,
        creditBalance: true,
      }
    })

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: `Pricing plan updated to ${pricingPlan}`
    })
  } catch (error) {
    console.error('Error updating pricing plan:', error)
    return NextResponse.json(
      { error: 'Failed to update pricing plan' },
      { status: 500 }
    )
  }
}
