import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const userProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { isAdmin: true }
    })

    if (!userProfile?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get all jobs with user email
    const jobs = await prisma.job.findMany({
      select: {
        id: true,
        userId: true,
        status: true,
        createdAt: true,
        completedAt: true,
        inputImages: true,
        creditsCost: true,
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 100 // Limit to last 100 jobs
    })

    // Get user emails
    const userIds = Array.from(new Set(jobs.map(j => j.userId)))
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true }
    })

    const userMap = new Map(users.map(u => [u.id, u.email]))

    const jobsWithEmail = jobs.map(job => ({
      ...job,
      userEmail: userMap.get(job.userId),
      creditsCharged: job.creditsCost || job.inputImages.length
    }))

    return NextResponse.json({ jobs: jobsWithEmail })
  } catch (error) {
    console.error('Error fetching jobs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    )
  }
}
