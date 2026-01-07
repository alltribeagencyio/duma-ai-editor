import dynamic from 'next/dynamic'

const SubscriptionClient = dynamic(
  () => import('@/components/subscription/SubscriptionClient').then(mod => ({ default: mod.SubscriptionClient })),
  {
    loading: () => (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900" />
      </div>
    ),
    ssr: false
  }
)

export default function SubscriptionPage() {
  return <SubscriptionClient />
}