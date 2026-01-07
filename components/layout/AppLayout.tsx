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
        className={`fixed top-0 right-0 h-16 md:h-20 lg:h-24 bg-white border-b border-gray-200 z-40 transition-all duration-300 ${
          sidebarCollapsed ? 'left-0 md:left-20' : 'left-0 md:left-80'
        }`}
      >
        <div className="h-full px-4 md:px-6 lg:px-8 flex items-center justify-between">
          {title && (
            <div className="py-2 flex-1 min-w-0 pr-4">
              <h1 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 leading-tight truncate">{title}</h1>
              {subtitle && <p className="text-xs md:text-sm text-gray-600 mt-1 md:mt-1.5 truncate">{subtitle}</p>}
            </div>
          )}
          <div className={`relative flex-shrink-0 ${!title ? 'ml-auto' : ''}`}>
            {userId && <FloatingNotifications userId={userId} />}
          </div>
        </div>
      </header>

      <main
        className={`min-h-screen pt-16 md:pt-20 lg:pt-[106px] transition-all duration-300 ${
          sidebarCollapsed ? 'md:pl-20' : 'md:pl-80'
        }`}
      >
        <div className="px-4 md:px-6 lg:px-8 py-4 md:py-5">{children}</div>
      </main>
    </div>
  )
}
