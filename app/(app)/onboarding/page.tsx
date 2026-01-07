import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow'
import { createServerComponentClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export default async function OnboardingPage() {
  const supabase = createServerComponentClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user has already completed onboarding
  const userProfile = await prisma.user.findUnique({
    where: { id: user.id },
    select: { hasCompletedOnboarding: true }
  })

  if (userProfile?.hasCompletedOnboarding) {
    redirect('/dashboard')
  }

  return <OnboardingFlow />
}