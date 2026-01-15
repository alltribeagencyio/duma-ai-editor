'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Download, Loader2, Edit3, X } from 'lucide-react'

const ImageLightbox = dynamic(
  () => import('./ImageLightbox').then(mod => ({ default: mod.ImageLightbox })),
  { ssr: false }
)

interface ImageWithVersion {
  url: string
  version?: number
  isReEdit?: boolean
}

interface ImageGalleryProps {
  imageUrls: string[] | ImageWithVersion[]
  totalImages?: number
  onSelectionChange?: (selectedUrls: string[]) => void
  jobId?: string
  jobStatus?: string
  onReEdit?: (imageUrl: string) => void
  enableExpand?: boolean
}

export function ImageGallery({ imageUrls, totalImages, onSelectionChange, jobId, jobStatus, onReEdit, enableExpand = false }: ImageGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set())
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())
  const [expandedImage, setExpandedImage] = useState<string | null>(null)

  // Handle closing expanded image - unified function
  const closeExpandedImage = () => {
    setExpandedImage(null)
  }

  // Normalize imageUrls to always be ImageWithVersion format
  const normalizedImages: ImageWithVersion[] = imageUrls.map((item) => {
    if (typeof item === 'string') {
      return { url: item }
    }
    return item
  })

  // Show checkboxes only when there are multiple images
  const showCheckboxes = normalizedImages.length > 1

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
      {/* Backdrop for expanded image - click to collapse */}
      {enableExpand && expandedImage && (
        <div
          className="fixed inset-0 bg-black/80 z-40"
          onPointerDown={(e) => {
            e.preventDefault()
            e.stopPropagation()
            closeExpandedImage()
          }}
          role="button"
          aria-label="Close expanded image"
        />
      )}

      <div className={`grid gap-3 md:gap-4 p-4 md:p-6 relative ${
        normalizedImages.length === 1
          ? 'grid-cols-1 max-w-md mx-auto'
          : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
      }`}>
        {/* Completed images */}
        {normalizedImages.map((image, index) => {
          const isExpanded = enableExpand && expandedImage === image.url
          return (
            <div
              key={`${image.url}-${index}`}
              className={`relative rounded-lg border border-gray-200 overflow-hidden group transition-all duration-300 ${
                isExpanded ? 'fixed inset-4 md:inset-8 z-50 max-w-none max-h-none' : 'aspect-square'
              }`}
            >
              {/* Close button for expanded image - prominent on mobile */}
              {isExpanded && (
                <button
                  type="button"
                  onPointerDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    closeExpandedImage()
                  }}
                  className="absolute top-4 right-4 z-[60] p-4 md:p-3 bg-black/95 hover:bg-black active:bg-red-600 rounded-full transition-all shadow-2xl touch-manipulation min-w-[56px] min-h-[56px] md:min-w-[48px] md:min-h-[48px] flex items-center justify-center"
                  title="Close"
                  aria-label="Close expanded image"
                >
                  <X className="h-8 w-8 md:h-6 md:w-6 text-white" strokeWidth={3} />
                </button>
              )}

              {/* Version Tag - only show if it's a re-edit */}
              {!isExpanded && image.isReEdit && image.version && (
                <div className="absolute top-2 right-2 z-10">
                  <span className="px-2 py-1 bg-purple-600 text-white text-xs font-medium rounded shadow-md">
                    Re-edit V{image.version}
                  </span>
                </div>
              )}

              {/* Checkbox - only show when multiple images and not expanded */}
              {!isExpanded && showCheckboxes && (
                <div className="absolute top-2 left-2 z-10">
                  <input
                    type="checkbox"
                    checked={selectedImages.has(image.url)}
                    onChange={(e) => {
                      e.stopPropagation()
                      toggleSelection(image.url)
                    }}
                    className="h-5 w-5 rounded border-gray-300 text-gray-900 focus:ring-gray-900 cursor-pointer"
                  />
                </div>
              )}

              <div
                className={`w-full h-full relative ${
                  isExpanded ? 'flex items-center justify-center bg-black pointer-events-none' : 'cursor-pointer'
                }`}
                onClick={(e) => {
                  if (!isExpanded) {
                    openLightbox(index)
                  }
                }}
              >
                {!imageErrors.has(image.url) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={image.url}
                    alt={`Edited image ${index + 1}`}
                    crossOrigin="anonymous"
                    className={`${
                      isExpanded
                        ? 'max-w-full max-h-full w-auto h-auto object-contain'
                        : 'w-full h-full object-cover transition-transform duration-200 group-hover:scale-105'
                    }`}
                    onError={() => setImageErrors(prev => new Set(prev).add(image.url))}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                    <span className="text-4xl">📷</span>
                  </div>
                )}
              </div>

              {/* Action bar at bottom */}
              {!isExpanded && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="flex items-center justify-center gap-4 p-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        downloadImage(image.url, index)
                      }}
                      className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all"
                      title="Download"
                    >
                      <Download className="h-5 w-5 text-white" />
                    </button>
                    {/* Re-edit button - only show for completed jobs */}
                    {jobStatus === 'completed' && onReEdit && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onReEdit(image.url)
                        }}
                        className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all"
                        title="Re-edit this image"
                      >
                        <Edit3 className="h-5 w-5 text-white" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Action bar for expanded image - at bottom with larger buttons */}
              {isExpanded && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                  <div className="flex items-center justify-center gap-6">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        downloadImage(image.url, index)
                      }}
                      className="p-3 bg-white/20 hover:bg-white/30 rounded-lg transition-all"
                      title="Download"
                    >
                      <Download className="h-6 w-6 text-white" />
                    </button>
                    {/* Re-edit button - only show for completed jobs */}
                    {jobStatus === 'completed' && onReEdit && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onReEdit(image.url)
                        }}
                        className="p-3 bg-white/20 hover:bg-white/30 rounded-lg transition-all"
                        title="Re-edit this image"
                      >
                        <Edit3 className="h-6 w-6 text-white" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}

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
        images={normalizedImages.map(img => img.url)}
        isOpen={lightboxOpen}
        currentIndex={lightboxIndex}
        onClose={() => setLightboxOpen(false)}
        onNavigate={setLightboxIndex}
      />
    </>
  )
}
