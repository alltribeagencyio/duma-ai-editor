'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Wallet, TrendingUp, DollarSign, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface CreditInfo {
  creditBalance: number
  pricingPlan: string
  ratePerImage: number
  imagesAvailable: number
  totalImagesProcessed: number
  hasCompletedInitialPurchase: boolean
}

export function CreditUsageCard() {
  const [creditInfo, setCreditInfo] = useState<CreditInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchCreditInfo()

    // Refresh data when page becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchCreditInfo()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Refresh every 30 seconds to catch credit updates
    const intervalId = setInterval(() => {
      fetchCreditInfo()
    }, 30000)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      clearInterval(intervalId)
    }
  }, [])

  const fetchCreditInfo = async () => {
    try {
      const response = await fetch('/api/credits/balance')
      if (response.ok) {
        const data = await response.json()
        setCreditInfo(data)
      }
    } catch (error) {
      console.error('Error fetching credit info:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getLowCreditWarning = () => {
    if (!creditInfo) return false
    return creditInfo.creditBalance < creditInfo.ratePerImage * 5 // Less than 5 images
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </CardContent>
      </Card>
    )
  }

  if (!creditInfo) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-600">
          <p>Unable to load credit information</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      {/* Main Balance Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Credit Balance</CardTitle>
          <CardDescription>Pay-as-you-go credits</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main Balance Display */}
          <div className="text-center py-6">
            <div className="text-4xl font-bold text-gray-900 mb-2">
              ${creditInfo.creditBalance.toFixed(2)}
            </div>
            <div className="text-sm text-gray-600">
              ~{creditInfo.imagesAvailable} images available
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {creditInfo.pricingPlan === 'personal' ? 'Personal' : 'Business'} Plan · ${creditInfo.ratePerImage}/image
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex items-center justify-between text-sm pt-4 border-t">
            <span className="text-gray-600">Images Processed</span>
            <span className="font-medium">{creditInfo.totalImagesProcessed}</span>
          </div>

          {/* Action Button */}
          <div className="w-full">
            <Button
              asChild
              variant="outline"
              className="w-full"
            >
              <Link href="/credits/transactions">View Transaction History</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Low Credit Warning or First Purchase */}
        {getLowCreditWarning() ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-sm font-medium text-gray-900 mb-2">
                Credits Running Low
              </div>
              <div className="text-sm text-gray-600 mb-4">
                You have less than 5 images remaining. Top up now to continue editing.
              </div>
              <Button
                asChild
                className="w-full"
              >
                <Link href="/credits">Add Credits</Link>
              </Button>
            </CardContent>
          </Card>
        ) : !creditInfo.hasCompletedInitialPurchase ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-sm font-medium text-gray-900 mb-2">
                Get Started
              </div>
              <div className="text-sm text-gray-600 mb-4">
                Purchase your first credits and start editing images. From just $2 for Personal plan or $20 for Business.
              </div>
              <Button
                asChild
                className="w-full"
              >
                <Link href="/credits">Purchase Credits</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6">
              <div className="text-sm font-medium text-gray-900 mb-2">
                Add Credits
              </div>
              <div className="text-sm text-gray-600 mb-4">
                Top up your balance to continue editing images. Credits never expire.
              </div>
              <Button
                asChild
                className="w-full"
              >
                <Link href="/credits">Add Credits</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Upgrade Plan Card */}
        {creditInfo.pricingPlan === 'personal' ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-sm font-medium text-gray-900 mb-2">
                Upgrade Your Plan
              </div>
              <div className="text-sm text-gray-600 mb-4">
                Switch to Business plan and save 7%. Pay only $0.35 per image instead of $0.375.
              </div>
              <Button
                asChild
                variant="outline"
                className="w-full"
              >
                <Link href="/credits">Upgrade Plan</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6">
              <div className="text-sm font-medium text-gray-900 mb-2">
                Business Plan
              </div>
              <div className="text-sm text-gray-600 mb-4">
                You&apos;re on the Business plan with the best rate of $0.35 per image.
              </div>
              <Button
                asChild
                variant="outline"
                className="w-full"
              >
                <Link href="/credits/transactions">View History</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}
