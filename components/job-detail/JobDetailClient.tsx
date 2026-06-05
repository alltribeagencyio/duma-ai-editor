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

  // Consolidate all edited images from all versions into one array with tags
  const allEditedImages: Array<{ url: string; version: number; isReEdit: boolean }> = []

  // Add Version 1 images. Show them as they stream in (n8n posts each finished
  // image to /api/webhook/image-complete), not only once the whole job is done.
  if (job.status !== 'failed' && outputImages.length > 0) {
    outputImages.forEach((url: string) => {
      allEditedImages.push({ url, version: 1, isReEdit: false })
    })
  }

  // Add all re-edit images with tags
  reEditJobs.forEach((reEdit, index) => {
    const reEditImages = Array.isArray(reEdit.outputData)
      ? reEdit.outputData
      : (reEdit.outputData?.images || [])

    if (reEdit.status === 'completed' && reEditImages.length > 0) {
      reEditImages.forEach((url: string) => {
        allEditedImages.push({ url, version: index + 2, isReEdit: true })
      })
    }
  })

  // Check if any version is still processing
  const isMainProcessing = job.status === 'pending' || job.status === 'processing'
  const isAnyProcessing = isMainProcessing ||
    reEditJobs.some(r => r.status === 'pending' || r.status === 'processing')

  // While the main job streams images in, show a spinner tile for each image
  // that hasn't arrived yet (total inputs minus outputs received so far).
  const pendingImageCount = isMainProcessing
    ? Math.max((totalImages || 1) - outputImages.length, 0)
    : 0

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
        <div className="glass-card overflow-hidden">
          <button
            onClick={() => setShowOriginalImages(!showOriginalImages)}
            className="w-full px-4 md:px-6 py-3 md:py-4 hover:bg-white/40 transition-colors group text-left"
          >
            {/* Row 1: Title + Arrow */}
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base md:text-lg font-semibold text-gray-900">
                Original Images & Prompts
              </h3>
              {showOriginalImages ? (
                <ChevronUp className="h-5 w-5 text-gray-600 group-hover:text-gray-900 transition-colors flex-shrink-0" />
              ) : (
                <ChevronDown className="h-5 w-5 text-purple-600 group-hover:text-purple-700 transition-colors flex-shrink-0" />
              )}
            </div>
            {/* Row 2: Info + Click to view */}
            <div className="flex items-center justify-between">
              <p className="text-xs md:text-sm text-gray-600">
                {job.inputImages?.length || 0} image{(job.inputImages?.length || 0) !== 1 ? 's' : ''} · {reEditJobs.length + 1} prompt{reEditJobs.length > 0 ? 's' : ''}
              </p>
              {!showOriginalImages && (
                <span className="text-xs text-purple-600 font-medium ml-2 flex-shrink-0">
                  Click to view →
                </span>
              )}
            </div>
          </button>

          {showOriginalImages && (
            <div className="px-4 sm:px-6 pb-4 sm:pb-6 border-t border-white/50">
              {/* Original Images */}
              {job.inputImages && job.inputImages.length > 0 && (
                <div className="pt-3 sm:pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Original Images</h4>
                  <ImageGallery imageUrls={job.inputImages} />
                </div>
              )}

              {/* Prompt Thread */}
              <div className="pt-4 sm:pt-6 space-y-2 sm:space-y-3">
                <h4 className="text-sm font-medium text-gray-700 mb-2 sm:mb-3">Prompt History</h4>

                {/* Version 1 Prompt */}
                {job.prompt && (
                  <div className="glass-subtle p-3 sm:p-4 rounded-xl">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
                      <span className="text-xs px-2 py-0.5 bg-brand-gradient text-white rounded-full font-medium shadow-glow">
                        Version 1
                      </span>
                      <span className="text-xs text-gray-600">
                        {new Date(job.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">{job.prompt}</p>
                  </div>
                )}

                {/* Re-edit Prompts */}
                {reEditJobs.map((reEdit, index) => (
                  reEdit.prompt && (
                    <div key={reEdit.id} className="glass-subtle p-3 sm:p-4 rounded-xl">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
                        <span className="text-xs px-2 py-0.5 bg-brand-gradient text-white rounded-full font-medium shadow-glow">
                          Version {index + 2}
                        </span>
                        <span className="text-xs text-gray-600">
                          {new Date(reEdit.createdAt).toLocaleDateString()}
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
                      <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">{reEdit.prompt}</p>
                    </div>
                  )
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Edited Images Gallery - Unified */}
        <div className="glass-card p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Edited Images</h3>
            <span className="text-xs px-2.5 py-1 bg-duma-primary/10 text-duma-primary ring-1 ring-inset ring-duma-primary/20 rounded-full font-medium">
              {allEditedImages.length} image{allEditedImages.length !== 1 ? 's' : ''} · {reEditJobs.length + 1} version{reEditJobs.length > 0 ? 's' : ''}
            </span>
          </div>

          {job.status === 'failed' && allEditedImages.length === 0 && (
            <div className="text-center py-8 bg-red-50/70 backdrop-blur-sm rounded-xl border border-red-200/60">
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

          {/* Unified Gallery - completed + streaming images with tags */}
          {allEditedImages.length > 0 && (
            <ImageGallery
              imageUrls={allEditedImages}
              onSelectionChange={setSelectedUrls}
              jobId={job.id}
              jobStatus={'completed'}
              enableExpand={true}
              onReEdit={(imageUrl) => {
                setSelectedImageForReEdit(imageUrl)
                setReEditModalOpen(true)
              }}
            />
          )}

          {/* Spinner tiles for images still being edited (streaming) */}
          {pendingImageCount > 0 && (
            <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 ${allEditedImages.length > 0 ? 'mt-3' : ''}`}>
              {Array.from({ length: pendingImageCount }).map((_, idx) => (
                <div key={idx} className="aspect-square rounded-xl border-2 border-dashed border-white/70 bg-white/30 backdrop-blur-sm flex flex-col items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-duma-primary/20 border-t-duma-primary mb-2" />
                  <p className="text-xs text-gray-500">Processing...</p>
                </div>
              ))}
            </div>
          )}

          {!isAnyProcessing && allEditedImages.length === 0 && job.status !== 'failed' && (
            <div className="text-center py-8 glass-subtle rounded-xl">
              <p className="text-gray-600">No images generated yet</p>
            </div>
          )}
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
