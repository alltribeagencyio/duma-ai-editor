import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// GET /api/credits/transactions - Get user's credit transaction history
export async function GET(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const type = searchParams.get('type') // purchase, deduction, refund, bonus

    const where: any = { userId: user.id }

    if (type) {
      where.type = type
    }

    const [transactions, total] = await Promise.all([
      prisma.creditTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.creditTransaction.count({ where })
    ])

    return NextResponse.json({
      transactions,
      total,
      limit,
      offset
    }, { status: 200 })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}
