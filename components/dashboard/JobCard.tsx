import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Job } from '@/lib/types'
import { useState } from 'react'

interface JobCardProps {
  job: Job
}

export function JobCard({ job }: JobCardProps) {
  const [imageError, setImageError] = useState(false)

  const statusVariant = {
    pending: 'pending' as const,
    processing: 'processing' as const,
    completed: 'completed' as const,
    failed: 'failed' as const,
  }[job.status]

  const imageCount = job.inputImages.length

  // Generate job name from product name and SKU
  const getJobName = () => {
    if (job.productName && job.productSku) {
      return `${job.productName} - ${job.productSku}`
    } else if (job.productName) {
      return job.productName
    } else if (job.productSku) {
      return job.productSku
    } else {
      return `${imageCount} ${imageCount === 1 ? 'image' : 'images'}`
    }
  }

  const hasValidImage = job.inputImages && job.inputImages.length > 0 && job.inputImages[0]

  return (
    <Link href={`/jobs/${job.id}`} className="block mb-6 last:mb-0">
      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm hover:border-gray-300 transition-all duration-200 cursor-pointer">
        <div className="flex gap-4">
          {/* Thumbnail */}
          <div className="relative w-20 h-20 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
            {hasValidImage && !imageError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={job.inputImages[0]}
                alt="Job preview"
                crossOrigin="anonymous"
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <span className="text-2xl">📷</span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 flex flex-col gap-2">
            {/* Top row */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 truncate">
                  {getJobName()}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {imageCount} {imageCount === 1 ? 'image' : 'images'}
                </p>
              </div>
              <Badge variant={statusVariant}>{job.status}</Badge>
            </div>

            {/* Bottom row */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
              </span>
              <span className="text-sm font-medium text-gray-900 hover:text-gray-600 transition-colors">
                View Details →
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
