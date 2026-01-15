import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// GET /api/support/tickets - Get user's support tickets
export async function GET(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    // Build query - only show user's own tickets
    const where: any = { userId: user.id }
    if (status) {
      where.status = status
    }

    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          messages: {
            where: {
              isInternal: false, // Don't show internal notes to users
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      }),
      prisma.supportTicket.count({ where }),
    ])

    return NextResponse.json({
      tickets,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + tickets.length < total,
      },
    })
  } catch (error) {
    console.error('Error fetching support tickets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch support tickets' },
      { status: 500 }
    )
  }
}
