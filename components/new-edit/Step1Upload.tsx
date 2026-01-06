'use client'

import { useCallback, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, AlertCircle, Camera } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { useNewEditStore } from '@/lib/stores/newEditStore'
import { cn } from '@/lib/utils'

export function Step1Upload() {
  const {
    images,
    setImages,
    removeImage,
    nextStep,
    productName,
    productCategory,
    productSku,
    setProductName,
    setProductCategory,
    setProductSku,
  } = useNewEditStore()
  const cameraInputRef = useRef<HTMLInputElement>(null)

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

  const hasErrors = fileRejections.length > 0
  const canProceed = images.length > 0

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Product Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Name
            </label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g., Classic T-Shirt"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <input
              type="text"
              value={productCategory}
              onChange={(e) => setProductCategory(e.target.value)}
              placeholder="e.g., Apparel"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SKU
            </label>
            <input
              type="text"
              value={productSku}
              onChange={(e) => setProductSku(e.target.value)}
              placeholder="e.g., TSH-001-BLK"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
        </div>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-xl p-12 transition-all duration-200 cursor-pointer',
          isDragActive
            ? 'border-gray-900 bg-gray-100'
            : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50'
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <Upload className="h-12 w-12 text-gray-400" />
          <div>
            <p className="text-base text-gray-900 font-medium">
              Drag images here or click to browse
            </p>
            <p className="text-sm text-gray-600 mt-1">
              JPG, PNG, WEBP, HEIC up to 5MB • Max 10 images
            </p>
          </div>
        </div>
      </div>

      {/* Camera Capture Button */}
      <div className="flex justify-center">
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
          onClick={() => cameraInputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Camera className="h-5 w-5 text-gray-600" />
          <span className="text-sm font-medium text-gray-900">Take Photo</span>
        </button>
      </div>

      {/* Error messages */}
      {hasErrors && (
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

      {/* Image previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div
              key={index}
              className="relative aspect-square rounded-lg border border-gray-200 overflow-hidden group"
            >
              <Image
                src={URL.createObjectURL(image)}
                alt={`Preview ${index + 1}`}
                fill
                className="object-cover"
              />
              <button
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-100 transition-colors"
              >
                <X className="h-4 w-4 text-gray-600" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Next button */}
      <div className="flex justify-end pt-4">
        <Button
          onClick={nextStep}
          disabled={!canProceed}
          size="lg"
        >
          Next
        </Button>
      </div>
    </div>
  )
}
