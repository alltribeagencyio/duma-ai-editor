import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { isValidWebhookUrl } from '@/lib/webhooks/selector'

// GET /api/admin/webhooks - Get all webhooks (admin only)
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
      select: { isAdmin: true, isSuperAdmin: true },
    })

    if (!userProfile?.isAdmin && !userProfile?.isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get query parameters
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const webhookType = searchParams.get('webhookType')

    // Build query
    const where: any = {}
    if (userId) {
      where.userId = userId
    }
    if (webhookType) {
      where.webhookType = webhookType
    }

    const webhooks = await prisma.userWebhook.findMany({
      where,
      orderBy: [
        { isActive: 'desc' },
        { priority: 'asc' },
      ],
    })

    return NextResponse.json({ webhooks })
  } catch (error) {
    console.error('Error fetching webhooks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch webhooks' },
      { status: 500 }
    )
  }
}

// POST /api/admin/webhooks - Create new webhook (admin only)
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
      select: { isAdmin: true, isSuperAdmin: true },
    })

    if (!userProfile?.isAdmin && !userProfile?.isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const {
      userId: targetUserId,
      name,
      webhookUrl,
      webhookType = 'image_processing',
      priority = 0,
      tierRestriction,
      isActive = false,
    } = body

    // Validate required fields
    if (!targetUserId || !name || !webhookUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, name, webhookUrl' },
        { status: 400 }
      )
    }

    // Validate webhook URL
    if (!isValidWebhookUrl(webhookUrl)) {
      return NextResponse.json(
        { error: 'Invalid webhook URL format' },
        { status: 400 }
      )
    }

    // Verify target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: 'Target user not found' },
        { status: 404 }
      )
    }

    // Create webhook
    const webhook = await prisma.userWebhook.create({
      data: {
        userId: targetUserId,
        name,
        webhookUrl,
        webhookType,
        priority,
        tierRestriction,
        isActive,
      },
    })

    // Log admin action
    await prisma.adminLog.create({
      data: {
        adminId: user.id,
        action: 'webhook_create',
        targetType: 'webhook',
        targetId: webhook.id,
        details: {
          webhookName: name,
          targetUserId,
          webhookUrl,
        },
      },
    })

    return NextResponse.json({ webhook }, { status: 201 })
  } catch (error) {
    console.error('Error creating webhook:', error)
    return NextResponse.json(
      { error: 'Failed to create webhook' },
      { status: 500 }
    )
  }
}
