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

    // Get comprehensive analytics data
    const [
      // User metrics
      totalUsers,
      activeUsers7Days,
      activeUsers30Days,
      newUsersThisMonth,
      usersByPlan,

      // Job metrics
      totalJobs,
      jobsByStatus,
      jobsThisMonth,
      avgJobsPerUser,

      // Credit metrics
      totalCreditsUsed,
      totalCreditBalance,
      creditTransactions,
      topSpenders,

      // Revenue metrics
      totalRevenue,
      revenueThisMonth,

      // Prompt metrics
      totalBrandPrompts,
      totalPresetPrompts,
      mostUsedPrompts,
    ] = await Promise.all([
      // User metrics
      prisma.user.count(),
      prisma.user.count({
        where: {
          lastLoginAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      prisma.user.count({
        where: {
          lastLoginAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      }),
      prisma.user.groupBy({
        by: ['pricingPlan'],
        _count: true
      }),

      // Job metrics
      prisma.job.count(),
      prisma.job.groupBy({
        by: ['status'],
        _count: true
      }),
      prisma.job.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      }),
      prisma.job.count().then(async (total) => {
        const users = await prisma.user.count()
        return users > 0 ? (total / users).toFixed(2) : '0'
      }),

      // Credit metrics
      prisma.user.aggregate({
        _sum: {
          creditsUsed: true
        }
      }),
      prisma.user.aggregate({
        _sum: {
          creditBalance: true
        }
      }),
      prisma.creditTransaction.count(),
      prisma.user.findMany({
        select: {
          email: true,
          fullName: true,
          creditsUsed: true,
          creditBalance: true,
        },
        orderBy: {
          creditsUsed: 'desc'
        },
        take: 5
      }),

      // Revenue metrics
      prisma.payment.aggregate({
        where: {
          type: 'credit_purchase',
          status: 'success'
        },
        _sum: {
          amountUSD: true
        }
      }),
      prisma.payment.aggregate({
        where: {
          type: 'credit_purchase',
          status: 'success',
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        },
        _sum: {
          amountUSD: true
        }
      }),

      // Prompt metrics
      prisma.brandPrompt.count(),
      prisma.promptPreset.count(),
      prisma.job.groupBy({
        by: ['promptType'],
        _count: true,
        orderBy: {
          _count: {
            promptType: 'desc'
          }
        },
        take: 5
      })
    ])

    // Calculate growth rates
    const lastMonthStart = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)
    const lastMonthEnd = new Date(new Date().getFullYear(), new Date().getMonth(), 0)

    const newUsersLastMonth = await prisma.user.count({
      where: {
        createdAt: {
          gte: lastMonthStart,
          lte: lastMonthEnd
        }
      }
    })

    const userGrowthRate = newUsersLastMonth > 0
      ? (((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100).toFixed(1)
      : '0'

    // Get job completion rate
    const completedJobs = jobsByStatus.find((j: { status: string }) => j.status === 'completed')?._count || 0
    const jobCompletionRate = totalJobs > 0 ? ((completedJobs / totalJobs) * 100).toFixed(1) : '0'

    // Get average credit balance per user
    const avgCreditBalance = totalUsers > 0
      ? ((totalCreditBalance._sum.creditBalance || 0) / totalUsers).toFixed(2)
      : '0'

    const analytics = {
      users: {
        total: totalUsers,
        active7Days: activeUsers7Days,
        active30Days: activeUsers30Days,
        newThisMonth: newUsersThisMonth,
        growthRate: parseFloat(userGrowthRate),
        byPlan: usersByPlan.reduce((acc: Record<string, number>, item: { pricingPlan: string, _count: number }) => {
          acc[item.pricingPlan] = item._count
          return acc
        }, {})
      },
      jobs: {
        total: totalJobs,
        thisMonth: jobsThisMonth,
        byStatus: jobsByStatus.reduce((acc: Record<string, number>, item: { status: string, _count: number }) => {
          acc[item.status] = item._count
          return acc
        }, {}),
        completionRate: parseFloat(jobCompletionRate),
        avgPerUser: parseFloat(avgJobsPerUser as string)
      },
      credits: {
        totalUsed: totalCreditsUsed._sum.creditsUsed || 0,
        totalBalance: totalCreditBalance._sum.creditBalance || 0,
        avgBalance: parseFloat(avgCreditBalance),
        transactions: creditTransactions,
        topSpenders: topSpenders.map(user => ({
          name: user.fullName || user.email,
          email: user.email,
          used: user.creditsUsed,
          balance: user.creditBalance
        }))
      },
      revenue: {
        total: totalRevenue._sum.amountUSD || 0,
        thisMonth: revenueThisMonth._sum.amountUSD || 0
      },
      prompts: {
        brandPrompts: totalBrandPrompts,
        presetPrompts: totalPresetPrompts,
        mostUsed: mostUsedPrompts.map((p: { promptType: string, _count: number }) => ({
          prompt: p.promptType || 'Custom prompt',
          count: p._count
        }))
      }
    }

    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Error fetching admin analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
