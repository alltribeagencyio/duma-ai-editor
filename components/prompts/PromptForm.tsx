import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Save, X } from 'lucide-react'

interface Prompt {
  id: string
  name: string
  description: string
  prompt: string
  category: string
  isPublic?: boolean
}

interface PromptFormProps {
  prompt?: Prompt | null
  onSubmit: (data: any) => void
  onCancel: () => void
}

export function PromptForm({ prompt, onSubmit, onCancel }: PromptFormProps) {
  const [formData, setFormData] = useState({
    name: prompt?.name || '',
    description: prompt?.description || '',
    prompt: prompt?.prompt || '',
    category: prompt?.category || 'other',
    isPublic: prompt?.isPublic || false,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.name && formData.prompt) {
      onSubmit(formData)
    }
  }

  return (
    <div className="glass-card glass-highlight p-4 sm:p-6 mb-6 animate-fade-in-up">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
        {prompt ? 'Edit Prompt' : 'Create New Prompt'}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
            Name *
          </label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="My Custom Prompt"
            required
            className="text-sm"
          />
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
            Description
          </label>
          <Input
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Brief description of what this prompt does"
            className="text-sm"
          />
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
            Category
          </label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData({ ...formData, category: value })}
          >
            <SelectTrigger className="text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="background">Background</SelectItem>
              <SelectItem value="enhancement">Enhancement</SelectItem>
              <SelectItem value="focus">Focus</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
            Prompt Instructions *
          </label>
          <Textarea
            value={formData.prompt}
            onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
            rows={4}
            placeholder="Enter your prompt instructions..."
            required
            className="text-sm"
          />
        </div>

        <div className="flex items-start space-x-2 pt-2">
          <Checkbox
            id="isPublic"
            checked={formData.isPublic}
            onCheckedChange={(checked) => setFormData({ ...formData, isPublic: !!checked })}
          />
          <div className="grid gap-1.5 leading-none">
            <label
              htmlFor="isPublic"
              className="text-xs sm:text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Make this prompt public
            </label>
            <p className="text-xs text-gray-500">
              Share this prompt with the community in Duma Prompt Library
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
          <Button
            type="button"
            onClick={onCancel}
            variant="outline"
            className="w-full sm:w-auto text-sm"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!formData.name || !formData.prompt}
            className="w-full sm:w-auto text-sm"
          >
            <Save className="h-4 w-4 mr-2" />
            {prompt ? 'Save Changes' : 'Create Prompt'}
          </Button>
        </div>
      </form>
    </div>
  )
}
