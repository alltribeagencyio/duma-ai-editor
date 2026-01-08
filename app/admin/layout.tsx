import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export default async function AdminLayoutWrapper({
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

  // Check if user is admin or super admin
  const userProfile = await prisma.user.findUnique({
    where: { id: user.id },
    select: { isAdmin: true, isSuperAdmin: true, email: true }
  })

  if (!userProfile?.isAdmin && !userProfile?.isSuperAdmin) {
    redirect('/dashboard')
  }

  return <>{children}</>
}
