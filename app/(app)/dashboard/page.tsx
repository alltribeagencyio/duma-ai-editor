import dynamic from 'next/dynamic'

const DashboardClient = dynamic(
  () => import('@/components/dashboard/DashboardClient').then(mod => ({ default: mod.DashboardClient })),
  {
    loading: () => (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900" />
      </div>
    ),
    ssr: true
  }
)

export default function DashboardPage() {
  return <DashboardClient />
}
