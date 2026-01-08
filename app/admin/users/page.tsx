'use client'

import { AdminLayout } from '@/components/admin/AdminLayout'
import { UserManagement } from '@/components/admin/UserManagement'

export default function AdminUsersPage() {
  return (
    <AdminLayout title="User Management" subtitle="Manage user accounts and permissions">
      <UserManagement />
    </AdminLayout>
  )
}
