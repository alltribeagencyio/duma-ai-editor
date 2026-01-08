import { UserManagement } from '@/components/admin/UserManagement'

export const metadata = {
  title: 'User Management | Duma AI Admin',
  description: 'Manage user accounts and permissions',
}

export default function AdminUsersPage() {
  return <UserManagement />
}
