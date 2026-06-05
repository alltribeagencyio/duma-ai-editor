'use client'

import { useState } from 'react'
import { Search, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Prompt {
  id: string
  name: string
  description: string
  prompt: string
  category: string
}

interface PromptLibraryProps {
  myPrompts: string[]
  presetPrompts: Prompt[]
  onUsePrompt: (prompt: string) => void
}

export function PromptLibrary({ myPrompts, presetPrompts, onUsePrompt }: PromptLibraryProps) {
  const [activeTab, setActiveTab] = useState<'presets' | 'library'>('presets')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredPrompts = myPrompts.filter((prompt) =>
    prompt.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Group presets by category
  const categorizedPresets = presetPrompts.reduce((acc, preset) => {
    if (!acc[preset.category]) {
      acc[preset.category] = []
    }
    acc[preset.category].push(preset)
    return acc
  }, {} as Record<string, Prompt[]>)

  const categoryGradients: Record<string, string> = {
    background: 'from-duma-primary/5 to-duma-primary/10',
    enhancement: 'from-duma-secondary/5 to-duma-secondary/10',
    focus: 'from-duma-primary/10 to-duma-secondary/10',
    other: 'from-gray-50 to-gray-100',
  }

  return (
    <div className="glass-card p-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Prompt Library</h2>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/50 mb-6">
        <button
          onClick={() => setActiveTab('presets')}
          className={cn(
            'px-4 py-2 font-medium transition-colors',
            activeTab === 'presets'
              ? 'text-duma-primary border-b-2 border-duma-primary'
              : 'text-gray-600 hover:text-duma-primary'
          )}
        >
          Pro Presets
        </button>
        <button
          onClick={() => setActiveTab('library')}
          className={cn(
            'px-4 py-2 font-medium transition-colors',
            activeTab === 'library'
              ? 'text-duma-primary border-b-2 border-duma-primary'
              : 'text-gray-600 hover:text-duma-primary'
          )}
        >
          My Library ({myPrompts.length})
        </button>
      </div>

      {/* Pro Presets Tab */}
      {activeTab === 'presets' && (
        <div className="space-y-6">
          {Object.entries(categorizedPresets).map(([category, prompts]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-gray-700 uppercase mb-3 tracking-wide">
                {category}
              </h3>
              {/* Mobile: Horizontal scroll, Desktop: Grid */}
              <div className="flex md:grid md:grid-cols-3 gap-3 md:gap-4 overflow-x-auto md:overflow-x-visible pb-2 -mx-8 px-8 md:mx-0 md:px-0 snap-x snap-mandatory md:snap-none scrollbar-hide">
                {prompts.map((preset) => (
                  <div
                    key={preset.id}
                    className={cn(
                      'glass-card glass-interactive bg-gradient-to-br p-6 group cursor-pointer min-w-[280px] md:min-w-0 snap-start flex-shrink-0 active:scale-95 md:active:scale-100',
                      categoryGradients[preset.category] || 'from-gray-50 to-gray-100'
                    )}
                    onClick={() => onUsePrompt(preset.prompt)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <Sparkles className="h-5 w-5 text-duma-primary" />
                    </div>
                    <h4 className="text-base font-semibold text-gray-900 mb-2">{preset.name}</h4>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{preset.description}</p>
                    <button className="w-full px-4 py-2 rounded-xl text-sm font-medium transition-all bg-brand-gradient text-white shadow-glow hover:brightness-105">
                      Use this Prompt
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {presetPrompts.length === 0 && (
            <div className="text-center py-8 text-gray-500">No preset prompts available</div>
          )}
        </div>
      )}

      {/* My Library Tab */}
      {activeTab === 'library' && (
        <div>
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search your prompts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass-input w-full pl-10 pr-4 py-2 focus:outline-none"
            />
          </div>

          {/* Prompts List */}
          {filteredPrompts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchQuery
                ? 'No prompts found'
                : 'No saved prompts yet. Start editing to build your library!'}
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredPrompts.map((prompt, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 glass-subtle rounded-xl hover:bg-white/70 transition-colors group"
                >
                  <p className="text-sm text-gray-900 flex-1 pr-4">{prompt}</p>
                  <button
                    onClick={() => onUsePrompt(prompt)}
                    className="px-3 py-1 text-xs bg-gradient-to-r from-duma-primary to-duma-secondary text-white rounded-lg hover:from-duma-primary-dark hover:to-duma-secondary-dark transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                  >
                    Use
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
