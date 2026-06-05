'use client'

import { useState, useEffect } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Plus, Heart, Send, Sparkles, Users, Star, Globe2, Trash2, Edit2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { PromptCard } from './PromptCard'
import { PromptForm } from './PromptForm'
import { BrandRequestForm } from './BrandRequestForm'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Prompt {
  id: string
  name: string
  description: string
  prompt: string
  category: string
  isPreset?: boolean
  isFavorited?: boolean
  isPublic?: boolean
  userId?: string
}

export function PromptsClient() {
  const [userEmail, setUserEmail] = useState<string | undefined>(undefined)
  const [customPrompts, setCustomPrompts] = useState<Prompt[]>([])
  const [presetPrompts, setPresetPrompts] = useState<Prompt[]>([])
  const [brandPrompts, setBrandPrompts] = useState<Prompt[]>([])
  const [publicPrompts, setPublicPrompts] = useState<Prompt[]>([])
  const [favoritedPrompts, setFavoritedPrompts] = useState<Prompt[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('preset')
  const [isCreating, setIsCreating] = useState(false)
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null)
  const [showBrandRequest, setShowBrandRequest] = useState(false)
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
      fetchAllPrompts()
    }

    checkAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchAllPrompts = async () => {
    try {
      setIsLoading(true)
      const [customRes, presetRes, brandRes, publicRes, favoritesRes] = await Promise.all([
        fetch('/api/prompts/custom'),
        fetch('/api/prompts/presets'),
        fetch('/api/prompts/brand/assigned'),
        fetch('/api/prompts/public'),
        fetch('/api/prompts/favorites'),
      ])

      if (customRes.ok) {
        const { prompts } = await customRes.json()
        setCustomPrompts(prompts)
      }

      if (presetRes.ok) {
        const { prompts } = await presetRes.json()
        setPresetPrompts(prompts.map((p: Prompt) => ({ ...p, isPreset: true })))
      }

      if (brandRes.ok) {
        const { prompts } = await brandRes.json()
        setBrandPrompts(prompts || [])
      }

      if (publicRes.ok) {
        const { prompts } = await publicRes.json()
        setPublicPrompts(prompts || [])
      }

      if (favoritesRes.ok) {
        const { prompts } = await favoritesRes.json()
        setFavoritedPrompts(prompts || [])
      }
    } catch (error) {
      console.error('Error fetching prompts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleFavorite = async (promptId: string, promptType: string, isFavorited: boolean) => {
    try {
      if (isFavorited) {
        await fetch(`/api/prompts/favorites?promptId=${promptId}&promptType=${promptType}`, {
          method: 'DELETE',
        })
      } else {
        await fetch('/api/prompts/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ promptId, promptType }),
        })
      }
      await fetchAllPrompts()
    } catch (error) {
      console.error('Error toggling favorite:', error)
    }
  }

  const handleCreatePrompt = async (data: any) => {
    try {
      const response = await fetch('/api/prompts/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        await fetchAllPrompts()
        setIsCreating(false)
      }
    } catch (error) {
      console.error('Error creating prompt:', error)
    }
  }

  const handleUpdatePrompt = async (id: string, data: any) => {
    try {
      const response = await fetch(`/api/prompts/custom/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        await fetchAllPrompts()
        setEditingPrompt(null)
      }
    } catch (error) {
      console.error('Error updating prompt:', error)
    }
  }

  const handleDeletePrompt = async (id: string) => {
    if (!confirm('Are you sure you want to delete this prompt?')) return

    try {
      const response = await fetch(`/api/prompts/custom/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchAllPrompts()
      }
    } catch (error) {
      console.error('Error deleting prompt:', error)
    }
  }

  const renderPrompts = (prompts: Prompt[], promptType: string) => {
    if (prompts.length === 0) {
      return (
        <div className="col-span-full text-center py-16 glass-card">
          <div className="max-w-sm mx-auto">
            <div className="h-16 w-16 rounded-2xl glass-subtle glass-highlight flex items-center justify-center mx-auto mb-4 text-duma-primary/70">
              {promptType === 'custom' && <Plus className="h-8 w-8" />}
              {promptType === 'preset' && <Sparkles className="h-8 w-8" />}
              {promptType === 'brand' && <Star className="h-8 w-8" />}
              {promptType === 'public' && <Users className="h-8 w-8" />}
              {promptType === 'favorites' && <Heart className="h-8 w-8" />}
            </div>
            <p className="text-gray-600 mb-2">No prompts here yet</p>
            <p className="text-sm text-gray-500">
              {promptType === 'custom' && 'Create your first custom prompt to get started'}
              {promptType === 'preset' && 'Preset prompts will appear here'}
              {promptType === 'brand' && 'Request brand prompts tailored to your business'}
              {promptType === 'public' && 'Community prompts will appear here when users share them'}
              {promptType === 'favorites' && 'Your favorited prompts will appear here'}
            </p>
          </div>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {prompts.map((prompt) => (
          <PromptCard
            key={prompt.id}
            prompt={prompt}
            promptType={promptType}
            onToggleFavorite={handleToggleFavorite}
            onEdit={promptType === 'custom' ? () => setEditingPrompt(prompt) : undefined}
            onDelete={promptType === 'custom' ? () => handleDeletePrompt(prompt.id) : undefined}
          />
        ))}
      </div>
    )
  }

  return (
    <AppLayout
      userEmail={userEmail}
      title="Prompts"
      subtitle="Manage and discover image editing prompts"
    >
      <div className="w-full max-w-screen-2xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <TabsList className="grid w-full sm:w-auto grid-cols-3 sm:grid-cols-6 gap-2">
              <TabsTrigger value="preset" className="flex items-center gap-1.5 text-xs sm:text-sm px-2 sm:px-4">
                <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Preset</span>
                <span className="sm:hidden">Pre</span>
              </TabsTrigger>
              <TabsTrigger value="custom" className="flex items-center gap-1.5 text-xs sm:text-sm px-2 sm:px-4">
                <Edit2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Custom</span>
                <span className="sm:hidden">Cust</span>
              </TabsTrigger>
              <TabsTrigger value="brand" className="flex items-center gap-1.5 text-xs sm:text-sm px-2 sm:px-4">
                <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Premium</span>
                <span className="sm:hidden">Prem</span>
              </TabsTrigger>
              <TabsTrigger value="public" className="flex items-center gap-1.5 text-xs sm:text-sm px-2 sm:px-4">
                <Globe2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Library</span>
                <span className="sm:hidden">Lib</span>
              </TabsTrigger>
              <TabsTrigger value="favorites" className="flex items-center gap-1.5 text-xs sm:text-sm px-2 sm:px-4">
                <Heart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Favorites</span>
                <span className="sm:hidden">Fav</span>
              </TabsTrigger>
            </TabsList>

            {activeTab === 'custom' && (
              <Button
                onClick={() => setIsCreating(true)}
                size="sm"
                className="w-full sm:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Prompt
              </Button>
            )}

            {activeTab === 'brand' && !showBrandRequest && (
              <Button
                onClick={() => setShowBrandRequest(true)}
                size="sm"
                className="w-full sm:w-auto"
              >
                <Send className="h-4 w-4 mr-2" />
                Request Premium Prompts
              </Button>
            )}
          </div>

          {/* Create/Edit Form */}
          {(isCreating || editingPrompt) && (
            <PromptForm
              prompt={editingPrompt}
              onSubmit={(data) => {
                if (editingPrompt) {
                  handleUpdatePrompt(editingPrompt.id, data)
                } else {
                  handleCreatePrompt(data)
                }
              }}
              onCancel={() => {
                setIsCreating(false)
                setEditingPrompt(null)
              }}
            />
          )}

          {/* Brand Request Form */}
          {showBrandRequest && activeTab === 'brand' && (
            <BrandRequestForm
              onSubmit={async () => {
                setShowBrandRequest(false)
              }}
              onCancel={() => setShowBrandRequest(false)}
            />
          )}

          {isLoading ? (
            <div className="flex justify-center py-16">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-duma-primary/20 border-t-duma-primary" />
            </div>
          ) : (
            <>
              <TabsContent value="preset" className="mt-0">
                {renderPrompts(presetPrompts, 'preset')}
              </TabsContent>

              <TabsContent value="custom" className="mt-0">
                {renderPrompts(customPrompts, 'custom')}
              </TabsContent>

              <TabsContent value="brand" className="mt-0">
                {renderPrompts(brandPrompts, 'brand')}
              </TabsContent>

              <TabsContent value="public" className="mt-0">
                {renderPrompts(publicPrompts, 'public')}
              </TabsContent>

              <TabsContent value="favorites" className="mt-0">
                {renderPrompts(favoritedPrompts, 'favorites')}
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </AppLayout>
  )
}
