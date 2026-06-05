'use client'

import { useState, useEffect } from 'react'
import { AdminSidebar } from './AdminSidebar'

interface AdminLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  userEmail?: string
}

export function AdminLayout({ children, title, subtitle, userEmail: initialUserEmail }: AdminLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('adminSidebarCollapsed')
      return saved === 'true'
    }
    return false
  })
  const [mounted, setMounted] = useState(false)
  const [userEmail, setUserEmail] = useState(initialUserEmail)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!initialUserEmail) {
      // Fetch user email if not provided
      fetch('/api/user/profile')
        .then(res => res.json())
        .then(data => {
          if (data.user?.email) {
            setUserEmail(data.user.email)
          }
        })
        .catch(err => console.error('Failed to fetch user email:', err))
    }
  }, [initialUserEmail])

  return (
    <div className="min-h-screen">
      <AdminSidebar
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
        userEmail={userEmail}
      />

      {/* Header */}
      <header className={`fixed top-0 right-0 h-16 glass-nav border-b z-40 ${mounted ? 'transition-all duration-300' : ''} ${
        sidebarCollapsed ? 'left-0 md:left-16' : 'left-0 md:left-64'
      }`}>
        <div className="h-full px-5 md:px-6 flex items-center">
          {title && (
            <div className="flex-1 min-w-0 pr-4">
              <h1 className="text-lg font-semibold text-gray-900 leading-tight truncate">{title}</h1>
              {subtitle && <p className="text-sm text-gray-500 mt-0.5 truncate">{subtitle}</p>}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className={`min-h-screen pt-16 ${mounted ? 'transition-all duration-300' : ''} ${
        sidebarCollapsed ? 'md:pl-16' : 'md:pl-64'
      }`}>
        <div className="px-5 md:px-6 py-6">{children}</div>
      </main>
    </div>
  )
}
