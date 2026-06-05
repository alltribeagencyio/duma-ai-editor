'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

/**
 * Renders children into document.body via a portal so overlays/modals escape
 * any ancestor stacking context (e.g. elements using backdrop-blur / transform).
 * Without this, a `fixed` modal nested inside a glass card can be painted
 * beneath the fixed top nav. SSR-safe (renders nothing until mounted).
 */
export function ModalPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || typeof document === 'undefined') return null

  return createPortal(children, document.body)
}
