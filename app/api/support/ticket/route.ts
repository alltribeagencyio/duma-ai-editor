import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// POST /api/support/ticket - Create support ticket
export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { subject, message, category = 'general', priority = 'normal' } = body

    // Validate required fields
    if (!subject || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: subject, message' },
        { status: 400 }
      )
    }

    // Create support ticket
    const ticket = await prisma.supportTicket.create({
      data: {
        userId: user.id,
        userEmail: user.email!,
        subject,
        message,
        category,
        priority,
        status: 'open',
      },
    })

    // Send to N8N support webhook if configured
    const supportWebhookUrl = process.env.N8N_SUPPORT_WEBHOOK_URL
    if (supportWebhookUrl) {
      try {
        await fetch(supportWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ticketId: ticket.id,
            userId: user.id,
            userEmail: user.email,
            subject,
            message,
            category,
            priority,
            createdAt: ticket.createdAt,
            callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/support/ticket/callback`,
          }),
        })
      } catch (error) {
        console.error('Error sending support ticket to N8N:', error)
        // Don't fail the request if webhook fails
      }
    }

    return NextResponse.json({ ticket }, { status: 201 })
  } catch (error) {
    console.error('Error creating support ticket:', error)
    return NextResponse.json(
      { error: 'Failed to create support ticket' },
      { status: 500 }
    )
  }
}
