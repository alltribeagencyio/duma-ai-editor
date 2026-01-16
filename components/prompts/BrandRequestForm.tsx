import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Send, X, Star, AlertCircle } from 'lucide-react'

interface BrandRequestFormProps {
  onSubmit: () => void
  onCancel: () => void
}

export function BrandRequestForm({ onSubmit, onCancel }: BrandRequestFormProps) {
  const [formData, setFormData] = useState({
    brandName: '',
    numberOfPrompts: '',
    requirements: '',
    complexity: 'moderate',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.brandName || !formData.numberOfPrompts || !formData.requirements) {
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/prompts/brand-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setSubmitSuccess(true)
        setTimeout(() => {
          onSubmit()
        }, 2000)
      }
    } catch (error) {
      console.error('Error submitting request:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitSuccess) {
    return (
      <div className="bg-white rounded-lg border border-green-200 p-6 mb-6 shadow-sm">
        <div className="text-center">
          <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <Star className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Request Submitted!</h3>
          <p className="text-sm text-gray-600 mb-4">
            We&apos;ve received your premium prompt request. Our team will review it and get back to you with a custom quote and timeline.
          </p>
          <p className="text-xs text-gray-500">
            You&apos;ll receive an email confirmation shortly.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 mb-6 shadow-sm">
      <div className="mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
          Request Premium Brand Prompts
        </h3>
        <p className="text-xs sm:text-sm text-gray-600">
          Get custom-tailored prompts designed specifically for your brand and industry. Pricing varies based on complexity and number of prompts requested.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-6">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs sm:text-sm text-blue-800">
            <p className="font-medium mb-1">How it works:</p>
            <ol className="list-decimal list-inside space-y-1 text-blue-700">
              <li>Submit your requirements below</li>
              <li>Our team reviews and provides a custom quote</li>
              <li>Upon approval, we create your brand prompts</li>
              <li>Prompts appear in your Premium tab once completed</li>
            </ol>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
            Brand Name *
          </label>
          <Input
            value={formData.brandName}
            onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
            placeholder="Your brand or company name"
            required
            className="text-sm"
          />
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
            Number of Prompts Needed *
          </label>
          <Input
            type="number"
            min="1"
            value={formData.numberOfPrompts}
            onChange={(e) => setFormData({ ...formData, numberOfPrompts: e.target.value })}
            placeholder="e.g., 5"
            required
            className="text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">
            Typical range: 3-10 prompts per request
          </p>
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
            Complexity Level
          </label>
          <Select
            value={formData.complexity}
            onValueChange={(value) => setFormData({ ...formData, complexity: value })}
          >
            <SelectTrigger className="text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="simple">
                <div className="py-1">
                  <div className="font-medium">Simple</div>
                  <div className="text-xs text-gray-500">Basic product enhancement prompts</div>
                </div>
              </SelectItem>
              <SelectItem value="moderate">
                <div className="py-1">
                  <div className="font-medium">Moderate</div>
                  <div className="text-xs text-gray-500">Industry-specific with brand guidelines</div>
                </div>
              </SelectItem>
              <SelectItem value="complex">
                <div className="py-1">
                  <div className="font-medium">Complex</div>
                  <div className="text-xs text-gray-500">Advanced multi-scenario prompts with detailed specifications</div>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
            Requirements & Details *
          </label>
          <Textarea
            value={formData.requirements}
            onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
            rows={5}
            placeholder="Describe your brand, target audience, desired outcomes, and any specific requirements for the prompts..."
            required
            className="text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">
            Be as detailed as possible to help us understand your needs
          </p>
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
          <Button
            type="button"
            onClick={onCancel}
            variant="outline"
            className="w-full sm:w-auto text-sm"
            disabled={isSubmitting}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !formData.brandName || !formData.numberOfPrompts || !formData.requirements}
            className="w-full sm:w-auto text-sm"
          >
            <Send className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </Button>
        </div>
      </form>
    </div>
  )
}
