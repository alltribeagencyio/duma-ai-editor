'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Check, Zap, Crown, Building, Star, Loader2 } from 'lucide-react'

interface SubscriptionPlan {
  id: string
  name: string
  displayName: string
  description: string
  price: number
  monthlyCredits: number
  maxBrandPrompts: number
  setupFee: number
  hasWhatsAppSupport: boolean
  hasPrioritySupport: boolean
  hasBulkProcessing: boolean
  hasAdvancedAnalytics: boolean
  hasCustomBranding: boolean
}

interface PricingPlansProps {
  currentPlan?: string
  onSelectPlan: (planId: string, includeSetupFee: boolean) => void
}

export function PricingPlans({ currentPlan, onSelectPlan }: PricingPlansProps) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<string>('')
  const [includeSetupFee, setIncludeSetupFee] = useState(true)
  const [isSubscribing, setIsSubscribing] = useState(false)

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/subscription/plans')
      if (response.ok) {
        const { plans: fetchedPlans } = await response.json()
        setPlans(fetchedPlans)
      }
    } catch (error) {
      console.error('Error fetching plans:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'starter': return Zap
      case 'pro': return Crown
      case 'enterprise': return Building
      default: return Star
    }
  }

  const getPlanColor = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'starter': return 'bg-blue-500'
      case 'pro': return 'bg-purple-500'
      case 'enterprise': return 'bg-gray-900'
      default: return 'bg-gray-500'
    }
  }

  const formatPrice = (price: number) => {
    return (price / 100).toLocaleString('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    })
  }

  const getTotalPrice = (plan: SubscriptionPlan) => {
    let total = plan.price
    if (includeSetupFee && plan.setupFee > 0) {
      total += plan.setupFee
    }
    return total
  }

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (plan.name === 'free') return

    setIsSubscribing(true)
    try {
      onSelectPlan(plan.id, includeSetupFee && plan.setupFee > 0)
    } finally {
      setIsSubscribing(false)
    }
  }

  const isPlanRecommended = (planName: string) => planName.toLowerCase() === 'pro'

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Setup Fee Toggle */}
      {plans.some(plan => plan.setupFee > 0) && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="setup-fee"
                checked={includeSetupFee}
                onCheckedChange={(checked) => setIncludeSetupFee(checked === true)}
              />
              <label htmlFor="setup-fee" className="text-sm font-medium cursor-pointer">
                Include one-time setup fee for brand prompt creation and optimization
              </label>
            </div>
            <p className="text-sm text-blue-600 mt-2">
              Setup fee includes personalized brand prompts and 100 practice credits to test your brand style.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Pricing Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const PlanIcon = getPlanIcon(plan.name)
          const isCurrentPlan = currentPlan === plan.name
          const isRecommended = isPlanRecommended(plan.name)
          const isFree = plan.name === 'free'
          const totalPrice = getTotalPrice(plan)

          return (
            <Card
              key={plan.id}
              className={`relative transition-all duration-200 hover:shadow-lg ${
                isRecommended ? 'ring-2 ring-purple-500 shadow-lg' : ''
              } ${isCurrentPlan ? 'bg-green-50 border-green-200' : ''}`}
            >
              {isRecommended && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-purple-500 text-white px-3 py-1">
                    Most Popular
                  </Badge>
                </div>
              )}

              {isCurrentPlan && (
                <div className="absolute -top-3 right-4">
                  <Badge className="bg-green-500 text-white px-3 py-1">
                    Current Plan
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <div className={`w-12 h-12 mx-auto rounded-lg ${getPlanColor(plan.name)} flex items-center justify-center mb-4`}>
                  <PlanIcon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">{plan.displayName}</CardTitle>
                <CardDescription className="text-sm">{plan.description}</CardDescription>

                {!isFree && (
                  <div className="mt-4">
                    <div className="text-3xl font-bold">
                      {formatPrice(totalPrice)}
                    </div>
                    <div className="text-sm text-gray-600">per month</div>

                    {includeSetupFee && plan.setupFee > 0 && (
                      <div className="mt-2 text-xs text-blue-600">
                        Monthly: {formatPrice(plan.price)} + Setup: {formatPrice(plan.setupFee)}
                      </div>
                    )}
                  </div>
                )}

                {isFree && (
                  <div className="mt-4">
                    <div className="text-3xl font-bold">Free</div>
                    <div className="text-sm text-gray-600">forever</div>
                  </div>
                )}
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Credits */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Monthly Credits</span>
                  <span className="text-lg font-bold text-blue-600">
                    {plan.monthlyCredits.toLocaleString()}
                  </span>
                </div>

                {includeSetupFee && plan.setupFee > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Practice Credits</span>
                    <span className="text-sm font-bold text-green-600">
                      +100 (one-time)
                    </span>
                  </div>
                )}

                <Separator />

                {/* Features List */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Up to {plan.maxBrandPrompts} brand prompts</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Image upload & editing</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Re-edit & upscale images</span>
                  </div>

                  {plan.hasWhatsAppSupport && (
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm">WhatsApp notifications</span>
                    </div>
                  )}

                  {plan.hasPrioritySupport && (
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Priority support</span>
                    </div>
                  )}

                  {plan.hasBulkProcessing && (
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Bulk image processing</span>
                    </div>
                  )}

                  {plan.hasAdvancedAnalytics && (
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Advanced analytics</span>
                    </div>
                  )}

                  {plan.hasCustomBranding && (
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Custom branding</span>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Action Button */}
                {isCurrentPlan ? (
                  <Button disabled className="w-full">
                    Current Plan
                  </Button>
                ) : isFree ? (
                  <Button variant="outline" disabled className="w-full">
                    Free Plan
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleSubscribe(plan)}
                    disabled={isSubscribing}
                    className={`w-full ${
                      isRecommended
                        ? 'bg-purple-600 hover:bg-purple-700'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {isSubscribing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      `Choose ${plan.displayName}`
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Feature Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Comparison</CardTitle>
          <CardDescription>
            Compare features across all plans to find what works best for you
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Feature</th>
                  {plans.map(plan => (
                    <th key={plan.id} className="text-center py-3 px-4">{plan.displayName}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-3 px-4 font-medium">Monthly Credits</td>
                  {plans.map(plan => (
                    <td key={plan.id} className="text-center py-3 px-4">
                      {plan.monthlyCredits.toLocaleString()}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 font-medium">Brand Prompts</td>
                  {plans.map(plan => (
                    <td key={plan.id} className="text-center py-3 px-4">
                      {plan.maxBrandPrompts}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 font-medium">WhatsApp Support</td>
                  {plans.map(plan => (
                    <td key={plan.id} className="text-center py-3 px-4">
                      {plan.hasWhatsAppSupport ? <Check className="h-4 w-4 text-green-500 mx-auto" /> : '—'}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 font-medium">Priority Support</td>
                  {plans.map(plan => (
                    <td key={plan.id} className="text-center py-3 px-4">
                      {plan.hasPrioritySupport ? <Check className="h-4 w-4 text-green-500 mx-auto" /> : '—'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">Bulk Processing</td>
                  {plans.map(plan => (
                    <td key={plan.id} className="text-center py-3 px-4">
                      {plan.hasBulkProcessing ? <Check className="h-4 w-4 text-green-500 mx-auto" /> : '—'}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}