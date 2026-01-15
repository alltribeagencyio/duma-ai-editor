import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// GET /api/admin/support/tickets/[id] - Get ticket details (admin only)
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

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: params.id },
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Fetch user details separately
    const ticketUser = await prisma.user.findUnique({
      where: { id: ticket.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        brandName: true,
      },
    })

    return NextResponse.json({
      ticket: {
        ...ticket,
        user: ticketUser
      }
    })
  } catch (error) {
    console.error('Error fetching ticket:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ticket' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/support/tickets/[id] - Update ticket (admin only)
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
      select: { isAdmin: true, isSuperAdmin: true, fullName: true },
    })

    if (!userProfile?.isAdmin && !userProfile?.isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { status, response, priority } = body

    // Check if ticket exists
    const existingTicket = await prisma.supportTicket.findUnique({
      where: { id: params.id },
    })

    if (!existingTicket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Build update data
    const updateData: any = {}
    if (status !== undefined) {
      updateData.status = status
      if (status === 'resolved' || status === 'closed') {
        updateData.resolvedAt = new Date()
        updateData.resolvedBy = user.id
      }
    }
    if (response !== undefined) {
      updateData.response = response
      updateData.respondedAt = new Date()
      updateData.respondedBy = user.id
    }
    if (priority !== undefined) {
      updateData.priority = priority
    }

    // Update ticket
    const ticket = await prisma.supportTicket.update({
      where: { id: params.id },
      data: updateData,
    })

    // Log admin action
    await prisma.adminLog.create({
      data: {
        adminId: user.id,
        action: 'ticket_update',
        targetType: 'support_ticket',
        targetId: params.id,
        details: {
          changes: updateData,
          adminName: userProfile.fullName,
        },
      },
    })

    // Send response notification to user via N8N if response was added
    if (response && process.env.N8N_TICKET_RESPONSE_WEBHOOK_URL) {
      try {
        await fetch(process.env.N8N_TICKET_RESPONSE_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ticketId: params.id,
            userEmail: existingTicket.userEmail,
            subject: existingTicket.subject,
            response,
            adminName: userProfile.fullName || 'Support Team',
            status: updateData.status || existingTicket.status,
          }),
        })
      } catch (error) {
        console.error('Error sending ticket response notification:', error)
        // Don't fail the request if notification fails
      }
    }

    return NextResponse.json({ ticket })
  } catch (error) {
    console.error('Error updating ticket:', error)
    return NextResponse.json(
      { error: 'Failed to update ticket' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/support/tickets/[id] - Delete ticket (admin only)
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

    // Check if ticket exists
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: params.id },
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Delete ticket
    await prisma.supportTicket.delete({
      where: { id: params.id },
    })

    // Log admin action
    await prisma.adminLog.create({
      data: {
        adminId: user.id,
        action: 'ticket_delete',
        targetType: 'support_ticket',
        targetId: params.id,
        details: {
          ticketSubject: ticket.subject,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting ticket:', error)
    return NextResponse.json(
      { error: 'Failed to delete ticket' },
      { status: 500 }
    )
  }
}
