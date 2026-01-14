'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Users, Briefcase, MessageSquare, DollarSign, TrendingUp, Activity, Award } from 'lucide-react'
import Link from 'next/link'

interface Stats {
  totalUsers: number
  activeUsers: number
  totalJobs: number
  completedJobs: number
  creditsUsed: number
  revenue: number
}

interface AnalyticsSnapshot {
  users: {
    newThisMonth: number
    growthRate: number
  }
  jobs: {
    completionRate: number
  }
  credits: {
    topSpenders: Array<{
      name: string
      used: number
    }>
  }
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [analyticsSnapshot, setAnalyticsSnapshot] = useState<AnalyticsSnapshot | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
    fetchAnalyticsSnapshot()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAnalyticsSnapshot = async () => {
    try {
      const response = await fetch('/api/admin/analytics')
      if (response.ok) {
        const data = await response.json()
        setAnalyticsSnapshot(data)
      }
    } catch (error) {
      console.error('Error fetching analytics snapshot:', error)
    }
  }

  return (
    <AdminLayout title="Welcome to Admin Panel" subtitle="Manage your platform from here">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">Total Users</div>
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {loading ? '...' : stats?.totalUsers.toLocaleString() || '0'}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {loading ? '' : `${stats?.activeUsers || 0} active (30 days)`}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">Total Jobs</div>
              <Briefcase className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {loading ? '...' : stats?.totalJobs.toLocaleString() || '0'}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {loading ? '' : `${stats?.completedJobs || 0} completed`}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">Images Processed</div>
              <MessageSquare className="h-5 w-5 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {loading ? '...' : stats?.creditsUsed.toLocaleString() || '0'}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              All time
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">Total Revenue</div>
              <DollarSign className="h-5 w-5 text-orange-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {loading ? '...' : `$${(stats?.revenue || 0).toFixed(2)}`}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              From credit purchases
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/admin/users"
              className="p-4 border border-gray-200 rounded-lg hover:border-duma-primary/50 hover:bg-duma-primary/5 transition-all"
            >
              <div className="font-medium text-gray-900">Manage Users</div>
              <div className="text-sm text-gray-600 mt-1">View and edit user accounts</div>
            </a>
            <a
              href="/admin/webhooks"
              className="p-4 border border-gray-200 rounded-lg hover:border-duma-primary/50 hover:bg-duma-primary/5 transition-all"
            >
              <div className="font-medium text-gray-900">Manage Webhooks</div>
              <div className="text-sm text-gray-600 mt-1">Configure user workflows</div>
            </a>
            <a
              href="/admin/prompts"
              className="p-4 border border-gray-200 rounded-lg hover:border-duma-primary/50 hover:bg-duma-primary/5 transition-all"
            >
              <div className="font-medium text-gray-900">Manage Prompts</div>
              <div className="text-sm text-gray-600 mt-1">Create and assign prompts</div>
            </a>
          </div>
        </div>

        {/* Analytics Snapshot */}
        <div className="bg-white rounded-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Analytics Snapshot</h3>
            <Link
              href="/admin/analytics"
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              View Full Analytics →
            </Link>
          </div>

          {!analyticsSnapshot ? (
            <div className="text-center text-gray-500 py-8">Loading analytics...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* User Growth */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                  <h4 className="font-medium text-gray-900">User Growth</h4>
                </div>
                <div className="space-y-2">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {analyticsSnapshot.users.newThisMonth}
                    </div>
                    <div className="text-xs text-gray-500">New users this month</div>
                  </div>
                  <div className={`text-sm flex items-center gap-1 ${
                    analyticsSnapshot.users.growthRate >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {analyticsSnapshot.users.growthRate >= 0 ? '+' : ''}{analyticsSnapshot.users.growthRate}%
                    <span className="text-gray-500">vs last month</span>
                  </div>
                </div>
              </div>

              {/* Platform Health */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="h-5 w-5 text-blue-600" />
                  <h4 className="font-medium text-gray-900">Platform Health</h4>
                </div>
                <div className="space-y-2">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {analyticsSnapshot.jobs.completionRate}%
                    </div>
                    <div className="text-xs text-gray-500">Job completion rate</div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${analyticsSnapshot.jobs.completionRate}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Top User */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Award className="h-5 w-5 text-yellow-600" />
                  <h4 className="font-medium text-gray-900">Top User</h4>
                </div>
                {analyticsSnapshot.credits.topSpenders.length > 0 ? (
                  <div className="space-y-2">
                    <div>
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {analyticsSnapshot.credits.topSpenders[0].name}
                      </div>
                      <div className="text-xs text-gray-500">Most active user</div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {analyticsSnapshot.credits.topSpenders[0].used}
                    </div>
                    <div className="text-xs text-gray-500">Images processed</div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">No data yet</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
