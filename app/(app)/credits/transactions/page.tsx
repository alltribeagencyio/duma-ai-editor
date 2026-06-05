import dynamic from 'next/dynamic'

const TransactionsClient = dynamic(
  () => import('@/components/credits/TransactionsClient').then(mod => ({ default: mod.TransactionsClient })),
  {
    loading: () => (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-duma-primary/20 border-t-duma-primary" />
      </div>
    ),
    ssr: false
  }
)

export const metadata = {
  title: 'Transaction History - Duma AI',
  description: 'View your credit transaction history'
}

export default function TransactionsPage() {
  return <TransactionsClient />
}
