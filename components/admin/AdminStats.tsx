'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, Users, Briefcase, DollarSign } from 'lucide-react'

export function AdminStats() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Platform Analytics</CardTitle>
          <CardDescription>
            Detailed analytics and insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {/* Growth Metrics */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Growth Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50/70 ring-1 ring-inset ring-white/50 backdrop-blur-sm rounded-xl">
                  <div className="flex items-center gap-2 text-blue-600 mb-2">
                    <Users className="h-5 w-5" />
                    <span className="font-medium">User Growth</span>
                  </div>
                  <div className="text-2xl font-bold">+24%</div>
                  <div className="text-sm text-gray-600">vs last month</div>
                </div>

                <div className="p-4 bg-green-50/70 ring-1 ring-inset ring-white/50 backdrop-blur-sm rounded-xl">
                  <div className="flex items-center gap-2 text-green-600 mb-2">
                    <Briefcase className="h-5 w-5" />
                    <span className="font-medium">Job Volume</span>
                  </div>
                  <div className="text-2xl font-bold">+18%</div>
                  <div className="text-sm text-gray-600">vs last month</div>
                </div>

                <div className="p-4 bg-duma-primary/10 ring-1 ring-inset ring-white/50 backdrop-blur-sm rounded-xl">
                  <div className="flex items-center gap-2 text-duma-primary mb-2">
                    <DollarSign className="h-5 w-5" />
                    <span className="font-medium">Revenue</span>
                  </div>
                  <div className="text-2xl font-bold">+32%</div>
                  <div className="text-sm text-gray-600">vs last month</div>
                </div>
              </div>
            </div>

            {/* Subscription Breakdown */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Subscription Distribution</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 glass-subtle rounded-xl">
                  <span className="font-medium">Free</span>
                  <div className="flex items-center gap-4">
                    <div className="w-48 bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '60%' }}></div>
                    </div>
                    <span className="text-sm text-gray-600 w-16 text-right">60%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 glass-subtle rounded-xl">
                  <span className="font-medium">Starter</span>
                  <div className="flex items-center gap-4">
                    <div className="w-48 bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '25%' }}></div>
                    </div>
                    <span className="text-sm text-gray-600 w-16 text-right">25%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 glass-subtle rounded-xl">
                  <span className="font-medium">Pro</span>
                  <div className="flex items-center gap-4">
                    <div className="w-48 bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-600 h-2 rounded-full" style={{ width: '12%' }}></div>
                    </div>
                    <span className="text-sm text-gray-600 w-16 text-right">12%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 glass-subtle rounded-xl">
                  <span className="font-medium">Enterprise</span>
                  <div className="flex items-center gap-4">
                    <div className="w-48 bg-gray-200 rounded-full h-2">
                      <div className="bg-gray-900 h-2 rounded-full" style={{ width: '3%' }}></div>
                    </div>
                    <span className="text-sm text-gray-600 w-16 text-right">3%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* System Health */}
            <div>
              <h3 className="text-lg font-semibold mb-4">System Health</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 glass-subtle rounded-xl">
                  <div className="text-sm text-gray-600 mb-1">Success Rate</div>
                  <div className="text-3xl font-bold text-green-600">98.5%</div>
                  <div className="text-xs text-gray-500 mt-1">Last 30 days</div>
                </div>

                <div className="p-4 glass-subtle rounded-xl">
                  <div className="text-sm text-gray-600 mb-1">Avg Processing Time</div>
                  <div className="text-3xl font-bold text-blue-600">3.2m</div>
                  <div className="text-xs text-gray-500 mt-1">Per job</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
