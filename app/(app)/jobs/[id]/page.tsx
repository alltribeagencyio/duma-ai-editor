import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import dynamic from 'next/dynamic'

const JobDetailClient = dynamic(
  () => import('@/components/job-detail/JobDetailClient').then(mod => ({ default: mod.JobDetailClient })),
  {
    loading: () => (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900" />
      </div>
    ),
    ssr: true
  }
)

interface JobDetailPageProps {
  params: Promise<{ id: string }> | { id: string }
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const resolvedParams = await Promise.resolve(params)

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return notFound()
  }

  const job = await prisma.job.findUnique({
    where: { id: resolvedParams.id },
  })

  if (!job || job.userId !== user.id) {
    return notFound()
  }

  // Serialize the job data to pass to client component
  const serializedJob = {
    ...job,
    createdAt: job.createdAt.toISOString(),
    startedAt: job.startedAt?.toISOString() || null,
    completedAt: job.completedAt?.toISOString() || null,
  }

  return <JobDetailClient initialJob={serializedJob} />
}
