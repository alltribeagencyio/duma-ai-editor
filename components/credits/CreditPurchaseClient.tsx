'use client'

import { useState, useEffect } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { CreditCard, Wallet, Zap, Building2, Check, AlertCircle, Info } from 'lucide-react'

interface PricingPlan {
  plan: string
  displayName: string
  ratePerImage: number
  minimumInitialPurchase: number
  minimumTopUp: number
  description: string
  features: string[]
  isActive: boolean
}

interface CreditInfo {
  creditBalance: number
  pricingPlan: string
  ratePerImage: number
  imagesAvailable: number
  totalImagesProcessed: number
  hasCompletedInitialPurchase: boolean
}

export function CreditPurchaseClient() {
  const [userEmail, setUserEmail] = useState<string | undefined>(undefined)
  const [creditInfo, setCreditInfo] = useState<CreditInfo | null>(null)
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([])
  const [selectedPlan, setSelectedPlan] = useState<'personal' | 'business'>('personal')
  const [purchaseAmount, setPurchaseAmount] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [isPurchasing, setIsPurchasing] = useState(false)
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
      await Promise.all([fetchCreditInfo(), fetchPricingPlans()])
    }

    checkAuth()
  }, [router])

  const fetchCreditInfo = async () => {
    try {
      const response = await fetch('/api/credits/balance')
      if (response.ok) {
        const data = await response.json()
        setCreditInfo(data)
        setSelectedPlan(data.pricingPlan || 'personal')
      }
    } catch (error) {
      console.error('Error fetching credit info:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPricingPlans = async () => {
    try {
      const response = await fetch('/api/pricing/plans')
      if (response.ok) {
        const { plans } = await response.json()
        setPricingPlans(plans)

        // Set default amount to minimum initial or top-up
        if (plans.length > 0) {
          const personalPlan = plans.find((p: PricingPlan) => p.plan === 'personal')
          if (personalPlan) {
            setPurchaseAmount(personalPlan.minimumInitialPurchase.toString())
          }
        }
      }
    } catch (error) {
      console.error('Error fetching pricing plans:', error)
    }
  }

  const selectedPlanConfig = pricingPlans.find(p => p.plan === selectedPlan)

  const calculateCredits = () => {
    const amount = parseFloat(purchaseAmount)
    if (!amount || !selectedPlanConfig) return 0
    return Math.floor(amount / selectedPlanConfig.ratePerImage)
  }

  const getMinimumAmount = () => {
    if (!selectedPlanConfig) return 0
    return creditInfo?.hasCompletedInitialPurchase
      ? selectedPlanConfig.minimumTopUp
      : selectedPlanConfig.minimumInitialPurchase
  }

  const handlePurchase = async () => {
    const amount = parseFloat(purchaseAmount)
    const minimumAmount = getMinimumAmount()

    if (!amount || amount < minimumAmount) {
      setError(`Minimum amount is $${minimumAmount.toFixed(2)}`)
      return
    }

    setError('')
    setIsPurchasing(true)

    try {
      const response = await fetch('/api/credits/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountUSD: amount,
          pricingPlan: selectedPlan
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Redirect to Paystack payment page
        window.location.href = data.paymentUrl
      } else {
        setError(data.error || 'Failed to initialize payment')
      }
    } catch (error) {
      console.error('Error purchasing credits:', error)
      setError('Failed to process purchase request')
    } finally {
      setIsPurchasing(false)
    }
  }

  if (isLoading) {
    return (
      <AppLayout userEmail={userEmail}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-duma-primary/20 border-t-duma-primary" />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout
      userEmail={userEmail}
      title="Purchase Credits"
      subtitle="Pay as you go - Only pay for what you use"
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Current Balance */}
        {creditInfo && (
          <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">Current Balance</p>
                  <p className="text-3xl font-bold text-gray-900">
                    ${creditInfo.creditBalance.toFixed(2)}
                  </p>
                  <p className="text-sm text-purple-600">
                    ~{creditInfo.imagesAvailable} images available at ${creditInfo.ratePerImage}/image
                  </p>
                </div>
                <div className="text-right">
                  <Badge className="bg-purple-600 text-white mb-2">
                    {creditInfo.pricingPlan === 'personal' ? 'Personal Plan' : 'Business Plan'}
                  </Badge>
                  <p className="text-sm text-gray-600">
                    {creditInfo.totalImagesProcessed} images processed
                  </p>
                </div>
              </div>
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

        {/* Pricing Plans Selection */}
        <div className="grid md:grid-cols-2 gap-6">
          {pricingPlans.map((plan) => {
            const isSelected = selectedPlan === plan.plan
            const isCurrentPlan = creditInfo?.pricingPlan === plan.plan
            const Icon = plan.plan === 'personal' ? Zap : Building2
            const savings = plan.plan === 'business' ?
              Math.round(((0.375 - plan.ratePerImage) / 0.375) * 100) : 0

            return (
              <Card
                key={plan.plan}
                className={`cursor-pointer transition-all ${
                  isSelected
                    ? 'ring-2 ring-purple-500 shadow-lg'
                    : 'hover:shadow-md'
                }`}
                onClick={() => {
                  setSelectedPlan(plan.plan as 'personal' | 'business')
                  const minAmount = creditInfo?.hasCompletedInitialPurchase
                    ? plan.minimumTopUp
                    : plan.minimumInitialPurchase
                  setPurchaseAmount(minAmount.toString())
                }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-lg ${
                        plan.plan === 'personal' ? 'bg-blue-100' : 'bg-purple-100'
                      }`}>
                        <Icon className={`h-6 w-6 ${
                          plan.plan === 'personal' ? 'text-blue-600' : 'text-purple-600'
                        }`} />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{plan.displayName}</CardTitle>
                        {isCurrentPlan && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            Current Plan
                          </Badge>
                        )}
                      </div>
                    </div>
                    {savings > 0 && (
                      <Badge className="bg-green-500 text-white">
                        Save {savings}%
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="mt-2">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="glass-subtle p-4 rounded-xl">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-gradient-duma">
                        ${plan.ratePerImage}
                      </p>
                      <p className="text-sm text-gray-600">per image</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Min. Initial Purchase:</span>
                      <span className="font-semibold">${plan.minimumInitialPurchase}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Min. Top-up:</span>
                      <span className="font-semibold">${plan.minimumTopUp}</span>
                    </div>
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Purchase Form */}
        {selectedPlanConfig && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Purchase Credits
              </CardTitle>
              <CardDescription>
                {creditInfo?.hasCompletedInitialPurchase
                  ? `Minimum top-up: $${selectedPlanConfig.minimumTopUp}`
                  : `Minimum initial purchase: $${selectedPlanConfig.minimumInitialPurchase}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Purchase Amount (USD)</label>
                <Input
                  type="number"
                  step="0.01"
                  min={getMinimumAmount()}
                  value={purchaseAmount}
                  onChange={(e) => setPurchaseAmount(e.target.value)}
                  placeholder={`Minimum: $${getMinimumAmount()}`}
                  className="text-lg"
                />
              </div>

              {purchaseAmount && parseFloat(purchaseAmount) >= getMinimumAmount() && (
                <div className="bg-duma-secondary/10 border border-duma-secondary/20 backdrop-blur-sm rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-duma-secondary mt-0.5 flex-shrink-0" />
                    <div className="space-y-2 flex-1">
                      <p className="text-sm font-medium text-duma-secondary-dark">
                        You will receive approximately:
                      </p>
                      <div className="glass-card rounded-xl p-3">
                        <p className="text-2xl font-bold text-gradient-duma">
                          {calculateCredits()} images
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          ${purchaseAmount} Ã· ${selectedPlanConfig.ratePerImage} per image
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <Button
                onClick={handlePurchase}
                disabled={isPurchasing || !purchaseAmount || parseFloat(purchaseAmount) < getMinimumAmount()}
                size="lg"
                className="w-full text-base"
              >
                {isPurchasing ? (
                  <>
                    <div className="h-5 w-5 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-5 w-5 mr-2" />
                    Purchase ${purchaseAmount || '0'} Credits
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-gray-500">
                Secure payment powered by Paystack. Credits are added immediately after successful payment.
              </p>
            </CardContent>
          </Card>
        )}

        {/* FAQ */}
        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">ðŸ’³ Pay As You Go</h4>
              <p className="text-sm text-gray-600">
                Purchase credits in any amount above the minimum. Use them whenever you need to edit images. No monthly subscriptions or unused credits going to waste.
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">ðŸŽ¯ Simple Pricing</h4>
              <p className="text-sm text-gray-600">
                Each image edit costs one credit at your plan&apos;s rate. Personal plan: $0.375/image, Business plan: $0.35/image (7% savings).
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">âš¡ Instant Activation</h4>
              <p className="text-sm text-gray-600">
                Credits are added to your account immediately after payment. Start editing right away with no delays.
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">ðŸ”„ Flexible Top-ups</h4>
              <p className="text-sm text-gray-600">
                After your first purchase, top up with lower minimums ($1.50 for Personal, $10 for Business). Add credits whenever you need them.
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">ðŸ“ˆ Upgrade Anytime</h4>
              <p className="text-sm text-gray-600">
                Start with Personal and upgrade to Business plan for better rates. Your existing balance stays intact, and future purchases get the new rate.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
