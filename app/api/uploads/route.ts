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

    const [uploadRows, jobs] = await Promise.all([
      prisma.upload.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.job.findMany({
        where: { userId: user.id },
        select: { id: true, inputImages: true, productName: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    type Entry = {
      url: string
      jobId: string | null
      productName: string | null
      createdAt: Date
      useCount: number
    }
    const map = new Map<string, Entry>()

    // 1. Seed with recorded uploads (every image that went to R2).
    for (const u of uploadRows) {
      if (!u.url) continue
      map.set(u.url, { url: u.url, jobId: null, productName: null, createdAt: u.createdAt, useCount: 0 })
    }

    // 2. Merge job usage: count reuse, attach product name, and backfill any
    //    historical uploads that predate the Upload table.
    for (const job of jobs) {
      for (const url of job.inputImages || []) {
        if (typeof url !== 'string' || !url) continue
        const existing = map.get(url)
        if (existing) {
          existing.useCount += 1
          if (!existing.productName) existing.productName = job.productName ?? null
          if (!existing.jobId) existing.jobId = job.id
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

    const uploads = Array.from(map.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    )

    return NextResponse.json({ uploads })
  } catch (error) {
    console.error('Error fetching uploads:', error)
    return NextResponse.json({ error: 'Failed to fetch uploads' }, { status: 500 })
  }
}
