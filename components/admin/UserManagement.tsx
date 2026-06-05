'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, Edit, Ban, CheckCircle, XCircle, UserPlus, Plus, Minus, RotateCcw } from 'lucide-react'
import { showToast } from '@/components/feedback/ToastContainer'

interface User {
  id: string
  email: string
  fullName?: string
  subscriptionTier: string
  subscriptionStatus: string
  monthlyCredits: number
  creditsUsed: number
  creditBalance: number
  pricingPlan: string
  isAdmin: boolean
  createdAt: string
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showCreditsModal, setShowCreditsModal] = useState(false)
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [createForm, setCreateForm] = useState({
    email: '',
    fullName: '',
    password: '',
    monthlyCredits: 100,
    subscriptionTier: 'starter'
  })
  const [creditsForm, setCreditsForm] = useState({
    action: 'add',
    amount: 0
  })
  const [selectedPlan, setSelectedPlan] = useState<string>('personal')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'free': return 'default'
      case 'starter': return 'secondary'
      case 'pro': return 'processing'
      case 'enterprise': return 'completed'
      default: return 'default'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'completed'
      case 'trialing': return 'processing'
      case 'past_due': return 'pending'
      case 'canceled': return 'failed'
      default: return 'default'
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm)
      })

      const data = await response.json()

      if (response.ok) {
        showToast('success', 'User Created', `${createForm.email} has been created successfully`)
        setShowCreateModal(false)
        setCreateForm({
          email: '',
          fullName: '',
          password: '',
          monthlyCredits: 100,
          subscriptionTier: 'starter'
        })
        fetchUsers()
      } else {
        showToast('error', 'Creation Failed', data.error || 'Failed to create user')
      }
    } catch (error) {
      console.error('Error creating user:', error)
      showToast('error', 'Error', 'An unexpected error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  const handleManageCredits = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return

    setSubmitting(true)

    try {
      const response = await fetch('/api/admin/users/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          action: creditsForm.action,
          amount: creditsForm.amount
        })
      })

      const data = await response.json()

      if (response.ok) {
        showToast('success', 'Credits Updated', `Credits ${creditsForm.action} successful`)
        setShowCreditsModal(false)
        setSelectedUser(null)
        setCreditsForm({ action: 'add', amount: 0 })
        fetchUsers()
      } else {
        showToast('error', 'Update Failed', data.error || 'Failed to update credits')
      }
    } catch (error) {
      console.error('Error managing credits:', error)
      showToast('error', 'Error', 'An unexpected error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  const openCreditsModal = (user: User) => {
    setSelectedUser(user)
    setCreditsForm({ action: 'add', amount: 0 })
    setShowCreditsModal(true)
  }

  const openPlanModal = (user: User) => {
    setSelectedUser(user)
    setSelectedPlan(user.pricingPlan)
    setShowPlanModal(true)
  }

  const handleChangePlan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return

    setSubmitting(true)

    try {
      const response = await fetch('/api/admin/users/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          pricingPlan: selectedPlan
        })
      })

      const data = await response.json()

      if (response.ok) {
        showToast('success', 'Plan Updated', `Pricing plan changed to ${selectedPlan}`)
        setShowPlanModal(false)
        setSelectedUser(null)
        fetchUsers()
      } else {
        showToast('error', 'Update Failed', data.error || 'Failed to update plan')
      }
    } catch (error) {
      console.error('Error changing plan:', error)
      showToast('error', 'Error', 'An unexpected error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                View and manage all platform users
              </CardDescription>
            </div>
            <Button onClick={() => setShowCreateModal(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Create User
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search users by email or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

        {/* Users Table */}
        <div className="border rounded-lg">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/40 backdrop-blur-sm">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pricing Plan</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Credit Balance</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      Loading users...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-white/40">
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium text-gray-900">
                            {user.fullName || 'N/A'}
                            {user.isAdmin && (
                              <Badge variant="outline" className="ml-2 text-xs">Admin</Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={user.pricingPlan === 'business' ? 'processing' : 'secondary'}>
                          {user.pricingPlan}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={getStatusColor(user.subscriptionStatus) as any}>
                          {user.subscriptionStatus}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <div>${user.creditBalance.toFixed(2)}</div>
                          <div className="text-xs text-gray-500">{user.creditsUsed} images processed</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openPlanModal(user)}
                            title="Change Plan"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Plan
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openCreditsModal(user)}
                            title="Manage Credits"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Credits
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="text-sm text-gray-500">
          Showing {filteredUsers.length} of {users.length} users
        </div>
      </CardContent>
    </Card>

    {/* Create User Modal */}
    {showCreateModal && (
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="glass-panel max-w-md w-full p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Create New User</h3>
            <button
              onClick={() => setShowCreateModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <Input
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                required
                placeholder="user@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <Input
                type="text"
                value={createForm.fullName}
                onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password *
              </label>
              <Input
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                required
                placeholder="Min. 6 characters"
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monthly Credits
              </label>
              <Input
                type="number"
                value={createForm.monthlyCredits}
                onChange={(e) => setCreateForm({ ...createForm, monthlyCredits: parseInt(e.target.value) })}
                min={0}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subscription Tier
              </label>
              <select
                value={createForm.subscriptionTier}
                onChange={(e) => setCreateForm({ ...createForm, subscriptionTier: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="free">Free</option>
                <option value="starter">Starter</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateModal(false)}
                className="flex-1"
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create User'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    )}

    {/* Change Plan Modal */}
    {showPlanModal && selectedUser && (
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="glass-panel max-w-md w-full p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Change Pricing Plan</h3>
            <button
              onClick={() => {
                setShowPlanModal(false)
                setSelectedUser(null)
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>

          <div className="glass-subtle rounded-xl p-4">
            <div className="text-sm text-gray-600">User</div>
            <div className="font-medium">{selectedUser.fullName || selectedUser.email}</div>
            <div className="text-sm text-gray-500 mt-2">
              Current Plan: <span className="font-medium capitalize">{selectedUser.pricingPlan}</span>
            </div>
            <div className="text-sm text-gray-500">
              Credit Balance: <span className="font-medium">${selectedUser.creditBalance.toFixed(2)}</span>
            </div>
          </div>

          <form onSubmit={handleChangePlan} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Pricing Plan
              </label>
              <select
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="personal">Personal ($0.375 per image)</option>
                <option value="business">Business ($0.35 per image)</option>
              </select>
              <p className="text-xs text-gray-500 mt-2">
                Changing the plan will affect future image processing costs.
              </p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowPlanModal(false)
                  setSelectedUser(null)
                }}
                className="flex-1"
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={submitting}>
                {submitting ? 'Updating...' : 'Change Plan'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    )}

    {/* Manage Credits Modal */}
    {showCreditsModal && selectedUser && (
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="glass-panel max-w-md w-full p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Manage Credits</h3>
            <button
              onClick={() => {
                setShowCreditsModal(false)
                setSelectedUser(null)
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>

          <div className="glass-subtle rounded-xl p-4">
            <div className="text-sm text-gray-600">User</div>
            <div className="font-medium">{selectedUser.fullName || selectedUser.email}</div>
            <div className="text-sm text-gray-500 mt-2">
              Current: {selectedUser.creditsUsed} / {selectedUser.monthlyCredits} credits used
            </div>
          </div>

          <form onSubmit={handleManageCredits} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Action
              </label>
              <select
                value={creditsForm.action}
                onChange={(e) => setCreditsForm({ ...creditsForm, action: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="add">Add Credits</option>
                <option value="set">Set Credits</option>
                <option value="reset">Reset Used Credits</option>
              </select>
            </div>

            {creditsForm.action !== 'reset' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount
                </label>
                <Input
                  type="number"
                  value={creditsForm.amount}
                  onChange={(e) => setCreditsForm({ ...creditsForm, amount: parseInt(e.target.value) })}
                  min={0}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {creditsForm.action === 'add'
                    ? `Will add ${creditsForm.amount} to monthly credits`
                    : `Will set monthly credits to ${creditsForm.amount}`}
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCreditsModal(false)
                  setSelectedUser(null)
                }}
                className="flex-1"
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={submitting}>
                {submitting ? 'Updating...' : 'Update Credits'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    )}
    </>
  )
}
