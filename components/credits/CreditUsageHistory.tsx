'use client'

import { AppLayout } from '@/components/layout/AppLayout'
import { ArrowLeft, Calendar, CreditCard, TrendingDown } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

interface CreditUsage {
  id: string
  jobId: string | null
  amount: number
  type: string
  description: string | null
  createdAt: Date
}

interface CreditUsageHistoryProps {
  userEmail?: string
  totalCredits: number
  usedCredits: number
  availableCredits: number
  creditsReset: Date | null
  creditHistory: CreditUsage[]
}

export function CreditUsageHistory({
  userEmail,
  totalCredits,
  usedCredits,
  availableCredits,
  creditsReset,
  creditHistory,
}: CreditUsageHistoryProps) {
  return (
    <AppLayout userEmail={userEmail} title="Credit Usage History" subtitle="View your credit transactions and usage">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Button */}
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-duma-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Profile
        </Link>

        {/* Credit Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-card glass-interactive p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-blue-50 ring-1 ring-inset ring-white/50 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{totalCredits}</div>
                <div className="text-xs text-gray-600">Total Credits</div>
              </div>
            </div>
          </div>

          <div className="glass-card glass-interactive p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-green-50 ring-1 ring-inset ring-white/50 flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{availableCredits}</div>
                <div className="text-xs text-gray-600">Available</div>
              </div>
            </div>
          </div>

          <div className="glass-card glass-interactive p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-red-50 ring-1 ring-inset ring-white/50 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{usedCredits}</div>
                <div className="text-xs text-gray-600">Used This Month</div>
              </div>
            </div>
          </div>
        </div>

        {/* Reset Date */}
        {creditsReset && (
          <div className="bg-duma-secondary/10 border border-duma-secondary/20 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center gap-2 text-sm text-duma-secondary-dark">
              <Calendar className="h-4 w-4" />
              <span>Credits reset on: <strong>{format(new Date(creditsReset), 'MMMM d, yyyy')}</strong></span>
            </div>
          </div>
        )}

        {/* Transaction History */}
        <div className="glass-card overflow-hidden">
          <div className="px-6 py-4 border-b border-white/50">
            <h2 className="text-lg font-semibold text-gray-900">Transaction History</h2>
            <p className="text-sm text-gray-600 mt-1">All credit usage transactions</p>
          </div>

          <div className="divide-y divide-white/40">
            {creditHistory.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">No credit usage yet</p>
                <p className="text-sm text-gray-500 mt-1">Start creating edits to see your credit history</p>
              </div>
            ) : (
              creditHistory.map((transaction) => (
                <div key={transaction.id} className="px-6 py-4 hover:bg-white/40 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          transaction.type === 'new_job' ? 'bg-blue-500' :
                          transaction.type === 're_edit' ? 'bg-purple-500' :
                          'bg-gray-400'
                        }`} />
                        <div>
                          <div className="font-medium text-gray-900">
                            {transaction.description || 'Credit usage'}
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-gray-500">
                              {format(new Date(transaction.createdAt), 'MMM d, yyyy • h:mm a')}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              transaction.type === 'new_job' ? 'bg-blue-50 text-blue-700' :
                              transaction.type === 're_edit' ? 'bg-purple-50 text-purple-700' :
                              'bg-gray-50 text-gray-700'
                            }`}>
                              {transaction.type === 'new_job' ? 'New Job' :
                               transaction.type === 're_edit' ? 'Re-edit' :
                               transaction.type}
                            </span>
                            {transaction.jobId && (
                              <Link
                                href={`/history/${transaction.jobId}`}
                                className="text-xs text-duma-primary hover:underline"
                              >
                                View Job
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-red-600">
                        -{transaction.amount}
                      </div>
                      <div className="text-xs text-gray-500">
                        {transaction.amount === 1 ? 'credit' : 'credits'}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Help Text */}
        <div className="glass-subtle rounded-xl p-4">
          <p className="text-sm text-gray-700">
            <strong>Note:</strong> Credits are deducted only when your image edit completes successfully.
            Failed jobs do not consume credits.
          </p>
        </div>
      </div>
    </AppLayout>
  )
}
