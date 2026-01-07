'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  CreditCard,
  TrendingUp,
  Calendar,
  Target,
  AlertCircle,
  RefreshCw,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react'
// Simple chart components (replace with recharts after npm install)
const SimpleLineChart = ({ data }: { data: any[] }) => (
  <div className="h-72 flex items-end justify-center space-x-2 p-4 bg-gray-50 rounded">
    {data.slice(-10).map((item, index) => (
      <div
        key={index}
        className="bg-blue-500 rounded-t"
        style={{
          height: `${Math.max((item.credits / Math.max(...data.map(d => d.credits))) * 100, 10)}%`,
          width: '20px'
        }}
        title={`${item.date}: ${item.credits} credits`}
      />
    ))}
  </div>
)

const SimplePieChart = ({ data }: { data: any[] }) => (
  <div className="h-48 flex items-center justify-center">
    <div className="text-center">
      <div className="text-lg font-bold mb-2">Usage Distribution</div>
      {data.map((item, index) => (
        <div key={index} className="text-sm mb-1">
          {item.type}: {item.amount} ({Math.round(item.percentage)}%)
        </div>
      ))}
    </div>
  </div>
)

const SimpleBarChart = ({ data }: { data: any[] }) => (
  <div className="h-64 flex items-end justify-center space-x-4 p-4 bg-gray-50 rounded">
    {data.map((item, index) => (
      <div key={index} className="flex flex-col items-center">
        <div
          className="bg-blue-500 rounded-t mb-2"
          style={{
            height: `${Math.max((item.count / Math.max(...data.map(d => d.count))) * 100, 20)}px`,
            width: '40px'
          }}
        />
        <div className="text-xs text-center">{item.status}</div>
        <div className="text-xs font-bold">{item.count}</div>
      </div>
    ))}
  </div>
)

interface CreditAnalytics {
  period: number
  summary: {
    totalAvailable: number
    remainingCredits: number
    creditsUsed: number
    usagePercentage: number
  }
  usage: {
    byType: Array<{
      type: string
      amount: number
      count: number
      percentage: number
    }>
    daily: Array<{
      date: string
      credits: number
      transactions: number
    }>
    recent: Array<{
      amount: number
      type: string
      createdAt: string
      description: string
    }>
  }
  jobs: {
    total: number
    completed: number
    successRate: number
    avgCreditsPerJob: number
    byStatus: Array<{
      status: string
      count: number
    }>
  }
  user: {
    tier: string
    memberSince: string
  }
}

export function CreditAnalytics() {
  const [analytics, setAnalytics] = useState<CreditAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [period, setPeriod] = useState('30')

  useEffect(() => {
    fetchAnalytics()
  }, [period])

  const fetchAnalytics = async () => {
    setIsLoading(true)
    setError('')
    try {
      const response = await fetch(`/api/analytics/credits?period=${period}`)
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data.analytics)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to fetch analytics')
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
      setError('Failed to load analytics data')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getUsageColor = (percentage: number) => {
    if (percentage < 50) return 'text-green-600'
    if (percentage < 80) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getProgressColor = (percentage: number) => {
    if (percentage < 50) return 'bg-green-500'
    if (percentage < 80) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const pieChartColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!analytics) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>No analytics data available</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="w-full max-w-screen-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Credit Analytics</h1>
          <p className="text-gray-600 mt-1">
            Track your credit usage and monitor your account efficiency
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={fetchAnalytics}
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Total Credits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.summary.totalAvailable.toLocaleString()}</div>
            <p className="text-xs text-gray-600 mt-1">Available this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Credits Used
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.summary.creditsUsed.toLocaleString()}</div>
            <div className="flex items-center mt-2">
              <Progress
                value={analytics.summary.usagePercentage}
                className="flex-1 h-2"
              />
              <span className={`text-xs ml-2 font-medium ${getUsageColor(analytics.summary.usagePercentage)}`}>
                {Math.round(analytics.summary.usagePercentage)}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.jobs.successRate}%</div>
            <p className="text-xs text-gray-600 mt-1">
              {analytics.jobs.completed} of {analytics.jobs.total} jobs completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Avg Credits/Job
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.jobs.avgCreditsPerJob}</div>
            <p className="text-xs text-gray-600 mt-1">Per job efficiency</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Usage Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Daily Usage Trend
            </CardTitle>
            <CardDescription>
              Credit consumption over the last {analytics.period} days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleLineChart data={analytics.usage.daily} />
          </CardContent>
        </Card>

        {/* Usage by Type */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Usage by Type
            </CardTitle>
            <CardDescription>
              Credit distribution across different operations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SimplePieChart data={analytics.usage.byType} />

              <div className="space-y-2">
                {analytics.usage.byType.map((item, index) => (
                  <div key={item.type} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full bg-blue-500"
                      />
                      <span className="text-sm capitalize">{item.type}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">{item.amount}</div>
                      <div className="text-xs text-gray-500">{Math.round(item.percentage)}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Job Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Job Performance</CardTitle>
          <CardDescription>
            Breakdown of job statuses and performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-4">Jobs by Status</h4>
              <SimpleBarChart data={analytics.jobs.byStatus} />
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Performance Summary</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-sm font-medium">Total Jobs</span>
                  <span className="text-lg font-bold">{analytics.jobs.total}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                  <span className="text-sm font-medium">Completed</span>
                  <span className="text-lg font-bold text-green-600">{analytics.jobs.completed}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                  <span className="text-sm font-medium">Success Rate</span>
                  <span className="text-lg font-bold text-blue-600">{analytics.jobs.successRate}%</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded">
                  <span className="text-sm font-medium">Efficiency</span>
                  <span className="text-lg font-bold text-purple-600">{analytics.jobs.avgCreditsPerJob} credits/job</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Transactions
          </CardTitle>
          <CardDescription>
            Your latest credit usage activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          {analytics.usage.recent.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No recent transactions found
            </div>
          ) : (
            <div className="space-y-4">
              {analytics.usage.recent.map((transaction, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium">
                        {transaction.description || `${transaction.type} operation`}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDateTime(transaction.createdAt)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-red-600">
                      -{transaction.amount} credits
                    </div>
                    <Badge variant="outline" className="text-xs capitalize">
                      {transaction.type}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <span className="text-sm font-medium text-gray-600">Subscription Tier</span>
              <div className="mt-1">
                <Badge className="capitalize">{analytics.user.tier}</Badge>
              </div>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Member Since</span>
              <div className="mt-1 text-sm">
                {new Date(analytics.user.memberSince).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}