import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/presets - Get all active prompt presets
export async function GET(req: NextRequest) {
  try {
    const presets = await prisma.promptPreset.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    })

    // Public, rarely-changing data — cache at the edge with stale-while-revalidate.
    return NextResponse.json(
      { presets },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    )
  } catch (error) {
    console.error('Error fetching presets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch presets' },
      { status: 500 }
    )
  }
}
