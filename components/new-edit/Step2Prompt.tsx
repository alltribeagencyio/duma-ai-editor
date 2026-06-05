'use client'

import { useState, useEffect, useMemo } from 'react'
import { Eraser, Square, Circle, Palette, Focus, Home, Sparkles, ImageIcon, Wand2 } from 'lucide-react'
import Image from 'next/image'
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
    images,
    imageUrls,
    prompt,
    description,
    promptType,
    presetId,
    setPrompt,
    setDescription,
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

  // Build preview URLs for the images chosen in step 1 so the user can see
  // what they're editing without going back.
  const previews = useMemo(
    () => [
      ...images.map((file) => ({ key: `f-${file.name}-${file.size}`, src: URL.createObjectURL(file) })),
      ...imageUrls.map((url, i) => ({ key: `u-${i}`, src: url })),
    ],
    [images, imageUrls]
  )

  useEffect(() => {
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

  const handleToggleCustom = (type: 'preset' | 'custom') => {
    if (type === promptType) return
    if (type === 'custom') {
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

  const canProceed = promptType === 'preset' ? !!presetId : prompt.trim().length > 0

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Editing-context preview: shows the step-1 uploads inline */}
      {previews.length > 0 && (
        <div className="glass-card p-3 md:p-4">
          <div className="flex items-center gap-2 mb-2.5">
            <ImageIcon className="h-4 w-4 text-duma-primary" />
            <span className="text-sm font-medium text-gray-900">
              Editing {previews.length} image{previews.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={prevStep}
              className="ml-auto text-xs font-medium text-duma-primary hover:underline"
            >
              Change
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {previews.map((p) => (
              <div
                key={p.key}
                className="relative h-16 w-16 md:h-20 md:w-20 flex-shrink-0 rounded-xl glass-subtle overflow-hidden"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.src} alt="Upload preview" className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Style selector: segmented preset / custom toggle */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg md:text-xl font-semibold text-gray-900">
              Choose an editing style
            </h2>
            <p className="text-xs md:text-sm text-gray-600 mt-0.5">
              {promptType === 'preset'
                ? 'Pick a ready-made style or one of your saved prompts'
                : 'Write exactly how you want your images edited'}
            </p>
          </div>
          {/* Segmented control */}
          <div className="inline-flex p-1 rounded-xl glass-subtle self-start">
            <button
              onClick={() => handleToggleCustom('preset')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                promptType === 'preset'
                  ? 'bg-brand-gradient text-white shadow-glow'
                  : 'text-gray-600 hover:text-duma-primary'
              )}
            >
              <Sparkles className="h-4 w-4" />
              Presets
            </button>
            <button
              onClick={() => handleToggleCustom('custom')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                promptType === 'custom'
                  ? 'bg-brand-gradient text-white shadow-glow'
                  : 'text-gray-600 hover:text-duma-primary'
              )}
            >
              <Wand2 className="h-4 w-4" />
              Custom
            </button>
          </div>
        </div>

        {/* Presets / saved prompts */}
        {promptType === 'preset' && (
          <>
            <div className="flex gap-2 border-b border-white/50">
              <button
                onClick={() => setShowSaved(true)}
                className={cn(
                  'px-4 py-2 text-sm font-medium transition-colors',
                  showSaved
                    ? 'text-duma-primary border-b-2 border-duma-primary'
                    : 'text-gray-600 hover:text-duma-primary'
                )}
              >
                Presets ({presets.length})
              </button>
              <button
                onClick={() => setShowSaved(false)}
                className={cn(
                  'px-4 py-2 text-sm font-medium transition-colors',
                  !showSaved
                    ? 'text-duma-primary border-b-2 border-duma-primary'
                    : 'text-gray-600 hover:text-duma-primary'
                )}
              >
                My Prompts ({customSavedPrompts.length})
              </button>
            </div>

            <div>
              {loading ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="glass-card p-4 space-y-2 animate-pulse">
                      <div className="h-6 w-6 bg-white/60 rounded" />
                      <div className="h-5 w-3/4 bg-white/60 rounded" />
                      <div className="h-4 w-full bg-white/60 rounded" />
                    </div>
                  ))}
                </div>
              ) : showSaved ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  {presets.map((preset) => {
                    const Icon = iconMap[preset.icon] || Square
                    const isSelected = presetId === preset.id
                    return (
                      <button
                        key={preset.id}
                        onClick={() => handlePresetClick(preset)}
                        aria-pressed={isSelected}
                        className={cn(
                          'glass-card glass-interactive p-4 text-left transition-all duration-200 flex flex-col gap-2 active:scale-[0.98]',
                          isSelected ? 'ring-2 ring-duma-primary bg-duma-primary/10 shadow-glow' : ''
                        )}
                      >
                        <Icon className="h-6 w-6 text-duma-primary" />
                        <h3 className="font-medium text-gray-900 leading-tight">{preset.name}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2">{preset.description}</p>
                      </button>
                    )
                  })}
                </div>
              ) : customSavedPrompts.length === 0 ? (
                <div className="text-center py-12 glass-card">
                  <p className="text-gray-600">No custom prompts saved yet.</p>
                  <button
                    onClick={() => (window.location.href = '/prompts')}
                    className="text-sm text-duma-primary font-medium hover:underline mt-2"
                  >
                    Create your first prompt
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  {customSavedPrompts.map((savedPrompt) => {
                    const isSelected = presetId === savedPrompt.id
                    return (
                      <button
                        key={savedPrompt.id}
                        onClick={() => handleSavedPromptClick(savedPrompt)}
                        aria-pressed={isSelected}
                        className={cn(
                          'glass-card glass-interactive p-4 text-left transition-all duration-200 flex flex-col gap-2 active:scale-[0.98]',
                          isSelected ? 'ring-2 ring-duma-primary bg-duma-primary/10 shadow-glow' : ''
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Circle className="h-5 w-5 text-duma-primary" />
                          <span className="text-xs px-2 py-0.5 bg-duma-secondary/10 text-duma-secondary rounded-full">
                            {savedPrompt.category}
                          </span>
                        </div>
                        <h3 className="font-medium text-gray-900 leading-tight">{savedPrompt.name}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2">{savedPrompt.description}</p>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* Custom prompt */}
        {promptType === 'custom' && (
          <div className="space-y-1.5">
            <label htmlFor="custom-prompt" className="block text-sm font-medium text-gray-900">
              Editing instructions
            </label>
            <Textarea
              id="custom-prompt"
              placeholder="e.g. Remove the background and place the product on a clean white studio backdrop with soft shadows."
              value={customPrompt}
              onChange={(e) => handleCustomPromptChange(e.target.value)}
              className="min-h-[120px]"
              maxLength={1500}
            />
            <div className="flex justify-end">
              <span className={cn('text-xs', customPrompt.length > 1500 ? 'text-red-600' : 'text-gray-500')}>
                {customPrompt.length} / 1500
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Description / context — combined with the prompt by our refinement AI */}
      <div className="glass-card p-4 space-y-1.5">
        <label htmlFor="edit-description" className="flex items-center gap-2 text-sm font-medium text-gray-900">
          <Sparkles className="h-4 w-4 text-duma-primary" />
          Add context
          <span className="text-xs font-normal text-gray-500">(optional)</span>
        </label>
        <p className="text-xs text-gray-600">
          Describe the product or scene — brand, materials, mood, what matters. Our AI blends this
          with your instructions above to produce sharper edits.
        </p>
        <Textarea
          id="edit-description"
          placeholder="e.g. Handmade leather wallet, premium feel, warm natural lighting, e-commerce listing."
          value={description}
          onChange={(e) => setDescription(e.target.value.slice(0, 1500))}
          className="min-h-[88px] mt-1"
          maxLength={1500}
        />
        <div className="flex justify-end">
          <span className="text-xs text-gray-500">{description.length} / 1500</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <Button variant="ghost" onClick={prevStep} className="w-auto">
          Back
        </Button>
        <Button onClick={nextStep} disabled={!canProceed} variant="default" size="lg" className="w-full sm:w-auto">
          Next
        </Button>
      </div>
    </div>
  )
}
