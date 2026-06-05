'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Modal } from '@/components/ui/modal'
import { Plus, Pencil, Trash2, Power, PowerOff, ExternalLink, AlertCircle, CheckCircle2, X } from 'lucide-react'

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
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
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
      setError(null)
      const params = new URLSearchParams()
      if (userIdFilter) {
        params.append('userId', userIdFilter)
      }

      const response = await fetch(`/api/admin/webhooks?${params}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch webhooks' }))
        throw new Error(errorData.error || `Failed to fetch webhooks: ${response.status}`)
      }

      const data = await response.json()
      // Handle case where webhooks might be undefined
      setWebhooks(Array.isArray(data.webhooks) ? data.webhooks : [])
    } catch (error) {
      console.error('Error fetching webhooks:', error)
      setError(error instanceof Error ? error.message : 'Failed to load webhooks. Please try again.')
      setWebhooks([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchWebhooks()
  }, [userIdFilter])

  // Auto-dismiss success messages after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  const handleCreate = () => {
    setEditingWebhook(null)
    setValidationErrors({})
    setError(null)
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
    setValidationErrors({})
    setError(null)
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

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    // Required fields validation
    if (!formData.name.trim()) {
      errors.name = 'Webhook name is required'
    }

    if (!formData.webhookUrl.trim()) {
      errors.webhookUrl = 'Webhook URL is required'
    } else {
      // Validate URL format
      try {
        const url = new URL(formData.webhookUrl)
        if (!url.protocol.startsWith('http')) {
          errors.webhookUrl = 'Webhook URL must start with http:// or https://'
        }
      } catch {
        errors.webhookUrl = 'Please enter a valid URL'
      }
    }

    if (!editingWebhook && !formData.userId.trim()) {
      errors.userId = 'User ID is required'
    }

    // Validate priority is a valid number
    if (isNaN(formData.priority) || formData.priority < 0) {
      errors.priority = 'Priority must be a positive number'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSave = async () => {
    // Validate form before submission
    if (!validateForm()) {
      setError('Please fix the validation errors before saving')
      return
    }

    try {
      setIsSaving(true)
      setError(null)

      // Ensure priority is converted to a number
      const priorityValue = typeof formData.priority === 'string'
        ? parseInt(formData.priority, 10)
        : formData.priority

      if (isNaN(priorityValue)) {
        throw new Error('Priority must be a valid number')
      }

      if (editingWebhook) {
        // Update existing webhook
        const response = await fetch(`/api/admin/webhooks/${editingWebhook.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name.trim(),
            webhookUrl: formData.webhookUrl.trim(),
            webhookType: formData.webhookType,
            priority: priorityValue,
            tierRestriction: formData.tierRestriction || null,
            isActive: formData.isActive,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Failed to update webhook' }))
          throw new Error(errorData.error || `Failed to update webhook: ${response.status}`)
        }

        await fetchWebhooks()
        setSuccessMessage('Webhook updated successfully!')
        setIsModalOpen(false)
      } else {
        // Create new webhook
        const response = await fetch('/api/admin/webhooks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: formData.userId.trim(),
            name: formData.name.trim(),
            webhookUrl: formData.webhookUrl.trim(),
            webhookType: formData.webhookType,
            priority: priorityValue,
            tierRestriction: formData.tierRestriction || null,
            isActive: formData.isActive,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Failed to create webhook' }))
          throw new Error(errorData.error || `Failed to create webhook: ${response.status}`)
        }

        await fetchWebhooks()
        setSuccessMessage('Webhook created successfully!')
        setIsModalOpen(false)
      }
    } catch (error) {
      console.error('Error saving webhook:', error)
      setError(error instanceof Error ? error.message : 'Failed to save webhook. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggle = async (id: string) => {
    try {
      setError(null)
      const response = await fetch(`/api/admin/webhooks/${id}/toggle`, {
        method: 'POST',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to toggle webhook' }))
        throw new Error(errorData.error || `Failed to toggle webhook: ${response.status}`)
      }

      await fetchWebhooks()
      setSuccessMessage('Webhook status updated successfully!')
    } catch (error) {
      console.error('Error toggling webhook:', error)
      setError(error instanceof Error ? error.message : 'Failed to toggle webhook. Please try again.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this webhook?')) {
      return
    }

    try {
      setError(null)
      const response = await fetch(`/api/admin/webhooks/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to delete webhook' }))
        throw new Error(errorData.error || `Failed to delete webhook: ${response.status}`)
      }

      await fetchWebhooks()
      setSuccessMessage('Webhook deleted successfully!')
    } catch (error) {
      console.error('Error deleting webhook:', error)
      setError(error instanceof Error ? error.message : 'Failed to delete webhook. Please try again.')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-duma-primary/20 border-t-duma-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-green-800 font-medium">{successMessage}</p>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-green-600 hover:text-green-800"
            aria-label="Dismiss"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-800 font-medium">Error</p>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-600 hover:text-red-800"
            aria-label="Dismiss"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-end">
        <Button onClick={handleCreate}>
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
        {!webhooks || webhooks.length === 0 ? (
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
                    Type: {webhook.webhookType} â€¢ Created: {new Date(webhook.createdAt).toLocaleDateString()}
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
          {/* Modal Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {!editingWebhook && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                User ID <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.userId}
                onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                placeholder="Enter user ID"
                className={validationErrors.userId ? 'border-red-500' : ''}
              />
              {validationErrors.userId && (
                <p className="text-red-600 text-sm">{validationErrors.userId}</p>
              )}
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
              className={validationErrors.name ? 'border-red-500' : ''}
            />
            {validationErrors.name && (
              <p className="text-red-600 text-sm">{validationErrors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Webhook URL <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.webhookUrl}
              onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
              placeholder="https://n8n.example.com/webhook/..."
              className={validationErrors.webhookUrl ? 'border-red-500' : ''}
            />
            {validationErrors.webhookUrl && (
              <p className="text-red-600 text-sm">{validationErrors.webhookUrl}</p>
            )}
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
                onChange={(e) => {
                  const value = e.target.value === '' ? 0 : parseInt(e.target.value, 10)
                  setFormData({ ...formData, priority: isNaN(value) ? 0 : value })
                }}
                placeholder="0 = highest"
                className={validationErrors.priority ? 'border-red-500' : ''}
              />
              {validationErrors.priority && (
                <p className="text-red-600 text-sm">{validationErrors.priority}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Tier Restriction (Optional)
            </label>
            <Select
              value={formData.tierRestriction || 'none'}
              onValueChange={(value) => setFormData({ ...formData, tierRestriction: value === 'none' ? '' : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="No restriction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No restriction</SelectItem>
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
            <Button
              variant="outline"
              onClick={() => {
                setIsModalOpen(false)
                setError(null)
                setValidationErrors({})
              }}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !formData.name || !formData.webhookUrl || (!editingWebhook && !formData.userId)}
              className="bg-gradient-to-r from-duma-primary to-duma-secondary text-white"
            >
              {isSaving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                  {editingWebhook ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                editingWebhook ? 'Update' : 'Create'
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
