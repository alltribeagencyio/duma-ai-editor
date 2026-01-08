'use client'

import { memo } from 'react'
import { Check, Coins, HardDrive, Zap } from 'lucide-react'

interface MetricCardsProps {
  totalEnhanced: number
  creditsRemaining: number
  creditsUsed: number
  storageUsed: number // in MB
  engineStatus: 'ready' | 'busy' | 'offline'
}

export const MetricCards = memo(function MetricCards({
  totalEnhanced,
  creditsRemaining,
  creditsUsed,
  storageUsed,
  engineStatus,
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
      label: 'Total Enhanced',
      value: totalEnhanced.toLocaleString(),
      icon: Check,
      color: 'text-duma-secondary',
      bg: 'bg-duma-secondary/10',
    },
    {
      label: 'Credits Remaining',
      value: creditsRemaining.toLocaleString(),
      subtitle: `${creditsUsed} credits used`,
      icon: Coins,
      color: 'text-duma-primary',
      bg: 'bg-duma-primary/10',
    },
    {
      label: 'Storage Used',
      value: `${storageUsed.toFixed(1)} MB`,
      icon: HardDrive,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
    {
      label: 'Engine Status',
      value: status.text,
      icon: Zap,
      color: status.color,
      bg: status.bg,
      pulse: engineStatus === 'ready',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {metrics.map((metric) => {
        const Icon = metric.icon
        return (
          <div
            key={metric.label}
            className="bg-white rounded-lg border border-gray-100 p-6 hover:border-duma-primary/20 transition-all hover:shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 rounded-lg ${metric.bg}`}>
                <Icon className={`h-5 w-5 ${metric.color}`} />
              </div>
              {metric.pulse && (
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-1">{metric.label}</p>
            <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
            {metric.subtitle && (
              <p className="text-xs text-gray-500 mt-1">{metric.subtitle}</p>
            )}
          </div>
        )
      })}
    </div>
  )
})
