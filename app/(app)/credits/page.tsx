import dynamic from 'next/dynamic'

const CreditPurchaseClient = dynamic(
  () => import('@/components/credits/CreditPurchaseClient').then(mod => ({ default: mod.CreditPurchaseClient })),
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
  title: 'Purchase Credits - Duma AI',
  description: 'Purchase credits for your AI image editing needs'
}

export default function CreditsPage() {
  return <CreditPurchaseClient />
}
