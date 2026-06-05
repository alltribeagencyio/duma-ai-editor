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

const SupportProvider = dynamic(
  () => import('../support/SupportProvider').then(mod => ({ default: mod.SupportProvider })),
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Initialize from localStorage immediately to prevent flash
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebarCollapsed')
      return saved === 'true'
    }
    return false
  })
  const [mounted, setMounted] = useState(false)

  // Memoize Supabase client to avoid recreating on every render
  const supabase = useMemo(() => createClient(), [])

  // Mark as mounted to enable transitions after initial render
  useEffect(() => {
    setMounted(true)
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
    <div className="min-h-screen">
      <Sidebar
        userEmail={userEmail}
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />

      {/* Top header bar - z-30 to be below sidebar z-50 */}
      <header
        className={`fixed top-0 right-0 h-12 md:h-16 glass-nav border-b z-30 ${mounted ? 'transition-all duration-300' : ''} ${
          sidebarCollapsed ? 'left-0 md:left-16' : 'left-0 md:left-64'
        }`}
      >
        {/* Mobile: center title, Desktop: left align */}
        <div className="h-full pl-12 pr-4 md:px-6 flex items-center md:justify-between">
          {title && (
            <div className="flex-1 min-w-0 pr-3 md:pr-4 text-center md:text-left">
              <h1 className="text-base md:text-lg font-semibold text-gray-900 leading-tight truncate">{title}</h1>
              {subtitle && <p className="text-xs md:text-sm text-gray-500 mt-0.5 truncate hidden sm:block">{subtitle}</p>}
            </div>
          )}
          <div className={`relative flex-shrink-0 ${!title ? 'ml-auto' : 'absolute right-4 md:relative md:right-0'}`}>
            {userId && <FloatingNotifications userId={userId} />}
          </div>
        </div>
      </header>

      <main
        className={`min-h-screen pt-12 md:pt-16 ${mounted ? 'transition-all duration-300' : ''} ${
          sidebarCollapsed ? 'md:pl-16' : 'md:pl-64'
        }`}
      >
        {/* Apple-inspired padding: tighter on mobile, generous on desktop */}
        <div className="px-3 md:px-6 lg:px-8 py-3 md:py-6">{children}</div>
      </main>

      {/* Support Chat & Ticket Modal */}
      <SupportProvider />
    </div>
  )
}
