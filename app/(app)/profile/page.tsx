import dynamic from 'next/dynamic'

const ProfileClient = dynamic(
  () => import('@/components/profile/ProfileClient').then(mod => ({ default: mod.ProfileClient })),
  {
    loading: () => (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900" />
      </div>
    ),
    ssr: false
  }
)

export default function ProfilePage() {
  return <ProfileClient />
}