'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  Users,
  Settings,
  MessageSquare,
  Webhook,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  LogOut,
  HeadphonesIcon,
  BarChart3
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AdminSidebarProps {
  collapsed: boolean
  onCollapsedChange: (collapsed: boolean) => void
  userEmail?: string
}

export function AdminSidebar({ collapsed, onCollapsedChange, userEmail }: AdminSidebarProps) {
  const pathname = usePathname()

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/dashboard' },
    { icon: Users, label: 'Users', href: '/admin/users' },
    { icon: Webhook, label: 'Webhooks', href: '/admin/webhooks' },
    { icon: MessageSquare, label: 'Prompts', href: '/admin/prompts' },
    { icon: HeadphonesIcon, label: 'Support', href: '/admin/support' },
    { icon: BarChart3, label: 'Analytics', href: '/admin/analytics' },
    { icon: Settings, label: 'Settings', href: '/admin/settings' },
  ]

  const toggleCollapsed = useCallback(() => {
    const newValue = !collapsed
    localStorage.setItem('adminSidebarCollapsed', String(newValue))
    onCollapsedChange(newValue)
  }, [collapsed, onCollapsedChange])

  return (
    <aside className={cn(
      'fixed left-0 top-0 z-40 h-full glass-nav border-r flex flex-col transition-all duration-300',
      collapsed ? 'w-16' : 'w-64'
    )}>
      {/* Header */}
      <div className={cn('p-4 flex items-center justify-between', collapsed && 'px-3')}>
        {!collapsed && (
          <div className="flex items-center justify-center w-full px-2">
            <Image
              src="/duma-logo-no-bg.png"
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
              src="/duma-icon-no-bg.png"
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
      <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all duration-200 text-sm',
                isActive
                  ? 'bg-gradient-to-r from-duma-primary/15 to-duma-secondary/15 text-duma-primary font-semibold shadow-glass-sm ring-1 ring-inset ring-white/60'
                  : 'text-gray-600 hover:bg-white/60 hover:text-duma-primary',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {!collapsed && <span className="font-medium">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* User Info & Exit */}
      <div className={cn('p-3 border-t border-gray-100', collapsed && 'px-2')}>
        <div className="space-y-2">
          {!collapsed ? (
            <>
              {userEmail && (
                <div className="flex items-center gap-2 px-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-duma-primary to-duma-secondary flex items-center justify-center text-white font-medium text-xs">
                    {userEmail.split('@')[0].slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-600 truncate">{userEmail}</p>
                  </div>
                </div>
              )}
              <Link
                href="/dashboard"
                className="w-full flex items-center justify-start gap-2 px-3 py-2 rounded-lg text-gray-600 hover:text-duma-primary hover:bg-duma-primary/5 text-sm transition-colors"
                title="Exit to User Panel"
              >
                <LogOut className="h-4 w-4" />
                <span>Exit Admin</span>
              </Link>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              {userEmail && (
                <div
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-duma-primary to-duma-secondary flex items-center justify-center text-white font-medium text-xs cursor-pointer"
                  title={userEmail}
                >
                  {userEmail.split('@')[0].slice(0, 2).toUpperCase()}
                </div>
              )}
              <Link
                href="/dashboard"
                className="p-1.5 hover:bg-duma-primary/5 hover:text-duma-primary rounded-lg transition-colors"
                title="Exit to User Panel"
              >
                <LogOut className="h-3.5 w-3.5 text-gray-600" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
