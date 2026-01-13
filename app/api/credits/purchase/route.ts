import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { pricingService } from '@/lib/pricing'
import { paystackService } from '@/lib/paystack'
import { prisma } from '@/lib/prisma'

// POST /api/credits/purchase - Initialize credit purchase
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
    const { amountUSD, pricingPlan } = body

    // Validate inputs
    if (!amountUSD || typeof amountUSD !== 'number' || amountUSD <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      )
    }

    if (!pricingPlan || !['personal', 'business'].includes(pricingPlan)) {
      return NextResponse.json(
        { error: 'Invalid pricing plan' },
        { status: 400 }
      )
    }

    // Validate purchase amount against plan rules
    const validation = await pricingService.validatePurchase(
      user.id,
      amountUSD,
      pricingPlan
    )

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // Get plan config for credit calculation
    const planConfig = await pricingService.getPlanConfig(pricingPlan)

    if (!planConfig) {
      return NextResponse.json(
        { error: 'Invalid pricing plan' },
        { status: 400 }
      )
    }

    const creditsToReceive = pricingService.calculateCredits(
      amountUSD,
      planConfig.ratePerImage
    )

    // Generate payment reference
    const reference = `credit_${user.id}_${Date.now()}`

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        paystackReference: reference,
        amount: Math.round(amountUSD * 100), // Convert to cents
        amountUSD,
        currency: 'USD',
        status: 'pending',
        type: 'credit_purchase',
        pricingPlan,
        creditsAllocated: creditsToReceive,
        description: `Purchase ${creditsToReceive.toFixed(0)} credits on ${planConfig.displayName}`
      }
    })

    // Initialize Paystack transaction
    const paystackResult = await paystackService.initializeTransaction({
      email: user.email!,
      amount: Math.round(amountUSD * 100), // Convert to cents
      reference,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/credits/verify?reference=${reference}`,
      metadata: {
        userId: user.id,
        pricingPlan,
        amountUSD,
        creditsToReceive,
        paymentId: payment.id
      }
    })

    if (!paystackResult.success) {
      return NextResponse.json(
        { error: 'Failed to initialize payment' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      paymentUrl: paystackResult.transaction.authorization_url,
      reference,
      amount: amountUSD,
      creditsToReceive,
      plan: planConfig
    }, { status: 200 })
  } catch (error) {
    console.error('Error initializing credit purchase:', error)
    return NextResponse.json(
      { error: 'Failed to initialize credit purchase' },
      { status: 500 }
    )
  }
}
