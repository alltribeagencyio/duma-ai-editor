import { AppLayout } from '@/components/layout/AppLayout'
import { CreditAnalytics } from '@/components/analytics/CreditAnalytics'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AnalyticsPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <AppLayout
      userEmail={user.email}
      title="Analytics Dashboard"
      subtitle="Monitor your credit usage and account performance"
    >
      <CreditAnalytics />
    </AppLayout>
  )
}