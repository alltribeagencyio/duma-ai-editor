import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Job } from '@/lib/types'
import { DownloadActions } from './DownloadActions'

interface JobHeaderProps {
  job: Job
}

export function JobHeader({ job }: JobHeaderProps) {
  const statusVariant = {
    pending: 'pending' as const,
    processing: 'processing' as const,
    completed: 'completed' as const,
    failed: 'failed' as const,
  }[job.status]

  const imageCount = job.inputImages.length

  // Extract image URLs from outputData - handle both array and object formats
  const imageUrls = Array.isArray(job.outputData)
    ? job.outputData
    : ((job.outputData as any)?.images || [])

  return (
    <div className="bg-white border-b border-gray-200 p-6">
      <div className="max-w-6xl mx-auto">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-gray-900 mb-3">
              {job.prompt}
            </h1>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Badge variant={statusVariant}>{job.status}</Badge>
              <span>•</span>
              <span>
                {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
              </span>
              <span>•</span>
              <span>
                {imageCount} {imageCount === 1 ? 'image' : 'images'}
              </span>
            </div>
          </div>

          {(job.status === 'completed' || job.status === 'processing') && imageUrls.length > 0 && (
            <DownloadActions imageUrls={imageUrls} />
          )}
        </div>
      </div>
    </div>
  )
}
