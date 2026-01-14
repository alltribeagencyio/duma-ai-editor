'use client'

import { memo } from 'react'
import { Check, Coins, HardDrive, Zap } from 'lucide-react'

interface MetricCardsProps {
  totalEnhanced: number
  creditsRemaining: number
  creditsUsed: number
  storageUsed: number // in MB
  engineStatus: 'ready' | 'busy' | 'offline'
  timeSaved?: number // in minutes
}

export const MetricCards = memo(function MetricCards({
  totalEnhanced,
  creditsRemaining,
  creditsUsed,
  storageUsed,
  engineStatus,
  timeSaved = 0,
}: MetricCardsProps) {
  const statusConfig = {
    ready: { color: 'text-green-500', bg: 'bg-green-50', text: 'Ready' },
    busy: { color: 'text-yellow-500', bg: 'bg-yellow-50', text: 'Processing' },
    offline: { color: 'text-red-500', bg: 'bg-red-50', text: 'Offline' },
  }

  const status = statusConfig[engineStatus]

  const metrics: Array<{
    label: string
    value: string
    icon: any
    color: string
    bg: string
    pulse?: boolean
    subtitle?: string
  }> = [
    {
      label: 'Credits Remaining',
      value: creditsRemaining.toLocaleString(),
      subtitle: `${creditsUsed} used this month`,
      icon: Coins,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      label: 'Images Enhanced',
      value: totalEnhanced.toLocaleString(),
      subtitle: 'Total processed',
      icon: Check,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'Time Saved',
      value: timeSaved >= 60
        ? `${Math.floor(timeSaved / 60)}h ${timeSaved % 60}m`
        : `${timeSaved}m`,
      subtitle: 'vs manual editing',
      icon: Zap,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Storage Used',
      value: `${storageUsed.toFixed(1)} MB`,
      subtitle: 'Cloud storage',
      icon: HardDrive,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6 mb-6">
      {metrics.map((metric) => {
        const Icon = metric.icon
        return (
          <div
            key={metric.label}
            className="bg-white rounded-lg border border-gray-100 p-3 md:p-4 lg:p-6 hover:border-duma-primary/20 transition-all hover:shadow-sm"
          >
            {/* Mobile: Centered layout */}
            <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
              <div className="flex items-center justify-center w-full lg:justify-between mb-2 lg:mb-2">
                <div className={`p-2 rounded-lg ${metric.bg}`}>
                  <Icon className={`h-4 w-4 md:h-5 md:w-5 ${metric.color}`} />
                </div>
                {metric.pulse && (
                  <span className="relative flex h-2 w-2 md:h-3 md:w-3 ml-auto hidden lg:flex">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-full w-full bg-green-500"></span>
                  </span>
                )}
              </div>
              <p className="text-xs md:text-sm text-gray-600 mb-1 lg:mb-1">{metric.label}</p>
              <p className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900">{metric.value}</p>
              {metric.subtitle && (
                <p className="text-[10px] md:text-xs text-gray-500 mt-0.5 lg:mt-1">{metric.subtitle}</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
})
