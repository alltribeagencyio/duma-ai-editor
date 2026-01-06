import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/prompts/custom - Get all custom prompts for the authenticated user
export async function GET(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const customPrompts = await prisma.customPrompt.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ prompts: customPrompts })
  } catch (error) {
    console.error('Error fetching custom prompts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch custom prompts' },
      { status: 500 }
    )
  }
}

// POST /api/prompts/custom - Create a new custom prompt
export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, description, prompt, category } = await req.json()

    if (!name || !prompt) {
      return NextResponse.json(
        { error: 'Name and prompt are required' },
        { status: 400 }
      )
    }

    const customPrompt = await prisma.customPrompt.create({
      data: {
        userId: user.id,
        name,
        description: description || '',
        prompt,
        category: category || 'other',
      },
    })

    return NextResponse.json({ prompt: customPrompt }, { status: 201 })
  } catch (error) {
    console.error('Error creating custom prompt:', error)
    return NextResponse.json(
      { error: 'Failed to create custom prompt' },
      { status: 500 }
    )
  }
}
