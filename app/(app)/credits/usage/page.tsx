import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { CreditUsageHistory } from '@/components/credits/CreditUsageHistory'

export const metadata = {
  title: 'Credit Usage History | Duma AI',
  description: 'View your credit usage history and transactions',
}

export default async function CreditUsagePage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user profile
  const userProfile = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      monthlyCredits: true,
      practiceCredits: true,
      creditsUsed: true,
      creditsReset: true,
    },
  })

  // Get credit usage history
  const creditHistory = await prisma.creditUsage.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 100, // Last 100 transactions
  })

  const totalCredits = (userProfile?.monthlyCredits || 0) + (userProfile?.practiceCredits || 0)
  const usedCredits = userProfile?.creditsUsed || 0
  const availableCredits = totalCredits - usedCredits

  return (
    <CreditUsageHistory
      userEmail={user.email}
      totalCredits={totalCredits}
      usedCredits={usedCredits}
      availableCredits={availableCredits}
      creditsReset={userProfile?.creditsReset ?? null}
      creditHistory={creditHistory.map(ch => ({
        ...ch,
        createdAt: ch.createdAt ?? new Date()
      }))}
    />
  )
}
