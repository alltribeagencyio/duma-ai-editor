'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Search, ArrowUpDown, ImageIcon, Check, Wand2, X, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useNewEditStore } from '@/lib/stores/newEditStore'
import { cn } from '@/lib/utils'

interface UploadItem {
  url: string
  jobId: string
  productName?: string | null
  createdAt: string
  useCount: number
}

type SortOption = 'date-desc' | 'date-asc' | 'used-desc'

const MAX_SELECT = 10
const PAGE_SIZE = 24

export function UploadsClient({ userEmail }: { userEmail: string }) {
  const router = useRouter()
  const { reset, setImageUrls } = useNewEditStore()

  const [uploads, setUploads] = useState<UploadItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('date-desc')
  const [selected, setSelected] = useState<string[]>([])
  const [page, setPage] = useState(1)
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch('/api/uploads')
      .then((r) => (r.ok ? r.json() : { uploads: [] }))
      .then(({ uploads }) => setUploads(uploads || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const processed = useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = uploads.filter((u) => !q || (u.productName || '').toLowerCase().includes(q))
    if (sortBy === 'date-desc')
      list = [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    else if (sortBy === 'date-asc')
      list = [...list].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    else if (sortBy === 'used-desc') list = [...list].sort((a, b) => b.useCount - a.useCount)
    return list
  }, [uploads, search, sortBy])

  const totalPages = Math.max(1, Math.ceil(processed.length / PAGE_SIZE))
  const pageItems = processed.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  useEffect(() => {
    setPage(1)
  }, [search, sortBy])

  const toggle = useCallback((url: string) => {
    setSelected((prev) => {
      if (prev.includes(url)) return prev.filter((u) => u !== url)
      if (prev.length >= MAX_SELECT) return prev
      return [...prev, url]
    })
  }, [])

  const startNewDesign = useCallback(
    (urls: string[]) => {
      if (urls.length === 0) return
      reset()
      setImageUrls(urls.slice(0, MAX_SELECT))
      router.push('/new')
    },
    [reset, setImageUrls, router]
  )

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

  return (
    <AppLayout
      userEmail={userEmail}
      title="Uploads"
      subtitle={`${uploads.length} uploaded image${uploads.length !== 1 ? 's' : ''}`}
    >
      <div className="max-w-7xl mx-auto pb-24">
        {/* Controls */}
        <div className="glass-card p-4 md:p-5 mb-6">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by product name…"
                aria-label="Search uploads"
                className="glass-input w-full pl-9 pr-3 py-2 text-sm focus:outline-none"
              />
            </div>
            <div className="relative w-full md:w-52">
              <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                aria-label="Sort uploads"
                className="glass-input w-full pl-9 pr-3 py-2 text-sm focus:outline-none appearance-none"
              >
                <option value="date-desc">Newest first</option>
                <option value="date-asc">Oldest first</option>
                <option value="used-desc">Most used</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square glass-subtle rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && uploads.length === 0 && (
          <div className="glass-card p-12 text-center">
            <ImageIcon className="h-10 w-10 text-duma-primary/40 mx-auto mb-3" />
            <p className="text-gray-600 mb-4">You haven&apos;t uploaded any images yet</p>
            <Link
              href="/new"
              className="inline-flex items-center px-5 py-2.5 bg-brand-gradient text-white rounded-xl shadow-glow hover:brightness-105 transition-all font-medium"
            >
              Start your first edit
            </Link>
          </div>
        )}

        {/* No results */}
        {!loading && uploads.length > 0 && processed.length === 0 && (
          <div className="glass-card p-12 text-center">
            <p className="text-gray-600 mb-2">No uploads match your search</p>
            <button
              onClick={() => setSearch('')}
              className="text-sm text-duma-primary font-medium hover:underline"
            >
              Clear search
            </button>
          </div>
        )}

        {/* Grid */}
        {!loading && pageItems.length > 0 && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {pageItems.map((item) => {
                const isSelected = selected.includes(item.url)
                const broken = imageErrors.has(item.url)
                return (
                  <div
                    key={item.url}
                    onClick={() => toggle(item.url)}
                    className={cn(
                      'group relative aspect-square glass-subtle rounded-xl overflow-hidden cursor-pointer transition-all hover:shadow-glass',
                      isSelected && 'ring-2 ring-duma-primary shadow-glow'
                    )}
                  >
                    {!broken ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.url}
                        alt={item.productName || 'Uploaded image'}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                        onError={() => setImageErrors((prev) => new Set(prev).add(item.url))}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-duma-primary/40">
                        <ImageIcon className="h-9 w-9" />
                      </div>
                    )}

                    {/* Selection check */}
                    <div
                      className={cn(
                        'absolute top-2 left-2 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all',
                        isSelected
                          ? 'bg-brand-gradient border-white text-white shadow-glow'
                          : 'bg-white/70 border-white/80 text-transparent group-hover:border-duma-primary/50'
                      )}
                    >
                      <Check className="h-4 w-4" />
                    </div>

                    {/* Reuse count badge */}
                    {item.useCount > 1 && (
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/55 text-white text-[10px] font-medium">
                        used {item.useCount}×
                      </div>
                    )}

                    {/* Hover overlay: meta + quick use */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-[11px] text-white/80 mb-1.5 truncate">
                        {item.productName || formatDate(item.createdAt)}
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          startNewDesign([item.url])
                        }}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-white/90 hover:bg-white text-gray-900 text-xs font-medium transition-colors"
                      >
                        <Wand2 className="h-3.5 w-3.5" />
                        New design
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <span className="text-xs text-gray-600">
                  {processed.length} upload{processed.length !== 1 ? 's' : ''}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    aria-label="Previous page"
                    className="grid place-items-center h-8 w-8 rounded-lg glass-subtle text-gray-700 hover:text-duma-primary disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-sm text-gray-700 tabular-nums px-1">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    aria-label="Next page"
                    className="grid place-items-center h-8 w-8 rounded-lg glass-subtle text-gray-700 hover:text-duma-primary disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Sticky action bar for multi-select */}
      {selected.length > 0 && (
        <div className="fixed inset-x-0 bottom-4 z-30 flex justify-center px-4 pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-3 glass-nav border rounded-2xl shadow-glass px-4 py-2.5">
            <span className="text-sm font-medium text-gray-900">
              {selected.length} selected{selected.length >= MAX_SELECT ? ` (max ${MAX_SELECT})` : ''}
            </span>
            <button
              onClick={() => setSelected([])}
              className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1"
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </button>
            <button
              onClick={() => startNewDesign(selected)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-gradient text-white text-sm font-medium shadow-glow hover:brightness-105 transition-all"
            >
              <Wand2 className="h-4 w-4" />
              New design ({selected.length})
            </button>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
