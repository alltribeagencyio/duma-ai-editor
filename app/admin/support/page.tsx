'use client'

import { AdminLayout } from '@/components/admin/AdminLayout'
import { SupportTickets } from '@/components/admin/SupportTickets'

export default function AdminSupportPage() {
  return (
    <AdminLayout title="Support Tickets" subtitle="View and manage customer support requests">
      <SupportTickets />
    </AdminLayout>
  )
}
