'use client'

import { useEffect, useState } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { EnhancedJobList } from './EnhancedJobList'
import { TransactionsHistory } from './TransactionsHistory'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, DollarSign } from 'lucide-react'

export function HistoryClient() {
  const [userEmail, setUserEmail] = useState<string | undefined>(undefined)
  const [activeTab, setActiveTab] = useState('jobs')
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
      subtitle="View your job history and transaction records"
    >
      <div className="w-full max-w-screen-2xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
            <TabsTrigger value="jobs" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Job History
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Transactions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="jobs" className="mt-0">
            <EnhancedJobList />
          </TabsContent>

          <TabsContent value="transactions" className="mt-0">
            <TransactionsHistory />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}
