'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Job {
  id: string
  userId: string
  userEmail?: string
  status: string
  createdAt: string
  completedAt?: string
  inputImages: string[]
  creditsCharged: number
}

export function JobManagement() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/admin/jobs')
      if (response.ok) {
        const data = await response.json()
        setJobs(data.jobs)
      }
    } catch (error) {
      console.error('Error fetching jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredJobs = statusFilter === 'all'
    ? jobs
    : jobs.filter(job => job.status === statusFilter)

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'completed'
      case 'processing': return 'processing'
      case 'failed': return 'failed'
      case 'pending': return 'pending'
      default: return 'default'
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Job Management</CardTitle>
            <CardDescription>View and monitor all image processing jobs</CardDescription>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/40 backdrop-blur-sm">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Job ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Images</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Credits</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      Loading jobs...
                    </td>
                  </tr>
                ) : filteredJobs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No jobs found
                    </td>
                  </tr>
                ) : (
                  filteredJobs.slice(0, 50).map((job) => (
                    <tr key={job.id} className="hover:bg-white/40">
                      <td className="px-4 py-3">
                        <div className="font-mono text-xs text-gray-600">
                          {job.id.substring(0, 8)}...
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">{job.userEmail || 'N/A'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={getStatusVariant(job.status) as any}>
                          {job.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {job.inputImages.length} images
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {job.creditsCharged || job.inputImages.length}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(job.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="mt-4 text-sm text-gray-500">
          Showing {Math.min(filteredJobs.length, 50)} of {filteredJobs.length} jobs
        </div>
      </CardContent>
    </Card>
  )
}
