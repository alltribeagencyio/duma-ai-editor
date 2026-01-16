import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// GET /api/prompts/favorites - Get user's favorited prompts
export async function GET(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const favorites = await prisma.promptFavorite.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    })

    // Fetch actual prompt data based on favorites
    const promptsData = await Promise.all(
      favorites.map(async (fav) => {
        let prompt = null
        if (fav.promptType === 'preset') {
          prompt = await prisma.promptPreset.findUnique({
            where: { id: fav.promptId },
          })
          if (prompt) {
            return { ...prompt, isFavorited: true, favoriteType: 'preset' }
          }
        } else if (fav.promptType === 'custom') {
          prompt = await prisma.customPrompt.findUnique({
            where: { id: fav.promptId },
          })
          if (prompt) {
            return { ...prompt, isFavorited: true, favoriteType: 'custom' }
          }
        } else if (fav.promptType === 'brand') {
          prompt = await prisma.brandPrompt.findUnique({
            where: { id: fav.promptId },
          })
          if (prompt) {
            return { ...prompt, isFavorited: true, favoriteType: 'brand' }
          }
        } else if (fav.promptType === 'public') {
          prompt = await prisma.customPrompt.findUnique({
            where: { id: fav.promptId, isPublic: true },
          })
          if (prompt) {
            return { ...prompt, isFavorited: true, favoriteType: 'public' }
          }
        }
        return null
      })
    )

    const validPrompts = promptsData.filter((p) => p !== null)

    return NextResponse.json({ prompts: validPrompts })
  } catch (error) {
    console.error('Error fetching favorite prompts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch favorite prompts' },
      { status: 500 }
    )
  }
}

// POST /api/prompts/favorites - Add prompt to favorites
export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { promptId, promptType } = await req.json()

    if (!promptId || !promptType) {
      return NextResponse.json(
        { error: 'promptId and promptType are required' },
        { status: 400 }
      )
    }

    const favorite = await prisma.promptFavorite.create({
      data: {
        userId: user.id,
        promptId,
        promptType,
      },
    })

    return NextResponse.json({ favorite })
  } catch (error: any) {
    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Prompt already favorited' },
        { status: 409 }
      )
    }
    console.error('Error adding favorite:', error)
    return NextResponse.json(
      { error: 'Failed to add favorite' },
      { status: 500 }
    )
  }
}

// DELETE /api/prompts/favorites - Remove prompt from favorites
export async function DELETE(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const promptId = searchParams.get('promptId')
    const promptType = searchParams.get('promptType')

    if (!promptId || !promptType) {
      return NextResponse.json(
        { error: 'promptId and promptType are required' },
        { status: 400 }
      )
    }

    await prisma.promptFavorite.deleteMany({
      where: {
        userId: user.id,
        promptId,
        promptType,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing favorite:', error)
    return NextResponse.json(
      { error: 'Failed to remove favorite' },
      { status: 500 }
    )
  }
}
