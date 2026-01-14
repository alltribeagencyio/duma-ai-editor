'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2 } from 'lucide-react'
import { useNewEditStore } from '@/lib/stores/newEditStore'
import { createClient } from '@/lib/supabase/client'

export function Step3Review() {
  const router = useRouter()
  const {
    images,
    imageUrls,
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
  const [uploadProgress, setUploadProgress] = useState(0)

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
    setUploadProgress(0)

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

      // Add image URLs as JSON array
      if (imageUrls.length > 0) {
        formData.append('imageUrls', JSON.stringify(imageUrls))
      }

      // Use XMLHttpRequest to track upload progress
      const xhr = new XMLHttpRequest()

      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100)
          setUploadProgress(percentComplete)
        }
      })

      // Handle completion
      const uploadPromise = new Promise((resolve, reject) => {
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText)
              resolve(response)
            } catch (e) {
              reject(new Error('Failed to parse response'))
            }
          } else {
            reject(new Error('Failed to create job'))
          }
        })

        xhr.addEventListener('error', () => {
          reject(new Error('Network error'))
        })

        xhr.addEventListener('abort', () => {
          reject(new Error('Upload cancelled'))
        })
      })

      xhr.open('POST', '/api/jobs')
      xhr.send(formData)

      const { job } = await uploadPromise as any

      // Reset form and redirect to job details page
      reset()
      router.push(`/jobs/${job.id}`)
    } catch (err: any) {
      setError(err.message || 'Failed to submit job')
      setUploadProgress(0)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
      {error && (
        <div className="p-3 text-xs md:text-sm text-red-600 bg-red-50 rounded-lg">
          {error}
        </div>
      )}

      {/* Review Images */}
      <div className="space-y-3 md:space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900">Your Images</h2>
          <Button variant="ghost" onClick={() => setStep(1)} size="sm">
            Edit
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
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
      <div className="space-y-3 md:space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900">
            Editing Instructions
          </h2>
          <Button variant="ghost" onClick={() => setStep(2)} size="sm">
            Edit
          </Button>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 md:p-4">
          <p className="text-sm md:text-base text-gray-700">
            {promptType === 'preset' && presetName && (
              <span className="font-medium">{presetName}: </span>
            )}
            {prompt}
          </p>
        </div>
      </div>

      {/* Submit */}
      <div className="space-y-3 md:space-y-4 pt-4">
        <div className="space-y-3">
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            variant="default"
            className="w-full h-11 md:h-12 text-sm md:text-base"
            size="lg"
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 md:h-5 md:w-5 animate-spin" />}
            {submitting ? 'Uploading images...' : 'Submit for Editing'}
          </Button>

          {/* Minimal Progress Bar */}
          {submitting && uploadProgress > 0 && (
            <div className="space-y-1.5">
              <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-600 transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-center text-gray-600">
                {uploadProgress}% uploaded
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-center">
          <Button variant="ghost" onClick={() => setStep(2)} disabled={submitting}>
            Back
          </Button>
        </div>
      </div>
    </div>
  )
}
