import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// PATCH /api/prompts/custom/[id] - Update a custom prompt
export async function PATCH(
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

    const promptId = params.id

    // Verify the prompt belongs to the user
    const existingPrompt = await prisma.customPrompt.findUnique({
      where: { id: promptId },
    })

    if (!existingPrompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 })
    }

    if (existingPrompt.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { name, description, prompt, category } = await req.json()

    const updatedPrompt = await prisma.customPrompt.update({
      where: { id: promptId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(prompt && { prompt }),
        ...(category && { category }),
      },
    })

    return NextResponse.json({ prompt: updatedPrompt })
  } catch (error) {
    console.error('Error updating custom prompt:', error)
    return NextResponse.json(
      { error: 'Failed to update custom prompt' },
      { status: 500 }
    )
  }
}

// DELETE /api/prompts/custom/[id] - Delete a custom prompt
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

    const promptId = params.id

    // Verify the prompt belongs to the user
    const existingPrompt = await prisma.customPrompt.findUnique({
      where: { id: promptId },
    })

    if (!existingPrompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 })
    }

    if (existingPrompt.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    await prisma.customPrompt.delete({
      where: { id: promptId },
    })

    return NextResponse.json({ message: 'Prompt deleted successfully' })
  } catch (error) {
    console.error('Error deleting custom prompt:', error)
    return NextResponse.json(
      { error: 'Failed to delete custom prompt' },
      { status: 500 }
    )
  }
}
