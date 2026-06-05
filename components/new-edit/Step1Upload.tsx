'use client'

import { useCallback, useRef, useState, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, AlertCircle, Camera, Link as LinkIcon, Sparkles } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { useNewEditStore } from '@/lib/stores/newEditStore'
import { cn } from '@/lib/utils'

export function Step1Upload() {
  const {
    images,
    imageUrls,
    setImages,
    setImageUrls,
    removeImage,
    removeImageUrl,
    nextStep,
    productName,
    productCategory,
    productSku,
    setProductName,
    setProductCategory,
    setProductSku,
    description,
    setDescription,
  } = useNewEditStore()
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const [pricingPlan, setPricingPlan] = useState<string>('personal')
  const [isLoadingPlan, setIsLoadingPlan] = useState(true)
  const [urlInput, setUrlInput] = useState('')
  const [urlError, setUrlError] = useState('')
  const [isValidatingUrl, setIsValidatingUrl] = useState(false)

  // Fetch user's pricing plan
  useEffect(() => {
    const fetchPricingPlan = async () => {
      try {
        const response = await fetch('/api/user/profile')
        if (response.ok) {
          const { user } = await response.json()
          setPricingPlan(user.pricingPlan || 'personal')
        }
      } catch (error) {
        console.error('Error fetching pricing plan:', error)
      } finally {
        setIsLoadingPlan(false)
      }
    }
    fetchPricingPlan()
  }, [])

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      // Filter for valid image files and size
      const validFiles = acceptedFiles.filter(
        (file) =>
          file.type.startsWith('image/') &&
          file.size <= 5 * 1024 * 1024 // 5MB
      )

      // Limit to 10 images total
      const newImages = [...images, ...validFiles].slice(0, 10)
      setImages(newImages)
    },
    [images, setImages]
  )

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'image/heic': ['.heic'],
      'image/heif': ['.heif'],
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    maxFiles: 10,
  })

  const handleCameraCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      const validFiles = Array.from(files).filter(
        (file) => file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024
      )
      const newImages = [...images, ...validFiles].slice(0, 10)
      setImages(newImages)
    }
  }

  const validateImageUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url)
      // Must be http or https
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return false
      }
      // Check if URL ends with common image extensions
      const pathname = urlObj.pathname.toLowerCase()
      const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.heic', '.heif']
      return validExtensions.some(ext => pathname.endsWith(ext))
    } catch {
      return false
    }
  }

  const handleAddUrl = async () => {
    if (!urlInput.trim()) return

    setUrlError('')
    setIsValidatingUrl(true)

    try {
      // Basic URL validation
      if (!validateImageUrl(urlInput)) {
        setUrlError('Please enter a valid image URL (must end with .jpg, .png, .webp, etc.)')
        setIsValidatingUrl(false)
        return
      }

      // Check if we haven't exceeded limit
      const totalImages = images.length + imageUrls.length
      if (totalImages >= 10) {
        setUrlError('Maximum 10 images allowed')
        setIsValidatingUrl(false)
        return
      }

      // Verify URL is accessible by fetching headers
      const response = await fetch(urlInput, { method: 'HEAD' })
      if (!response.ok) {
        setUrlError('Could not access image at this URL. Please check the URL and try again.')
        setIsValidatingUrl(false)
        return
      }

      // Check content type
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.startsWith('image/')) {
        setUrlError('URL does not point to an image')
        setIsValidatingUrl(false)
        return
      }

      // Add URL to list
      setImageUrls([...imageUrls, urlInput.trim()])
      setUrlInput('')
    } catch (error) {
      setUrlError('Failed to validate URL. Please check the URL and try again.')
    } finally {
      setIsValidatingUrl(false)
    }
  }

  const hasErrors = fileRejections.length > 0 || !!urlError
  const canProceed = images.length > 0 || imageUrls.length > 0
  const totalImages = images.length + imageUrls.length

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6 items-start">
      {/* ── Left column: upload controls ────────────────────────── */}
      <div className="space-y-4">
        {/* Product Information - Only visible for business users */}
        {!isLoadingPlan && pricingPlan === 'business' && (
          <div className="glass-card p-4">
            <h3 className="text-base font-semibold text-gray-900 mb-3">Product Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Product Name
                </label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g., Classic T-Shirt"
                  className="glass-input w-full px-3 py-2 text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Category
                </label>
                <input
                  type="text"
                  value={productCategory}
                  onChange={(e) => setProductCategory(e.target.value)}
                  placeholder="e.g., Apparel"
                  className="glass-input w-full px-3 py-2 text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  SKU
                </label>
                <input
                  type="text"
                  value={productSku}
                  onChange={(e) => setProductSku(e.target.value)}
                  placeholder="e.g., TSH-001-BLK"
                  className="glass-input w-full px-3 py-2 text-sm focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-2xl p-6 md:p-8 transition-all duration-200 cursor-pointer backdrop-blur-md',
            isDragActive
              ? 'border-duma-primary bg-duma-primary/10 shadow-glow'
              : 'border-white/70 bg-white/40 hover:border-duma-primary/40 hover:bg-white/60'
          )}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center text-center space-y-3">
            <div className="grid place-items-center h-14 w-14 rounded-2xl bg-brand-gradient text-white shadow-glow">
              <Upload className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm md:text-base text-gray-900 font-medium">
                Drag images here or click to browse
              </p>
              <p className="text-xs md:text-sm text-gray-600 mt-1">
                JPG, PNG, WEBP, HEIC up to 5MB • Max 10 images
              </p>
            </div>
            {/* Camera Capture Button */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleCameraCapture}
              className="hidden"
              multiple
            />
            <button
              onClick={(e) => {
                e.stopPropagation()
                cameraInputRef.current?.click()
              }}
              className="flex items-center gap-2 px-4 py-2 glass-subtle rounded-xl hover:bg-white/70 hover:text-duma-primary transition-colors"
            >
              <Camera className="h-5 w-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-900">Take Photo</span>
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/60"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-3 py-0.5 rounded-full glass-subtle text-gray-500">or add image by URL</span>
          </div>
        </div>

        {/* URL Input */}
        <div className="glass-card p-3 md:p-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddUrl()}
                placeholder="https://example.com/image.jpg"
                className="glass-input w-full px-3.5 py-2 text-sm focus:outline-none"
                disabled={isValidatingUrl}
              />
            </div>
            <Button
              onClick={handleAddUrl}
              disabled={isValidatingUrl || !urlInput.trim()}
              className="flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <LinkIcon className="h-4 w-4" />
              <span>{isValidatingUrl ? 'Validating...' : 'Add URL'}</span>
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Enter a direct link to an image (must end with .jpg, .png, .webp, etc.)
          </p>
        </div>

        {/* Description / context — combined with the prompt by our refinement AI */}
        <div className="glass-card p-4 space-y-1.5">
          <label
            htmlFor="edit-description"
            className="flex items-center gap-2 text-sm font-medium text-gray-900"
          >
            <Sparkles className="h-4 w-4 text-duma-primary" />
            Description
            <span className="text-xs font-normal text-gray-500">(optional)</span>
          </label>
          <p className="text-xs text-gray-600">
            Describe the product or scene — brand, materials, mood, what matters. Our AI blends this
            with your editing prompt to produce sharper results.
          </p>
          <textarea
            id="edit-description"
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, 1500))}
            placeholder="e.g. Handmade leather wallet, premium feel, warm natural lighting, e-commerce listing."
            className="glass-input w-full px-3 py-2 text-sm focus:outline-none min-h-[88px] resize-y"
            maxLength={1500}
          />
          <div className="flex justify-end">
            <span className="text-xs text-gray-500">{description.length} / 1500</span>
          </div>
        </div>

        {/* Error messages */}
        {fileRejections.length > 0 && (
          <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-600">
              <p className="font-medium">Some files were rejected:</p>
              <ul className="mt-1 list-disc list-inside">
                {fileRejections.map(({ file, errors }) => (
                  <li key={file.name}>
                    {file.name}: {errors[0]?.message}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* URL Error */}
        {urlError && (
          <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-600">
              <p className="font-medium">{urlError}</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Right column: live previews + next ──────────────────── */}
      <div className="glass-card p-4 md:p-5 flex flex-col lg:sticky lg:top-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-gray-900">
            Selected Images
          </h3>
          <span className="px-2.5 py-0.5 rounded-full glass-subtle text-xs font-medium text-gray-600">
            {totalImages}/10
          </span>
        </div>

        {totalImages === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center border-2 border-dashed border-white/60 rounded-xl py-12 px-4 min-h-[260px]">
            <div className="grid place-items-center h-12 w-12 rounded-2xl glass-subtle text-gray-400 mb-3">
              <Upload className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-gray-600">No images yet</p>
            <p className="text-xs text-gray-500 mt-1">
              Upload or add a URL to see previews here
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto pr-1 max-h-[calc(100vh-22rem)] min-h-[260px]">
            {/* File uploads */}
            {images.map((image, index) => (
              <div
                key={`file-${index}`}
                className="relative aspect-square rounded-xl glass-subtle overflow-hidden group"
              >
                <Image
                  src={URL.createObjectURL(image)}
                  alt={`Preview ${index + 1}`}
                  fill
                  className="object-cover"
                />
                <button
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 md:top-2 md:right-2 w-8 h-8 md:w-6 md:h-6 glass-nav border rounded-full flex items-center justify-center hover:text-red-600 transition-colors"
                  aria-label={`Remove image ${index + 1}`}
                >
                  <X className="h-5 w-5 md:h-4 md:w-4 text-gray-600" />
                </button>
              </div>
            ))}
            {/* URL images */}
            {imageUrls.map((url, index) => (
              <div
                key={`url-${index}`}
                className="relative aspect-square rounded-xl glass-subtle overflow-hidden group"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`URL Preview ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-1 left-1 md:top-2 md:left-2 px-2 py-1 bg-blue-500 text-white text-xs rounded">
                  URL
                </div>
                <button
                  onClick={() => removeImageUrl(index)}
                  className="absolute top-1 right-1 md:top-2 md:right-2 w-8 h-8 md:w-6 md:h-6 glass-nav border rounded-full flex items-center justify-center hover:text-red-600 transition-colors"
                  aria-label={`Remove URL image ${index + 1}`}
                >
                  <X className="h-5 w-5 md:h-4 md:w-4 text-gray-600" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Next button */}
        <div className="flex justify-end pt-4 mt-4 border-t border-white/50">
          <Button
            onClick={nextStep}
            disabled={!canProceed}
            variant="default"
            size="lg"
            className="w-full sm:w-auto"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
