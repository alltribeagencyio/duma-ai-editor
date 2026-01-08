'use client'

import { AdminLayout } from '@/components/admin/AdminLayout'

export default function AdminSettingsPage() {
  return (
    <AdminLayout title="Admin Settings" subtitle="Configure platform-wide settings">
      <div className="bg-white rounded-lg border border-gray-100 p-8 text-center">
        <p className="text-gray-600">Settings interface will be implemented in future phases</p>
      </div>
    </AdminLayout>
  )
}
