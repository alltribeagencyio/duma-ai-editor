import { AppLayout } from '@/components/layout/AppLayout'
import { AdminDashboard } from '@/components/admin/AdminDashboard'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export default async function AdminPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user is admin
  const userProfile = await prisma.user.findUnique({
    where: { id: user.id },
    select: { isAdmin: true, role: true }
  })

  if (!userProfile?.isAdmin) {
    redirect('/dashboard')
  }

  return (
    <AppLayout
      userEmail={user.email}
      title="Admin Dashboard"
      subtitle="Manage users, jobs, and platform settings"
    >
      <AdminDashboard />
    </AppLayout>
  )
}
