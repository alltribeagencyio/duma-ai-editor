'use client'

import { useState, memo, useCallback, useEffect } from 'react'
import { ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface RecentEdit {
  id: string
  editedImages: string[]
  originalImages: string[]
  prompt: string
  createdAt: string
}

interface RecentGalleryProps {
  recentEdits: RecentEdit[]
}

export const RecentGallery = memo(function RecentGallery({ recentEdits }: RecentGalleryProps) {
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  // Limit to 16 most recent for desktop slider
  const displayEdits = recentEdits.slice(0, 16)
  const slidesPerView = 4
  const totalSlides = Math.ceil(displayEdits.length / slidesPerView)

  const formatTimeAgo = useCallback((dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }, [])

  // Autoplay functionality
  useEffect(() => {
    if (isPaused || displayEdits.length <= slidesPerView) return

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides)
    }, 3000) // Change slide every 3 seconds

    return () => clearInterval(interval)
  }, [isPaused, displayEdits.length, slidesPerView, totalSlides])

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides)
  }, [totalSlides])

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides)
  }, [totalSlides])

  if (recentEdits.length === 0) {
    return (
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Edits</h2>
        <div className="glass-card p-12 text-center">
          <p className="text-gray-600 mb-4">No recent edits yet</p>
          <Link href="/new">
            <Button>Start Your First Edit</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Recent Edits</h2>
        <Link href="/history" className="text-sm font-medium text-duma-primary hover:text-duma-primary-dark transition-colors">
          View All →
        </Link>
      </div>

      {/* Mobile: 2x2 Grid */}
      <div className="grid grid-cols-2 gap-3 md:hidden">
        {recentEdits.slice(0, 4).map((edit, index) => {
          const editedImage = edit.editedImages[0]

          return (
            <Link
              key={edit.id}
              href={`/jobs/${edit.id}`}
              className="block group"
            >
              <div className="relative aspect-square glass-subtle rounded-xl overflow-hidden hover:shadow-glass transition-all min-h-[150px]">
                {!imageErrors.has(editedImage) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={editedImage}
                    alt={`Edit ${index + 1}`}
                    crossOrigin="anonymous"
                    className="w-full h-full object-cover"
                    onError={() => setImageErrors(prev => new Set(prev).add(editedImage))}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-duma-primary/40">
                    <ImageIcon className="h-9 w-9" />
                  </div>
                )}

                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="absolute bottom-3 left-3 right-3">
                    <span className="text-white text-xs font-medium">View Edit</span>
                  </div>
                </div>

                {/* Time Label */}
                <div className="absolute top-2 right-2">
                  <span className="text-xs px-2 py-1 bg-white/90 backdrop-blur-sm rounded text-gray-900 font-medium">
                    {formatTimeAgo(edit.createdAt)}
                  </span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Desktop: Carousel Slider */}
      <div
        className="hidden md:block relative"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {Array.from({ length: totalSlides }).map((_, slideIndex) => (
              <div key={slideIndex} className="flex-shrink-0 w-full">
                <div className="grid grid-cols-4 gap-4">
                  {displayEdits
                    .slice(slideIndex * slidesPerView, (slideIndex + 1) * slidesPerView)
                    .map((edit, index) => {
                      const editedImage = edit.editedImages[0]

                      return (
                        <Link
                          key={edit.id}
                          href={`/jobs/${edit.id}`}
                          className="block group"
                        >
                          <div className="relative aspect-square glass-subtle rounded-xl overflow-hidden hover:shadow-glass transition-all">
                            {!imageErrors.has(editedImage) ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={editedImage}
                                alt={`Edit ${index + 1}`}
                                crossOrigin="anonymous"
                                className="w-full h-full object-cover"
                                onError={() => setImageErrors(prev => new Set(prev).add(editedImage))}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-duma-primary/40">
                                <ImageIcon className="h-9 w-9" />
                              </div>
                            )}

                            {/* Minimal overlay on hover */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                              <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                                <span className="text-white text-sm font-medium tracking-wide">View Edit</span>
                              </div>
                            </div>

                            {/* Time Label */}
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <span className="text-xs px-2 py-1 bg-white/90 backdrop-blur-sm rounded text-gray-900 font-medium">
                                {formatTimeAgo(edit.createdAt)}
                              </span>
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Arrows */}
        {totalSlides > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 p-2 glass-nav border rounded-full hover:text-duma-primary transition-all"
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-5 w-5 text-gray-700" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 p-2 glass-nav border rounded-full hover:text-duma-primary transition-all"
              aria-label="Next slide"
            >
              <ChevronRight className="h-5 w-5 text-gray-700" />
            </button>
          </>
        )}

        {/* Slide Indicators */}
        {totalSlides > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            {Array.from({ length: totalSlides }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? 'w-8 bg-brand-gradient shadow-glow'
                    : 'w-1.5 bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
})
