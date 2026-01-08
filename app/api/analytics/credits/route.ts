import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// GET /api/analytics/credits - Get credit usage analytics
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
    const period = searchParams.get('period') || '30' // days
    const periodDays = parseInt(period)

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - periodDays)

    // Get user profile for current credit info
    const userProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        monthlyCredits: true,
        practiceCredits: true,
        creditsUsed: true,
        subscriptionTier: true,
        createdAt: true
      }
    })

    if (!userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Get credit usage over time
    const creditUsage = await prisma.creditUsage.findMany({
      where: {
        userId: user.id,
        createdAt: {
          gte: startDate
        }
      },
      orderBy: { createdAt: 'asc' },
      select: {
        amount: true,
        type: true,
        createdAt: true,
        description: true
      }
    })

    // Get usage by type
    const usageByType = await prisma.creditUsage.groupBy({
      by: ['type'],
      where: {
        userId: user.id,
        createdAt: {
          gte: startDate
        }
      },
      _sum: {
        amount: true
      },
      _count: {
        id: true
      }
    })

    // Get daily usage for chart
    const dailyUsage = await prisma.$queryRaw`
      SELECT
        DATE_TRUNC('day', "createdAt") as date,
        SUM(amount) as credits,
        COUNT(*) as transactions
      FROM "CreditUsage"
      WHERE "userId" = ${user.id}
        AND "createdAt" >= ${startDate}
      GROUP BY DATE_TRUNC('day', "createdAt")
      ORDER BY date ASC
    ` as Array<{ date: Date; credits: bigint; transactions: bigint }>

    // Get jobs statistics
    const jobStats = await prisma.job.groupBy({
      by: ['status'],
      where: {
        userId: user.id,
        createdAt: {
          gte: startDate
        }
      },
      _count: {
        id: true
      }
    })

    // Calculate efficiency metrics
    const totalJobs = jobStats.reduce((sum, stat) => sum + stat._count.id, 0)
    const completedJobs = jobStats.find(s => s.status === 'completed')?._count.id || 0
    const successRate = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0

    // Calculate average credits per job
    const totalCreditsUsed = creditUsage.reduce((sum, usage) => sum + usage.amount, 0)
    const avgCreditsPerJob = totalJobs > 0 ? totalCreditsUsed / totalJobs : 0

    // Format daily usage for chart
    const formattedDailyUsage = dailyUsage.map(day => ({
      date: day.date.toISOString().split('T')[0],
      credits: Number(day.credits),
      transactions: Number(day.transactions)
    }))

    // Calculate remaining credits
    const totalAvailable = userProfile.monthlyCredits + userProfile.practiceCredits
    const remainingCredits = totalAvailable - userProfile.creditsUsed

    return NextResponse.json({
      analytics: {
        period: periodDays,
        summary: {
          totalAvailable,
          remainingCredits,
          creditsUsed: userProfile.creditsUsed,
          usagePercentage: totalAvailable > 0 ? (userProfile.creditsUsed / totalAvailable) * 100 : 0
        },
        usage: {
          byType: usageByType.map(type => ({
            type: type.type,
            amount: type._sum.amount || 0,
            count: type._count.id,
            percentage: totalCreditsUsed > 0 ? ((type._sum.amount || 0) / totalCreditsUsed) * 100 : 0
          })),
          daily: formattedDailyUsage,
          recent: creditUsage.slice(-10).reverse() // Last 10 transactions
        },
        jobs: {
          total: totalJobs,
          completed: completedJobs,
          successRate: Math.round(successRate * 100) / 100,
          avgCreditsPerJob: Math.round(avgCreditsPerJob * 100) / 100,
          byStatus: jobStats.map(stat => ({
            status: stat.status,
            count: stat._count.id
          }))
        },
        user: {
          tier: userProfile.subscriptionTier,
          memberSince: userProfile.createdAt?.toISOString() || new Date().toISOString()
        }
      }
    })
  } catch (error) {
    console.error('Error fetching credit analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch credit analytics' },
      { status: 500 }
    )
  }
}