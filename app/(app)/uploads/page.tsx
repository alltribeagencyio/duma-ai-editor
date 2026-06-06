import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UploadsClient } from '@/components/uploads/UploadsClient'

export const metadata = {
  title: 'Uploads - Duma AI Image Editor',
  description: 'All the images you have uploaded — reuse any of them to start a new edit',
}

export default async function UploadsPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <UploadsClient userEmail={user.email || ''} />
}
