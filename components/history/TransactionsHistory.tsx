'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowDownCircle, ArrowUpCircle, Gift, RefreshCw, FileText, ChevronLeft, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'

interface Transaction {
  id: string
  type: string
  amount: number
  creditsAdded?: number
  creditsDeducted?: number
  balanceBefore: number
  balanceAfter: number
  pricingPlan?: string
  ratePerImage?: number
  description?: string
  createdAt: string
}

export function TransactionsHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalTransactions, setTotalTransactions] = useState(0)

  const ITEMS_PER_PAGE = 10

  useEffect(() => {
    fetchTransactions()
  }, [currentPage])

  const fetchTransactions = async () => {
    try {
      setIsLoading(true)
      const offset = (currentPage - 1) * ITEMS_PER_PAGE
      const response = await fetch(`/api/credits/transactions?limit=${ITEMS_PER_PAGE}&offset=${offset}`)
      if (response.ok) {
        const { transactions: fetchedTransactions, total } = await response.json()
        setTransactions(fetchedTransactions)
        setTotalTransactions(total)
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const totalPages = Math.ceil(totalTransactions / ITEMS_PER_PAGE)

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return <ArrowUpCircle className="h-5 w-5 text-green-600" />
      case 'deduction':
        return <ArrowDownCircle className="h-5 w-5 text-red-600" />
      case 'refund':
        return <RefreshCw className="h-5 w-5 text-blue-600" />
      case 'bonus':
        return <Gift className="h-5 w-5 text-purple-600" />
      default:
        return <FileText className="h-5 w-5 text-gray-600" />
    }
  }

  const getTransactionBadgeColor = (type: string) => {
    switch (type) {
      case 'purchase':
        return 'bg-green-100 text-green-800'
      case 'deduction':
        return 'bg-red-100 text-red-800'
      case 'refund':
        return 'bg-blue-100 text-blue-800'
      case 'bonus':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading && transactions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-duma-primary/20 border-t-duma-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          {transactions.length === 0 && !isLoading ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No transactions yet</p>
              <p className="text-sm text-gray-500">
                Purchase credits to start editing images
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-start gap-4 p-4 rounded-xl glass-subtle hover:bg-white/70 transition-colors"
                >
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {getTransactionIcon(transaction.type)}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {transaction.description || `${transaction.type} transaction`}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {format(new Date(transaction.createdAt), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                      <Badge className={getTransactionBadgeColor(transaction.type)}>
                        {transaction.type}
                      </Badge>
                    </div>

                    {/* Amount */}
                    <div className="flex items-center gap-4 mt-2 text-sm flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">Amount:</span>
                        <span className={`font-semibold ${
                          transaction.type === 'purchase' || transaction.type === 'bonus'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}>
                          {transaction.type === 'purchase' || transaction.type === 'bonus' ? '+' : '-'}
                          ${Math.abs(transaction.amount).toFixed(2)}
                        </span>
                      </div>

                      {transaction.creditsAdded && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">Credits Added:</span>
                          <span className="font-medium text-green-600">
                            +{Math.floor(transaction.creditsAdded)} images
                          </span>
                        </div>
                      )}

                      {transaction.creditsDeducted && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">Credits Used:</span>
                          <span className="font-medium text-red-600">
                            {transaction.creditsDeducted.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Balance Change */}
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                      <span>Balance:</span>
                      <span>${transaction.balanceBefore.toFixed(2)}</span>
                      <span>→</span>
                      <span className="font-medium text-gray-700">
                        ${transaction.balanceAfter.toFixed(2)}
                      </span>
                    </div>

                    {/* Rate Info */}
                    {transaction.ratePerImage && (
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        <span>Rate: ${transaction.ratePerImage}/image</span>
                        {transaction.pricingPlan && (
                          <>
                            <span>•</span>
                            <span className="capitalize">{transaction.pricingPlan} Plan</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t mt-6">
                  <div className="text-sm text-gray-600">
                    Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, totalTransactions)} of {totalTransactions} transactions
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1 || isLoading}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <div className="text-sm text-gray-600 px-2">
                      Page {currentPage} of {totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages || isLoading}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
