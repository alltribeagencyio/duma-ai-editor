'use client'

import { useEffect, useState, memo } from 'react'
import { Bell, X } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface Notification {
  id: string
  title: string
  jobId: string
  createdAt: string
}

interface FloatingNotificationsProps {
  userId: string
}

export const FloatingNotifications = memo(function FloatingNotifications({ userId }: FloatingNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Request notification permission
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission()
      }
    }

    // Load viewed notifications from localStorage
    const viewedNotifications = new Set<string>(
      JSON.parse(localStorage.getItem('viewedNotifications') || '[]')
    )

    // Track completed job IDs to avoid duplicate notifications
    const completedJobIds = new Set<string>()

    // Poll for completed jobs every 5 seconds
    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/jobs')
        if (response.ok) {
          const { jobs } = await response.json()

          // Check for newly completed jobs
          jobs.forEach((job: any) => {
            if (job.status === 'completed' && !completedJobIds.has(job.id)) {
              completedJobIds.add(job.id)
              console.log('🔔 Job completed notification:', job.id)

              const notification: Notification = {
                id: job.id,
                title: 'Your images are ready!',
                jobId: job.id,
                createdAt: new Date().toISOString(),
              }

              setNotifications((prev) => [notification, ...prev])

              // Only increment unread count if not viewed before
              if (!viewedNotifications.has(job.id)) {
                setUnreadCount((prev) => prev + 1)
              }

              // Show browser notification if permitted
              if (typeof window !== 'undefined' && 'Notification' in window) {
                if (window.Notification.permission === 'granted') {
                  new window.Notification('AI Image Editor', {
                    body: 'Your images have been edited and are ready to download!',
                    icon: '/icon.png',
                  })
                }
              }
            }
          })
        }
      } catch (error) {
        console.error('Error polling for notifications:', error)
      }
    }, 5000) // Poll every 5 seconds

    return () => {
      clearInterval(interval)
    }
  }, [userId])

  const clearNotifications = () => {
    // Mark all current notifications as viewed
    const notificationIds = notifications.map((n) => n.id)
    const existingViewed = JSON.parse(localStorage.getItem('viewedNotifications') || '[]')
    const updatedViewed = Array.from(new Set([...existingViewed, ...notificationIds]))
    localStorage.setItem('viewedNotifications', JSON.stringify(updatedViewed))
    setUnreadCount(0)
  }

  return (
    <>
      {/* Top notification button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen)
          if (!isOpen) {
            clearNotifications()
          }
        }}
        className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="h-5 w-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification panel */}
      <div
        className={cn(
          'absolute top-12 right-0 z-50 w-96 bg-white shadow-2xl rounded-lg border border-gray-200 transition-all duration-300',
          isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
          <h3 className="font-semibold text-gray-900">Notifications</h3>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
          >
            <X className="h-4 w-4 text-gray-600" />
          </button>
        </div>

        {/* Notifications list */}
        <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-500">
              No notifications yet
            </div>
          ) : (
            notifications.map((notification, index) => (
              <Link
                key={notification.id}
                href={`/jobs/${notification.jobId}`}
                onClick={() => setIsOpen(false)}
                className={cn(
                  'block px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors',
                  index !== notifications.length - 1 && 'border-b border-gray-100'
                )}
              >
                <p className="text-sm font-medium text-gray-900">
                  {notification.title}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(notification.createdAt).toLocaleString()}
                </p>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-30 bg-black/20"
        />
      )}
    </>
  )
})
