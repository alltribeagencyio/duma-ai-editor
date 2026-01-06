'use client'

import { useState, memo, useCallback } from 'react'
import { Download } from 'lucide-react'
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
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())

  const handleDownload = useCallback(async (imageUrl: string, index: number) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `edited-image-${index + 1}.jpg`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading image:', error)
    }
  }, [])

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

  if (recentEdits.length === 0) {
    return (
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Edits</h2>
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-600 mb-4">No recent edits yet</p>
          <Link href="/new">
            <Button className="bg-gray-900 hover:bg-gray-800 text-white">
              Start Your First Edit
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Recent Edits</h2>
        <Link href="/history" className="text-sm text-gray-600 hover:text-gray-900">
          View All →
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-6">
        {recentEdits.map((edit, index) => {
          const editedImage = edit.editedImages[0]

          return (
            <div
              key={edit.id}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-gray-300 transition-all group"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Image Container */}
              <div className="relative aspect-square bg-gray-100">
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
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <span className="text-4xl">📷</span>
                  </div>
                )}

                {/* Hover Controls */}
                {hoveredIndex === index && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2 transition-opacity">
                    <button
                      onClick={() => handleDownload(editedImage, index)}
                      className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors"
                      title="Download"
                    >
                      <Download className="h-4 w-4 text-gray-900" />
                    </button>
                  </div>
                )}

                {/* Time Label */}
                <div className="absolute top-2 right-2">
                  <span className="text-xs px-2 py-1 bg-white/90 backdrop-blur-sm rounded text-gray-900 font-medium">
                    {formatTimeAgo(edit.createdAt)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4">
                <Link href={`/jobs/${edit.id}`}>
                  <button className="w-full text-xs px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium">
                    View Job
                  </button>
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
})
