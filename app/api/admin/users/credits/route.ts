import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const userProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { isAdmin: true }
    })

    if (!userProfile?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { userId, action, amount, creditType = 'balance' } = body

    // Validate required fields
    if (!userId || !action || typeof amount !== 'number') {
      return NextResponse.json(
        { error: 'userId, action, and amount are required' },
        { status: 400 }
      )
    }

    // Validate action
    if (!['add', 'set', 'reset'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be: add, set, or reset' },
        { status: 400 }
      )
    }

    // Validate credit type
    if (!['balance', 'monthly'].includes(creditType)) {
      return NextResponse.json(
        { error: 'Invalid creditType. Must be: balance or monthly' },
        { status: 400 }
      )
    }

    // Get current user
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        monthlyCredits: true,
        creditsUsed: true,
        creditBalance: true,
        pricingPlan: true
      }
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let updatedUser

    if (creditType === 'balance') {
      // Pay-as-you-go credit balance operations (in USD)
      switch (action) {
        case 'add':
          // Add credits to balance
          updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
              creditBalance: targetUser.creditBalance + amount
            }
          })
          break

        case 'set':
          // Set balance to specific amount
          updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
              creditBalance: amount
            }
          })
          break

        case 'reset':
          // Reset balance to 0
          updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
              creditBalance: 0
            }
          })
          break

        default:
          return NextResponse.json(
            { error: 'Invalid action' },
            { status: 400 }
          )
      }
    } else {
      // Legacy monthly credits operations
      switch (action) {
        case 'add':
          // Add credits to monthly allocation
          updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
              monthlyCredits: targetUser.monthlyCredits + amount
            }
          })
          break

        case 'set':
          // Set monthly credits to specific amount
          updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
              monthlyCredits: amount
            }
          })
          break

        case 'reset':
          // Reset credits used to 0
          updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
              creditsUsed: 0,
              creditsReset: new Date()
            }
          })
          break

        default:
          return NextResponse.json(
            { error: 'Invalid action' },
            { status: 400 }
          )
      }
    }

    // Log the credit change
    await prisma.creditUsage.create({
      data: {
        userId,
        amount: action === 'reset' ? (creditType === 'balance' ? -targetUser.creditBalance : -targetUser.creditsUsed) : amount,
        type: 'manual_adjustment',
        description: `Admin ${action} ${creditType === 'balance' ? 'credit balance' : 'monthly credits'}: ${amount}`
      }
    })

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        pricingPlan: updatedUser.pricingPlan,
        creditBalance: updatedUser.creditBalance,
        monthlyCredits: updatedUser.monthlyCredits,
        creditsUsed: updatedUser.creditsUsed,
        creditsRemaining: updatedUser.monthlyCredits - updatedUser.creditsUsed
      }
    })
  } catch (error) {
    console.error('Error managing credits:', error)
    return NextResponse.json(
      { error: 'Failed to manage credits' },
      { status: 500 }
    )
  }
}
