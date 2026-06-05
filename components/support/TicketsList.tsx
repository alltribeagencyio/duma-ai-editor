'use client'

import { useState, useEffect } from 'react'
import { Ticket, MessageCircle, Clock, CheckCircle, AlertCircle, Plus, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { showToast } from '@/components/feedback/ToastContainer'
import { TicketDetailModal } from './TicketDetailModal'

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
      return <MessageCircle className="h-4 w-4" />
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

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'technical':
      return 'bg-red-50 text-red-700 border-red-200'
    case 'billing':
      return 'bg-green-50 text-green-700 border-green-200'
    case 'feature':
      return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'bug':
      return 'bg-orange-50 text-orange-700 border-orange-200'
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200'
  }
}

export function TicketsList() {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)

  const fetchTickets = async () => {
    setIsLoading(true)
    try {
      const url = statusFilter === 'all'
        ? '/api/support/tickets'
        : `/api/support/tickets?status=${statusFilter}`

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setTickets(data.tickets)
      } else {
        showToast('error', 'Error', 'Failed to load tickets')
      }
    } catch (error) {
      console.error('Error fetching tickets:', error)
      showToast('error', 'Error', 'Failed to load tickets')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTickets()
  }, [statusFilter])

  const handleCreateTicket = () => {
    window.dispatchEvent(new CustomEvent('openSupportTicket'))
  }

  const handleTicketClick = (ticket: SupportTicket) => {
    setSelectedTicket(ticket)
  }

  const handleCloseModal = () => {
    setSelectedTicket(null)
    fetchTickets() // Refresh tickets list
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tickets...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex items-center gap-3">
            <Filter className="h-5 w-5 text-gray-500" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tickets</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="awaiting_customer">Awaiting Response</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleCreateTicket}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Ticket
          </Button>
        </div>

        {/* Tickets List */}
        {tickets.length === 0 ? (
          <div className="text-center py-12 glass-card">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-2xl glass-subtle glass-highlight text-duma-primary/70">
                <Ticket className="h-12 w-12" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No tickets found</h3>
            <p className="text-gray-600 mb-6">
              {statusFilter === 'all'
                ? "You haven't created any support tickets yet."
                : `No ${formatStatus(statusFilter).toLowerCase()} tickets.`}
            </p>
            <Button onClick={handleCreateTicket}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Ticket
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => handleTicketClick(ticket)}
                className="glass-card glass-interactive p-6 cursor-pointer"
              >
                <div className="flex flex-col sm:flex-row gap-4 justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="p-2 bg-duma-primary/10 ring-1 ring-inset ring-duma-primary/20 rounded-xl flex-shrink-0">
                        <Ticket className="h-5 w-5 text-duma-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1 break-words">
                          {ticket.subject}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-2 break-words">
                          {ticket.message}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(ticket.status)}`}>
                        {getStatusIcon(ticket.status)}
                        {formatStatus(ticket.status)}
                      </span>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getCategoryColor(ticket.category)}`}>
                        {ticket.category}
                      </span>
                      {ticket.messages.length > 0 && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                          <MessageCircle className="h-3 w-3" />
                          {ticket.messages.length} {ticket.messages.length === 1 ? 'reply' : 'replies'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-start sm:items-end gap-2 flex-shrink-0 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </div>
                    {ticket.updatedAt !== ticket.createdAt && (
                      <div className="text-xs text-gray-400">
                        Updated {new Date(ticket.updatedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          onClose={handleCloseModal}
        />
      )}
    </>
  )
}
