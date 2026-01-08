import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// GET /api/admin/prompts/brand/[id] - Get single brand prompt (admin only)
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const prompt = await prisma.brandPrompt.findUnique({
      where: { id: params.id },
      include: {
        assignments: {
          include: {
            user: {
              select: {
                email: true,
                fullName: true,
              },
            },
          },
        },
      },
    })

    if (!prompt) {
      return NextResponse.json({ error: 'Brand prompt not found' }, { status: 404 })
    }

    return NextResponse.json({ prompt })
  } catch (error) {
    console.error('Error fetching brand prompt:', error)
    return NextResponse.json(
      { error: 'Failed to fetch brand prompt' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/prompts/brand/[id] - Update brand prompt (admin only)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { name, description, prompt, category, tags, industry, isActive } = body

    // Check if prompt exists
    const existingPrompt = await prisma.brandPrompt.findUnique({
      where: { id: params.id },
    })

    if (!existingPrompt) {
      return NextResponse.json({ error: 'Brand prompt not found' }, { status: 404 })
    }

    // Update prompt
    const updatedPrompt = await prisma.brandPrompt.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(prompt !== undefined && { prompt }),
        ...(category !== undefined && { category }),
        ...(tags !== undefined && { tags }),
        ...(industry !== undefined && { industry }),
        ...(isActive !== undefined && { isActive }),
        updatedAt: new Date(),
      },
    })

    // Log admin action
    await prisma.adminLog.create({
      data: {
        adminId: user.id,
        action: 'brand_prompt_update',
        targetType: 'brand_prompt',
        targetId: params.id,
        details: {
          changes: body,
        },
      },
    })

    return NextResponse.json({ prompt: updatedPrompt })
  } catch (error) {
    console.error('Error updating brand prompt:', error)
    return NextResponse.json(
      { error: 'Failed to update brand prompt' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/prompts/brand/[id] - Delete brand prompt (admin only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if prompt exists
    const prompt = await prisma.brandPrompt.findUnique({
      where: { id: params.id },
    })

    if (!prompt) {
      return NextResponse.json({ error: 'Brand prompt not found' }, { status: 404 })
    }

    // Delete all assignments first
    await prisma.brandPromptAssignment.deleteMany({
      where: { brandPromptId: params.id },
    })

    // Delete prompt
    await prisma.brandPrompt.delete({
      where: { id: params.id },
    })

    // Log admin action
    await prisma.adminLog.create({
      data: {
        adminId: user.id,
        action: 'brand_prompt_delete',
        targetType: 'brand_prompt',
        targetId: params.id,
        details: {
          promptName: prompt.name,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting brand prompt:', error)
    return NextResponse.json(
      { error: 'Failed to delete brand prompt' },
      { status: 500 }
    )
  }
}
