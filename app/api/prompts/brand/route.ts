import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// GET /api/prompts/brand - Get user's brand prompts
export async function GET(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const brandPrompts = await prisma.brandPrompt.findMany({
      where: {
        userId: user.id,
        isActive: true
      },
      orderBy: [{ category: 'asc' }, { usageCount: 'desc' }],
    })

    return NextResponse.json({ prompts: brandPrompts })
  } catch (error) {
    console.error('Error fetching brand prompts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch brand prompts' },
      { status: 500 }
    )
  }
}

// POST /api/prompts/brand - Create a new brand prompt
export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, description, prompt, category, industry } = body

    if (!name || !prompt) {
      return NextResponse.json(
        { error: 'Name and prompt are required' },
        { status: 400 }
      )
    }

    // Check user's subscription tier for brand prompt limits
    const userProfile = await prisma.user.findUnique({
      where: { id: user.id }
    })

    if (!userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Count existing brand prompts
    const existingCount = await prisma.brandPrompt.count({
      where: {
        userId: user.id,
        isActive: true
      }
    })

    // Check limits based on subscription tier
    const limits: { [key: string]: number } = {
      free: 3,
      starter: 10,
      pro: 30,
      enterprise: 100
    }

    const userLimit = limits[userProfile.subscriptionTier] || 3
    if (existingCount >= userLimit) {
      return NextResponse.json(
        { error: `Brand prompt limit reached for ${userProfile.subscriptionTier} plan (${userLimit} max)` },
        { status: 400 }
      )
    }

    const brandPrompt = await prisma.brandPrompt.create({
      data: {
        userId: user.id,
        name,
        description: description || '',
        prompt,
        category: category || 'brand',
        industry,
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