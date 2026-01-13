import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { pricingService } from '@/lib/pricing'

// GET /api/admin/pricing - Get all pricing configurations
export async function GET(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient()
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

    const pricingConfigs = await prisma.pricingConfig.findMany({
      orderBy: { ratePerImage: 'asc' }
    })

    return NextResponse.json({ pricingConfigs }, { status: 200 })
  } catch (error) {
    console.error('Error fetching pricing configs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pricing configurations' },
      { status: 500 }
    )
  }
}

// POST /api/admin/pricing - Create or update pricing configuration
export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient()
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

    const body = await req.json()
    const {
      plan,
      displayName,
      ratePerImage,
      minimumInitialPurchase,
      minimumTopUp,
      description,
      features,
      isActive
    } = body

    // Validate required fields
    if (!plan || !displayName || typeof ratePerImage !== 'number') {
      return NextResponse.json(
        { error: 'Missing required fields: plan, displayName, ratePerImage' },
        { status: 400 }
      )
    }

    // Validate plan name
    if (!['personal', 'business'].includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan. Must be: personal or business' },
        { status: 400 }
      )
    }

    // Validate rate
    if (ratePerImage <= 0) {
      return NextResponse.json(
        { error: 'ratePerImage must be greater than 0' },
        { status: 400 }
      )
    }

    // Create or update pricing config
    const pricingConfig = await prisma.pricingConfig.upsert({
      where: { plan },
      create: {
        plan,
        displayName,
        ratePerImage,
        minimumInitialPurchase: minimumInitialPurchase || 0,
        minimumTopUp: minimumTopUp || 0,
        description: description || '',
        features: features || [],
        isActive: isActive !== undefined ? isActive : true
      },
      update: {
        displayName,
        ratePerImage,
        minimumInitialPurchase,
        minimumTopUp,
        description,
        features,
        isActive
      }
    })

    // Log admin action
    await prisma.adminLog.create({
      data: {
        adminId: user.id,
        action: 'update_pricing_config',
        targetType: 'pricing_config',
        targetId: pricingConfig.id,
        details: {
          plan,
          ratePerImage,
          minimumInitialPurchase,
          minimumTopUp
        }
      }
    })

    return NextResponse.json({
      success: true,
      pricingConfig
    }, { status: 200 })
  } catch (error) {
    console.error('Error updating pricing config:', error)
    return NextResponse.json(
      { error: 'Failed to update pricing configuration' },
      { status: 500 }
    )
  }
}
