import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// GET /api/admin/prompts/preset - Get all preset prompts (admin only)
export async function GET(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const userProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { isAdmin: true, isSuperAdmin: true },
    })

    if (!userProfile?.isAdmin && !userProfile?.isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const prompts = await prisma.presetPrompt.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ prompts })
  } catch (error) {
    console.error('Error fetching preset prompts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch preset prompts' },
      { status: 500 }
    )
  }
}

// POST /api/admin/prompts/preset - Create preset prompt (admin only)
export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const userProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { isAdmin: true, isSuperAdmin: true },
    })

    if (!userProfile?.isAdmin && !userProfile?.isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { name, description, prompt, category, industry, tags, imageUrl } = body

    // Validate required fields
    if (!name || !prompt) {
      return NextResponse.json(
        { error: 'Missing required fields: name, prompt' },
        { status: 400 }
      )
    }

    // Create preset prompt
    const presetPrompt = await prisma.presetPrompt.create({
      data: {
        name,
        description,
        prompt,
        category,
        industry,
        tags,
        imageUrl,
      },
    })

    // Log admin action
    await prisma.adminLog.create({
      data: {
        adminId: user.id,
        action: 'preset_prompt_create',
        targetType: 'preset_prompt',
        targetId: presetPrompt.id,
        details: {
          promptName: name,
          category,
        },
      },
    })

    return NextResponse.json({ prompt: presetPrompt }, { status: 201 })
  } catch (error) {
    console.error('Error creating preset prompt:', error)
    return NextResponse.json(
      { error: 'Failed to create preset prompt' },
      { status: 500 }
    )
  }
}
