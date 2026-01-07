'use client'

import { useState, useEffect, memo, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home, Plus, Clock, Settings, Menu, X, LogOut, FileText, ChevronLeft, ChevronRight, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ActivityLog } from './ActivityLog'
import { cn } from '@/lib/utils'

interface SidebarProps {
  userEmail?: string
  collapsed: boolean
  onCollapsedChange: (collapsed: boolean) => void
}

export const Sidebar = memo(function Sidebar({ userEmail, collapsed, onCollapsedChange }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const toggleCollapsed = useCallback(() => {
    const newValue = !collapsed
    localStorage.setItem('sidebarCollapsed', String(newValue))
    onCollapsedChange(newValue)
  }, [collapsed, onCollapsedChange])

  const menuItems = useMemo(() => [
    { icon: Home, label: 'Dashboard', href: '/dashboard' },
    { icon: Plus, label: 'New Edit', href: '/new' },
    { icon: FileText, label: 'Prompts', href: '/prompts' },
    { icon: Clock, label: 'History', href: '/history' },
    { icon: User, label: 'Profile', href: '/profile' },
  ], [])

  const handleLogout = useCallback(async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }, [router])

  const initials = useMemo(() => userEmail
    ? userEmail
        .split('@')[0]
        .slice(0, 2)
        .toUpperCase()
    : 'U', [userEmail])

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-lg bg-white border border-gray-200 shadow-sm"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-full bg-white border-r border-gray-200 flex flex-col transition-all duration-300',
          collapsed ? 'w-20' : 'w-80',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {/* Header */}
        <div className={cn('p-6 flex items-center justify-between', collapsed && 'px-4')}>
          {!collapsed && (
            <div>
              <h1 className="text-xl font-bold text-gray-900">Duma AI</h1>
              <p className="text-sm text-gray-600">Image Editor</p>
            </div>
          )}
          {/* Collapse button - desktop only */}
          <button
            onClick={toggleCollapsed}
            className="hidden md:flex p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                  isActive
                    ? 'bg-gray-100 text-gray-900 border-l-3 border-gray-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                  collapsed && 'justify-center px-2'
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span className="font-medium">{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Activity Log - hide when collapsed */}
        {!collapsed && <ActivityLog />}

        {/* Bottom section */}
        <div className={cn('p-4 border-t border-gray-200', collapsed && 'px-2')}>
          <div className="space-y-3">
            {!collapsed ? (
              <>
                <div className="flex items-center gap-3 px-2">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-medium">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-600 truncate">{userEmail}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="w-full justify-start text-gray-600 hover:text-gray-900"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-medium cursor-pointer"
                  title={userEmail}
                >
                  {initials}
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4 text-gray-600" />
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  )
})
