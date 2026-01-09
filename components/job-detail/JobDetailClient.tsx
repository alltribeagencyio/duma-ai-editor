'use client'

import { useEffect, useState } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { ImageGallery } from './ImageGallery'
import { ReEditModal } from '@/components/re-edit/ReEditModal'
import { RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

interface JobDetailClientProps {
  initialJob: any
}

export function JobDetailClient({ initialJob }: JobDetailClientProps) {
  const [job, setJob] = useState(initialJob)
  const [selectedUrls, setSelectedUrls] = useState<string[]>([])
  const [isRetrying, setIsRetrying] = useState(false)
  const [showOriginalImages, setShowOriginalImages] = useState(true)
  const [showPrompt, setShowPrompt] = useState(true)
  const [userEmail, setUserEmail] = useState<string | undefined>(undefined)
  const [reEditModalOpen, setReEditModalOpen] = useState(false)
  const [selectedImageForReEdit, setSelectedImageForReEdit] = useState<string>('')

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserEmail(user.email)
      }
    }
    fetchUser()
  }, [])

  useEffect(() => {
    // Only poll if job is pending or processing
    if (job.status !== 'pending' && job.status !== 'processing') {
      return
    }

    console.log('🔄 Starting polling for job:', job.id)

    // Poll for updates every 2 seconds
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/jobs/${job.id}`)
        if (response.ok) {
          const { job: updatedJob } = await response.json()
          const imageCount = Array.isArray(updatedJob.outputData)
            ? updatedJob.outputData.length
            : (updatedJob.outputData?.images?.length || 0)
          console.log('📡 Poll update:', updatedJob.status, 'Images:', imageCount)
          setJob(updatedJob)

          // Stop polling if job is completed or failed
          if (updatedJob.status === 'completed' || updatedJob.status === 'failed') {
            console.log('✅ Polling stopped - job finished')
            clearInterval(interval)
          }
        }
      } catch (error) {
        console.error('Error polling job:', error)
      }
    }, 2000) // Poll every 2 seconds

    return () => {
      console.log('🛑 Cleaning up polling interval')
      clearInterval(interval)
    }
  }, [job.id, job.status])

  // Extract image URLs from outputData
  // Handle both formats: array directly or object with images property
  const outputImages = Array.isArray(job.outputData)
    ? job.outputData
    : (job.outputData?.images || [])
  const totalImages = job.inputImages?.length || 0

  const handleRetry = async () => {
    setIsRetrying(true)
    try {
      const response = await fetch(`/api/jobs/${job.id}/retry`, {
        method: 'POST',
      })

      if (response.ok) {
        const { job: updatedJob } = await response.json()
        setJob(updatedJob)
        // Polling will start automatically due to the useEffect dependency on job.status
      } else {
        const error = await response.json()
        alert(`Failed to retry: ${error.error}`)
      }
    } catch (error) {
      console.error('Error retrying job:', error)
      alert('Failed to retry job. Please try again.')
    } finally {
      setIsRetrying(false)
    }
  }

  return (
    <AppLayout
      userEmail={userEmail}
      title="Job Details"
      subtitle={`Status: ${job.status}`}
    >
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Show prompt always if available */}
        {job.prompt && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <button
              onClick={() => setShowPrompt(!showPrompt)}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
            >
              <h3 className="text-lg font-semibold text-gray-900">
                Prompt Used
              </h3>
              {showPrompt ? (
                <ChevronUp className="h-5 w-5 text-gray-600" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-600" />
              )}
            </button>

            {showPrompt && (
              <div className="px-6 pb-6 border-t border-gray-200">
                <div className="pt-4">
                  <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-100 whitespace-pre-wrap">
                    {job.prompt}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Edited Images Section - Always Show */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Edited Images</h3>

          {(job.status === 'pending' || (job.status === 'processing' && outputImages.length === 0)) && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: totalImages || 1 }).map((_, index) => (
                <div
                  key={index}
                  className="aspect-square bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center"
                >
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900 mb-3" />
                  <p className="text-sm text-gray-500">Processing image {index + 1}...</p>
                </div>
              ))}
            </div>
          )}

          {job.status === 'processing' && outputImages.length > 0 && (
            <ImageGallery
              imageUrls={outputImages}
              totalImages={totalImages}
              onSelectionChange={setSelectedUrls}
            />
          )}

          {job.status === 'failed' && (
            <div className="text-center py-8 bg-white rounded-lg border border-red-200">
              <p className="text-red-600 mb-2 font-semibold">Failed to process images</p>
              {job.errorMessage && (
                <p className="text-sm text-gray-600 mb-4">{job.errorMessage}</p>
              )}
              <Button
                onClick={handleRetry}
                disabled={isRetrying}
                className="bg-gray-900 hover:bg-gray-800 text-white"
              >
                {isRetrying ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry Job
                  </>
                )}
              </Button>
            </div>
          )}

          {job.status === 'completed' && outputImages.length > 0 && (
            <ImageGallery
              imageUrls={outputImages}
              onSelectionChange={setSelectedUrls}
              jobId={job.id}
              jobStatus={job.status}
              onReEdit={(imageUrl) => {
                setSelectedImageForReEdit(imageUrl)
                setReEditModalOpen(true)
              }}
            />
          )}

          {job.status === 'completed' && outputImages.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-600">No edited images available</p>
            </div>
          )}
        </div>

        {/* Original Images Section */}
        {job.inputImages && job.inputImages.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <button
              onClick={() => setShowOriginalImages(!showOriginalImages)}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
            >
              <h3 className="text-lg font-semibold text-gray-900">
                Original Images ({job.inputImages.length})
              </h3>
              {showOriginalImages ? (
                <ChevronUp className="h-5 w-5 text-gray-600" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-600" />
              )}
            </button>

            {showOriginalImages && (
              <div className="px-6 pb-6 border-t border-gray-200">
                <div className="pt-4">
                  <ImageGallery imageUrls={job.inputImages} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Re-edit Modal */}
      <ReEditModal
        isOpen={reEditModalOpen}
        onClose={() => {
          setReEditModalOpen(false)
          setSelectedImageForReEdit('')
        }}
        imageUrl={selectedImageForReEdit}
        jobId={job.id}
        onSuccess={() => {
          // Optionally refetch job data or navigate to new job
          window.location.reload() // Simple approach for now
        }}
      />
    </AppLayout>
  )
}
