'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Crown, Zap, Building } from 'lucide-react'

interface UserProfile {
  subscriptionTier: string
  subscriptionStatus: string
  monthlyCredits: number
  practiceCredits: number
  setupFeesPaid: boolean
  hasCompletedOnboarding: boolean
}

interface SubscriptionCardProps {
  profile: UserProfile
}

export function SubscriptionCard({ profile }: SubscriptionCardProps) {
  const getTierInfo = (tier: string) => {
    switch (tier) {
      case 'starter':
        return {
          name: 'Starter',
          icon: Zap,
          color: 'bg-blue-500',
          description: 'Perfect for small businesses'
        }
      case 'pro':
        return {
          name: 'Pro',
          icon: Crown,
          color: 'bg-purple-500',
          description: 'Advanced features for growing brands'
        }
      case 'enterprise':
        return {
          name: 'Enterprise',
          icon: Building,
          color: 'bg-gray-900',
          description: 'Custom solutions for large organizations'
        }
      default:
        return {
          name: 'Free',
          icon: Zap,
          color: 'bg-gray-500',
          description: 'Get started with basic features'
        }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'trialing':
        return 'bg-blue-100 text-blue-800'
      case 'past_due':
        return 'bg-yellow-100 text-yellow-800'
      case 'canceled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const tierInfo = getTierInfo(profile.subscriptionTier)
  const TierIcon = tierInfo.icon

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${tierInfo.color}`}>
              <TierIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">{tierInfo.name} Plan</CardTitle>
              <CardDescription>{tierInfo.description}</CardDescription>
            </div>
          </div>
          <Badge className={getStatusColor(profile.subscriptionStatus)}>
            {profile.subscriptionStatus}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">
              {profile.monthlyCredits}
            </div>
            <div className="text-sm text-gray-600">Monthly Credits</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">
              {profile.practiceCredits}
            </div>
            <div className="text-sm text-gray-600">Practice Credits</div>
          </div>
        </div>

        {!profile.hasCompletedOnboarding && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm font-medium text-blue-800 mb-1">
              Complete Your Setup
            </div>
            <div className="text-sm text-blue-600 mb-2">
              Finish onboarding to unlock all features and get your practice credits
            </div>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              Continue Setup
            </Button>
          </div>
        )}

        {profile.subscriptionTier === 'free' && (
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="text-sm font-medium text-purple-800 mb-1">
              Upgrade Your Plan
            </div>
            <div className="text-sm text-purple-600 mb-2">
              Get more credits and premium features
            </div>
            <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
              View Plans
            </Button>
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1">
            Billing History
          </Button>
          {profile.subscriptionTier !== 'free' && (
            <Button variant="outline" className="flex-1">
              Manage Plan
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}