'use client'

import { useState, useEffect } from 'react'
import { Eraser, Square, Circle, Palette, Focus, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useNewEditStore } from '@/lib/stores/newEditStore'
import { PromptPreset } from '@/lib/types'
import { cn } from '@/lib/utils'

const iconMap: Record<string, any> = {
  Eraser,
  Square,
  Circle,
  Palette,
  Focus,
  Home,
}

export function Step2Prompt() {
  const {
    prompt,
    promptType,
    presetId,
    setPrompt,
    setPromptType,
    setPreset,
    nextStep,
    prevStep,
  } = useNewEditStore()

  const [presets, setPresets] = useState<PromptPreset[]>([])
  const [customSavedPrompts, setCustomSavedPrompts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [customPrompt, setCustomPrompt] = useState(promptType === 'custom' ? prompt : '')
  const [showSaved, setShowSaved] = useState(true)

  useEffect(() => {
    // Fetch both presets and custom saved prompts
    Promise.all([
      fetch('/api/prompts/presets').then((res) => res.json()),
      fetch('/api/prompts/custom').then((res) => res.json()),
    ])
      .then(([presetsData, customData]) => {
        setPresets(presetsData.prompts || [])
        setCustomSavedPrompts(customData.prompts || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))

    // Check for reused prompt from localStorage
    const reusedPrompt = localStorage.getItem('reusedPrompt')
    if (reusedPrompt) {
      setPromptType('custom')
      setCustomPrompt(reusedPrompt)
      setPrompt(reusedPrompt)
      localStorage.removeItem('reusedPrompt')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handlePresetClick = (preset: PromptPreset) => {
    setPreset(preset.id, preset.name, preset.prompt)
  }

  const handleSavedPromptClick = (savedPrompt: any) => {
    setPreset(savedPrompt.id, savedPrompt.name, savedPrompt.prompt)
  }

  const handleToggleCustom = () => {
    if (promptType === 'preset') {
      setPromptType('custom')
      setPrompt(customPrompt)
    } else {
      setPromptType('preset')
      setPrompt('')
    }
  }

  const handleCustomPromptChange = (value: string) => {
    setCustomPrompt(value)
    setPrompt(value)
  }

  const canProceed = promptType === 'preset' ? !!presetId : prompt.length > 0

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Choose an editing style
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {promptType === 'preset'
              ? 'Select from popular presets'
              : 'Describe your custom editing needs'}
          </p>
        </div>
        <button
          onClick={handleToggleCustom}
          className="text-sm text-gray-600 hover:text-gray-900 font-medium"
        >
          {promptType === 'preset' ? 'Use custom prompt instead' : 'Use preset instead'}
        </button>
      </div>

      {/* Saved prompts (Preset + Custom) */}
      {promptType === 'preset' && (
        <>
          {/* Tabs for Preset vs Custom Saved */}
          <div className="flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setShowSaved(true)}
              className={cn(
                'px-4 py-2 font-medium transition-colors',
                showSaved
                  ? 'text-gray-900 border-b-2 border-gray-900'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              Presets ({presets.length})
            </button>
            <button
              onClick={() => setShowSaved(false)}
              className={cn(
                'px-4 py-2 font-medium transition-colors',
                !showSaved
                  ? 'text-gray-900 border-b-2 border-gray-900'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              My Prompts ({customSavedPrompts.length})
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {loading ? (
              // Loading skeleton
              Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="border border-gray-200 rounded-lg p-4 space-y-2 animate-pulse"
                >
                  <div className="h-6 w-6 bg-gray-200 rounded" />
                  <div className="h-5 w-3/4 bg-gray-200 rounded" />
                  <div className="h-4 w-full bg-gray-200 rounded" />
                </div>
              ))
            ) : showSaved ? (
              presets.map((preset) => {
                const Icon = iconMap[preset.icon] || Square
                const isSelected = presetId === preset.id

                return (
                  <button
                    key={preset.id}
                    onClick={() => handlePresetClick(preset)}
                    className={cn(
                      'border rounded-lg p-4 text-left transition-all duration-200 flex flex-col gap-2',
                      isSelected
                        ? 'border-gray-900 border-2 bg-gray-50'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                    )}
                  >
                    <Icon className="h-6 w-6 text-gray-900" />
                    <h3 className="font-medium text-gray-900">{preset.name}</h3>
                    <p className="text-sm text-gray-600">{preset.description}</p>
                  </button>
                )
              })
            ) : (
              customSavedPrompts.length === 0 ? (
                <div className="col-span-full text-center py-12 bg-white rounded-lg border border-gray-200">
                  <p className="text-gray-600">No custom prompts saved yet.</p>
                  <button
                    onClick={() => window.location.href = '/prompts'}
                    className="text-sm text-gray-900 hover:underline mt-2"
                  >
                    Create your first prompt
                  </button>
                </div>
              ) : (
                customSavedPrompts.map((savedPrompt) => {
                  const isSelected = presetId === savedPrompt.id

                  return (
                    <button
                      key={savedPrompt.id}
                      onClick={() => handleSavedPromptClick(savedPrompt)}
                      className={cn(
                        'border rounded-lg p-4 text-left transition-all duration-200 flex flex-col gap-2',
                        isSelected
                          ? 'border-gray-900 border-2 bg-gray-50'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Circle className="h-5 w-5 text-gray-900" />
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                          {savedPrompt.category}
                        </span>
                      </div>
                      <h3 className="font-medium text-gray-900">{savedPrompt.name}</h3>
                      <p className="text-sm text-gray-600">{savedPrompt.description}</p>
                    </button>
                  )
                })
              )
            )}
          </div>
        </>
      )}

      {/* Custom prompt textarea */}
      {promptType === 'custom' && (
        <div className="space-y-2">
          <Textarea
            placeholder="Describe how you want your images edited..."
            value={customPrompt}
            onChange={(e) => handleCustomPromptChange(e.target.value)}
            className="min-h-[120px]"
            maxLength={500}
          />
          <div className="flex justify-end">
            <span
              className={cn(
                'text-sm',
                customPrompt.length > 500 ? 'text-red-600' : 'text-gray-500'
              )}
            >
              {customPrompt.length} / 500
            </span>
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex items-center justify-between pt-4">
        <Button variant="ghost" onClick={prevStep}>
          Back
        </Button>
        <Button onClick={nextStep} disabled={!canProceed} size="lg">
          Next
        </Button>
      </div>
    </div>
  )
}
