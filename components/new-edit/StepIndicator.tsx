'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StepIndicatorProps {
  currentStep: 1 | 2 | 3
}

const steps = [
  { number: 1, label: 'Upload', mobileLabel: 'Upload' },
  { number: 2, label: 'Prompt', mobileLabel: 'Prompt' },
  { number: 3, label: 'Review & Submit', mobileLabel: 'Review' },
]

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="glass-card py-8 mb-6">
      <div className="max-w-2xl mx-auto px-4">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isCompleted = step.number < currentStep
            const isCurrent = step.number === currentStep
            const isUpcoming = step.number > currentStep

            return (
              <div key={step.number} className="flex items-center flex-1">
                {/* Step circle */}
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all duration-200',
                      isCompleted && 'bg-brand-gradient text-white shadow-glow',
                      isCurrent && 'border-2 border-duma-primary text-duma-primary bg-white/70 backdrop-blur-sm shadow-glass-sm',
                      isUpcoming && 'border-2 border-white/70 text-gray-400 bg-white/40 backdrop-blur-sm'
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <span>{step.number}</span>
                    )}
                  </div>
                  <span
                    className={cn(
                      'mt-2 text-sm font-medium',
                      (isCompleted || isCurrent) && 'text-duma-primary',
                      isUpcoming && 'text-gray-400'
                    )}
                  >
                    <span className="hidden sm:inline">{step.label}</span>
                    <span className="inline sm:hidden">{step.mobileLabel}</span>
                  </span>
                </div>

                {/* Connecting line */}
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'flex-1 h-0.5 mx-4 transition-all duration-200',
                      isCompleted ? 'bg-brand-gradient' : 'bg-gray-200'
                    )}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
