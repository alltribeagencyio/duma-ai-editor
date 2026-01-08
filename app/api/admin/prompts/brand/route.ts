import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// GET /api/admin/prompts/brand - Get all brand prompts (admin only)
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

    // Get query parameters
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const isActive = searchParams.get('isActive')

    // Build query
    const where: any = {}
    if (category) {
      where.category = category
    }
    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }

    const prompts = await prisma.brandPrompt.findMany({
      where,
      orderBy: [
        { isActive: 'desc' },
        { usageCount: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    return NextResponse.json({ prompts })
  } catch (error) {
    console.error('Error fetching brand prompts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch brand prompts' },
      { status: 500 }
    )
  }
}

// POST /api/admin/prompts/brand - Create brand prompt (admin only)
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
    const { name, description, prompt, category, industry, isActive = true } = body

    // Validate required fields
    if (!name || !prompt) {
      return NextResponse.json(
        { error: 'Missing required fields: name, prompt' },
        { status: 400 }
      )
    }

    // Create brand prompt
    const brandPrompt = await prisma.brandPrompt.create({
      data: {
        name,
        description,
        prompt,
        category,
        industry,
        createdBy: user.id,
        isActive,
        usageCount: 0,
      },
    })

    // Log admin action
    await prisma.adminLog.create({
      data: {
        adminId: user.id,
        action: 'brand_prompt_create',
        targetType: 'brand_prompt',
        targetId: brandPrompt.id,
        details: {
          promptName: name,
          category,
        },
      },
    })

    return NextResponse.json({ prompt: brandPrompt }, { status: 201 })
  } catch (error) {
    console.error('Error creating brand prompt:', error)
    return NextResponse.json(
      { error: 'Failed to create brand prompt' },
      { status: 500 }
    )
  }
}
