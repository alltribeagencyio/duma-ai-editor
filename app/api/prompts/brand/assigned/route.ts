import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// GET /api/prompts/brand/assigned - Get assigned brand prompts for current user
export async function GET(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get assigned brand prompts for this user
    const assignments = await prisma.brandPromptAssignment.findMany({
      where: {
        userId: user.id,
      },
      select: {
        brandPromptId: true,
      },
    })

    // Get the actual brand prompts that are active
    const prompts = await prisma.brandPrompt.findMany({
      where: {
        id: {
          in: assignments.map((a) => a.brandPromptId),
        },
        isActive: true, // Only return active prompts
      },
    })

    return NextResponse.json({ prompts })
  } catch (error) {
    console.error('Error fetching assigned brand prompts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch assigned brand prompts' },
      { status: 500 }
    )
  }
}
