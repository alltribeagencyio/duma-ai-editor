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
  const [showOriginalImages, setShowOriginalImages] = useState(true)
  const [showPrompt, setShowPrompt] = useState(false) // Start collapsed for cleaner view
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
      title="Job Details"
      subtitle={`Status: ${job.status}`}
    >
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Show prompt always if available */}
        {job.prompt && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <button
              onClick={() => setShowPrompt(!showPrompt)}
              className="w-full flex items-center justify-between px-4 md:px-6 py-3 md:py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors group"
            >
              <div className="flex items-center gap-2">
                <h3 className="text-base md:text-lg font-semibold text-gray-900">
                  Prompt Used
                </h3>
                {!showPrompt && (
                  <span className="text-xs px-2 py-0.5 bg-purple-50 text-purple-700 rounded font-medium">
                    Tap to view
                  </span>
                )}
              </div>
              <div className={`transition-transform duration-200 ${showPrompt ? 'rotate-180' : ''}`}>
                <ChevronDown className="h-5 w-5 text-gray-600 group-hover:text-gray-900" />
              </div>
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

        {/* All Versions Section - Side by Side */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Edit Versions</h3>
            <span className="text-xs px-2 py-1 bg-purple-50 text-purple-700 rounded font-medium">
              {reEditJobs.length + 1} Version{reEditJobs.length > 0 ? 's' : ''}
            </span>
          </div>

          {/* Horizontal scroll container for all versions */}
          <div className="flex md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-x-auto md:overflow-x-visible pb-4 -mx-3 px-3 md:mx-0 md:px-0 snap-x snap-mandatory md:snap-none scrollbar-hide">
            {/* Version 1 - Original Edit */}
            <div className="min-w-[280px] md:min-w-0 snap-start flex-shrink-0 bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900">Version 1</h4>
                  <p className="text-xs text-gray-600 mt-1">Original Edit</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded font-medium ${
                  job.status === 'completed' ? 'bg-green-50 text-green-700' :
                  job.status === 'processing' ? 'bg-blue-50 text-blue-700' :
                  job.status === 'failed' ? 'bg-red-50 text-red-700' :
                  'bg-gray-50 text-gray-700'
                }`}>
                  {job.status}
                </span>
              </div>

              {(job.status === 'pending' || (job.status === 'processing' && outputImages.length === 0)) && (
                <div className="aspect-square bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center mb-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900 mb-3" />
                  <p className="text-sm text-gray-500">Processing...</p>
                </div>
              )}

              {job.status === 'processing' && outputImages.length > 0 && (
                <div className="mb-3">
                  <ImageGallery
                    imageUrls={outputImages}
                    totalImages={totalImages}
                    onSelectionChange={setSelectedUrls}
                  />
                </div>
              )}

              {job.status === 'failed' && (
                <div className="text-center py-8 bg-red-50 rounded-lg border border-red-200 mb-3">
                  <p className="text-red-600 text-sm font-semibold">Failed</p>
                  {job.errorMessage && (
                    <p className="text-xs text-gray-600 mt-2">{job.errorMessage}</p>
                  )}
                  <Button
                    onClick={handleRetry}
                    disabled={isRetrying}
                    className="bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-100 mt-3 text-xs h-8"
                  >
                    {isRetrying ? (
                      <>
                        <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                        Retrying...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-3 w-3 mr-2" />
                        Retry
                      </>
                    )}
                  </Button>
                </div>
              )}

              {job.status === 'completed' && outputImages.length > 0 && (
                <>
                  <div className="mb-3">
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
                  </div>
                  <Button
                    onClick={() => {
                      setSelectedImageForReEdit(outputImages[0])
                      setReEditModalOpen(true)
                    }}
                    className="w-full bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-100 text-xs h-8"
                  >
                    Re-edit this version
                  </Button>
                </>
              )}

              {job.status === 'completed' && outputImages.length === 0 && (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-600 text-sm">No images</p>
                </div>
              )}
            </div>

            {/* All Re-edit Versions */}
            {reEditJobs.map((reEdit, index) => {
              const reEditImages = Array.isArray(reEdit.outputData)
                ? reEdit.outputData
                : (reEdit.outputData?.images || [])

              return (
                <div key={reEdit.id} className="min-w-[280px] md:min-w-0 snap-start flex-shrink-0 bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">Version {index + 2}</h4>
                      <p className="text-xs text-gray-600 mt-1">
                        {new Date(reEdit.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded font-medium ${
                      reEdit.status === 'completed' ? 'bg-green-50 text-green-700' :
                      reEdit.status === 'processing' ? 'bg-blue-50 text-blue-700' :
                      reEdit.status === 'failed' ? 'bg-red-50 text-red-700' :
                      'bg-gray-50 text-gray-700'
                    }`}>
                      {reEdit.status}
                    </span>
                  </div>

                  {/* Re-edit Prompt */}
                  {reEdit.prompt && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-gray-600 mb-1">Prompt:</p>
                      <p className="text-xs text-gray-700 bg-gray-50 p-2 rounded border border-gray-100 line-clamp-3">
                        {reEdit.prompt}
                      </p>
                    </div>
                  )}

                  {/* Re-edit Images */}
                  {reEdit.status === 'completed' && reEditImages.length > 0 && (
                    <>
                      <div className="mb-3">
                        <ImageGallery
                          imageUrls={reEditImages}
                          jobId={reEdit.id}
                          jobStatus={reEdit.status}
                          onReEdit={(imageUrl) => {
                            setSelectedImageForReEdit(imageUrl)
                            setReEditModalOpen(true)
                          }}
                        />
                      </div>
                      <Button
                        onClick={() => {
                          setSelectedImageForReEdit(reEditImages[0])
                          setReEditModalOpen(true)
                        }}
                        className="w-full bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-100 text-xs h-8"
                      >
                        Re-edit this version
                      </Button>
                    </>
                  )}

                  {(reEdit.status === 'pending' || reEdit.status === 'processing') && (
                    <div className="aspect-square bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-purple-600 mb-3" />
                      <p className="text-sm text-gray-500">Processing...</p>
                    </div>
                  )}

                  {reEdit.status === 'failed' && (
                    <div className="text-center py-8 bg-red-50 rounded-lg border border-red-200">
                      <p className="text-red-600 text-sm font-semibold">Failed</p>
                      {reEdit.errorMessage && (
                        <p className="text-xs text-gray-600 mt-2">{reEdit.errorMessage}</p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Original Images Section */}
        {job.inputImages && job.inputImages.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <button
              onClick={() => setShowOriginalImages(!showOriginalImages)}
              className="w-full flex items-center justify-between px-4 md:px-6 py-3 md:py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors group"
            >
              <div className="flex items-center gap-2">
                <h3 className="text-base md:text-lg font-semibold text-gray-900">
                  Original Images ({job.inputImages.length})
                </h3>
                {!showOriginalImages && (
                  <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded font-medium">
                    Tap to view
                  </span>
                )}
              </div>
              <div className={`transition-transform duration-200 ${showOriginalImages ? 'rotate-180' : ''}`}>
                <ChevronDown className="h-5 w-5 text-gray-600 group-hover:text-gray-900" />
              </div>
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

        {/* Re-edit Versions Section */}
        {reEditJobs.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
              <span className="text-sm font-medium text-gray-600">Edit History</span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
            </div>

            {reEditJobs.map((reEdit, index) => {
              const reEditImages = Array.isArray(reEdit.outputData)
                ? reEdit.outputData
                : (reEdit.outputData?.images || [])

              return (
                <div key={reEdit.id} className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-base md:text-lg font-semibold text-gray-900">
                        Version {index + 2}
                      </h3>
                      <p className="text-xs md:text-sm text-gray-600 mt-1">
                        Created {new Date(reEdit.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded font-medium ${
                      reEdit.status === 'completed' ? 'bg-green-50 text-green-700' :
                      reEdit.status === 'processing' ? 'bg-blue-50 text-blue-700' :
                      reEdit.status === 'failed' ? 'bg-red-50 text-red-700' :
                      'bg-gray-50 text-gray-700'
                    }`}>
                      {reEdit.status}
                    </span>
                  </div>

                  {/* Re-edit Prompt */}
                  {reEdit.prompt && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-gray-600 mb-2">Prompt Used:</p>
                      <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100">
                        {reEdit.prompt}
                      </p>
                    </div>
                  )}

                  {/* Re-edit Images */}
                  {reEdit.status === 'completed' && reEditImages.length > 0 && (
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

                  {(reEdit.status === 'pending' || reEdit.status === 'processing') && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Array.from({ length: reEdit.inputImages?.length || 1 }).map((_, idx) => (
                        <div
                          key={idx}
                          className="aspect-square bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center"
                        >
                          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-purple-600 mb-3" />
                          <p className="text-sm text-gray-500">Processing...</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {reEdit.status === 'failed' && (
                    <div className="text-center py-8 bg-red-50 rounded-lg border border-red-200">
                      <p className="text-red-600 text-sm font-semibold">Failed to process</p>
                      {reEdit.errorMessage && (
                        <p className="text-xs text-gray-600 mt-2">{reEdit.errorMessage}</p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
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
