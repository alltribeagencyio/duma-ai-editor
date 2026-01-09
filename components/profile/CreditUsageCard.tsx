'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TrendingUp, Calendar, Zap } from 'lucide-react'

interface UserProfile {
  monthlyCredits: number
  practiceCredits: number
  creditsUsed: number
  subscriptionTier: string
  hasCompletedOnboarding: boolean
}

interface CreditUsageCardProps {
  profile: UserProfile
}

export function CreditUsageCard({ profile }: CreditUsageCardProps) {
  const totalCredits = profile.monthlyCredits + profile.practiceCredits
  const remainingCredits = totalCredits - profile.creditsUsed
  const usagePercentage = totalCredits > 0 ? (profile.creditsUsed / totalCredits) * 100 : 0

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500'
    if (percentage >= 70) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg">Credit Usage</CardTitle>
            <CardDescription>Track your monthly and practice credits</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Credit Balance */}
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {remainingCredits}
          </div>
          <div className="text-sm text-gray-600">Credits Remaining</div>
          <div className="text-xs text-gray-500 mt-1">
            {profile.creditsUsed} of {totalCredits} used
          </div>
        </div>

        {/* Usage Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Usage</span>
            <span>{usagePercentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getUsageColor(usagePercentage)}`}
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Credit Breakdown */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-2 bg-blue-50 rounded">
            <div className="text-lg font-semibold text-blue-900">
              {profile.monthlyCredits}
            </div>
            <div className="text-xs text-blue-600">Monthly</div>
          </div>
          <div className="text-center p-2 bg-green-50 rounded">
            <div className="text-lg font-semibold text-green-900">
              {profile.practiceCredits}
            </div>
            <div className="text-xs text-green-600">Practice</div>
          </div>
        </div>

        {/* Complete Setup Alert */}
        {!profile.hasCompletedOnboarding && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm font-medium text-blue-800 mb-1">
              Complete Your Setup
            </div>
            <div className="text-sm text-blue-600 mb-2">
              Finish onboarding to unlock all features and get your practice credits
            </div>
            <Button
              size="sm"
              className="bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-100"
              onClick={() => window.location.href = '/onboarding'}
            >
              Continue Setup
            </Button>
          </div>
        )}

        {/* Low Credit Warning */}
        {usagePercentage >= 80 && (
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="text-sm font-medium text-orange-800 mb-1">
              Credits Running Low
            </div>
            <div className="text-sm text-orange-600 mb-2">
              You&apos;ve used {usagePercentage.toFixed(1)}% of your credits this month
            </div>
            {profile.subscriptionTier === 'free' && (
              <Button
                size="sm"
                className="bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-100"
                onClick={() => window.location.href = '/subscription'}
              >
                Upgrade Plan
              </Button>
            )}
          </div>
        )}

        {/* Upgrade Plan Prompt for Free Tier */}
        {profile.subscriptionTier === 'free' && usagePercentage < 80 && (
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="text-sm font-medium text-purple-800 mb-1">
              Upgrade Your Plan
            </div>
            <div className="text-sm text-purple-600 mb-2">
              Get more credits and premium features
            </div>
            <Button
              size="sm"
              className="bg-purple-600 hover:bg-purple-700"
              onClick={() => window.location.href = '/subscription'}
            >
              View Plans
            </Button>
          </div>
        )}

        {/* Usage Stats */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">This Month</span>
            </div>
            <span className="font-medium">{profile.creditsUsed} credits</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">Resets</span>
            </div>
            <span className="font-medium">Jan 1st</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.href = '/credits/usage'}
          >
            Usage History
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.href = '/subscription'}
          >
            Billing History
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}