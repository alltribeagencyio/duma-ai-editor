import dynamic from 'next/dynamic'

const HistoryClient = dynamic(
  () => import('@/components/history/HistoryClient').then(mod => ({ default: mod.HistoryClient })),
  {
    loading: () => (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-duma-primary/20 border-t-duma-primary" />
      </div>
    ),
    ssr: true
  }
)

export default function HistoryPage() {
  return <HistoryClient />
}
