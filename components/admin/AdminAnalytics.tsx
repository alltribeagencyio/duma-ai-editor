'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Users,
  Briefcase,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  MessageSquare,
  Activity,
  Award
} from 'lucide-react'

interface Analytics {
  users: {
    total: number
    active7Days: number
    active30Days: number
    newThisMonth: number
    growthRate: number
    byPlan: Record<string, number>
  }
  jobs: {
    total: number
    thisMonth: number
    byStatus: Record<string, number>
    completionRate: number
    avgPerUser: number
  }
  credits: {
    totalUsed: number
    totalBalance: number
    avgBalance: number
    transactions: number
    topSpenders: Array<{
      name: string
      email: string
      used: number
      balance: number
    }>
  }
  revenue: {
    total: number
    thisMonth: number
  }
  prompts: {
    brandPrompts: number
    presetPrompts: number
    mostUsed: Array<{
      prompt: string
      count: number
    }>
  }
}

export function AdminAnalytics() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/admin/analytics')
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-4" />
              <div className="h-8 bg-gray-200 rounded w-16 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-32" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-gray-600">Failed to load analytics data</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* User Analytics */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-purple-600" />
          User Analytics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Users</CardDescription>
              <CardTitle className="text-3xl">{analytics.users.total.toLocaleString()}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-gray-500">
                {analytics.users.active30Days} active (30 days)
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>New This Month</CardDescription>
              <CardTitle className="text-3xl">{analytics.users.newThisMonth}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-xs flex items-center gap-1 ${analytics.users.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {analytics.users.growthRate >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {Math.abs(analytics.users.growthRate)}% vs last month
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Active (7 Days)</CardDescription>
              <CardTitle className="text-3xl">{analytics.users.active7Days}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-gray-500">
                {((analytics.users.active7Days / analytics.users.total) * 100).toFixed(1)}% of total
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>By Pricing Plan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {Object.entries(analytics.users.byPlan).map(([plan, count]) => (
                  <div key={plan} className="flex justify-between text-sm">
                    <span className="capitalize text-gray-600">{plan}:</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Job Analytics */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-blue-600" />
          Job Analytics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Jobs</CardDescription>
              <CardTitle className="text-3xl">{analytics.jobs.total.toLocaleString()}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-gray-500">
                {analytics.jobs.thisMonth} this month
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Completion Rate</CardDescription>
              <CardTitle className="text-3xl">{analytics.jobs.completionRate}%</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-gray-500">
                {analytics.jobs.byStatus.completed || 0} completed
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Avg Jobs/User</CardDescription>
              <CardTitle className="text-3xl">{analytics.jobs.avgPerUser}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-gray-500">
                Platform average
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Job Status Breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {Object.entries(analytics.jobs.byStatus).map(([status, count]) => (
                  <div key={status} className="flex justify-between text-sm">
                    <span className="capitalize text-gray-600">{status}:</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Credit & Revenue Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-green-600" />
            Credit Analytics
          </h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Credits Used</CardDescription>
                <CardTitle className="text-2xl">{analytics.credits.totalUsed.toLocaleString()}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-gray-500">
                  Images processed
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Balance</CardDescription>
                <CardTitle className="text-2xl">${analytics.credits.totalBalance.toFixed(2)}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-gray-500">
                  Avg: ${analytics.credits.avgBalance}/user
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Award className="h-4 w-4 text-yellow-600" />
                Top Spenders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.credits.topSpenders.map((spender, idx) => (
                  <div key={spender.email} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-medium">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{spender.name}</div>
                        <div className="text-xs text-gray-500">{spender.email}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">{spender.used} images</div>
                      <div className="text-xs text-gray-500">${spender.balance.toFixed(2)} balance</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-orange-600" />
            Revenue Analytics
          </h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Revenue</CardDescription>
                <CardTitle className="text-2xl">${analytics.revenue.total.toFixed(2)}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-gray-500">
                  All time
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>This Month</CardDescription>
                <CardTitle className="text-2xl">${analytics.revenue.thisMonth.toFixed(2)}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-gray-500">
                  {analytics.credits.transactions} transactions
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-blue-600" />
                Most Used Prompts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.prompts.mostUsed.map((prompt, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex-1 mr-3">
                      <div className="text-sm text-gray-700 truncate">{prompt.prompt}</div>
                    </div>
                    <div className="text-sm font-medium text-gray-900">{prompt.count}x</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t text-xs text-gray-500">
                Total prompts: {analytics.prompts.brandPrompts} brand + {analytics.prompts.presetPrompts} preset
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Platform Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-purple-600" />
            Platform Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm text-gray-600 mb-2">User Engagement</div>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full"
                    style={{ width: `${(analytics.users.active30Days / analytics.users.total) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium">
                  {((analytics.users.active30Days / analytics.users.total) * 100).toFixed(0)}%
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">30-day active rate</div>
            </div>

            <div>
              <div className="text-sm text-gray-600 mb-2">Job Success Rate</div>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${analytics.jobs.completionRate}%` }}
                  />
                </div>
                <span className="text-sm font-medium">
                  {analytics.jobs.completionRate}%
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">Completion rate</div>
            </div>

            <div>
              <div className="text-sm text-gray-600 mb-2">User Growth</div>
              <div className="flex items-center gap-3">
                <div className={`text-2xl font-bold ${analytics.users.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {analytics.users.growthRate >= 0 ? '+' : ''}{analytics.users.growthRate}%
                </div>
                {analytics.users.growthRate >= 0 ? (
                  <TrendingUp className="h-5 w-5 text-green-600" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-600" />
                )}
              </div>
              <div className="text-xs text-gray-500 mt-1">vs last month</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
