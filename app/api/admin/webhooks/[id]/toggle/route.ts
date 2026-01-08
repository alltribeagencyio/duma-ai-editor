import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// POST /api/admin/webhooks/[id]/toggle - Toggle webhook active status (admin only)
export async function POST(
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

    // Toggle active status
    const updatedWebhook = await prisma.userWebhook.update({
      where: { id: params.id },
      data: {
        isActive: !webhook.isActive,
        updatedAt: new Date(),
      },
    })

    // Log admin action
    await prisma.adminLog.create({
      data: {
        adminId: user.id,
        action: 'webhook_toggle',
        targetType: 'webhook',
        targetId: params.id,
        details: {
          webhookName: webhook.name,
          previousState: webhook.isActive,
          newState: updatedWebhook.isActive,
        },
      },
    })

    return NextResponse.json({ webhook: updatedWebhook })
  } catch (error) {
    console.error('Error toggling webhook:', error)
    return NextResponse.json(
      { error: 'Failed to toggle webhook' },
      { status: 500 }
    )
  }
}
