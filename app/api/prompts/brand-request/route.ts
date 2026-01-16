import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// POST /api/prompts/brand-request - Submit a brand prompt request
export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { brandName, numberOfPrompts, requirements, complexity } = await req.json()

    if (!brandName || !numberOfPrompts || !requirements || !complexity) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    const request = await prisma.brandPromptRequest.create({
      data: {
        userId: user.id,
        brandName,
        numberOfPrompts: parseInt(numberOfPrompts),
        requirements,
        complexity,
        status: 'pending',
      },
    })

    return NextResponse.json({ request })
  } catch (error) {
    console.error('Error creating brand prompt request:', error)
    return NextResponse.json(
      { error: 'Failed to submit request' },
      { status: 500 }
    )
  }
}

// GET /api/prompts/brand-request - Get user's brand prompt requests
export async function GET(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const requests = await prisma.brandPromptRequest.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ requests })
  } catch (error) {
    console.error('Error fetching brand prompt requests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch requests' },
      { status: 500 }
    )
  }
}
