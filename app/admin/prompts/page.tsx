'use client'

import { AdminLayout } from '@/components/admin/AdminLayout'
import { PromptManagement } from '@/components/admin/PromptManagement'

export default function AdminPromptsPage() {
  return (
    <AdminLayout title="Prompt Management" subtitle="Manage prompts and assignments">
      <PromptManagement />
    </AdminLayout>
  )
}
