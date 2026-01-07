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
  const [selectedPrompt, setSelectedPrompt] = useState<PromptPreset | null>(null)

  useEffect(() => {
    fetchPrompts()
  }, [])

  const fetchPrompts = async () => {
    try {
      const response = await fetch('/api/prompts/presets')
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

  const togglePromptStatus = async (promptId: string, currentStatus: boolean) => {
    try {
      // This would need a corresponding API endpoint
      showToast('info', 'Coming Soon', 'Prompt toggle functionality will be available soon')
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
          <Button onClick={() => showToast('info', 'Coming Soon', 'Create prompt functionality will be available soon')}>
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
                            onClick={() => {
                              setSelectedPrompt(prompt)
                              setShowEditModal(true)
                            }}
                            title="View Details"
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
            Prompts are fetched from the database in real-time. Any changes made to prompts in the database
            will automatically reflect on the user side when they refresh or load the prompt selection screen.
            Full CRUD functionality for prompts coming soon!
          </div>
        </div>
      </CardContent>

      {/* View/Edit Modal */}
      {showEditModal && selectedPrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Prompt Details</h3>
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setSelectedPrompt(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <Edit className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">Name</div>
                <div className="text-base text-gray-900">{selectedPrompt.name}</div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">Category</div>
                <Badge variant={getCategoryColor(selectedPrompt.category) as any}>
                  {selectedPrompt.category}
                </Badge>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">Description</div>
                <div className="text-base text-gray-900">{selectedPrompt.description}</div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">Prompt Text</div>
                <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-900 whitespace-pre-wrap">
                  {selectedPrompt.prompt}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">Icon</div>
                  <div className="text-base text-gray-900">{selectedPrompt.icon}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">Display Order</div>
                  <div className="text-base text-gray-900">{selectedPrompt.order}</div>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">Status</div>
                <div className={`text-base ${selectedPrompt.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                  {selectedPrompt.isActive ? 'Active (Visible to users)' : 'Inactive (Hidden from users)'}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditModal(false)
                  setSelectedPrompt(null)
                }}
                className="flex-1"
              >
                Close
              </Button>
              <Button
                className="flex-1"
                onClick={() => showToast('info', 'Coming Soon', 'Edit functionality will be available soon')}
              >
                Edit Prompt
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
