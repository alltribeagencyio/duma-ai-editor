'use client'

import { useState, useEffect, memo, useCallback, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { Home, Plus, Clock, Settings, Menu, X, LogOut, FileText, ChevronLeft, ChevronRight, User, BarChart3, CreditCard, HelpCircle, Images } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

interface SidebarProps {
  userEmail?: string
  collapsed: boolean
  onCollapsedChange: (collapsed: boolean) => void
}

export const Sidebar = memo(function Sidebar({ userEmail, collapsed, onCollapsedChange }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  // Mark as mounted to enable transitions
  useEffect(() => {
    setMounted(true)
  }, [])

  // Check if user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const response = await fetch('/api/user/profile')
        if (response.ok) {
          const { user } = await response.json()
          setIsAdmin(user.isAdmin || user.isSuperAdmin)
        }
      } catch (error) {
        console.error('Error checking admin status:', error)
      }
    }
    checkAdmin()
  }, [])

  // Add scroll lock when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [mobileOpen])

  const toggleCollapsed = useCallback(() => {
    const newValue = !collapsed
    localStorage.setItem('sidebarCollapsed', String(newValue))
    onCollapsedChange(newValue)
  }, [collapsed, onCollapsedChange])

  const menuItems = useMemo(() => [
    { icon: Home, label: 'Dashboard', href: '/dashboard' },
    { icon: Plus, label: 'New Edit', href: '/new' },
    { icon: Images, label: 'Gallery', href: '/gallery' },
    { icon: FileText, label: 'Prompts', href: '/prompts' },
    { icon: Clock, label: 'History', href: '/history' },
    // { icon: BarChart3, label: 'Analytics', href: '/analytics' }, // Hidden for MVP
    // { icon: CreditCard, label: 'Subscription', href: '/subscription' }, // Hidden for MVP - manual billing
    { icon: User, label: 'Profile', href: '/profile' },
    { icon: HelpCircle, label: 'Help', href: '/help' },
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
      {/* Mobile menu button - aligned with header */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-2 left-2 z-50 md:hidden p-2 rounded-lg bg-white border border-gray-200 shadow-sm active:scale-95 transition-transform"
        aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
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
          'fixed left-0 top-0 z-40 h-full bg-white border-r border-gray-100 flex flex-col',
          mounted && 'transition-all duration-300',
          collapsed ? 'w-16' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {/* Header */}
        <div className={cn('p-4 flex items-center justify-between', collapsed && 'px-3')}>
          {!collapsed && (
            <div className="flex items-center justify-center w-full px-2">
              <Image
                src="/duma-logo.png"
                alt="Duma Logo"
                width={180}
                height={90}
                className="w-auto h-auto max-w-full max-h-16 object-contain"
                priority
              />
            </div>
          )}
          {collapsed && (
            <div className="flex items-center justify-center">
              <Image
                src="/duma-icon.png"
                alt="Duma"
                width={32}
                height={32}
                className="w-auto h-auto max-w-[32px] max-h-[32px] object-contain"
                priority
              />
            </div>
          )}
          {/* Collapse button - desktop only */}
          <button
            onClick={toggleCollapsed}
            className="hidden md:flex p-1.5 rounded-lg hover:bg-gray-50 transition-colors"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4 text-gray-500" /> : <ChevronLeft className="h-4 w-4 text-gray-500" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-2 space-y-0.5">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-200 text-sm',
                  isActive
                    ? 'bg-gradient-to-r from-duma-primary/10 to-duma-secondary/10 text-duma-primary border-l-2 border-duma-primary'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                  collapsed && 'justify-center px-2'
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {!collapsed && <span className="font-medium">{item.label}</span>}
              </Link>
            )
          })}

          {/* Admin Panel Access */}
          {isAdmin && (
            <>
              <Separator className="my-2" />
              <Link
                href="/admin/dashboard"
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-200 text-sm',
                  pathname.startsWith('/admin')
                    ? 'bg-gradient-to-r from-duma-primary to-duma-secondary text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gradient-to-r hover:from-duma-primary/5 hover:to-duma-secondary/5 hover:text-duma-primary border border-gray-100',
                  collapsed && 'justify-center px-2'
                )}
                title={collapsed ? 'Admin Panel' : undefined}
              >
                <Settings className="h-4 w-4 flex-shrink-0" />
                {!collapsed && <span className="font-medium">Admin Panel</span>}
              </Link>
            </>
          )}
        </nav>

        {/* Bottom section - Logout (pinned to bottom, replaces Activity Log) */}
        <div className={cn('mt-auto p-3 border-t border-gray-100', collapsed && 'px-2')}>
          <div className="space-y-2">
            {!collapsed ? (
              <>
                <div className="flex items-center gap-2 px-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-duma-primary to-duma-secondary flex items-center justify-center text-white font-medium text-xs">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-600 truncate">{userEmail}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="w-full justify-start text-gray-600 hover:text-duma-primary hover:bg-duma-primary/5 text-xs py-1.5 h-auto"
                >
                  <LogOut className="h-3.5 w-3.5 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-duma-primary to-duma-secondary flex items-center justify-center text-white font-medium text-xs cursor-pointer"
                  title={userEmail}
                >
                  {initials}
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1.5 hover:bg-duma-primary/5 hover:text-duma-primary rounded-lg transition-colors"
                  title="Logout"
                >
                  <LogOut className="h-3.5 w-3.5 text-gray-600" />
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  )
})
