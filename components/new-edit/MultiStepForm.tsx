'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { AppLayout } from '@/components/layout/AppLayout'
import { StepIndicator } from './StepIndicator'
import { useNewEditStore } from '@/lib/stores/newEditStore'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const StepLoadingSkeleton = () => (
  <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
    <div className="h-64 bg-gray-200 rounded-lg" />
    <div className="h-12 bg-gray-200 rounded w-1/3" />
  </div>
)

const Step1Upload = dynamic(
  () => import('./Step1Upload').then(mod => ({ default: mod.Step1Upload })),
  {
    loading: () => <StepLoadingSkeleton />,
    ssr: false
  }
)

const Step2Prompt = dynamic(
  () => import('./Step2Prompt').then(mod => ({ default: mod.Step2Prompt })),
  {
    loading: () => <StepLoadingSkeleton />,
    ssr: false
  }
)

const Step3Review = dynamic(
  () => import('./Step3Review').then(mod => ({ default: mod.Step3Review })),
  {
    loading: () => <StepLoadingSkeleton />,
    ssr: false
  }
)

export function MultiStepForm() {
  const { step } = useNewEditStore()
  const [userEmail, setUserEmail] = useState<string | undefined>(undefined)
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
    }

    checkAuth()
  }, [router])

  return (
    <AppLayout
      userEmail={userEmail}
      title="New Edit"
      subtitle="Create a new image edit in 3 simple steps"
    >
      <div className="w-full max-w-screen-2xl mx-auto">
        <StepIndicator currentStep={step} />
        <div className="py-8">
          {step === 1 && <Step1Upload />}
          {step === 2 && <Step2Prompt />}
          {step === 3 && <Step3Review />}
        </div>
      </div>
    </AppLayout>
  )
}
