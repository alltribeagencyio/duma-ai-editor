import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// POST /api/support/chatbot - Send message to AI chatbot
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
    const { message } = body

    // Validate required fields
    if (!message) {
      return NextResponse.json(
        { error: 'Missing required field: message' },
        { status: 400 }
      )
    }

    // Get user profile for context
    const userProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        brandName: true,
        brandIndustry: true,
        brandAesthetic: true,
        brandColors: true,
        brandRequirements: true,
      },
    })

    // Get recent prompts for context
    const recentJobs = await prisma.job.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        prompt: true,
        promptType: true,
      },
    })

    // Send to N8N chatbot webhook
    const chatbotWebhookUrl = process.env.N8N_CHATBOT_WEBHOOK_URL
    if (!chatbotWebhookUrl) {
      return NextResponse.json(
        { error: 'Chatbot service not configured' },
        { status: 503 }
      )
    }

    try {
      const response = await fetch(chatbotWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.email,
          message,
          context: {
            brandName: userProfile?.brandName,
            brandIndustry: userProfile?.brandIndustry,
            brandAesthetic: userProfile?.brandAesthetic,
            brandColors: userProfile?.brandColors,
            brandRequirements: userProfile?.brandRequirements,
            recentPrompts: recentJobs.map((j) => ({
              prompt: j.prompt,
              type: j.promptType,
            })),
          },
        }),
      })

      if (!response.ok) {
        throw new Error('Chatbot webhook failed')
      }

      const data = await response.json()
      return NextResponse.json({
        reply: data.reply || data.message || 'I received your message. How can I help you?',
      })
    } catch (error) {
      console.error('Error calling chatbot webhook:', error)
      return NextResponse.json(
        { error: 'Chatbot service temporarily unavailable' },
        { status: 503 }
      )
    }
  } catch (error) {
    console.error('Error processing chatbot message:', error)
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    )
  }
}
