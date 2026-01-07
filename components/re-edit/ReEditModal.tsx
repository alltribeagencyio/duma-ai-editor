'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Sparkles, Palette, Edit3, Zap } from 'lucide-react'

interface ReEditModalProps {
  isOpen: boolean
  onClose: () => void
  imageUrl: string
  jobId: string
  onSuccess: () => void
}

interface PromptOption {
  id: string
  name: string
  description: string
  prompt: string
  category: string
  type: 'preset' | 'brand' | 'custom'
  icon?: string
}

export function ReEditModal({ isOpen, onClose, imageUrl, jobId, onSuccess }: ReEditModalProps) {
  const [selectedPromptType, setSelectedPromptType] = useState<'preset' | 'brand' | 'custom'>('preset')
  const [customPrompt, setCustomPrompt] = useState('')
  const [selectedPreset, setSelectedPreset] = useState<string>('')
  const [selectedBrand, setSelectedBrand] = useState<string>('')
  const [presetPrompts, setPresetPrompts] = useState<PromptOption[]>([])
  const [brandPrompts, setBrandPrompts] = useState<PromptOption[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchPrompts()
    }
  }, [isOpen])

  const fetchPrompts = async () => {
    setIsLoading(true)
    try {
      const [presetsRes, brandsRes] = await Promise.all([
        fetch('/api/prompts/presets'),
        fetch('/api/prompts/brand')
      ])

      if (presetsRes.ok) {
        const { prompts } = await presetsRes.json()
        setPresetPrompts(prompts.map((p: any) => ({ ...p, type: 'preset' })))
      }

      if (brandsRes.ok) {
        const { prompts } = await brandsRes.json()
        setBrandPrompts(prompts.map((p: any) => ({ ...p, type: 'brand' })))
      }
    } catch (error) {
      console.error('Error fetching prompts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getPromptTypeIcon = (type: string) => {
    switch (type) {
      case 'preset': return <Sparkles className="h-4 w-4" />
      case 'brand': return <Palette className="h-4 w-4" />
      case 'custom': return <Edit3 className="h-4 w-4" />
      default: return <Zap className="h-4 w-4" />
    }
  }

  const getSelectedPrompt = () => {
    switch (selectedPromptType) {
      case 'preset':
        return presetPrompts.find(p => p.id === selectedPreset)?.prompt || ''
      case 'brand':
        return brandPrompts.find(p => p.id === selectedBrand)?.prompt || ''
      case 'custom':
        return customPrompt
      default:
        return ''
    }
  }

  const handleSubmit = async () => {
    if (!getSelectedPrompt().trim()) {
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        prompt: getSelectedPrompt(),
        promptType: selectedPromptType,
        presetId: selectedPromptType === 'preset' ? selectedPreset : null,
        brandPromptId: selectedPromptType === 'brand' ? selectedBrand : null,
        selectedImageUrl: imageUrl
      }

      const response = await fetch(`/api/jobs/${jobId}/re-edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        onSuccess()
        onClose()
        // Reset form
        setCustomPrompt('')
        setSelectedPreset('')
        setSelectedBrand('')
        setSelectedPromptType('preset')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to start re-edit')
      }
    } catch (error) {
      console.error('Error submitting re-edit:', error)
      alert('Failed to start re-edit')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5" />
            Re-edit Image
          </DialogTitle>
          <DialogDescription>
            Select a prompt type and customize your re-editing instructions
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Image Preview */}
          <div className="space-y-4">
            <h3 className="font-medium">Selected Image</h3>
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={imageUrl}
                alt="Selected for re-edit"
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-sm text-gray-600">
              This image will be re-edited with your selected prompt. You'll be charged 1 credit for this re-edit.
            </p>
          </div>

          {/* Prompt Selection */}
          <div className="space-y-6">
            {/* Prompt Type Selection */}
            <div className="space-y-3">
              <h3 className="font-medium">Choose Prompt Type</h3>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setSelectedPromptType('preset')}
                  className={`p-3 rounded-lg border text-center transition-colors ${
                    selectedPromptType === 'preset'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Sparkles className="h-5 w-5 mx-auto mb-1" />
                  <div className="text-sm font-medium">Preset</div>
                  <div className="text-xs text-gray-500">App defaults</div>
                </button>

                <button
                  onClick={() => setSelectedPromptType('brand')}
                  className={`p-3 rounded-lg border text-center transition-colors ${
                    selectedPromptType === 'brand'
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  disabled={brandPrompts.length === 0}
                >
                  <Palette className="h-5 w-5 mx-auto mb-1" />
                  <div className="text-sm font-medium">Brand</div>
                  <div className="text-xs text-gray-500">Your brand</div>
                </button>

                <button
                  onClick={() => setSelectedPromptType('custom')}
                  className={`p-3 rounded-lg border text-center transition-colors ${
                    selectedPromptType === 'custom'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Edit3 className="h-5 w-5 mx-auto mb-1" />
                  <div className="text-sm font-medium">Custom</div>
                  <div className="text-xs text-gray-500">Write your own</div>
                </button>
              </div>
            </div>

            <Separator />

            {/* Prompt Content */}
            {selectedPromptType === 'preset' && (
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  {getPromptTypeIcon('preset')}
                  App Preset Prompts
                </h4>

                {isLoading ? (
                  <div className="text-center py-8">Loading prompts...</div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {presetPrompts.map((prompt) => (
                      <div
                        key={prompt.id}
                        onClick={() => setSelectedPreset(prompt.id)}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedPreset === prompt.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="font-medium text-sm">{prompt.name}</div>
                          <Badge variant="outline" className="text-xs">
                            {prompt.category}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600">{prompt.description}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedPromptType === 'brand' && (
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  {getPromptTypeIcon('brand')}
                  Your Brand Prompts
                </h4>

                {brandPrompts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Palette className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>No brand prompts found</p>
                    <p className="text-sm">Set up brand prompts in your profile</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {brandPrompts.map((prompt) => (
                      <div
                        key={prompt.id}
                        onClick={() => setSelectedBrand(prompt.id)}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedBrand === prompt.id
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="font-medium text-sm">{prompt.name}</div>
                          <Badge variant="outline" className="text-xs">
                            {prompt.category}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600">{prompt.description}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedPromptType === 'custom' && (
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  {getPromptTypeIcon('custom')}
                  Custom Prompt
                </h4>
                <Textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Describe how you'd like to edit this image..."
                  rows={4}
                  className="resize-none"
                />
              </div>
            )}

            {/* Selected Prompt Preview */}
            {getSelectedPrompt() && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Prompt Preview</h4>
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <p className="text-sm text-gray-700">{getSelectedPrompt()}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!getSelectedPrompt().trim() || isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Processing...' : 'Start Re-edit (1 credit)'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}