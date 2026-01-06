'use client'

import { useEffect, useState } from 'react'
import { Activity, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

interface ActivityItem {
  id: string
  type: 'pending' | 'processing' | 'completed' | 'failed'
  message: string
  jobId: string
  timestamp: string
  errorMessage?: string
}

export function ActivityLog() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await fetch('/api/jobs')
        if (response.ok) {
          const { jobs } = await response.json()

          const activityItems: ActivityItem[] = jobs
            .slice(0, 3) // Only show last 3 activities
            .map((job: any) => ({
              id: job.id,
              type: job.status,
              message: getActivityMessage(job),
              jobId: job.id,
              timestamp: job.updatedAt || job.createdAt,
              errorMessage: job.errorMessage,
            }))

          setActivities(activityItems)
        }
      } catch (error) {
        console.error('Error fetching activities:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchActivities()

    // Refresh every 10 seconds
    const interval = setInterval(fetchActivities, 10000)
    return () => clearInterval(interval)
  }, [])

  const getActivityMessage = (job: any) => {
    const imageCount = job.inputImages?.length || 0
    const imagesText = `${imageCount} ${imageCount === 1 ? 'image' : 'images'}`

    switch (job.status) {
      case 'pending':
        return `${imagesText} queued for editing`
      case 'processing':
        const processedCount = Array.isArray(job.outputData)
          ? job.outputData.length
          : (job.outputData?.images?.length || 0)
        return `Editing ${imagesText} (${processedCount}/${imageCount} done)`
      case 'completed':
        return `Successfully edited ${imagesText}`
      case 'failed':
        return `Failed to edit ${imagesText}`
      default:
        return `${imagesText} in progress`
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'pending':
        return <Clock className="h-4 w-4 text-gray-400" />
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-400" />
    }
  }

  if (isLoading) {
    return (
      <div className="px-4 py-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-5 w-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Activity Log</h3>
        </div>
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 border-t border-gray-200">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="h-5 w-5 text-gray-600" />
        <h3 className="font-semibold text-gray-900">Activity Log</h3>
      </div>

      {activities.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => (
            <Link
              key={activity.id}
              href={`/jobs/${activity.jobId}`}
              className="block p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{getIcon(activity.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 font-medium">
                    {activity.message}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </p>
                  {activity.errorMessage && (
                    <p className="text-xs text-red-600 mt-1">
                      Error: Job timed out
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
