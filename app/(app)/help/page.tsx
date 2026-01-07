import { AppLayout } from '@/components/layout/AppLayout'
import { HelpCenter } from '@/components/help/HelpCenter'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function HelpPage() {
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
      title="Help & Support"
      subtitle="Get answers to your questions and learn how to use Duma AI"
    >
      <HelpCenter />
    </AppLayout>
  )
}
