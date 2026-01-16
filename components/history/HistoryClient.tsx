'use client'

import { useEffect, useState } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { EnhancedJobList } from './EnhancedJobList'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function HistoryClient() {
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
      title="History"
      subtitle="View and manage all your editing jobs"
    >
      <div className="w-full max-w-screen-2xl mx-auto">
        <EnhancedJobList />
      </div>
    </AppLayout>
  )
}
