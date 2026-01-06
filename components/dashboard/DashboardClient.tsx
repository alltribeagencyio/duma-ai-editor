'use client'

import { useState, useEffect } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { MetricCards } from './MetricCards'
import { RecentGallery } from './RecentGallery'
import { PromptLibrary } from './PromptLibrary'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Job {
  id: string
  status: string
  inputImages: string[]
  outputData: any
  prompt: string
  createdAt: string
}

export function DashboardClient() {
  const [userEmail, setUserEmail] = useState<string | undefined>(undefined)
  const [jobs, setJobs] = useState<Job[]>([])
  const [presetPrompts, setPresetPrompts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      setUserEmail(user.email)
      fetchData()
    }

    checkAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchData = async () => {
    try {
      const [jobsRes, presetsRes] = await Promise.all([
        fetch('/api/jobs'),
        fetch('/api/prompts/presets'),
      ])

      if (jobsRes.ok) {
        const { jobs } = await jobsRes.json()
        setJobs(jobs)
      }

      if (presetsRes.ok) {
        const { prompts } = await presetsRes.json()
        setPresetPrompts(prompts)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate metrics
  const completedJobs = jobs.filter((job) => job.status === 'completed')
  const totalEnhanced = completedJobs.reduce((acc, job) => {
    const imageCount = Array.isArray(job.outputData)
      ? job.outputData.length
      : job.outputData?.images?.length || 0
    return acc + imageCount
  }, 0)

  const timeSaved = totalEnhanced * 20 // 20 minutes per image (est. prep, shoot & editing)

  // Calculate storage (rough estimate based on number of images)
  const storageUsed = totalEnhanced * 2.5 // Assume ~2.5MB per image

  // Engine status based on recent activity
  const hasRecentActivity = jobs.some((job) => {
    const createdAt = new Date(job.createdAt)
    const now = new Date()
    const diffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60)
    return diffMinutes < 60 && (job.status === 'pending' || job.status === 'processing')
  })

  const engineStatus = hasRecentActivity ? 'busy' : 'ready'

  // Get recent edits (last 8 completed jobs)
  const recentEdits = completedJobs.slice(0, 8).map((job) => {
    const editedImages = Array.isArray(job.outputData)
      ? job.outputData
      : job.outputData?.images || []

    return {
      id: job.id,
      editedImages,
      originalImages: job.inputImages,
      prompt: job.prompt,
      createdAt: job.createdAt,
    }
  })

  // Get unique prompts for My Library
  const myPrompts = Array.from(
    new Set(
      jobs
        .filter((job) => job.prompt && job.status === 'completed')
        .map((job) => job.prompt)
    )
  )

  const handleUsePrompt = (prompt: string) => {
    localStorage.setItem('reusedPrompt', prompt)
    router.push('/new?step=2&reuse=true')
  }

  if (isLoading) {
    return (
      <AppLayout userEmail={userEmail}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900" />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout
      userEmail={userEmail}
      title="Dashboard"
      subtitle="Welcome back! Here's your editing overview."
    >
      <div className="w-full max-w-screen-2xl mx-auto">
        {/* Metrics */}
        <MetricCards
          totalEnhanced={totalEnhanced}
          timeSaved={timeSaved}
          storageUsed={storageUsed}
          engineStatus={engineStatus}
        />

        {/* Recent Gallery */}
        <RecentGallery recentEdits={recentEdits} />

        {/* Prompt Library */}
        <PromptLibrary
          myPrompts={myPrompts}
          presetPrompts={presetPrompts}
          onUsePrompt={handleUsePrompt}
        />
      </div>
    </AppLayout>
  )
}
