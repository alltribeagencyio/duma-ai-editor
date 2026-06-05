'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Send, User, Headphones, Clock, Ticket, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { showToast } from '@/components/feedback/ToastContainer'
import { ModalPortal } from '@/components/ui/modal-portal'

interface TicketMessage {
  id: string
  senderId: string
  senderEmail: string
  senderName: string | null
  senderRole: string
  message: string
  createdAt: string
}

interface SupportTicket {
  id: string
  userId: string
  userEmail: string
  userName: string | null
  subject: string
  message: string
  category: string
  priority: string
  status: string
  createdAt: string
  updatedAt: string
  messages: TicketMessage[]
}

interface TicketDetailModalProps {
  ticket: SupportTicket
  onClose: () => void
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'open':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'in_progress':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'awaiting_customer':
      return 'bg-purple-100 text-purple-800 border-purple-200'
    case 'resolved':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'closed':
      return 'bg-gray-100 text-gray-800 border-gray-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'open':
      return <AlertCircle className="h-4 w-4" />
    case 'in_progress':
      return <Clock className="h-4 w-4" />
    case 'awaiting_customer':
      return <Send className="h-4 w-4" />
    case 'resolved':
    case 'closed':
      return <CheckCircle className="h-4 w-4" />
    default:
      return <Ticket className="h-4 w-4" />
  }
}

const formatStatus = (status: string) => {
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function TicketDetailModal({ ticket: initialTicket, onClose }: TicketDetailModalProps) {
  const [ticket, setTicket] = useState<SupportTicket>(initialTicket)
  const [replyMessage, setReplyMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [ticket.messages])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Refresh ticket data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshTicket()
    }, 30000)

    return () => clearInterval(interval)
  }, [ticket.id])

  const refreshTicket = async () => {
    setIsRefreshing(true)
    try {
      const response = await fetch(`/api/support/tickets/${ticket.id}`)
      if (response.ok) {
        const data = await response.json()
        setTicket(data.ticket)
      }
    } catch (error) {
      console.error('Error refreshing ticket:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleSendReply = async () => {
    if (!replyMessage.trim() || isSending) return

    if (ticket.status === 'closed') {
      showToast('error', 'Error', 'Cannot reply to a closed ticket')
      return
    }

    setIsSending(true)

    try {
      const response = await fetch(`/api/support/tickets/${ticket.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: replyMessage })
      })

      if (response.ok) {
        const data = await response.json()
        // Refresh the ticket to get updated messages
        await refreshTicket()
        setReplyMessage('')
        showToast('success', 'Success', 'Reply sent successfully')
      } else {
        const error = await response.json()
        showToast('error', 'Error', error.error || 'Failed to send reply')
      }
    } catch (error) {
      console.error('Error sending reply:', error)
      showToast('error', 'Error', 'Failed to send reply. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendReply()
    }
  }

  // Combine initial message with conversation messages
  const allMessages = [
    {
      id: 'initial',
      senderId: ticket.userId,
      senderEmail: ticket.userEmail,
      senderName: ticket.userName,
      senderRole: 'user',
      message: ticket.message,
      createdAt: ticket.createdAt,
    },
    ...ticket.messages,
  ]

  return (
    <ModalPortal>
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-2 md:p-4">
      <div className="glass-panel max-w-4xl w-full flex flex-col max-h-[95vh] md:max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-4 md:p-6 border-b border-white/50">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-2">
              <Ticket className="h-5 w-5 flex-shrink-0 text-gray-600" />
              <h2 className="text-lg md:text-xl font-semibold break-words text-gray-900">{ticket.subject}</h2>
            </div>
            <div className="flex flex-wrap gap-2 items-center text-sm">
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(ticket.status)}`}>
                {getStatusIcon(ticket.status)}
                {formatStatus(ticket.status)}
              </span>
              <span className="text-gray-500 text-xs">
                Created {new Date(ticket.createdAt).toLocaleDateString()}
              </span>
              {isRefreshing && (
                <span className="text-gray-400 text-xs flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Refreshing...
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1 hover:bg-white/60 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-white/20">
          {allMessages.map((msg, index) => {
            const isSupport = msg.senderRole === 'admin' || msg.senderRole === 'support'
            const isSystem = msg.senderRole === 'system'

            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isSupport || isSystem ? 'flex-row' : 'flex-row-reverse'}`}
              >
                <div className={`flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center ${
                  isSupport
                    ? 'bg-gray-700 text-white'
                    : isSystem
                    ? 'bg-gray-400 text-white'
                    : 'bg-gray-900 text-white'
                }`}>
                  {isSupport ? (
                    <Headphones className="h-4 w-4 md:h-5 md:w-5" />
                  ) : (
                    <User className="h-4 w-4 md:h-5 md:w-5" />
                  )}
                </div>
                <div className={`flex-1 max-w-[85%] md:max-w-[80%]`}>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      {isSupport
                        ? msg.senderName || 'Support Team'
                        : isSystem
                        ? 'System'
                        : msg.senderName || 'You'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(msg.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className={`rounded-2xl p-3 md:p-4 ${
                    isSupport
                      ? 'glass-card text-gray-900'
                      : isSystem
                      ? 'glass-subtle text-gray-900'
                      : 'bg-brand-gradient text-white shadow-glow'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Reply Input */}
        <div className="p-4 md:p-6 border-t border-white/50">
          {ticket.status === 'closed' ? (
            <div className="text-center py-4 glass-subtle rounded-xl">
              <p className="text-sm text-gray-600">
                This ticket is closed. To continue the conversation, please create a new ticket.
              </p>
            </div>
          ) : ticket.status === 'resolved' ? (
            <div className="space-y-3">
              <div className="text-center py-2 glass-subtle rounded-xl">
                <p className="text-sm text-gray-600">
                  This ticket has been marked as resolved. You can still reply if you need further assistance.
                </p>
              </div>
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your reply..."
                  disabled={isSending}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendReply}
                  disabled={!replyMessage.trim() || isSending}
                  className="bg-gray-900 hover:bg-gray-800"
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your reply..."
                disabled={isSending}
                className="flex-1"
              />
              <Button
                onClick={handleSendReply}
                disabled={!replyMessage.trim() || isSending}
                className="bg-gray-900 hover:bg-gray-800"
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
    </ModalPortal>
  )
}
