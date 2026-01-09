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
            .slice(0, 7) // Fetch last 7 activities (scrollable to max 7)
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
        return <Clock className="h-3.5 w-3.5 text-gray-400" />
      case 'processing':
        return <Loader2 className="h-3.5 w-3.5 text-blue-500 animate-spin" />
      case 'completed':
        return <CheckCircle className="h-3.5 w-3.5 text-green-500" />
      case 'failed':
        return <XCircle className="h-3.5 w-3.5 text-red-500" />
      default:
        return <Activity className="h-3.5 w-3.5 text-gray-400" />
    }
  }

  if (isLoading) {
    return (
      <div className="px-4 py-4">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="h-4 w-4 text-gray-600" />
          <h3 className="text-sm font-semibold text-gray-900">Activity Log</h3>
        </div>
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-4 border-t border-gray-200">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="h-4 w-4 text-gray-600" />
        <h3 className="text-sm font-semibold text-gray-900">Activity Log</h3>
      </div>

      {activities.length === 0 ? (
        <p className="text-xs text-gray-500 text-center py-4">No recent activity</p>
      ) : (
        <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          {activities.map((activity) => (
            <Link
              key={activity.id}
              href={`/jobs/${activity.jobId}`}
              className="block p-2.5 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
            >
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5">{getIcon(activity.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-900 font-medium leading-snug">
                    {activity.message}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </p>
                  {activity.errorMessage && (
                    <p className="text-[10px] text-red-600 mt-0.5">
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
