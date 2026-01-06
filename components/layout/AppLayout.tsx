'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'

const Sidebar = dynamic(
  () => import('./Sidebar').then(mod => ({ default: mod.Sidebar })),
  { ssr: true }
)

const FloatingNotifications = dynamic(
  () => import('./FloatingNotifications').then(mod => ({ default: mod.FloatingNotifications })),
  { ssr: false }
)

interface AppLayoutProps {
  children: React.ReactNode
  userEmail?: string
  title?: string
  subtitle?: string
}

export function AppLayout({ children, userEmail, title, subtitle }: AppLayoutProps) {
  const [userId, setUserId] = useState<string | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Memoize Supabase client to avoid recreating on every render
  const supabase = useMemo(() => createClient(), [])

  // Load sidebar collapsed state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sidebarCollapsed')
    if (saved !== null) {
      setSidebarCollapsed(saved === 'true')
    }
  }, [])

  const fetchUser = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      setUserId(user.id)
    }
  }, [supabase])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  // Check for stale jobs every 15 minutes
  useEffect(() => {
    const checkStaleJobs = async () => {
      try {
        await fetch('/api/cron/check-stale-jobs')
      } catch (error) {
        console.error('Error checking stale jobs:', error)
      }
    }

    // Run immediately on mount
    checkStaleJobs()

    // Then run every 15 minutes
    const interval = setInterval(checkStaleJobs, 15 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        userEmail={userEmail}
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />

      {/* Top header bar */}
      <header
        className={`fixed top-0 right-0 h-24 bg-white border-b border-gray-200 z-40 transition-all duration-300 ${
          sidebarCollapsed ? 'left-0 md:left-20' : 'left-0 md:left-80'
        }`}
      >
        <div className="h-full px-8 flex items-center justify-between">
          {title && (
            <div className="py-2">
              <h1 className="text-2xl font-bold text-gray-900 leading-tight">{title}</h1>
              {subtitle && <p className="text-sm text-gray-600 mt-1.5">{subtitle}</p>}
            </div>
          )}
          <div className={`relative ${!title ? 'ml-auto' : ''}`}>
            {userId && <FloatingNotifications userId={userId} />}
          </div>
        </div>
      </header>

      <main
        className={`min-h-screen pt-[106px] transition-all duration-300 ${
          sidebarCollapsed ? 'md:pl-20' : 'md:pl-96'
        }`}
      >
        <div className="pl-8 pr-8 pt-5 pb-5">{children}</div>
      </main>
    </div>
  )
}
