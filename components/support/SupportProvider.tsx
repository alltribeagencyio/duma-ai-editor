'use client'

import { useState, useEffect } from 'react'
import { ChatWidget } from '@/components/chat/ChatWidget'
import { SupportTicketModal } from './SupportTicketModal'

export function SupportProvider() {
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false)

  useEffect(() => {
    // Listen for custom events to open ticket modal
    const handleOpenTicket = () => setIsTicketModalOpen(true)
    window.addEventListener('openSupportTicket', handleOpenTicket)

    return () => {
      window.removeEventListener('openSupportTicket', handleOpenTicket)
    }
  }, [])

  return (
    <>
      <ChatWidget />
      <SupportTicketModal
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
      />
    </>
  )
}
