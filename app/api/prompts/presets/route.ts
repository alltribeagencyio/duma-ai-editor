import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/prompts/presets - Get all active preset prompts
export async function GET(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const presetPrompts = await prisma.promptPreset.findMany({
      where: { isActive: true },
      orderBy: [{ category: 'asc' }, { order: 'asc' }],
    })

    // Get favorites for current user to mark which are favorited
    const favorites = await prisma.promptFavorite.findMany({
      where: {
        userId: user.id,
        promptType: 'preset',
      },
    })

    const favoriteIds = new Set(favorites.map(f => f.promptId))

    const promptsWithFavorites = presetPrompts.map(prompt => ({
      ...prompt,
      isFavorited: favoriteIds.has(prompt.id),
    }))

    return NextResponse.json({ prompts: promptsWithFavorites })
  } catch (error) {
    console.error('Error fetching preset prompts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch preset prompts' },
      { status: 500 }
    )
  }
}
