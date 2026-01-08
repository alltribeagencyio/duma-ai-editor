import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { isValidWebhookUrl } from '@/lib/webhooks/selector'

// GET /api/admin/webhooks/[id] - Get single webhook (admin only)
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
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
      select: { isAdmin: true, isSuperAdmin: true },
    })

    if (!userProfile?.isAdmin && !userProfile?.isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const webhook = await prisma.userWebhook.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            email: true,
            fullName: true,
            subscriptionTier: true,
          },
        },
      },
    })

    if (!webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
    }

    return NextResponse.json({ webhook })
  } catch (error) {
    console.error('Error fetching webhook:', error)
    return NextResponse.json(
      { error: 'Failed to fetch webhook' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/webhooks/[id] - Update webhook (admin only)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
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
      select: { isAdmin: true, isSuperAdmin: true },
    })

    if (!userProfile?.isAdmin && !userProfile?.isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { name, webhookUrl, webhookType, priority, tierRestriction, isActive } = body

    // Validate webhook URL if provided
    if (webhookUrl && !isValidWebhookUrl(webhookUrl)) {
      return NextResponse.json(
        { error: 'Invalid webhook URL format' },
        { status: 400 }
      )
    }

    // Check if webhook exists
    const existingWebhook = await prisma.userWebhook.findUnique({
      where: { id: params.id },
    })

    if (!existingWebhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
    }

    // Update webhook
    const webhook = await prisma.userWebhook.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(webhookUrl !== undefined && { webhookUrl }),
        ...(webhookType !== undefined && { webhookType }),
        ...(priority !== undefined && { priority }),
        ...(tierRestriction !== undefined && { tierRestriction }),
        ...(isActive !== undefined && { isActive }),
        updatedAt: new Date(),
      },
    })

    // Log admin action
    await prisma.adminLog.create({
      data: {
        adminId: user.id,
        action: 'webhook_update',
        targetType: 'webhook',
        targetId: webhook.id,
        details: {
          changes: body,
        },
      },
    })

    return NextResponse.json({ webhook })
  } catch (error) {
    console.error('Error updating webhook:', error)
    return NextResponse.json(
      { error: 'Failed to update webhook' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/webhooks/[id] - Delete webhook (admin only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
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
      select: { isAdmin: true, isSuperAdmin: true },
    })

    if (!userProfile?.isAdmin && !userProfile?.isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if webhook exists
    const webhook = await prisma.userWebhook.findUnique({
      where: { id: params.id },
    })

    if (!webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
    }

    // Delete webhook
    await prisma.userWebhook.delete({
      where: { id: params.id },
    })

    // Log admin action
    await prisma.adminLog.create({
      data: {
        adminId: user.id,
        action: 'webhook_delete',
        targetType: 'webhook',
        targetId: params.id,
        details: {
          webhookName: webhook.name,
          userId: webhook.userId,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting webhook:', error)
    return NextResponse.json(
      { error: 'Failed to delete webhook' },
      { status: 500 }
    )
  }
}
