import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// GET /api/user/profile - Get user profile
export async function GET(req: NextRequest) {
  try {
    console.log('[Profile API] Starting profile fetch...')
    const supabase = createRouteHandlerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    console.log('[Profile API] User from auth:', user?.id)

    if (!user) {
      console.log('[Profile API] No user found - unauthorized')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get or create user profile
    console.log('[Profile API] Fetching user profile from database...')
    let userProfile = await prisma.user.findUnique({
      where: { id: user.id },
    })

    console.log('[Profile API] User profile found:', !!userProfile)

    if (!userProfile) {
      // Create user profile from Supabase auth data
      console.log('[Profile API] Creating new user profile...')
      userProfile = await prisma.user.create({
        data: {
          id: user.id,
          email: user.email!,
          fullName: user.user_metadata?.full_name || user.user_metadata?.name,
          lastLoginAt: new Date(),
        },
      })
      console.log('[Profile API] User profile created')
    } else {
      // Update last login
      console.log('[Profile API] Updating last login...')
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      })
    }

    console.log('[Profile API] Returning profile data')
    return NextResponse.json({ user: userProfile })
  } catch (error) {
    console.error('[Profile API] Error fetching user profile:', error)
    console.error('[Profile API] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      {
        error: 'Failed to fetch user profile',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
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
      fullName,
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
        fullName,
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