import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// PUT /api/admin/prompts/preset/[id] - Update preset prompt (admin only)
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
    const { name, description, prompt, category, icon, order, isActive } = body

    // Check if prompt exists
    const existingPrompt = await prisma.promptPreset.findUnique({
      where: { id: params.id },
    })

    if (!existingPrompt) {
      return NextResponse.json({ error: 'Preset prompt not found' }, { status: 404 })
    }

    // Update prompt
    const updatedPrompt = await prisma.promptPreset.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(prompt !== undefined && { prompt }),
        ...(category !== undefined && { category }),
        ...(icon !== undefined && { icon }),
        ...(order !== undefined && { order }),
        ...(isActive !== undefined && { isActive }),
      },
    })

    // Log admin action
    await prisma.adminLog.create({
      data: {
        adminId: user.id,
        action: 'preset_prompt_update',
        targetType: 'preset_prompt',
        targetId: params.id,
        details: {
          changes: body,
        },
      },
    })

    return NextResponse.json({ prompt: updatedPrompt })
  } catch (error) {
    console.error('Error updating preset prompt:', error)
    return NextResponse.json(
      { error: 'Failed to update preset prompt' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/prompts/preset/[id] - Delete preset prompt (admin only)
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
    const prompt = await prisma.promptPreset.findUnique({
      where: { id: params.id },
    })

    if (!prompt) {
      return NextResponse.json({ error: 'Preset prompt not found' }, { status: 404 })
    }

    // Delete prompt
    await prisma.promptPreset.delete({
      where: { id: params.id },
    })

    // Log admin action
    await prisma.adminLog.create({
      data: {
        adminId: user.id,
        action: 'preset_prompt_delete',
        targetType: 'preset_prompt',
        targetId: params.id,
        details: {
          promptName: prompt.name,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting preset prompt:', error)
    return NextResponse.json(
      { error: 'Failed to delete preset prompt' },
      { status: 500 }
    )
  }
}
