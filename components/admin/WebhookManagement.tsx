'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Modal } from '@/components/ui/modal'
import { Plus, Pencil, Trash2, Power, PowerOff, ExternalLink } from 'lucide-react'

interface Webhook {
  id: string
  userId: string
  name: string
  webhookUrl: string
  isActive: boolean
  priority: number
  webhookType: string
  tierRestriction: string | null
  createdAt: string
  updatedAt: string
  user?: {
    email: string
    fullName: string | null
  }
}

export function WebhookManagement() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null)
  const [userIdFilter, setUserIdFilter] = useState('')
  const [formData, setFormData] = useState({
    userId: '',
    name: '',
    webhookUrl: '',
    webhookType: 'image_processing',
    priority: 0,
    tierRestriction: '',
    isActive: false,
  })

  const fetchWebhooks = async () => {
    try {
      const params = new URLSearchParams()
      if (userIdFilter) {
        params.append('userId', userIdFilter)
      }

      const response = await fetch(`/api/admin/webhooks?${params}`)
      if (response.ok) {
        const { webhooks } = await response.json()
        setWebhooks(webhooks)
      }
    } catch (error) {
      console.error('Error fetching webhooks:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchWebhooks()
  }, [userIdFilter])

  const handleCreate = () => {
    setEditingWebhook(null)
    setFormData({
      userId: '',
      name: '',
      webhookUrl: '',
      webhookType: 'image_processing',
      priority: 0,
      tierRestriction: '',
      isActive: false,
    })
    setIsModalOpen(true)
  }

  const handleEdit = (webhook: Webhook) => {
    setEditingWebhook(webhook)
    setFormData({
      userId: webhook.userId,
      name: webhook.name,
      webhookUrl: webhook.webhookUrl,
      webhookType: webhook.webhookType,
      priority: webhook.priority,
      tierRestriction: webhook.tierRestriction || '',
      isActive: webhook.isActive,
    })
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    try {
      if (editingWebhook) {
        // Update existing webhook
        const response = await fetch(`/api/admin/webhooks/${editingWebhook.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            webhookUrl: formData.webhookUrl,
            webhookType: formData.webhookType,
            priority: formData.priority,
            tierRestriction: formData.tierRestriction || null,
            isActive: formData.isActive,
          }),
        })

        if (response.ok) {
          await fetchWebhooks()
          setIsModalOpen(false)
        }
      } else {
        // Create new webhook
        const response = await fetch('/api/admin/webhooks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            tierRestriction: formData.tierRestriction || null,
          }),
        })

        if (response.ok) {
          await fetchWebhooks()
          setIsModalOpen(false)
        }
      }
    } catch (error) {
      console.error('Error saving webhook:', error)
    }
  }

  const handleToggle = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/webhooks/${id}/toggle`, {
        method: 'POST',
      })

      if (response.ok) {
        await fetchWebhooks()
      }
    } catch (error) {
      console.error('Error toggling webhook:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this webhook?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/webhooks/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchWebhooks()
      }
    } catch (error) {
      console.error('Error deleting webhook:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Webhook Management</h2>
          <p className="text-gray-600 mt-1">Configure N8N webhooks for users</p>
        </div>
        <Button onClick={handleCreate} className="bg-gradient-to-r from-duma-primary to-duma-secondary text-white">
          <Plus className="h-4 w-4 mr-2" />
          Add Webhook
        </Button>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Input
              placeholder="Filter by User ID..."
              value={userIdFilter}
              onChange={(e) => setUserIdFilter(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Webhooks List */}
      <div className="grid gap-4">
        {webhooks.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-600">
              No webhooks configured yet
            </CardContent>
          </Card>
        ) : (
          webhooks.map((webhook) => (
            <Card key={webhook.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-lg">{webhook.name}</CardTitle>
                      {webhook.isActive ? (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full flex items-center gap-1">
                          <Power className="h-3 w-3" />
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full flex items-center gap-1">
                          <PowerOff className="h-3 w-3" />
                          Inactive
                        </span>
                      )}
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                        Priority: {webhook.priority}
                      </span>
                      {webhook.tierRestriction && (
                        <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full">
                          {webhook.tierRestriction}+
                        </span>
                      )}
                    </div>
                    <CardDescription className="mt-2">
                      {webhook.user?.fullName || webhook.user?.email}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggle(webhook.id)}
                    >
                      {webhook.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(webhook)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(webhook.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <ExternalLink className="h-4 w-4" />
                    <code className="px-2 py-1 bg-gray-100 rounded text-xs">{webhook.webhookUrl}</code>
                  </div>
                  <div className="text-xs text-gray-500">
                    Type: {webhook.webhookType} • Created: {new Date(webhook.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingWebhook ? 'Edit Webhook' : 'Create Webhook'}
        size="lg"
      >
        <div className="space-y-4">
          {!editingWebhook && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                User ID <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.userId}
                onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                placeholder="Enter user ID"
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Webhook Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Production Webhook, Advanced Processing"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Webhook URL <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.webhookUrl}
              onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
              placeholder="https://n8n.example.com/webhook/..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Webhook Type
              </label>
              <Select
                value={formData.webhookType}
                onValueChange={(value) => setFormData({ ...formData, webhookType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="image_processing">Image Processing</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                  <SelectItem value="chatbot">Chatbot</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Priority
              </label>
              <Input
                type="number"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                placeholder="0 = highest"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Tier Restriction (Optional)
            </label>
            <Select
              value={formData.tierRestriction}
              onValueChange={(value) => setFormData({ ...formData, tierRestriction: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="No restriction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No restriction</SelectItem>
                <SelectItem value="professional">Professional+</SelectItem>
                <SelectItem value="enterprise">Enterprise only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded border-gray-300"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              Active
            </label>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formData.name || !formData.webhookUrl || (!editingWebhook && !formData.userId)}
              className="bg-gradient-to-r from-duma-primary to-duma-secondary text-white"
            >
              {editingWebhook ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
