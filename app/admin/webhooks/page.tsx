import { WebhookManagement } from '@/components/admin/WebhookManagement'

export const metadata = {
  title: 'Webhook Management | Duma AI Admin',
  description: 'Configure N8N webhooks and view logs',
}

export default function AdminWebhooksPage() {
  return <WebhookManagement />
}
