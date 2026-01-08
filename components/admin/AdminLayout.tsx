'use client'

import { useState, useEffect } from 'react'
import { AdminSidebar } from './AdminSidebar'

interface AdminLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  userEmail?: string
}

export function AdminLayout({ children, title, subtitle, userEmail }: AdminLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('adminSidebarCollapsed')
      return saved === 'true'
    }
    return false
  })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
        userEmail={userEmail}
      />

      {/* Header */}
      <header className={`fixed top-0 right-0 h-14 bg-white border-b border-gray-100 z-40 ${mounted ? 'transition-all duration-300' : ''} ${
        sidebarCollapsed ? 'left-0 md:left-16' : 'left-0 md:left-64'
      }`}>
        <div className="h-full px-4 md:px-5 flex items-center">
          {title && (
            <div className="flex-1 min-w-0 pr-4">
              <h1 className="text-base md:text-lg font-semibold text-gray-900 leading-tight truncate">{title}</h1>
              {subtitle && <p className="text-xs text-gray-500 mt-0.5 truncate">{subtitle}</p>}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className={`min-h-screen pt-14 ${mounted ? 'transition-all duration-300' : ''} ${
        sidebarCollapsed ? 'md:pl-16' : 'md:pl-64'
      }`}>
        <div className="px-4 md:px-5 py-4">{children}</div>
      </main>
    </div>
  )
}
