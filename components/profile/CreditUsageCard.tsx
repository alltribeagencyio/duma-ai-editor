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
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500">
            <Wallet className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg">Credit Balance</CardTitle>
            <CardDescription>Pay-as-you-go credits</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Credit Balance */}
        <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-100">
          <div className="text-3xl font-bold text-gray-900 mb-1">
            ${creditInfo.creditBalance.toFixed(2)}
          </div>
          <div className="text-sm text-purple-600">Current Balance</div>
          <div className="text-xs text-gray-600 mt-2">
            ~{creditInfo.imagesAvailable} images available
          </div>
        </div>

        {/* Plan Info */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-sm font-semibold text-blue-900 capitalize">
              {creditInfo.pricingPlan}
            </div>
            <div className="text-xs text-blue-600">Current Plan</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-sm font-semibold text-green-900">
              ${creditInfo.ratePerImage}
            </div>
            <div className="text-xs text-green-600">Per Image</div>
          </div>
        </div>

        {/* Low Credit Warning */}
        {getLowCreditWarning() && (
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="text-sm font-medium text-orange-800 mb-1">
              Credits Running Low
            </div>
            <div className="text-sm text-orange-600 mb-2">
              You have less than 5 images remaining. Top up now to continue editing.
            </div>
            <Button
              asChild
              size="sm"
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              <Link href="/credits">Add Credits</Link>
            </Button>
          </div>
        )}

        {/* First Purchase Prompt */}
        {!creditInfo.hasCompletedInitialPurchase && (
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="text-sm font-medium text-purple-800 mb-1">
              Get Started
            </div>
            <div className="text-sm text-purple-600 mb-2">
              Purchase your first credits and start editing images. From just $2 for Personal plan or $20 for Business.
            </div>
            <Button
              asChild
              size="sm"
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              <Link href="/credits">Purchase Credits</Link>
            </Button>
          </div>
        )}

        {/* Upgrade to Business */}
        {creditInfo.pricingPlan === 'personal' && creditInfo.hasCompletedInitialPurchase && !getLowCreditWarning() && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm font-medium text-blue-800 mb-1">
              Save 7% with Business Plan
            </div>
            <div className="text-sm text-blue-600 mb-2">
              Upgrade to Business plan and pay only $0.35 per image instead of $0.375.
            </div>
            <Button
              asChild
              size="sm"
              variant="outline"
              className="w-full border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              <Link href="/credits">Upgrade Plan</Link>
            </Button>
          </div>
        )}

        {/* Usage Stats */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">Images Processed</span>
            </div>
            <span className="font-medium">{creditInfo.totalImagesProcessed}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">Cost Per Image</span>
            </div>
            <span className="font-medium">${creditInfo.ratePerImage}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            asChild
            variant="outline"
            size="sm"
          >
            <Link href="/credits">Add Credits</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="sm"
          >
            <Link href="/credits/transactions">History</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
