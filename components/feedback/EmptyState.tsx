'use client'

import { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
  children?: ReactNode
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  children
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4 text-center', className)}>
      <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 md:h-10 md:w-10 text-gray-400" />
      </div>

      <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">
        {title}
      </h3>

      <p className="text-sm md:text-base text-gray-600 mb-6 max-w-md">
        {description}
      </p>

      {action && (
        <Button onClick={action.onClick}>
          {action.label}
        </Button>
      )}

      {children}
    </div>
  )
}
