'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { useNewEditStore } from '@/lib/stores/newEditStore'
import { createClient } from '@/lib/supabase/client'

export function Step3Review() {
  const router = useRouter()
  const {
    images,
    prompt,
    promptType,
    presetId,
    presetName,
    phone,
    notifyByEmail,
    productName,
    productCategory,
    productSku,
    setPhone,
    setNotifyByEmail,
    setStep,
    reset,
  } = useNewEditStore()

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [userEmail, setUserEmail] = useState('')

  // Get user email
  useState(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) {
        setUserEmail(data.user.email)
      }
    })
  })

  const handleSubmit = async () => {
    setError('')
    setSubmitting(true)

    try {
      const formData = new FormData()
      formData.append('prompt', prompt)
      formData.append('promptType', promptType)
      if (presetId) formData.append('presetId', presetId)
      if (phone) formData.append('phone', phone)
      formData.append('notifyByEmail', String(notifyByEmail))
      if (productName) formData.append('productName', productName)
      if (productCategory) formData.append('productCategory', productCategory)
      if (productSku) formData.append('productSku', productSku)

      images.forEach((image) => {
        formData.append('images', image)
      })

      const response = await fetch('/api/jobs', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to create job')
      }

      const { job } = await response.json()

      // Reset form and redirect to dashboard
      reset()
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Failed to submit job')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
          {error}
        </div>
      )}

      {/* Review Images */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Your Images</h2>
          <Button variant="ghost" onClick={() => setStep(1)}>
            Edit
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div
              key={index}
              className="relative aspect-square rounded-lg border border-gray-200 overflow-hidden"
            >
              <Image
                src={URL.createObjectURL(image)}
                alt={`Preview ${index + 1}`}
                fill
                className="object-cover"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Review Prompt */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Editing Instructions
          </h2>
          <Button variant="ghost" onClick={() => setStep(2)}>
            Edit
          </Button>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-gray-700">
            {promptType === 'preset' && presetName && (
              <span className="font-medium">{presetName}: </span>
            )}
            {prompt}
          </p>
        </div>
      </div>

      {/* Notification Options */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Get Notified</h2>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="notify-email"
              checked={notifyByEmail}
              onCheckedChange={(checked) => setNotifyByEmail(checked as boolean)}
            />
            <label
              htmlFor="notify-email"
              className="text-sm text-gray-700 cursor-pointer"
            >
              Email me when editing is complete ({userEmail})
            </label>
          </div>

          <div className="space-y-2">
            <label htmlFor="phone" className="text-sm font-medium text-gray-700">
              Phone (optional for SMS)
            </label>
            <Input
              id="phone"
              type="tel"
              placeholder="+1234567890"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <p className="text-xs text-gray-500">Format: +1234567890</p>
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="space-y-4 pt-4">
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full h-12 text-base"
          size="lg"
        >
          {submitting ? 'Submitting...' : 'Submit for Editing'}
        </Button>
        <div className="flex justify-center">
          <Button variant="ghost" onClick={() => setStep(2)}>
            Back
          </Button>
        </div>
      </div>
    </div>
  )
}
