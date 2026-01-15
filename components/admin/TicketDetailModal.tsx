'use client'

import { useState, useEffect } from 'react'
import { X, Send, User, Mail, Calendar, Tag, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { showToast } from '@/components/feedback/ToastContainer'

interface TicketUser {
  id: string
  email: string
  fullName: string | null
  brandName: string | null
}

interface TicketDetails {
  id: string
  userId: string
  userEmail: string
  subject: string
  message: string
  category: string
  priority: string
  status: string
  response: string | null
  createdAt: string
  resolvedAt: string | null
  respondedAt: string | null
  respondedBy: string | null
  resolvedBy: string | null
  user?: TicketUser
}

interface TicketDetailModalProps {
  ticketId: string | null
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void
}

export function TicketDetailModal({ ticketId, isOpen, onClose, onUpdate }: TicketDetailModalProps) {
  const [ticket, setTicket] = useState<TicketDetails | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [responseText, setResponseText] = useState('')
  const [newStatus, setNewStatus] = useState('')
  const [newPriority, setNewPriority] = useState('')

  useEffect(() => {
    if (isOpen && ticketId) {
      fetchTicketDetails()
    }
  }, [isOpen, ticketId])

  const fetchTicketDetails = async () => {
    if (!ticketId) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/support/tickets/${ticketId}`)
      if (response.ok) {
        const data = await response.json()
        setTicket(data.ticket)
        setNewStatus(data.ticket.status)
        setNewPriority(data.ticket.priority)
        setResponseText(data.ticket.response || '')
      } else {
        showToast('error', 'Error', 'Failed to load ticket details')
      }
    } catch (error) {
      console.error('Error fetching ticket:', error)
      showToast('error', 'Error', 'Failed to load ticket details')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateTicket = async () => {
    if (!ticketId) return

    setIsSubmitting(true)
    try {
      const updates: any = {}

      if (newStatus !== ticket?.status) {
        updates.status = newStatus
      }
      if (newPriority !== ticket?.priority) {
        updates.priority = newPriority
      }
      if (responseText && responseText !== ticket?.response) {
        updates.response = responseText
      }

      const response = await fetch(`/api/admin/support/tickets/${ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (response.ok) {
        showToast('success', 'Success', 'Ticket updated successfully')
        await fetchTicketDetails()
        onUpdate()
      } else {
        const error = await response.json()
        showToast('error', 'Error', error.error || 'Failed to update ticket')
      }
    } catch (error) {
      console.error('Error updating ticket:', error)
      showToast('error', 'Error', 'Failed to update ticket')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'resolved':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'closed':
        return 'bg-gray-100 text-gray-700 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-200'
      case 'normal':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'low':
        return 'bg-gray-100 text-gray-700 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-full">
              <Mail className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Ticket Details</h3>
              <p className="text-sm text-gray-600">ID: {ticketId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900" />
            </div>
          ) : ticket ? (
            <>
              {/* User Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  User Information
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Name:</span>
                    <span className="ml-2 font-medium">{ticket.user?.fullName || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <span className="ml-2 font-medium">{ticket.userEmail}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Brand:</span>
                    <span className="ml-2 font-medium">{ticket.user?.brandName || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Submitted:</span>
                    <span className="ml-2 font-medium">
                      {new Date(ticket.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Ticket Details */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Subject</h4>
                <p className="text-gray-700 font-medium">{ticket.subject}</p>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Message</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-wrap">{ticket.message}</p>
                </div>
              </div>

              {/* Status & Priority Management */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Category</label>
                  <div className={`px-3 py-2 rounded-lg border ${getPriorityColor('normal')} capitalize`}>
                    {ticket.category}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Status</label>
                  <Select value={newStatus} onValueChange={setNewStatus} disabled={isSubmitting}>
                    <SelectTrigger className={getStatusColor(newStatus)}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Priority</label>
                  <Select value={newPriority} onValueChange={setNewPriority} disabled={isSubmitting}>
                    <SelectTrigger className={getPriorityColor(newPriority)}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Response Section */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  Admin Response
                </label>
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Type your response to the user..."
                  className="w-full min-h-[150px] p-3 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={isSubmitting}
                />
                {ticket.respondedAt && (
                  <p className="text-xs text-gray-500 mt-2">
                    Last responded: {new Date(ticket.respondedAt).toLocaleString()}
                  </p>
                )}
              </div>

              {/* Info Messages */}
              {ticket.status === 'resolved' || ticket.status === 'closed' ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-900">Ticket {ticket.status}</p>
                    {ticket.resolvedAt && (
                      <p className="text-xs text-green-700 mt-1">
                        Resolved on {new Date(ticket.resolvedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900">Action Required</p>
                    <p className="text-xs text-blue-700 mt-1">
                      Review the ticket and provide a response. User will be notified via email.
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-gray-500 py-12">
              Failed to load ticket details
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t bg-gray-50">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpdateTicket}
            disabled={isSubmitting || !ticket}
            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Updating...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Update Ticket
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
