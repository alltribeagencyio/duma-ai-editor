'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StepIndicatorProps {
  currentStep: 1 | 2 | 3
}

const steps = [
  { number: 1, label: 'Upload' },
  { number: 2, label: 'Prompt' },
  { number: 3, label: 'Review & Submit' },
]

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="bg-white border-b border-gray-200 py-8">
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
                      isCompleted && 'bg-gray-900 text-white',
                      isCurrent && 'border-2 border-gray-900 text-gray-900 bg-white',
                      isUpcoming && 'border-2 border-gray-300 text-gray-400 bg-white'
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
                      (isCompleted || isCurrent) && 'text-gray-900',
                      isUpcoming && 'text-gray-400'
                    )}
                  >
                    {step.label}
                  </span>
                </div>

                {/* Connecting line */}
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'flex-1 h-0.5 mx-4 transition-all duration-200',
                      isCompleted ? 'bg-gray-900' : 'bg-gray-300'
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
