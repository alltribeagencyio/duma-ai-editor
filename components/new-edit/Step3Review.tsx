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
import { uploadImagesToR2 } from '@/lib/upload-client'

export function Step3Review() {
  const router = useRouter()
  const {
    images,
    imageUrls,
    referenceImage,
    prompt,
    description,
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
      // 1. Upload selected files directly to R2 (browser -> R2), tracking progress.
      const uploadedUrls = await uploadImagesToR2(images, setUploadProgress)

      // 2. Combine freshly uploaded URLs with any user-provided external URLs.
      const allImageUrls = [...uploadedUrls, ...imageUrls]

      if (allImageUrls.length === 0) {
        throw new Error('No images to submit')
      }

      // 2b. Upload the optional design-inspiration reference image (separately,
      // so it isn't treated as one of the images being edited).
      let referenceImageUrl: string | undefined
      if (referenceImage) {
        const [refUrl] = await uploadImagesToR2([referenceImage])
        referenceImageUrl = refUrl
      }

      // 3. Create the job with the image URLs (no file bytes through the API).
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          description: description || undefined,
          referenceImageUrl,
          promptType,
          presetId: presetId || undefined,
          phone: phone || undefined,
          notifyByEmail,
          productName: productName || undefined,
          productCategory: productCategory || undefined,
          productSku: productSku || undefined,
          imageUrls: allImageUrls,
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to create job')
      }

      // Reset form and redirect to job details page
      reset()
      router.push(`/jobs/${data.job.id}`)
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
              className="relative aspect-square rounded-xl glass-subtle overflow-hidden"
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
        <div className="glass-subtle rounded-xl p-3 md:p-4">
          <p className="text-sm md:text-base text-gray-700">
            {promptType === 'preset' && presetName && (
              <span className="font-medium">{presetName}: </span>
            )}
            {prompt}
          </p>
        </div>
      </div>

      {/* Review Design inspiration (optional) */}
      {referenceImage && (
        <div className="space-y-3 md:space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900">Design Inspiration</h2>
            <Button variant="ghost" onClick={() => setStep(1)} size="sm">
              Edit
            </Button>
          </div>
          <div className="flex items-center gap-3 glass-subtle rounded-xl p-3">
            <div className="relative h-16 w-16 flex-shrink-0 rounded-lg overflow-hidden">
              <Image
                src={URL.createObjectURL(referenceImage)}
                alt="Reference"
                fill
                className="object-cover"
              />
            </div>
            <p className="text-sm text-gray-700 truncate">{referenceImage.name}</p>
          </div>
        </div>
      )}

      {/* Review Description / context (optional) */}
      {description && (
        <div className="space-y-3 md:space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900">Added Context</h2>
            <Button variant="ghost" onClick={() => setStep(2)} size="sm">
              Edit
            </Button>
          </div>
          <div className="glass-subtle rounded-xl p-3 md:p-4">
            <p className="text-sm md:text-base text-gray-700 whitespace-pre-wrap">{description}</p>
          </div>
        </div>
      )}

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
              <div className="w-full h-1.5 bg-white/50 rounded-full overflow-hidden border border-white/60">
                <div
                  className="h-full bg-brand-gradient shadow-glow transition-all duration-300 ease-out"
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
