import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// This endpoint checks for jobs that have been in pending/processing state for more than 1 hour
// and marks them as failed
export async function GET(request: NextRequest) {
  try {
    // Calculate timestamp for 1 hour ago
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

    // Find stale jobs - either:
    // 1. Pending jobs created more than 1 hour ago (stuck in queue)
    // 2. Processing jobs that started more than 1 hour ago (taking too long)
    const staleJobs = await prisma.job.findMany({
      where: {
        OR: [
          // Pending jobs stuck in queue for over an hour
          {
            status: 'pending',
            createdAt: {
              lt: oneHourAgo,
            },
          },
          // Processing jobs taking more than an hour
          {
            status: 'processing',
            startedAt: {
              lt: oneHourAgo,
            },
          },
        ],
      },
    })

    console.log(`Found ${staleJobs.length} stale jobs to mark as failed`)

    // Update all stale jobs to failed status
    const updatePromises = staleJobs.map((job) => {
      const errorMessage =
        job.status === 'pending'
          ? 'Job timed out - stuck in pending queue for over 1 hour'
          : 'Job timed out - processing took longer than 1 hour to complete'

      return prisma.job.update({
        where: { id: job.id },
        data: {
          status: 'failed',
          errorMessage,
          completedAt: new Date(),
        },
      })
    })

    await Promise.all(updatePromises)

    return NextResponse.json({
      success: true,
      message: `Marked ${staleJobs.length} stale jobs as failed`,
      failedJobIds: staleJobs.map((job) => job.id),
    })
  } catch (error) {
    console.error('Error checking for stale jobs:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check for stale jobs',
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}
