import { Heart, Edit2, Trash2, Globe2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Prompt {
  id: string
  name: string
  description: string
  prompt: string
  category: string
  isPreset?: boolean
  isFavorited?: boolean
  isPublic?: boolean
}

interface PromptCardProps {
  prompt: Prompt
  promptType: string
  onToggleFavorite: (promptId: string, promptType: string, isFavorited: boolean) => void
  onEdit?: () => void
  onDelete?: () => void
}

export function PromptCard({ prompt, promptType, onToggleFavorite, onEdit, onDelete }: PromptCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all p-4 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0 pr-2">
          <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{prompt.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-block text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
              {prompt.category}
            </span>
            {prompt.isPublic && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded">
                <Globe2 className="h-3 w-3" />
                Public
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => onToggleFavorite(prompt.id, promptType, !!prompt.isFavorited)}
          className="flex-shrink-0 p-1.5 hover:bg-gray-100 rounded transition-colors"
          title={prompt.isFavorited ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart
            className={`h-4 w-4 ${
              prompt.isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-400'
            }`}
          />
        </button>
      </div>

      {/* Description */}
      {prompt.description && (
        <p className="text-xs sm:text-sm text-gray-600 mb-3 line-clamp-2">{prompt.description}</p>
      )}

      {/* Prompt Text */}
      <div className="flex-1 mb-3">
        <p className="text-xs sm:text-sm text-gray-700 bg-gray-50 p-3 rounded border border-gray-100 line-clamp-4">
          {prompt.prompt}
        </p>
      </div>

      {/* Actions */}
      {(onEdit || onDelete) && (
        <div className="flex gap-2 pt-3 border-t border-gray-100">
          {onEdit && (
            <Button
              onClick={onEdit}
              variant="outline"
              size="sm"
              className="flex-1 text-xs sm:text-sm"
            >
              <Edit2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Edit
            </Button>
          )}
          {onDelete && (
            <Button
              onClick={onDelete}
              variant="outline"
              size="sm"
              className="flex-1 text-xs sm:text-sm text-red-600 hover:bg-red-50 hover:border-red-200"
            >
              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Delete
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
