'use client'

import { AdminLayout } from '@/components/admin/AdminLayout'
import { AdminAnalytics } from '@/components/admin/AdminAnalytics'

export default function AdminAnalyticsPage() {
  return (
    <AdminLayout title="Analytics" subtitle="View platform metrics and user activity">
      <AdminAnalytics />
    </AdminLayout>
  )
}
