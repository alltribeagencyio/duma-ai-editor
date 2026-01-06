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
    background: 'from-gray-100 to-gray-200',
    enhancement: 'from-blue-50 to-blue-100',
    focus: 'from-amber-50 to-orange-100',
    other: 'from-green-50 to-green-100',
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Prompt Library</h2>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('presets')}
          className={cn(
            'px-4 py-2 font-medium transition-colors',
            activeTab === 'presets'
              ? 'text-gray-900 border-b-2 border-gray-900'
              : 'text-gray-600 hover:text-gray-900'
          )}
        >
          Pro Presets
        </button>
        <button
          onClick={() => setActiveTab('library')}
          className={cn(
            'px-4 py-2 font-medium transition-colors',
            activeTab === 'library'
              ? 'text-gray-900 border-b-2 border-gray-900'
              : 'text-gray-600 hover:text-gray-900'
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {prompts.map((preset) => (
                  <div
                    key={preset.id}
                    className={cn(
                      'bg-gradient-to-br p-6 rounded-lg border border-gray-200 hover:border-gray-300 transition-all group cursor-pointer',
                      categoryGradients[preset.category] || 'from-gray-100 to-gray-200'
                    )}
                    onClick={() => onUsePrompt(preset.prompt)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <Sparkles className="h-5 w-5 text-gray-600" />
                    </div>
                    <h4 className="text-base font-semibold text-gray-900 mb-2">{preset.name}</h4>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{preset.description}</p>
                    <button className="w-full px-4 py-2 rounded text-sm font-medium transition-colors bg-gray-900 text-white hover:bg-gray-800">
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
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
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
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                >
                  <p className="text-sm text-gray-900 flex-1 pr-4">{prompt}</p>
                  <button
                    onClick={() => onUsePrompt(prompt)}
                    className="px-3 py-1 text-xs bg-gray-900 text-white rounded hover:bg-gray-800 transition-colors opacity-0 group-hover:opacity-100"
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
