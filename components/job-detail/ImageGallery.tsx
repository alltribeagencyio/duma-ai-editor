'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Download, ZoomIn, Loader2 } from 'lucide-react'

const ImageLightbox = dynamic(
  () => import('./ImageLightbox').then(mod => ({ default: mod.ImageLightbox })),
  { ssr: false }
)

interface ImageGalleryProps {
  imageUrls: string[]
  totalImages?: number
  onSelectionChange?: (selectedUrls: string[]) => void
}

export function ImageGallery({ imageUrls, totalImages, onSelectionChange }: ImageGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set())
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())

  const openLightbox = (index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  const downloadImage = async (url: string, index: number) => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = blobUrl
      const filename = url.split('/').pop()?.split('?')[0] || `edited-image-${index + 1}.png`
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(blobUrl)
    } catch (error) {
      console.error('Error downloading image:', error)
    }
  }

  const toggleSelection = (url: string) => {
    const newSelected = new Set(selectedImages)
    if (newSelected.has(url)) {
      newSelected.delete(url)
    } else {
      newSelected.add(url)
    }
    setSelectedImages(newSelected)
    onSelectionChange?.(Array.from(newSelected))
  }

  // Calculate loading placeholders
  const loadingCount = totalImages ? Math.max(0, totalImages - imageUrls.length) : 0
  const loadingPlaceholders = Array(loadingCount).fill(null)

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-6">
        {/* Completed images */}
        {imageUrls.map((url, index) => (
          <div
            key={url}
            className="relative aspect-square rounded-lg border border-gray-200 overflow-hidden group"
          >
            {/* Checkbox */}
            <div className="absolute top-2 left-2 z-10">
              <input
                type="checkbox"
                checked={selectedImages.has(url)}
                onChange={(e) => {
                  e.stopPropagation()
                  toggleSelection(url)
                }}
                className="h-5 w-5 rounded border-gray-300 text-gray-900 focus:ring-gray-900 cursor-pointer"
              />
            </div>

            <div
              className="w-full h-full cursor-pointer relative"
              onClick={() => openLightbox(index)}
            >
              {!imageErrors.has(url) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={url}
                  alt={`Edited image ${index + 1}`}
                  crossOrigin="anonymous"
                  className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                  onError={() => setImageErrors(prev => new Set(prev).add(url))}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                  <span className="text-4xl">📷</span>
                </div>
              )}
            </div>

            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-4">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  openLightbox(index)
                }}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              >
                <ZoomIn className="h-6 w-6 text-white" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  downloadImage(url, index)
                }}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              >
                <Download className="h-6 w-6 text-white" />
              </button>
            </div>
          </div>
        ))}

        {/* Loading placeholders for images being processed */}
        {loadingPlaceholders.map((_, index) => (
          <div
            key={`loading-${index}`}
            className="relative aspect-square rounded-lg border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center"
          >
            <div className="text-center">
              <Loader2 className="h-8 w-8 text-gray-400 animate-spin mx-auto mb-2" />
              <p className="text-xs text-gray-500">Processing...</p>
            </div>
          </div>
        ))}
      </div>

      <ImageLightbox
        images={imageUrls}
        isOpen={lightboxOpen}
        currentIndex={lightboxIndex}
        onClose={() => setLightboxOpen(false)}
        onNavigate={setLightboxIndex}
      />
    </>
  )
}
