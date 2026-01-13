import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// GET /api/admin/pricing/[plan] - Get specific pricing configuration
export async function GET(
  req: NextRequest,
  { params }: { params: { plan: string } }
) {
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

    const { plan } = params

    const pricingConfig = await prisma.pricingConfig.findUnique({
      where: { plan }
    })

    if (!pricingConfig) {
      return NextResponse.json(
        { error: 'Pricing configuration not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ pricingConfig }, { status: 200 })
  } catch (error) {
    console.error('Error fetching pricing config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pricing configuration' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/pricing/[plan] - Delete/deactivate pricing configuration
export async function DELETE(
  req: NextRequest,
  { params }: { params: { plan: string } }
) {
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

    const { plan } = params

    // Soft delete by setting isActive to false
    const pricingConfig = await prisma.pricingConfig.update({
      where: { plan },
      data: { isActive: false }
    })

    // Log admin action
    await prisma.adminLog.create({
      data: {
        adminId: user.id,
        action: 'deactivate_pricing_config',
        targetType: 'pricing_config',
        targetId: pricingConfig.id,
        details: { plan }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Pricing configuration deactivated'
    }, { status: 200 })
  } catch (error) {
    console.error('Error deactivating pricing config:', error)
    return NextResponse.json(
      { error: 'Failed to deactivate pricing configuration' },
      { status: 500 }
    )
  }
}
