'use client'

import { useState, useEffect } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { PricingPlans } from './PricingPlans'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { CreditCard, AlertCircle } from 'lucide-react'

interface UserProfile {
  id: string
  email: string
  subscriptionTier: string
  subscriptionStatus: string
  setupFeesPaid: boolean
}

export function SubscriptionClient() {
  const [userEmail, setUserEmail] = useState<string | undefined>(undefined)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      setUserEmail(user.email)
      fetchProfile()
    }

    checkAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const { user } = await response.json()
        setProfile(user)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      setError('Failed to load user profile')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectPlan = async (planId: string, includeSetupFee: boolean) => {
    try {
      setError('')
      const response = await fetch('/api/subscription/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, paySetupFee: includeSetupFee })
      })

      const data = await response.json()

      if (response.ok) {
        // Redirect to Paystack payment page
        window.location.href = data.paymentUrl
      } else {
        setError(data.error || 'Failed to initialize payment')
      }
    } catch (error) {
      console.error('Error creating subscription:', error)
      setError('Failed to process subscription request')
    }
  }

  if (isLoading) {
    return (
      <AppLayout userEmail={userEmail}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900" />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout
      userEmail={userEmail}
      title="Subscription Plans"
      subtitle="Choose the perfect plan for your image editing needs"
    >
      <div className="w-full max-w-screen-2xl mx-auto space-y-8">
        {/* Current Subscription Status */}
        {profile && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Current Subscription
              </CardTitle>
              <CardDescription>
                Your current plan and subscription status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-semibold capitalize">
                    {profile.subscriptionTier} Plan
                  </div>
                  <div className="text-sm text-gray-600 capitalize">
                    Status: {profile.subscriptionStatus}
                  </div>
                </div>
                {profile.subscriptionTier === 'free' && (
                  <div className="text-right">
                    <div className="text-sm text-blue-600 font-medium">
                      Ready to upgrade?
                    </div>
                    <div className="text-xs text-gray-500">
                      Get more credits and features
                    </div>
                  </div>
                )}
              </div>

              {!profile.setupFeesPaid && profile.subscriptionTier !== 'free' && (
                <Alert className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Complete your setup by paying the one-time setup fee to unlock brand prompts and practice credits.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Pricing Plans */}
        <PricingPlans
          currentPlan={profile?.subscriptionTier}
          onSelectPlan={handleSelectPlan}
        />

        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-medium mb-2">How do credits work?</h4>
              <p className="text-sm text-gray-600">
                Each image edit costs 1 credit. Re-editing an image also costs 1 credit.
                Credits reset monthly on your billing date.
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">What&apos;s included in the setup fee?</h4>
              <p className="text-sm text-gray-600">
                The setup fee includes personalized brand prompt creation based on your industry
                and style preferences, plus 100 practice credits to test your brand prompts.
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">Can I change plans anytime?</h4>
              <p className="text-sm text-gray-600">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect
                on your next billing cycle.
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">What payment methods do you accept?</h4>
              <p className="text-sm text-gray-600">
                We accept all major credit/debit cards, bank transfers, USSD, and mobile money
                payments through our secure payment processor Paystack.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}