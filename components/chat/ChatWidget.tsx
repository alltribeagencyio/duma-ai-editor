'use client'

import { useState, useEffect } from 'react'
import { MessageCircle } from 'lucide-react'
import { ChatWindow } from './ChatWindow'

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Listen for custom events to open chat
    const handleOpenChat = () => setIsOpen(true)
    window.addEventListener('openChat', handleOpenChat)

    return () => {
      window.removeEventListener('openChat', handleOpenChat)
    }
  }, [])

  return (
    <>
      {/* Chat Window */}
      {isOpen && <ChatWindow onClose={() => setIsOpen(false)} />}

      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 p-4 bg-brand-gradient text-white rounded-full shadow-glow hover:shadow-glow-lg transition-all duration-200 hover:scale-110"
          aria-label="Open chat"
        >
          <MessageCircle className="h-6 w-6" />
          {/* Notification dot */}
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full border-2 border-white animate-pulse" />
        </button>
      )}
    </>
  )
}
