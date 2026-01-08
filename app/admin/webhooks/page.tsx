'use client'

import { AdminLayout } from '@/components/admin/AdminLayout'
import { WebhookManagement } from '@/components/admin/WebhookManagement'

export default function AdminWebhooksPage() {
  return (
    <AdminLayout title="Webhook Management" subtitle="Configure N8N webhooks for users">
      <WebhookManagement />
    </AdminLayout>
  )
}
