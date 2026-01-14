'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Search, Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react'
import { showToast } from '@/components/feedback/ToastContainer'

interface PromptPreset {
  id: string
  name: string
  description: string
  prompt: string
  category: string
  icon: string
  order: number
  isActive: boolean
}

export function PromptManagement() {
  const [prompts, setPrompts] = useState<PromptPreset[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [selectedPrompt, setSelectedPrompt] = useState<PromptPreset | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    prompt: '',
    category: '',
    icon: '✨',
    order: 0,
    isActive: true
  })

  useEffect(() => {
    fetchPrompts()
  }, [])

  const fetchPrompts = async () => {
    try {
      const response = await fetch('/api/admin/prompts/preset')
      if (response.ok) {
        const data = await response.json()
        setPrompts(data.prompts)
      }
    } catch (error) {
      console.error('Error fetching prompts:', error)
      showToast('error', 'Error', 'Failed to fetch prompts')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      prompt: '',
      category: '',
      icon: '✨',
      order: 0,
      isActive: true
    })
  }

  const openCreateModal = () => {
    resetForm()
    setShowCreateModal(true)
  }

  const openEditModal = (prompt: PromptPreset) => {
    setFormData({
      name: prompt.name,
      description: prompt.description,
      prompt: prompt.prompt,
      category: prompt.category,
      icon: prompt.icon,
      order: prompt.order,
      isActive: prompt.isActive
    })
    setSelectedPrompt(prompt)
    setShowEditModal(true)
  }

  const handleCreate = async () => {
    if (!formData.name || !formData.prompt || !formData.category) {
      showToast('error', 'Error', 'Please fill in all required fields')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/admin/prompts/preset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        showToast('success', 'Success', 'Prompt created successfully')
        setShowCreateModal(false)
        resetForm()
        await fetchPrompts() // Refresh the list
      } else {
        const error = await response.json()
        showToast('error', 'Error', error.error || 'Failed to create prompt')
      }
    } catch (error) {
      console.error('Error creating prompt:', error)
      showToast('error', 'Error', 'Failed to create prompt')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdate = async () => {
    if (!selectedPrompt) return

    if (!formData.name || !formData.prompt || !formData.category) {
      showToast('error', 'Error', 'Please fill in all required fields')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/admin/prompts/preset/${selectedPrompt.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        showToast('success', 'Success', 'Prompt updated successfully')
        setShowEditModal(false)
        setSelectedPrompt(null)
        resetForm()
        await fetchPrompts() // Refresh the list
      } else {
        const error = await response.json()
        showToast('error', 'Error', error.error || 'Failed to update prompt')
      }
    } catch (error) {
      console.error('Error updating prompt:', error)
      showToast('error', 'Error', 'Failed to update prompt')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedPrompt) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/admin/prompts/preset/${selectedPrompt.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        showToast('success', 'Success', 'Prompt deleted successfully')
        setShowDeleteConfirm(false)
        setSelectedPrompt(null)
        await fetchPrompts() // Refresh the list
      } else {
        const error = await response.json()
        showToast('error', 'Error', error.error || 'Failed to delete prompt')
      }
    } catch (error) {
      console.error('Error deleting prompt:', error)
      showToast('error', 'Error', 'Failed to delete prompt')
    } finally {
      setIsSubmitting(false)
    }
  }

  const togglePromptStatus = async (promptId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/prompts/preset/${promptId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      })

      if (response.ok) {
        showToast('success', 'Success', `Prompt ${!currentStatus ? 'activated' : 'deactivated'}`)
        await fetchPrompts() // Refresh the list
      } else {
        const error = await response.json()
        showToast('error', 'Error', error.error || 'Failed to toggle prompt status')
      }
    } catch (error) {
      console.error('Error toggling prompt:', error)
      showToast('error', 'Error', 'Failed to toggle prompt status')
    }
  }

  const filteredPrompts = prompts.filter(prompt =>
    prompt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    prompt.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    prompt.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'background': return 'processing'
      case 'enhancement': return 'completed'
      case 'focus': return 'pending'
      default: return 'default'
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Prompt Management</CardTitle>
            <CardDescription>
              Manage preset prompts available to all users
            </CardDescription>
          </div>
          <Button onClick={openCreateModal}>
            <Plus className="h-4 w-4 mr-2" />
            Create Prompt
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search prompts by name, description, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Prompts Table */}
        <div className="border rounded-lg">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      Loading prompts...
                    </td>
                  </tr>
                ) : filteredPrompts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No prompts found
                    </td>
                  </tr>
                ) : (
                  filteredPrompts.map((prompt) => (
                    <tr key={prompt.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{prompt.name}</div>
                        <div className="text-xs text-gray-500 truncate max-w-xs">
                          {prompt.prompt.substring(0, 50)}...
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={getCategoryColor(prompt.category) as any}>
                          {prompt.category}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-600 truncate max-w-xs">
                          {prompt.description}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-600">{prompt.order}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {prompt.isActive ? (
                            <Eye className="h-4 w-4 text-green-600" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          )}
                          <span className={`text-sm ${prompt.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                            {prompt.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditModal(prompt)}
                            title="Edit Prompt"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => togglePromptStatus(prompt.id, prompt.isActive)}
                            title={prompt.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {prompt.isActive ? (
                              <EyeOff className="h-3 w-3" />
                            ) : (
                              <Eye className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedPrompt(prompt)
                              setShowDeleteConfirm(true)
                            }}
                            title="Delete Prompt"
                            className="text-red-600 hover:text-red-700 hover:border-red-300"
                          >
                            <Trash2 className="h-3 w-3" />
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
          Showing {filteredPrompts.length} of {prompts.length} prompts
        </div>

        {/* Info Box */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm font-medium text-blue-900 mb-1">
            Prompt Management Info
          </div>
          <div className="text-sm text-blue-700">
            Create, edit, and delete preset prompts. Changes reflect instantly on the user side.
            Active prompts are visible to all users when creating jobs.
          </div>
        </div>
      </CardContent>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold">Create New Prompt</h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., White Background"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Category *</label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Background, Enhancement, Focus"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the prompt"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Prompt Text *</label>
                <textarea
                  value={formData.prompt}
                  onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                  placeholder="The actual prompt text that will be used"
                  className="w-full min-h-[120px] p-3 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Icon</label>
                  <Input
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    placeholder="✨"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Display Order</label>
                  <Input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <label className="text-sm font-medium text-gray-700">Active (Visible to users)</label>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false)
                  resetForm()
                }}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleCreate}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Prompt'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedPrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold">Edit Prompt</h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., White Background"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Category *</label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Background, Enhancement, Focus"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the prompt"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Prompt Text *</label>
                <textarea
                  value={formData.prompt}
                  onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                  placeholder="The actual prompt text that will be used"
                  className="w-full min-h-[120px] p-3 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Icon</label>
                  <Input
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    placeholder="✨"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Display Order</label>
                  <Input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <label className="text-sm font-medium text-gray-700">Active (Visible to users)</label>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditModal(false)
                  setSelectedPrompt(null)
                  resetForm()
                }}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleUpdate}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedPrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-100 rounded-full">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">Delete Prompt</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Are you sure you want to delete <strong>{selectedPrompt.name}</strong>? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setSelectedPrompt(null)
                }}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700"
                onClick={handleDelete}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Deleting...' : 'Delete Prompt'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
