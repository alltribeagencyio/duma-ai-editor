import dynamic from 'next/dynamic'

const DashboardClient = dynamic(
  () => import('@/components/dashboard/DashboardClient').then(mod => ({ default: mod.DashboardClient })),
  {
    loading: () => (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-duma-primary/20 border-t-duma-primary" />
      </div>
    ),
    ssr: true
  }
)

export default function DashboardPage() {
  return <DashboardClient />
}
