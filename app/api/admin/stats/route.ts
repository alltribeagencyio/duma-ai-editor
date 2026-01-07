import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const userProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { isAdmin: true }
    })

    if (!userProfile?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get stats
    const [totalUsers, activeUsers, totalJobs, completedJobs, creditStats] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          lastLoginAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        }
      }),
      prisma.job.count(),
      prisma.job.count({ where: { status: 'completed' } }),
      prisma.user.aggregate({
        _sum: {
          creditsUsed: true
        }
      })
    ])

    const stats = {
      totalUsers,
      activeUsers,
      totalJobs,
      completedJobs,
      revenue: 0, // TODO: Calculate from Payment table when implemented
      creditsUsed: creditStats._sum.creditsUsed || 0
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
