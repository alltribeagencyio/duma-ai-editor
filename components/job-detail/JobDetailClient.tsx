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
  const [reEditJobs, setReEditJobs] = useState<any[]>([])
  const [selectedUrls, setSelectedUrls] = useState<string[]>([])
  const [isRetrying, setIsRetrying] = useState(false)
  const [showOriginalImages, setShowOriginalImages] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)
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

  // Fetch re-edit jobs (child jobs)
  useEffect(() => {
    const fetchReEdits = async () => {
      try {
        const response = await fetch(`/api/jobs/${job.id}/re-edits`)
        if (response.ok) {
          const { reEdits } = await response.json()
          setReEditJobs(reEdits || [])
        }
      } catch (error) {
        console.error('Error fetching re-edits:', error)
      }
    }

    // Fetch initially and when job updates
    fetchReEdits()

    // Poll for re-edit updates if any are processing
    const hasProcessingReEdits = reEditJobs.some(
      (reEdit) => reEdit.status === 'pending' || reEdit.status === 'processing'
    )

    if (hasProcessingReEdits) {
      const interval = setInterval(fetchReEdits, 3000)
      return () => clearInterval(interval)
    }
  }, [job.id, job.status])

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
      title="Edit Details"
      subtitle={`Status: ${job.status}`}
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Original Images & Prompts Section - Collapsible */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <button
            onClick={() => setShowOriginalImages(!showOriginalImages)}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-gray-900">
                Original Images & Prompts
              </h3>
              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded font-medium">
                {job.inputImages?.length || 0} images · {reEditJobs.length + 1} prompt{reEditJobs.length > 0 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {!showOriginalImages && (
                <span className="text-xs px-2 py-0.5 bg-purple-50 text-purple-700 rounded font-medium">
                  Click to view
                </span>
              )}
              {showOriginalImages ? (
                <ChevronUp className="h-6 w-6 text-gray-600 group-hover:text-gray-900 transition-colors" />
              ) : (
                <ChevronDown className="h-6 w-6 text-purple-600 group-hover:text-purple-700 transition-colors" />
              )}
            </div>
          </button>

          {showOriginalImages && (
            <div className="px-6 pb-6 border-t border-gray-200">
              {/* Original Images */}
              {job.inputImages && job.inputImages.length > 0 && (
                <div className="pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Original Images</h4>
                  <ImageGallery imageUrls={job.inputImages} />
                </div>
              )}

              {/* Prompt Thread */}
              <div className="pt-6 space-y-3">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Prompt History</h4>

                {/* Version 1 Prompt */}
                {job.prompt && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs px-2 py-0.5 bg-purple-600 text-white rounded font-medium">
                        Version 1
                      </span>
                      <span className="text-xs text-gray-600">
                        {new Date(job.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{job.prompt}</p>
                  </div>
                )}

                {/* Re-edit Prompts */}
                {reEditJobs.map((reEdit, index) => (
                  reEdit.prompt && (
                    <div key={reEdit.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs px-2 py-0.5 bg-purple-600 text-white rounded font-medium">
                          Version {index + 2}
                        </span>
                        <span className="text-xs text-gray-600">
                          {new Date(reEdit.createdAt).toLocaleString()}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                          reEdit.status === 'completed' ? 'bg-green-100 text-green-700' :
                          reEdit.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                          reEdit.status === 'failed' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {reEdit.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">{reEdit.prompt}</p>
                    </div>
                  )
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Edited Images Gallery */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Edited Images</h3>
            <span className="text-xs px-2 py-1 bg-purple-50 text-purple-700 rounded font-medium">
              {reEditJobs.length + 1} version{reEditJobs.length > 0 ? 's' : ''}
            </span>
          </div>

          {/* Version 1 - Original Edit */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-semibold text-gray-900">Version 1</h4>
                <p className="text-xs text-gray-600 mt-1">Original Edit</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded font-medium ${
                job.status === 'completed' ? 'bg-green-100 text-green-700' :
                job.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                job.status === 'failed' ? 'bg-red-100 text-red-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {job.status}
              </span>
            </div>

            {(job.status === 'pending' || (job.status === 'processing' && outputImages.length === 0)) && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {Array.from({ length: totalImages || 1 }).map((_, idx) => (
                  <div key={idx} className="aspect-square bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-purple-600 mb-2" />
                    <p className="text-xs text-gray-500">Processing...</p>
                  </div>
                ))}
              </div>
            )}

            {job.status === 'failed' && (
              <div className="text-center py-8 bg-red-50 rounded-lg border border-red-200">
                <p className="text-red-600 font-semibold">Failed</p>
                {job.errorMessage && (
                  <p className="text-sm text-gray-600 mt-2">{job.errorMessage}</p>
                )}
                <Button
                  onClick={handleRetry}
                  disabled={isRetrying}
                  variant="outline"
                  className="mt-4"
                >
                  {isRetrying ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Retrying...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry
                    </>
                  )}
                </Button>
              </div>
            )}

            {(job.status === 'processing' || job.status === 'completed') && outputImages.length > 0 && (
              <ImageGallery
                imageUrls={outputImages}
                totalImages={totalImages}
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
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-600">No images generated</p>
              </div>
            )}
          </div>

          {/* Re-edit Versions */}
          {reEditJobs.map((reEdit, index) => {
            const reEditImages = Array.isArray(reEdit.outputData)
              ? reEdit.outputData
              : (reEdit.outputData?.images || [])

            return (
              <div key={reEdit.id} className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-gray-900">Version {index + 2}</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      {new Date(reEdit.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded font-medium ${
                    reEdit.status === 'completed' ? 'bg-green-100 text-green-700' :
                    reEdit.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                    reEdit.status === 'failed' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {reEdit.status}
                  </span>
                </div>

                {(reEdit.status === 'pending' || reEdit.status === 'processing') && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {Array.from({ length: reEdit.inputImages?.length || 1 }).map((_, idx) => (
                      <div key={idx} className="aspect-square bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-purple-600 mb-2" />
                        <p className="text-xs text-gray-500">Processing...</p>
                      </div>
                    ))}
                  </div>
                )}

                {reEdit.status === 'failed' && (
                  <div className="text-center py-8 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-red-600 font-semibold">Failed to process</p>
                    {reEdit.errorMessage && (
                      <p className="text-sm text-gray-600 mt-2">{reEdit.errorMessage}</p>
                    )}
                  </div>
                )}

                {(reEdit.status === 'completed') && reEditImages.length > 0 && (
                  <ImageGallery
                    imageUrls={reEditImages}
                    jobId={reEdit.id}
                    jobStatus={reEdit.status}
                    onReEdit={(imageUrl) => {
                      setSelectedImageForReEdit(imageUrl)
                      setReEditModalOpen(true)
                    }}
                  />
                )}
              </div>
            )
          })}
        </div>
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
