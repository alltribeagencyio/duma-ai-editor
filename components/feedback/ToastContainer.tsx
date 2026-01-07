'use client'

import { useState, useCallback, useEffect } from 'react'
import { Toast, ToastProps, ToastType } from './Toast'

interface ToastData {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}

let toastCounter = 0
const toastListeners: ((toast: ToastData) => void)[] = []

export function showToast(type: ToastType, title: string, message?: string, duration?: number) {
  const id = `toast-${++toastCounter}-${Date.now()}`
  const toast: ToastData = { id, type, title, message, duration }
  toastListeners.forEach(listener => listener(toast))
  return id
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastData[]>([])

  const addToast = useCallback((toast: ToastData) => {
    setToasts(prev => [...prev, toast])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  useEffect(() => {
    toastListeners.push(addToast)
    return () => {
      const index = toastListeners.indexOf(addToast)
      if (index > -1) {
        toastListeners.splice(index, 1)
      }
    }
  }, [addToast])

  return (
    <div className="fixed top-4 right-4 z-[100] space-y-3 max-w-sm w-full pointer-events-none">
      <div className="space-y-3 pointer-events-auto">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            id={toast.id}
            type={toast.type}
            title={toast.title}
            message={toast.message}
            duration={toast.duration}
            onClose={removeToast}
          />
        ))}
      </div>
    </div>
  )
}
