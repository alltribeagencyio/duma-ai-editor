'use client'

import { useState, useEffect } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProfileForm } from './ProfileForm'
import { SubscriptionCard } from './SubscriptionCard'
import { CreditUsageCard } from './CreditUsageCard'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface UserProfile {
  id: string
  email: string
  fullName?: string
  phone?: string
  brandName?: string
  brandIndustry?: string
  brandAesthetic?: string
  brandColors?: string[]
  brandRequirements?: string
  subscriptionTier: string
  subscriptionStatus: string
  monthlyCredits: number
  practiceCredits: number
  creditsUsed: number
  notificationsEmail: boolean
  notificationsWhatsApp: boolean
  whatsappNumber?: string
  language: string
  timezone: string
  hasCompletedOnboarding: boolean
  setupFeesPaid: boolean
}

export function ProfileClient() {
  const [userEmail, setUserEmail] = useState<string | undefined>(undefined)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
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
      fetchProfile()
    }

    checkAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const { user } = await response.json()
        console.log('Profile loaded:', user)
        setProfile(user)
        setError(null)
      } else {
        const errorText = await response.text()
        console.error('Profile fetch failed:', response.status, errorText)
        setError(`Failed to load profile: ${response.status}`)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      setError('Network error: Could not load profile')
    } finally {
      setIsLoading(false)
    }
  }

  const handleProfileUpdate = async (updateData: Partial<UserProfile>) => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        const { user } = await response.json()
        setProfile(user)
      } else {
        console.error('Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
    } finally {
      setIsSaving(false)
    }
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

  if (error || !profile) {
    return (
      <AppLayout userEmail={userEmail}>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <div className="p-4 text-sm text-red-600 bg-red-50 rounded-lg max-w-md">
            {error || 'Failed to load profile. Please check your database connection.'}
          </div>
          <button
            onClick={() => {
              setIsLoading(true)
              setError(null)
              fetchProfile()
            }}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
          >
            Retry
          </button>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout
      userEmail={userEmail}
      title="Profile & Settings"
      subtitle="Manage your account, preferences, and subscription"
    >
      <div className="w-full max-w-screen-2xl mx-auto space-y-8">
        {/* Account Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <SubscriptionCard profile={profile} />
          <CreditUsageCard profile={profile} />
        </div>

        {/* Profile Form */}
        <ProfileForm
          profile={profile}
          onUpdate={handleProfileUpdate}
          isSaving={isSaving}
        />
      </div>
    </AppLayout>
  )
}