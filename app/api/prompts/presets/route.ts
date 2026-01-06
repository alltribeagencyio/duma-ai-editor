import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/prompts/presets - Get all active preset prompts
export async function GET(req: NextRequest) {
  try {
    const presetPrompts = await prisma.promptPreset.findMany({
      where: { isActive: true },
      orderBy: [{ category: 'asc' }, { order: 'asc' }],
    })

    return NextResponse.json({ prompts: presetPrompts })
  } catch (error) {
    console.error('Error fetching preset prompts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch preset prompts' },
      { status: 500 }
    )
  }
}
