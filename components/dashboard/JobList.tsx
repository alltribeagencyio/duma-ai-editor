'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { JobCard } from './JobCard'
import { EmptyState } from './EmptyState'
import { Job } from '@/lib/types'
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react'

export function JobList() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [jobsPerPage, setJobsPerPage] = useState(10)

  // Filter states
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [promptTypeFilter, setPromptTypeFilter] = useState<'all' | 'preset' | 'custom'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetch('/api/jobs')
      .then((res) => res.json())
      .then((data) => {
        setJobs(data.jobs || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // Apply filters
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      // Date filter
      if (dateFrom) {
        const jobDate = new Date(job.createdAt)
        const fromDate = new Date(dateFrom)
        if (jobDate < fromDate) return false
      }
      if (dateTo) {
        const jobDate = new Date(job.createdAt)
        const toDate = new Date(dateTo)
        toDate.setHours(23, 59, 59, 999) // Include the entire day
        if (jobDate > toDate) return false
      }

      // Prompt type filter
      if (promptTypeFilter !== 'all' && job.promptType !== promptTypeFilter) {
        return false
      }

      // Search filter (search in productName, productSku, and prompt)
      if (searchTerm) {
        const search = searchTerm.toLowerCase()
        const matchesProductName = job.productName?.toLowerCase().includes(search)
        const matchesSku = job.productSku?.toLowerCase().includes(search)
        const matchesPrompt = job.prompt?.toLowerCase().includes(search)
        if (!matchesProductName && !matchesSku && !matchesPrompt) {
          return false
        }
      }

      return true
    })
  }, [jobs, dateFrom, dateTo, promptTypeFilter, searchTerm])

  // Calculate pagination based on filtered jobs
  const totalPages = Math.ceil(filteredJobs.length / jobsPerPage)
  const indexOfLastJob = currentPage * jobsPerPage
  const indexOfFirstJob = indexOfLastJob - jobsPerPage
  const currentJobs = filteredJobs.slice(indexOfFirstJob, indexOfLastJob)

  const goToPage = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleJobsPerPageChange = (value: number) => {
    setJobsPerPage(value)
    setCurrentPage(1) // Reset to first page when changing items per page
  }

  const clearFilters = () => {
    setDateFrom('')
    setDateTo('')
    setPromptTypeFilter('all')
    setSearchTerm('')
    setCurrentPage(1)
  }

  const hasActiveFilters = dateFrom || dateTo || promptTypeFilter !== 'all' || searchTerm

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Loading skeletons */}
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse"
          >
            <div className="flex gap-4">
              <div className="w-20 h-20 bg-gray-200 rounded-lg" />
              <div className="flex-1 space-y-3">
                <div className="h-5 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/4" />
                <div className="h-3 bg-gray-200 rounded w-1/3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      {/* Filter Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <X className="h-4 w-4" />
              Clear filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Date From */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              From Date
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              To Date
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          {/* Prompt Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prompt Type
            </label>
            <select
              value={promptTypeFilter}
              onChange={(e) => {
                setPromptTypeFilter(e.target.value as 'all' | 'preset' | 'custom')
                setCurrentPage(1)
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              <option value="all">All Types</option>
              <option value="preset">Preset</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
                placeholder="Product name, SKU, prompt..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
          </div>
        </div>

        {/* Results count */}
        {hasActiveFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Showing <span className="font-semibold text-gray-900">{filteredJobs.length}</span> of{' '}
              <span className="font-semibold text-gray-900">{jobs.length}</span> jobs
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">Jobs per page:</span>
          <select
            value={jobsPerPage}
            onChange={(e) => handleJobsPerPageChange(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
        <Link href="/new">
          <Button className="bg-gray-900 hover:bg-gray-800 text-white">New Edit</Button>
        </Link>
      </div>

      {jobs.length === 0 ? (
        <EmptyState />
      ) : filteredJobs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-600 mb-2">No jobs match your filters</p>
          <button
            onClick={clearFilters}
            className="text-sm text-gray-900 hover:underline"
          >
            Clear filters to see all jobs
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-6">
            {currentJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {indexOfFirstJob + 1} to {Math.min(indexOfLastJob, filteredJobs.length)} of{' '}
                {filteredJobs.length} jobs
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
                    // Show first page, last page, current page, and pages around current
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
                            ? 'bg-gray-900 text-white'
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
          )}
        </>
      )}
    </div>
  )
}
