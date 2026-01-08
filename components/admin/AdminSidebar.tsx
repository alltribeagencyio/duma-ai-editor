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
      'fixed left-0 top-0 z-40 h-full bg-gradient-to-b from-duma-primary to-duma-secondary border-r border-gray-100 flex flex-col transition-all duration-300',
      collapsed ? 'w-16' : 'w-64'
    )}>
      {/* Header */}
      <div className={cn('p-4 flex items-center justify-between border-b border-white/10', collapsed && 'px-3 flex-col gap-2')}>
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8 flex-shrink-0">
              <Image
                src="/duma-logo.png"
                alt="Duma Logo"
                width={32}
                height={32}
                className="object-contain"
                priority
              />
            </div>
            <div className="text-white">
              <div className="text-base font-bold">Admin Panel</div>
              <div className="text-xs opacity-80">Duma AI</div>
            </div>
          </div>
        ) : (
          <div className="relative w-8 h-8">
            <Image
              src="/duma-logo.png"
              alt="Duma Logo"
              width={32}
              height={32}
              className="object-contain"
              priority
            />
          </div>
        )}
        <button
          onClick={toggleCollapsed}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
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
                'flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all text-sm',
                isActive
                  ? 'bg-white text-duma-primary font-medium shadow-sm'
                  : 'text-white/90 hover:bg-white/10',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* User Info & Exit */}
      <div className="p-3 border-t border-white/10">
        {!collapsed && userEmail && (
          <div className="px-3 py-2 mb-2 text-white/80 text-xs truncate">
            {userEmail}
          </div>
        )}
        <Link
          href="/dashboard"
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg text-white/90 hover:bg-white/10 transition-colors text-sm',
            collapsed && 'justify-center px-2'
          )}
          title={collapsed ? 'Exit to User Panel' : undefined}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span>Exit Admin</span>}
        </Link>
      </div>
    </aside>
  )
}
