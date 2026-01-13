'use client'

import { useState, useEffect, useCallback } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Download, Search, Calendar, X } from 'lucide-react'
import Link from 'next/link'

interface GalleryImage {
  id: string
  jobId: string
  imageUrl: string
  prompt: string
  createdAt: string
  productName?: string
}

interface GalleryClientProps {
  userEmail: string
}

export function GalleryClient({ userEmail }: GalleryClientProps) {
  const [images, setImages] = useState<GalleryImage[]>([])
  const [filteredImages, setFilteredImages] = useState<GalleryImage[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  // Fetch all completed jobs with their images
  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await fetch('/api/jobs')
        if (response.ok) {
          const { jobs } = await response.json()

          // Extract all images from completed jobs
          const allImages: GalleryImage[] = []
          jobs.forEach((job: any) => {
            if (job.status === 'completed' && job.outputData && Array.isArray(job.outputData)) {
              job.outputData.forEach((imageUrl: string) => {
                allImages.push({
                  id: `${job.id}-${imageUrl}`,
                  jobId: job.id,
                  imageUrl,
                  prompt: job.prompt,
                  createdAt: job.completedAt || job.createdAt,
                  productName: job.productName,
                })
              })
            }
          })

          // Sort by most recent first
          allImages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

          setImages(allImages)
          setFilteredImages(allImages)
        }
      } catch (error) {
        console.error('Error fetching images:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchImages()
  }, [])

  // Filter images based on search and date
  useEffect(() => {
    let filtered = images

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (img) =>
          img.prompt?.toLowerCase().includes(search) ||
          img.productName?.toLowerCase().includes(search)
      )
    }

    // Date filter
    if (selectedDate) {
      filtered = filtered.filter((img) => {
        const imgDate = new Date(img.createdAt).toISOString().split('T')[0]
        return imgDate === selectedDate
      })
    }

    setFilteredImages(filtered)
  }, [searchTerm, selectedDate, images])

  const handleDownload = useCallback(async (imageUrl: string, index: number) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `duma-edit-${Date.now()}.jpg`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading image:', error)
    }
  }, [])

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedDate('')
  }

  const hasFilters = searchTerm || selectedDate

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <AppLayout userEmail={userEmail} title="Gallery" subtitle={`${filteredImages.length} edited images`}>
      <div className="max-w-7xl mx-auto">
        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by prompt or product name..."
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                />
              </div>
            </div>

            {/* Date Filter */}
            <div className="w-full md:w-48">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                />
              </div>
            </div>

            {/* Clear Filters */}
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <X className="h-4 w-4" />
                Clear
              </button>
            )}
          </div>

          {/* Results count */}
          {hasFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Showing <span className="font-semibold text-gray-900">{filteredImages.length}</span> of{' '}
                <span className="font-semibold text-gray-900">{images.length}</span> images
              </p>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square bg-gray-200 rounded-lg animate-pulse"
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && images.length === 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-600 mb-4">No edited images yet</p>
            <Link
              href="/new"
              className="inline-flex items-center px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-all font-medium border border-purple-100"
            >
              Create Your First Edit
            </Link>
          </div>
        )}

        {/* No Results State */}
        {!loading && images.length > 0 && filteredImages.length === 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-600 mb-2">No images match your filters</p>
            <button
              onClick={clearFilters}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              Clear filters to see all images
            </button>
          </div>
        )}

        {/* Image Grid */}
        {!loading && filteredImages.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredImages.map((image, index) => (
              <div
                key={image.id}
                className="group relative aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200 hover:border-gray-300 transition-all"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {!imageErrors.has(image.imageUrl) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={image.imageUrl}
                    alt={image.productName || 'Edited image'}
                    crossOrigin="anonymous"
                    className="w-full h-full object-cover"
                    onError={() => setImageErrors(prev => new Set(prev).add(image.imageUrl))}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <span className="text-4xl">📷</span>
                  </div>
                )}

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    {/* Product Name or Date */}
                    <p className="text-white text-sm font-medium mb-2 line-clamp-1">
                      {image.productName || formatDate(image.createdAt)}
                    </p>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDownload(image.imageUrl, index)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white transition-colors text-sm font-medium text-gray-900"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </button>
                      <Link
                        href={`/jobs/${image.jobId}`}
                        className="flex-1 flex items-center justify-center px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                      >
                        View Job
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
