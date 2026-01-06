'use client'

import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Notification {
  id: string
  title: string
  jobId: string
  createdAt: string
}

interface NotificationBellProps {
  userId: string
}

export function NotificationBell({ userId }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    // Request notification permission
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission()
      }
    }

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
              setUnreadCount((prev) => prev + 1)

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
    setUnreadCount(0)
  }

  return (
    <DropdownMenu onOpenChange={(open) => open && clearNotifications()}>
      <DropdownMenuTrigger asChild>
        <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell className="h-5 w-5 text-gray-600" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-80 bg-white shadow-lg border border-gray-200 rounded-lg z-50"
        sideOffset={8}
      >
        <div className="px-4 py-3 border-b border-gray-200 bg-white">
          <h3 className="font-semibold text-gray-900">Notifications</h3>
        </div>

        {notifications.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-500 bg-white">
            No notifications yet
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto bg-white divide-y divide-gray-200">
            {notifications.map((notification) => (
              <DropdownMenuItem key={notification.id} asChild>
                <Link
                  href={`/jobs/${notification.jobId}`}
                  className="flex flex-col items-start gap-1 px-4 py-4 hover:bg-gray-50 cursor-pointer bg-white transition-colors"
                >
                  <p className="text-sm font-medium text-gray-900">
                    {notification.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </Link>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
