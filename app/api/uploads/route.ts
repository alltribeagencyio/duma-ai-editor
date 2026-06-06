import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/uploads - Distinct input images the user has uploaded across all jobs.
// Aggregated from job.inputImages (no separate uploads table needed).
export async function GET(_req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const jobs = await prisma.job.findMany({
      where: { userId: user.id },
      select: { id: true, inputImages: true, productName: true, createdAt: true },
      orderBy: { createdAt: 'desc' }, // newest first → first sighting is the most recent use
    })

    // Dedupe by URL, keeping the most recent use date and counting reuse.
    const map = new Map<
      string,
      { url: string; jobId: string; productName: string | null; createdAt: Date; useCount: number }
    >()

    for (const job of jobs) {
      for (const url of job.inputImages || []) {
        if (typeof url !== 'string' || !url) continue
        const existing = map.get(url)
        if (existing) {
          existing.useCount += 1
        } else {
          map.set(url, {
            url,
            jobId: job.id,
            productName: job.productName ?? null,
            createdAt: job.createdAt,
            useCount: 1,
          })
        }
      }
    }

    return NextResponse.json({ uploads: Array.from(map.values()) })
  } catch (error) {
    console.error('Error fetching uploads:', error)
    return NextResponse.json({ error: 'Failed to fetch uploads' }, { status: 500 })
  }
}
