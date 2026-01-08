export const metadata = {
  title: 'Admin Dashboard | Duma AI',
  description: 'Admin dashboard for managing users, prompts, and webhooks',
}

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Welcome to Admin Panel</h2>
        <p className="text-gray-600 mt-1">Manage your platform from here</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-100 p-6">
          <div className="text-3xl font-bold text-gray-900">-</div>
          <div className="text-sm text-gray-600 mt-1">Total Users</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-6">
          <div className="text-3xl font-bold text-gray-900">-</div>
          <div className="text-sm text-gray-600 mt-1">Active Jobs</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-6">
          <div className="text-3xl font-bold text-gray-900">-</div>
          <div className="text-sm text-gray-600 mt-1">Total Prompts</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-6">
          <div className="text-3xl font-bold text-gray-900">-</div>
          <div className="text-sm text-gray-600 mt-1">Credits Used</div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/admin/users"
            className="p-4 border border-gray-200 rounded-lg hover:border-duma-primary/50 hover:bg-duma-primary/5 transition-all"
          >
            <div className="font-medium text-gray-900">Manage Users</div>
            <div className="text-sm text-gray-600 mt-1">View and edit user accounts</div>
          </a>
          <a
            href="/admin/webhooks"
            className="p-4 border border-gray-200 rounded-lg hover:border-duma-primary/50 hover:bg-duma-primary/5 transition-all"
          >
            <div className="font-medium text-gray-900">Configure Webhooks</div>
            <div className="text-sm text-gray-600 mt-1">Manage N8N webhook settings</div>
          </a>
          <a
            href="/admin/prompts"
            className="p-4 border border-gray-200 rounded-lg hover:border-duma-primary/50 hover:bg-duma-primary/5 transition-all"
          >
            <div className="font-medium text-gray-900">Manage Prompts</div>
            <div className="text-sm text-gray-600 mt-1">Create and assign prompts</div>
          </a>
        </div>
      </div>
    </div>
  )
}
