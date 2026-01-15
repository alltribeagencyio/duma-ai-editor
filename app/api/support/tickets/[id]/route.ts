import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// GET /api/support/tickets/[id] - Get a specific ticket with messages
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

    const ticket = await prisma.supportTicket.findFirst({
      where: {
        id: params.id,
        userId: user.id, // Users can only view their own tickets
      },
      include: {
        messages: {
          where: {
            isInternal: false, // Don't show internal notes to users
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    return NextResponse.json({ ticket })
  } catch (error) {
    console.error('Error fetching ticket:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ticket' },
      { status: 500 }
    )
  }
}

// POST /api/support/tickets/[id] - Add a message to a ticket
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

    const body = await req.json()
    const { message } = body

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Verify ticket exists and belongs to user
    const ticket = await prisma.supportTicket.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Don't allow replies to closed tickets
    if (ticket.status === 'closed') {
      return NextResponse.json(
        { error: 'Cannot reply to a closed ticket' },
        { status: 400 }
      )
    }

    // Get user info
    const userProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { fullName: true, email: true },
    })

    // Create the message
    const ticketMessage = await prisma.supportTicketMessage.create({
      data: {
        ticketId: params.id,
        senderId: user.id,
        senderEmail: user.email!,
        senderName: userProfile?.fullName || undefined,
        senderRole: 'user',
        message: message.trim(),
        isInternal: false,
      },
    })

    // Update ticket status to "open" if it was "awaiting_customer"
    if (ticket.status === 'awaiting_customer') {
      await prisma.supportTicket.update({
        where: { id: params.id },
        data: {
          status: 'open',
          updatedAt: new Date(),
        },
      })
    } else {
      // Just update the timestamp
      await prisma.supportTicket.update({
        where: { id: params.id },
        data: {
          updatedAt: new Date(),
        },
      })
    }

    // Notify support team via webhook
    const supportWebhookUrl = process.env.N8N_SUPPORT_WEBHOOK_URL
    if (supportWebhookUrl) {
      try {
        await fetch(supportWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'ticket_reply',
            ticketId: params.id,
            messageId: ticketMessage.id,
            userId: user.id,
            userEmail: user.email,
            userName: userProfile?.fullName,
            message: message.trim(),
            subject: ticket.subject,
            createdAt: ticketMessage.createdAt,
          }),
        })
      } catch (error) {
        console.error('Error sending reply notification to N8N:', error)
      }
    }

    return NextResponse.json({ message: ticketMessage }, { status: 201 })
  } catch (error) {
    console.error('Error adding message to ticket:', error)
    return NextResponse.json(
      { error: 'Failed to add message' },
      { status: 500 }
    )
  }
}
