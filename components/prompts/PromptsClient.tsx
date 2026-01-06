'use client'

import { useState, useEffect } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Prompt {
  id: string
  name: string
  description: string
  prompt: string
  category: string
  isPreset?: boolean
}

export function PromptsClient() {
  const [userEmail, setUserEmail] = useState<string | undefined>(undefined)
  const [customPrompts, setCustomPrompts] = useState<Prompt[]>([])
  const [presetPrompts, setPresetPrompts] = useState<Prompt[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCustom, setShowCustom] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    prompt: '',
    category: 'other',
  })
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      setUserEmail(user.email)
      fetchPrompts()
    }

    checkAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchPrompts = async () => {
    try {
      const [customRes, presetRes] = await Promise.all([
        fetch('/api/prompts/custom'),
        fetch('/api/prompts/presets'),
      ])

      if (customRes.ok) {
        const { prompts } = await customRes.json()
        setCustomPrompts(prompts)
      }

      if (presetRes.ok) {
        const { prompts } = await presetRes.json()
        setPresetPrompts(prompts.map((p: Prompt) => ({ ...p, isPreset: true })))
      }
    } catch (error) {
      console.error('Error fetching prompts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = async () => {
    try {
      const response = await fetch('/api/prompts/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await fetchPrompts()
        setIsCreating(false)
        setFormData({ name: '', description: '', prompt: '', category: 'other' })
      }
    } catch (error) {
      console.error('Error creating prompt:', error)
    }
  }

  const handleUpdate = async (id: string) => {
    try {
      const response = await fetch(`/api/prompts/custom/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await fetchPrompts()
        setEditingId(null)
        setFormData({ name: '', description: '', prompt: '', category: 'other' })
      }
    } catch (error) {
      console.error('Error updating prompt:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this prompt?')) return

    try {
      const response = await fetch(`/api/prompts/custom/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchPrompts()
      }
    } catch (error) {
      console.error('Error deleting prompt:', error)
    }
  }

  const startEditing = (prompt: Prompt) => {
    setEditingId(prompt.id)
    setFormData({
      name: prompt.name,
      description: prompt.description,
      prompt: prompt.prompt,
      category: prompt.category,
    })
  }

  const cancelEditing = () => {
    setEditingId(null)
    setIsCreating(false)
    setFormData({ name: '', description: '', prompt: '', category: 'other' })
  }

  const prompts = showCustom ? customPrompts : presetPrompts

  return (
    <AppLayout
      userEmail={userEmail}
      title="Prompts"
      subtitle="Manage your custom prompts and view presets"
    >
      <div className="w-full max-w-screen-2xl mx-auto">
        {/* Toggle between custom and preset */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
          <button
            onClick={() => setShowCustom(true)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              showCustom
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            Custom Prompts ({customPrompts.length})
          </button>
          <button
            onClick={() => setShowCustom(false)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              !showCustom
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            Preset Prompts ({presetPrompts.length})
          </button>
          </div>
          {showCustom && (
            <Button
              onClick={() => setIsCreating(true)}
              className="bg-gray-900 hover:bg-gray-800 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Prompt
            </Button>
          )}
        </div>

        {/* Create/Edit Form */}
        {(isCreating || editingId) && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {isCreating ? 'Create New Prompt' : 'Edit Prompt'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  placeholder="My Custom Prompt"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  placeholder="Brief description of what this prompt does"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                >
                  <option value="background">Background</option>
                  <option value="enhancement">Enhancement</option>
                  <option value="focus">Focus</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prompt
                </label>
                <textarea
                  value={formData.prompt}
                  onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  placeholder="Enter your prompt instructions..."
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => (isCreating ? handleCreate() : handleUpdate(editingId!))}
                  disabled={!formData.name || !formData.prompt}
                  className="bg-gray-900 hover:bg-gray-800 text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isCreating ? 'Create' : 'Save'}
                </Button>
                <Button
                  onClick={cancelEditing}
                  variant="outline"
                  className="border-gray-300"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Prompts List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900" />
          </div>
        ) : prompts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-600">
              {showCustom
                ? 'No custom prompts yet. Create your first one!'
                : 'No preset prompts available'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {prompts.map((prompt) => (
              <div
                key={prompt.id}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{prompt.name}</h3>
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                        {prompt.category}
                      </span>
                    </div>
                    {prompt.description && (
                      <p className="text-sm text-gray-600 mb-3">{prompt.description}</p>
                    )}
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded border border-gray-100">
                      {prompt.prompt}
                    </p>
                  </div>
                  {!prompt.isPreset && (
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => startEditing(prompt)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(prompt.id)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
