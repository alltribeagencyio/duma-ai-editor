'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Download, Search, Calendar, X, ChevronLeft, ChevronRight, ArrowUpDown, Eye } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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

type SortOption = 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc'

export function GalleryClient({ userEmail }: GalleryClientProps) {
  const router = useRouter()
  const [images, setImages] = useState<GalleryImage[]>([])
  const [filteredImages, setFilteredImages] = useState<GalleryImage[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const imagesPerPage = 20 // Fixed at 20 images per page

  // Sorting state
  const [sortBy, setSortBy] = useState<SortOption>('date-desc')

  // Fetch all completed jobs with their images
  useEffect(() => {
    const fetchImages = async () => {
      try {
        // First, process any completed jobs that haven't had credits deducted
        // This handles jobs that N8N completes directly in the database
        await fetch('/api/jobs/process-completed', { method: 'POST' }).catch(() => {
          // Silently fail if processing fails - it will retry on next fetch
        })

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

  // Sort images
  const sortedImages = useMemo(() => {
    const sorted = [...filteredImages]

    switch (sortBy) {
      case 'date-desc':
        sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
      case 'date-asc':
        sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        break
      case 'name-asc':
        sorted.sort((a, b) => {
          const nameA = (a.productName || '').toLowerCase()
          const nameB = (b.productName || '').toLowerCase()
          return nameA.localeCompare(nameB)
        })
        break
      case 'name-desc':
        sorted.sort((a, b) => {
          const nameA = (a.productName || '').toLowerCase()
          const nameB = (b.productName || '').toLowerCase()
          return nameB.localeCompare(nameA)
        })
        break
    }

    return sorted
  }, [filteredImages, sortBy])

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
    setCurrentPage(1) // Reset to first page when filters change
  }, [searchTerm, selectedDate, images])

  // Calculate pagination
  const totalPages = Math.ceil(sortedImages.length / imagesPerPage)
  const indexOfLastImage = currentPage * imagesPerPage
  const indexOfFirstImage = indexOfLastImage - imagesPerPage
  const currentImages = sortedImages.slice(indexOfFirstImage, indexOfLastImage)

  const goToPage = (page: number) => {
    setCurrentPage(page)
    // Instant scroll on mobile for better performance, smooth on desktop
    const isMobile = window.innerWidth < 768
    window.scrollTo({ top: 0, behavior: isMobile ? 'auto' : 'smooth' })
  }

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
    <AppLayout userEmail={userEmail} title="Gallery" subtitle={`${sortedImages.length} edited images`}>
      <div className="max-w-7xl mx-auto">
        {/* Filters and Controls */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6 mb-6">
          {/* Search, Date, Sort */}
          <div className="flex flex-col md:flex-row gap-4 mb-4">
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

            {/* Sort By */}
            <div className="w-full md:w-48">
              <div className="relative">
                <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent appearance-none bg-white"
                >
                  <option value="date-desc">Newest First</option>
                  <option value="date-asc">Oldest First</option>
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                </select>
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
          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              Showing {indexOfFirstImage + 1}-{Math.min(indexOfLastImage, sortedImages.length)} of{' '}
              <span className="font-semibold text-gray-900">{sortedImages.length}</span> images
            </p>
          </div>
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
        {!loading && images.length > 0 && sortedImages.length === 0 && (
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
        {!loading && currentImages.length > 0 && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
              {currentImages.map((image, index) => {
                const isSelected = selectedImageId === image.id

                return (
                  <div key={image.id} className="group relative aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200 active:border-purple-300 transition-all">
                    {/* Image - clickable on desktop (Link), tappable on mobile (toggles actions) */}
                    <div
                      className="block w-full h-full cursor-pointer md:cursor-default"
                      onClick={(e) => {
                        // Mobile behavior: toggle action buttons
                        if (window.innerWidth < 768) {
                          e.preventDefault()
                          setSelectedImageId(isSelected ? null : image.id)
                        }
                      }}
                    >
                      <Link href={`/jobs/${image.jobId}`} className="hidden md:block w-full h-full">
                        {!imageErrors.has(image.imageUrl) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={image.imageUrl}
                            alt={image.productName || 'Edited image'}
                            crossOrigin="anonymous"
                            className="w-full h-full object-cover"
                            loading="lazy"
                            decoding="async"
                            onError={() => setImageErrors(prev => new Set(prev).add(image.imageUrl))}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <span className="text-4xl">📷</span>
                          </div>
                        )}
                      </Link>

                      {/* Mobile: Image without Link wrapper */}
                      <div className="md:hidden w-full h-full">
                        {!imageErrors.has(image.imageUrl) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={image.imageUrl}
                            alt={image.productName || 'Edited image'}
                            crossOrigin="anonymous"
                            className="w-full h-full object-cover"
                            loading="lazy"
                            decoding="async"
                            onError={() => setImageErrors(prev => new Set(prev).add(image.imageUrl))}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <span className="text-4xl">📷</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Desktop: Hover overlay with download icon */}
                    <div className="hidden md:block absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                      <div className="absolute bottom-3 right-3 pointer-events-auto">
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            handleDownload(image.imageUrl, index)
                          }}
                          className="p-2 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white transition-colors shadow-sm"
                          title="Download"
                        >
                          <Download className="h-4 w-4 text-gray-900" />
                        </button>
                      </div>
                    </div>

                    {/* Mobile: Action buttons (show when selected) */}
                    {isSelected && (
                      <div className="md:hidden absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                        <div className="flex items-center justify-center gap-6">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDownload(image.imageUrl, index)
                              setSelectedImageId(null)
                            }}
                            className="p-3 bg-white/20 hover:bg-white/30 active:bg-white/40 rounded-lg transition-all"
                            title="Download"
                          >
                            <Download className="h-5 w-5 text-white" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/jobs/${image.jobId}`)
                            }}
                            className="p-3 bg-white/20 hover:bg-white/30 active:bg-white/40 rounded-lg transition-all"
                            title="View Details"
                          >
                            <Eye className="h-5 w-5 text-white" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Pagination - Simplified for mobile */}
            {totalPages > 1 && (
              <div className="bg-white rounded-lg border border-gray-200 p-3 md:p-4">
                {/* Mobile: Simple prev/next with page count */}
                <div className="flex md:hidden items-center justify-between">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-300 rounded-lg active:scale-95 disabled:opacity-40 disabled:active:scale-100 transition-transform font-medium"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Prev
                  </button>

                  <span className="text-sm text-gray-600 font-medium">
                    {currentPage} / {totalPages}
                  </span>

                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-300 rounded-lg active:scale-95 disabled:opacity-40 disabled:active:scale-100 transition-transform font-medium"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                {/* Desktop: Full pagination */}
                <div className="hidden md:flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>

                    <div className="flex gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        const showPage =
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)

                        if (!showPage && page === currentPage - 2) {
                          return (
                            <span key={page} className="px-3 py-2 text-gray-400">
                              ...
                            </span>
                          )
                        }

                        if (!showPage && page === currentPage + 2) {
                          return (
                            <span key={page} className="px-3 py-2 text-gray-400">
                              ...
                            </span>
                          )
                        }

                        if (!showPage) return null

                        return (
                          <button
                            key={page}
                            onClick={() => goToPage(page)}
                            className={`px-3 py-2 rounded-lg transition-colors ${
                              currentPage === page
                                ? 'bg-purple-50 text-purple-700 border border-purple-100'
                                : 'border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        )
                      })}
                    </div>

                    <button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  )
}
