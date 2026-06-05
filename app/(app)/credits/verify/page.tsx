import dynamic from 'next/dynamic'

const CreditVerifyClient = dynamic(
  () => import('@/components/credits/CreditVerifyClient').then(mod => ({ default: mod.CreditVerifyClient })),
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
  title: 'Verify Payment - Duma AI',
  description: 'Verifying your credit purchase'
}

export default function CreditVerifyPage() {
  return <CreditVerifyClient />
}
