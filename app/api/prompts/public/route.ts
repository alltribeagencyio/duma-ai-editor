import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// GET /api/prompts/public - Get all public prompts from Duma Prompt Library
export async function GET(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const publicPrompts = await prisma.customPrompt.findMany({
      where: { isPublic: true },
      orderBy: { createdAt: 'desc' },
    })

    // Get favorites for current user to mark which are favorited
    const favorites = await prisma.promptFavorite.findMany({
      where: {
        userId: user.id,
        promptType: 'public',
      },
    })

    const favoriteIds = new Set(favorites.map(f => f.promptId))

    const promptsWithFavorites = publicPrompts.map(prompt => ({
      ...prompt,
      isFavorited: favoriteIds.has(prompt.id),
    }))

    return NextResponse.json({ prompts: promptsWithFavorites })
  } catch (error) {
    console.error('Error fetching public prompts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch public prompts' },
      { status: 500 }
    )
  }
}
