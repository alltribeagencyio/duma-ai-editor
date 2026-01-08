import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// POST /api/admin/prompts/brand/assign - Assign brand prompt to users (admin only)
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
    const { brandPromptId, userIds } = body

    // Validate required fields
    if (!brandPromptId || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: brandPromptId, userIds (array)' },
        { status: 400 }
      )
    }

    // Check if brand prompt exists
    const brandPrompt = await prisma.brandPrompt.findUnique({
      where: { id: brandPromptId },
    })

    if (!brandPrompt) {
      return NextResponse.json({ error: 'Brand prompt not found' }, { status: 404 })
    }

    // Verify all users exist
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
    })

    if (users.length !== userIds.length) {
      return NextResponse.json(
        { error: 'One or more users not found' },
        { status: 404 }
      )
    }

    // Create assignments (skip if already exists)
    const assignments = await Promise.all(
      userIds.map((userId) =>
        prisma.brandPromptAssignment.upsert({
          where: {
            brandPromptId_userId: {
              brandPromptId,
              userId,
            },
          },
          create: {
            brandPromptId,
            userId,
            assignedBy: user.id,
          },
          update: {
            assignedBy: user.id,
          },
        })
      )
    )

    // Log admin action
    await prisma.adminLog.create({
      data: {
        adminId: user.id,
        action: 'brand_prompt_assign',
        targetType: 'brand_prompt',
        targetId: brandPromptId,
        details: {
          promptName: brandPrompt.name,
          userIds,
          userCount: userIds.length,
        },
      },
    })

    return NextResponse.json({
      success: true,
      assignments,
      count: assignments.length,
    })
  } catch (error) {
    console.error('Error assigning brand prompt:', error)
    return NextResponse.json(
      { error: 'Failed to assign brand prompt' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/prompts/brand/assign - Unassign brand prompt from users (admin only)
export async function DELETE(req: NextRequest) {
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
    const { brandPromptId, userIds } = body

    // Validate required fields
    if (!brandPromptId || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: brandPromptId, userIds (array)' },
        { status: 400 }
      )
    }

    // Delete assignments
    const result = await prisma.brandPromptAssignment.deleteMany({
      where: {
        brandPromptId,
        userId: { in: userIds },
      },
    })

    // Log admin action
    await prisma.adminLog.create({
      data: {
        adminId: user.id,
        action: 'brand_prompt_unassign',
        targetType: 'brand_prompt',
        targetId: brandPromptId,
        details: {
          userIds,
          userCount: userIds.length,
        },
      },
    })

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
    })
  } catch (error) {
    console.error('Error unassigning brand prompt:', error)
    return NextResponse.json(
      { error: 'Failed to unassign brand prompt' },
      { status: 500 }
    )
  }
}
