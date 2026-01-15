import { AppLayout } from '@/components/layout/AppLayout'
import { TicketsList } from '@/components/support/TicketsList'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function TicketsPage() {
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
      title="My Support Tickets"
      subtitle="View and manage your support tickets"
    >
      <TicketsList />
    </AppLayout>
  )
}
