'use client'

import { useState, useEffect } from 'react'
import { X, Ticket, Send, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { showToast } from '@/components/feedback/ToastContainer'

interface SupportTicketModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SupportTicketModal({ isOpen, onClose }: SupportTicketModalProps) {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [category, setCategory] = useState('general')
  const [priority, setPriority] = useState('normal')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setTimeout(() => {
        setSubject('')
        setMessage('')
        setCategory('general')
        setPriority('normal')
        setIsSuccess(false)
      }, 300)
    }
  }, [isOpen])

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      showToast('error', 'Error', 'Please fill in all required fields')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/support/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          message,
          category,
          priority
        })
      })

      if (response.ok) {
        setIsSuccess(true)
        showToast('success', 'Success', 'Support ticket created successfully')
        setTimeout(() => {
          onClose()
        }, 2000)
      } else {
        const error = await response.json()
        showToast('error', 'Error', error.error || 'Failed to create ticket')
      }
    } catch (error) {
      console.error('Error creating ticket:', error)
      showToast('error', 'Error', 'Failed to create ticket. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-panel max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        {isSuccess ? (
          // Success State
          <div className="text-center py-8">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-green-100 rounded-full">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">Ticket Created!</h3>
            <p className="text-gray-600 mb-4">
              We&apos;ve received your support ticket and will get back to you via email within 24 hours.
            </p>
            <p className="text-sm text-gray-500">
              You can close this window now.
            </p>
          </div>
        ) : (
          // Form State
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-duma-primary/10 ring-1 ring-inset ring-duma-primary/20 rounded-full">
                  <Ticket className="h-5 w-5 text-duma-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Create Support Ticket</h3>
                  <p className="text-sm text-gray-600">We&apos;ll respond within 24 hours</p>
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

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Subject *
                </label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief description of your issue"
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Category *
                  </label>
                  <Select value={category} onValueChange={setCategory} disabled={isSubmitting}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General Question</SelectItem>
                      <SelectItem value="technical">Technical Issue</SelectItem>
                      <SelectItem value="billing">Billing Question</SelectItem>
                      <SelectItem value="feature">Feature Request</SelectItem>
                      <SelectItem value="bug">Bug Report</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Priority
                  </label>
                  <Select value={priority} onValueChange={setPriority} disabled={isSubmitting}>
                    <SelectTrigger>
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

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Message *
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Please provide as much detail as possible..."
                  className="w-full min-h-[150px] p-3 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={isSubmitting}
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>Tip:</strong> Include any relevant details like error messages, screenshots,
                  or steps to reproduce the issue. This helps us resolve your ticket faster!
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !subject.trim() || !message.trim()}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Creating...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Create Ticket
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
