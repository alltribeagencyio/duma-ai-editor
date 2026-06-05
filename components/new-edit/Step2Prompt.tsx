'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Eraser,
  Square,
  Circle,
  Palette,
  Focus,
  Home,
  Sparkles,
  ImageIcon,
  Wand2,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
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

const PAGE_SIZE = 6

type SortKey = 'recommended' | 'name-asc' | 'name-desc' | 'category'

interface PromptItem {
  id: string
  name: string
  description?: string
  prompt: string
  category?: string
  icon?: string
}

export function Step2Prompt() {
  const {
    images,
    imageUrls,
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
  const [customSavedPrompts, setCustomSavedPrompts] = useState<PromptItem[]>([])
  const [loading, setLoading] = useState(true)
  const [customPrompt, setCustomPrompt] = useState(promptType === 'custom' ? prompt : '')
  const [showSaved, setShowSaved] = useState(true)

  // List controls
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sortBy, setSortBy] = useState<SortKey>('recommended')
  const [page, setPage] = useState(1)

  // Preview thumbnails of the step-1 uploads.
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

  const handleSwitchTab = (saved: boolean) => {
    setShowSaved(saved)
    setCategoryFilter('all')
    setSearch('')
    setPage(1)
  }

  const handleToggleMode = (type: 'preset' | 'custom') => {
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

  // The list backing the current tab.
  const activeList: PromptItem[] = showSaved ? (presets as PromptItem[]) : customSavedPrompts

  const categories = useMemo(() => {
    const set = new Set<string>()
    activeList.forEach((p) => p.category && set.add(p.category))
    return Array.from(set).sort()
  }, [activeList])

  // Filter → sort.
  const processed = useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = activeList.filter((p) => {
      const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q)
      return matchesCategory && matchesSearch
    })

    if (sortBy === 'name-asc') list = [...list].sort((a, b) => a.name.localeCompare(b.name))
    else if (sortBy === 'name-desc') list = [...list].sort((a, b) => b.name.localeCompare(a.name))
    else if (sortBy === 'category')
      list = [...list].sort(
        (a, b) => (a.category || '').localeCompare(b.category || '') || a.name.localeCompare(b.name)
      )

    return list
  }, [activeList, search, categoryFilter, sortBy])

  const totalPages = Math.max(1, Math.ceil(processed.length / PAGE_SIZE))
  const pageItems = processed.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // Keep page in range when filters change.
  useEffect(() => {
    setPage(1)
  }, [search, categoryFilter, sortBy, showSaved])

  const canProceed = promptType === 'preset' ? !!presetId : prompt.trim().length > 0

  const renderCard = (item: PromptItem) => {
    const Icon = iconMap[item.icon || ''] || Square
    const isSelected = presetId === item.id
    return (
      <button
        key={item.id}
        onClick={() => setPreset(item.id, item.name, item.prompt)}
        aria-pressed={isSelected}
        className={cn(
          'glass-card glass-interactive p-4 text-left transition-all duration-200 flex flex-col gap-2 active:scale-[0.98]',
          isSelected ? 'ring-2 ring-duma-primary bg-duma-primary/10 shadow-glow' : ''
        )}
      >
        <div className="flex items-center justify-between">
          <Icon className="h-6 w-6 text-duma-primary" />
          {item.category && (
            <span className="text-xs px-2 py-0.5 bg-duma-secondary/10 text-duma-secondary rounded-full capitalize">
              {item.category}
            </span>
          )}
        </div>
        <h3 className="font-medium text-gray-900 leading-tight">{item.name}</h3>
        {item.description && <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>}
      </button>
    )
  }

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

      {/* Header + mode toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg md:text-xl font-semibold text-gray-900">Choose an editing style</h2>
          <p className="text-xs md:text-sm text-gray-600 mt-0.5">
            {promptType === 'preset'
              ? 'Pick a ready-made style or one of your saved prompts'
              : 'Write exactly how you want your images edited'}
          </p>
        </div>
        <div className="inline-flex p-1 rounded-xl glass-subtle self-start">
          <button
            onClick={() => handleToggleMode('preset')}
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
            onClick={() => handleToggleMode('custom')}
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

      {/* Presets / saved prompts with search, filter, sort, pagination */}
      {promptType === 'preset' && (
        <div className="space-y-4">
          {/* Source tabs */}
          <div className="flex gap-2 border-b border-white/50">
            <button
              onClick={() => handleSwitchTab(true)}
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
              onClick={() => handleSwitchTab(false)}
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

          {/* Controls: search / category / sort */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search prompts…"
                aria-label="Search prompts"
                className="glass-input w-full pl-9 pr-3 py-2 text-sm focus:outline-none"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="Filter by category"
              className="glass-input px-3 py-2 text-sm focus:outline-none capitalize sm:w-44"
            >
              <option value="all">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c} className="capitalize">
                  {c}
                </option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              aria-label="Sort prompts"
              className="glass-input px-3 py-2 text-sm focus:outline-none sm:w-44"
            >
              <option value="recommended">Recommended</option>
              <option value="name-asc">Name (A–Z)</option>
              <option value="name-desc">Name (Z–A)</option>
              <option value="category">Category</option>
            </select>
          </div>

          {/* Cards */}
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
          ) : !showSaved && customSavedPrompts.length === 0 ? (
            <div className="text-center py-12 glass-card">
              <p className="text-gray-600">No custom prompts saved yet.</p>
              <button
                onClick={() => (window.location.href = '/prompts')}
                className="text-sm text-duma-primary font-medium hover:underline mt-2"
              >
                Create your first prompt
              </button>
            </div>
          ) : processed.length === 0 ? (
            <div className="text-center py-12 glass-card">
              <p className="text-gray-600">No prompts match your filters.</p>
              <button
                onClick={() => {
                  setSearch('')
                  setCategoryFilter('all')
                }}
                className="text-sm text-duma-primary font-medium hover:underline mt-2"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">{pageItems.map(renderCard)}</div>

              {/* Pagination */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-gray-600">
                  {processed.length} prompt{processed.length !== 1 ? 's' : ''}
                </span>
                {totalPages > 1 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      aria-label="Previous page"
                      className="grid place-items-center h-8 w-8 rounded-lg glass-subtle text-gray-700 hover:text-duma-primary disabled:opacity-40 disabled:pointer-events-none"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-sm text-gray-700 tabular-nums px-1">
                      {page} / {totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                      aria-label="Next page"
                      className="grid place-items-center h-8 w-8 rounded-lg glass-subtle text-gray-700 hover:text-duma-primary disabled:opacity-40 disabled:pointer-events-none"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
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
