import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check onboarding status (safe to use Prisma in layout server component)
  try {
    const userProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { hasCompletedOnboarding: true }
    })

    // If user hasn't completed onboarding, redirect to onboarding page
    if (!userProfile?.hasCompletedOnboarding) {
      redirect('/onboarding')
    }
  } catch (error) {
    console.error('Error checking onboarding status:', error)
    // Continue without redirect if database check fails
  }

  return <>{children}</>
}
