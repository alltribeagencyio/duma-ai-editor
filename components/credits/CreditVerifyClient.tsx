'use client'

import { useState, useEffect } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'

export function CreditVerifyClient() {
  const [userEmail, setUserEmail] = useState<string | undefined>(undefined)
  const [isVerifying, setIsVerifying] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string>('')
  const [creditInfo, setCreditInfo] = useState<any>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

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

      const reference = searchParams?.get('reference')
      if (reference) {
        await verifyPayment(reference)
      } else {
        setError('No payment reference found')
        setIsVerifying(false)
      }
    }

    checkAuth()
  }, [router, searchParams])

  const verifyPayment = async (reference: string) => {
    try {
      const response = await fetch(`/api/credits/verify?reference=${reference}`)
      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setCreditInfo(data)
      } else {
        setError(data.error || 'Payment verification failed')
      }
    } catch (error) {
      console.error('Error verifying payment:', error)
      setError('Failed to verify payment')
    } finally {
      setIsVerifying(false)
    }
  }

  if (isVerifying) {
    return (
      <AppLayout userEmail={userEmail}>
        <div className="max-w-2xl mx-auto mt-20">
          <Card>
            <CardContent className="p-12 text-center">
              <Loader2 className="h-16 w-16 animate-spin text-purple-600 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold mb-2">Verifying Payment...</h2>
              <p className="text-gray-600">
                Please wait while we confirm your payment and add credits to your account.
              </p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout userEmail={userEmail} title="Payment Verification">
      <div className="max-w-2xl mx-auto mt-10">
        {success && creditInfo ? (
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-green-900">
                Payment Successful!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-white rounded-lg p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Credits Added:</span>
                  <span className="text-2xl font-bold text-green-600">
                    ~{Math.floor(creditInfo.creditsAdded)} images
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">New Balance:</span>
                  <span className="text-xl font-semibold text-gray-900">
                    ${creditInfo.newBalance.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Pricing Plan:</span>
                  <span className="font-medium text-gray-900 capitalize">
                    {creditInfo.pricingPlan} Plan
                  </span>
                </div>
              </div>

              <Alert className="bg-blue-50 border-blue-200">
                <AlertDescription className="text-blue-900">
                  Your credits have been added and are ready to use immediately. Start editing images now!
                </AlertDescription>
              </Alert>

              <div className="flex gap-3">
                <Button
                  asChild
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  <Link href="/new-edit">Start Editing</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="flex-1"
                >
                  <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-red-200 bg-red-50">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <XCircle className="h-10 w-10 text-red-600" />
              </div>
              <CardTitle className="text-2xl text-red-900">
                Payment Failed
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>

              <div className="bg-white rounded-lg p-6">
                <p className="text-sm text-gray-600 mb-4">
                  Don&apos;t worry, you haven&apos;t been charged. Common reasons for payment failure:
                </p>
                <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
                  <li>Insufficient funds in your account</li>
                  <li>Card declined by your bank</li>
                  <li>Incorrect card details</li>
                  <li>Transaction cancelled</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <Button
                  asChild
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  <Link href="/credits">Try Again</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="flex-1"
                >
                  <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  )
}
