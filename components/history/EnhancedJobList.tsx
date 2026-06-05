'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Search, Filter, Calendar, Package, Tag, RefreshCw, Eye, Download, Edit3 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

interface Job {
  id: string
  status: string
  prompt: string
  promptType: string
  productName?: string
  productCategory?: string
  productSku?: string
  inputImages: string[]
  outputData: any
  createdAt: string
  isReEdit: boolean
  parentJobId?: string
  creditsCost: number
}

export function EnhancedJobList() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sortBy, setSortBy] = useState('date-desc')
  const [groupByProduct, setGroupByProduct] = useState(false)

  useEffect(() => {
    fetchJobs()
  }, [])

  useEffect(() => {
    filterAndSortJobs()
  }, [jobs, searchQuery, statusFilter, typeFilter, sortBy])

  const fetchJobs = async () => {
    try {
      // First, process any completed jobs that haven't had credits deducted
      // This handles jobs that N8N completes directly in the database
      await fetch('/api/jobs/process-completed', { method: 'POST' }).catch(() => {
        // Silently fail if processing fails - it will retry on next fetch
      })

      const response = await fetch('/api/jobs')
      if (response.ok) {
        const { jobs: fetchedJobs } = await response.json()
        setJobs(fetchedJobs)
      }
    } catch (error) {
      console.error('Error fetching jobs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterAndSortJobs = () => {
    let filtered = [...jobs]

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(job =>
        job.productName?.toLowerCase().includes(query) ||
        job.productSku?.toLowerCase().includes(query) ||
        job.productCategory?.toLowerCase().includes(query) ||
        job.prompt.toLowerCase().includes(query) ||
        job.id.toLowerCase().includes(query)
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(job => job.status === statusFilter)
    }

    // Type filter
    if (typeFilter === 'original') {
      filtered = filtered.filter(job => !job.isReEdit)
    } else if (typeFilter === 'reEdit') {
      filtered = filtered.filter(job => job.isReEdit)
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'date-asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case 'name':
          return (a.productName || '').localeCompare(b.productName || '')
        case 'status':
          return a.status.localeCompare(b.status)
        default:
          return 0
      }
    })

    setFilteredJobs(filtered)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'processing': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'failed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getImageCount = (job: Job) => {
    if (job.outputData) {
      return Array.isArray(job.outputData) ? job.outputData.length : job.outputData.images?.length || 0
    }
    return 0
  }

  const groupJobsByProduct = (jobs: Job[]) => {
    const grouped = jobs.reduce((acc, job) => {
      const key = job.productName || job.productSku || 'Untitled Product'
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(job)
      return acc
    }, {} as Record<string, Job[]>)

    return Object.entries(grouped).map(([productName, jobs]) => ({
      productName,
      jobs: jobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-duma-primary/20 border-t-duma-primary" />
      </div>
    )
  }

  const displayData = groupByProduct ? groupJobsByProduct(filteredJobs) : null

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by product name, SKU, prompt, or job ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="original">Original</SelectItem>
                  <SelectItem value="reEdit">Re-edits</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-desc">Newest First</SelectItem>
                  <SelectItem value="date-asc">Oldest First</SelectItem>
                  <SelectItem value="name">Product Name</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => setGroupByProduct(!groupByProduct)}
                className="flex items-center gap-2"
              >
                <Package className="h-4 w-4" />
                {groupByProduct ? 'Ungroup' : 'Group by Product'}
              </Button>

              <Button
                variant="outline"
                onClick={fetchJobs}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <span>
              {filteredJobs.length} of {jobs.length} jobs
            </span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Processing</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span>Pending</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Jobs List */}
      {filteredJobs.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
            <p className="text-gray-600">
              {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'Try adjusting your search criteria'
                : 'Start by creating your first editing job'}
            </p>
          </CardContent>
        </Card>
      ) : groupByProduct ? (
        /* Grouped View */
        <div className="space-y-6">
          {displayData?.map(({ productName, jobs }) => (
            <Card key={productName}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-gray-500" />
                    <h3 className="text-lg font-medium">{productName}</h3>
                    <Badge variant="outline">{jobs.length} jobs</Badge>
                  </div>
                </div>

                <div className="grid gap-3">
                  {jobs.map((job, index) => (
                    <div key={job.id}>
                      <JobRow job={job} />
                      {index < jobs.length - 1 && <Separator className="my-3" />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* List View */
        <Card>
          <CardContent className="p-6">
            <div className="space-y-3">
              {filteredJobs.map((job, index) => (
                <div key={job.id}>
                  <JobRow job={job} />
                  {index < filteredJobs.length - 1 && <Separator className="my-3" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function JobRow({ job }: { job: Job }) {
  const imageCount = job.inputImages.length
  const outputCount = job.status === 'completed' ?
    (Array.isArray(job.outputData) ? job.outputData.length : job.outputData?.images?.length || 0) : 0

  return (
    <div className="flex items-center justify-between p-4 hover:bg-white/40 rounded-xl transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <Badge className={getStatusColor(job.status)}>
            {job.status}
          </Badge>

          {job.isReEdit && (
            <Badge variant="outline" className="text-blue-600 border-blue-200">
              <Edit3 className="h-3 w-3 mr-1" />
              Re-edit
            </Badge>
          )}

          <span className="text-sm text-gray-500">
            {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
          </span>

          <span className="text-sm text-gray-500">
            {job.creditsCost} credit{job.creditsCost !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex items-center gap-4 mb-2">
          <h3 className="font-medium text-gray-900">
            {job.productName || job.productSku || `Job ${job.id.slice(0, 8)}`}
          </h3>

          {job.productCategory && (
            <Badge variant="outline" className="text-xs">
              <Tag className="h-3 w-3 mr-1" />
              {job.productCategory}
            </Badge>
          )}
        </div>

        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
          {job.prompt}
        </p>

        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span>{imageCount} input image{imageCount !== 1 ? 's' : ''}</span>
          {job.status === 'completed' && (
            <span>{outputCount} result{outputCount !== 1 ? 's' : ''}</span>
          )}
          {job.productSku && <span>SKU: {job.productSku}</span>}
        </div>
      </div>

      <div className="flex items-center gap-2 ml-4">
        <Link href={`/jobs/${job.id}`}>
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
        </Link>
      </div>
    </div>
  )
}

function getStatusColor(status: string) {
  switch (status) {
    case 'completed': return 'bg-green-100 text-green-800'
    case 'processing': return 'bg-blue-100 text-blue-800'
    case 'pending': return 'bg-yellow-100 text-yellow-800'
    case 'failed': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}