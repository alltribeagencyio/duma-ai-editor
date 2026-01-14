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

        {/* Low Credit Warning */}
        {getLowCreditWarning() && (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-sm font-medium text-gray-900 mb-2">
              Credits Running Low
            </div>
            <div className="text-sm text-gray-600 mb-3">
              You have less than 5 images remaining. Top up now to continue editing.
            </div>
            <Button
              asChild
              size="sm"
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              <Link href="/credits">Add Credits</Link>
            </Button>
          </div>
        )}

        {/* First Purchase Prompt */}
        {!creditInfo.hasCompletedInitialPurchase && (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-sm font-medium text-gray-900 mb-2">
              Get Started
            </div>
            <div className="text-sm text-gray-600 mb-3">
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

        {/* Stats Row */}
        <div className="flex items-center justify-between text-sm pt-4 border-t">
          <span className="text-gray-600">Images Processed</span>
          <span className="font-medium">{creditInfo.totalImagesProcessed}</span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            asChild
            variant="outline"
          >
            <Link href="/credits">Add Credits</Link>
          </Button>
          <Button
            asChild
            variant="outline"
          >
            <Link href="/credits/transactions">History</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
