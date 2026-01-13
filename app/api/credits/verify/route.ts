import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { paystackService } from '@/lib/paystack'
import { pricingService } from '@/lib/pricing'
import { prisma } from '@/lib/prisma'

// GET /api/credits/verify - Verify payment and allocate credits
export async function GET(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const reference = searchParams.get('reference')

    if (!reference) {
      return NextResponse.json(
        { error: 'Missing payment reference' },
        { status: 400 }
      )
    }

    // Find payment record
    const payment = await prisma.payment.findUnique({
      where: { paystackReference: reference }
    })

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    // Check if already processed
    if (payment.status === 'success') {
      return NextResponse.json({
        success: true,
        alreadyProcessed: true,
        creditsAllocated: payment.creditsAllocated
      }, { status: 200 })
    }

    // Verify payment with Paystack
    const verification = await paystackService.verifyTransaction(reference)

    if (!verification.success || verification.transaction.status !== 'success') {
      return NextResponse.json(
        { error: 'Payment verification failed' },
        { status: 400 }
      )
    }

    // Update payment record
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'success',
        paidAt: new Date(),
        paystackTransactionId: verification.transaction.id
      }
    })

    // Allocate credits to user
    const result = await pricingService.allocateCredits(
      payment.userId,
      payment.amountUSD!,
      payment.pricingPlan as 'personal' | 'business',
      payment.id
    )

    return NextResponse.json({
      success: true,
      creditsAdded: result.creditsAdded,
      newBalance: result.newBalance,
      pricingPlan: payment.pricingPlan
    }, { status: 200 })
  } catch (error) {
    console.error('Error verifying payment:', error)
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    )
  }
}
