import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// GET /api/admin/webhooks/logs - Get webhook execution logs (admin only)
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
    const webhookId = searchParams.get('webhookId')
    const jobId = searchParams.get('jobId')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    // Build query
    const where: any = {}
    if (userId) {
      where.userId = userId
    }
    if (webhookId) {
      where.webhookId = webhookId
    }
    if (jobId) {
      where.jobId = jobId
    }
    if (status) {
      where.status = status
    }

    const [logs, total] = await Promise.all([
      prisma.workflowLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          user: {
            select: {
              email: true,
              fullName: true,
            },
          },
        },
      }),
      prisma.workflowLog.count({ where }),
    ])

    return NextResponse.json({
      logs,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + logs.length < total,
      },
    })
  } catch (error) {
    console.error('Error fetching webhook logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch webhook logs' },
      { status: 500 }
    )
  }
}
