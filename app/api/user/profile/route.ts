import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// GET /api/user/profile - Get user profile
export async function GET(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get or create user profile
    let userProfile = await prisma.user.findUnique({
      where: { id: user.id },
    })

    if (!userProfile) {
      // Create user profile from Supabase auth data
      userProfile = await prisma.user.create({
        data: {
          id: user.id,
          email: user.email!,
          name: user.user_metadata?.full_name || user.user_metadata?.name,
          lastLoginAt: new Date(),
        },
      })
    } else {
      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      })
    }

    return NextResponse.json({ user: userProfile })
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    )
  }
}

// PUT /api/user/profile - Update user profile
export async function PUT(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      name,
      phone,
      brandName,
      brandIndustry,
      brandAesthetic,
      brandColors,
      brandRequirements,
      notificationsEmail,
      notificationsWhatsApp,
      whatsappNumber,
      language,
      timezone,
    } = body

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name,
        phone,
        brandName,
        brandIndustry,
        brandAesthetic,
        brandColors,
        brandRequirements,
        notificationsEmail,
        notificationsWhatsApp,
        whatsappNumber,
        language,
        timezone,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error('Error updating user profile:', error)
    return NextResponse.json(
      { error: 'Failed to update user profile' },
      { status: 500 }
    )
  }
}