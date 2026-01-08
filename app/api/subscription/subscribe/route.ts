import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { paystackService } from '@/lib/paystack'

// POST /api/subscription/subscribe - Initialize subscription
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
    const { planId, paySetupFee = false } = body

    // Get the selected plan
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId }
    })

    if (!plan) {
      return NextResponse.json(
        { error: 'Subscription plan not found' },
        { status: 404 }
      )
    }

    // Get user profile
    const userProfile = await prisma.user.findUnique({
      where: { id: user.id }
    })

    if (!userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Check if user already has an active subscription
    const existingSubscription = await prisma.subscription.findUnique({
      where: { userId: user.id }
    })

    if (existingSubscription && existingSubscription.status === 'active') {
      return NextResponse.json(
        { error: 'User already has an active subscription' },
        { status: 400 }
      )
    }

    // Create or get Paystack customer
    let paystackCustomer
    if (existingSubscription?.paystackCustomerCode) {
      const customerResult = await paystackService.getCustomer(existingSubscription.paystackCustomerCode)
      if (customerResult.success) {
        paystackCustomer = customerResult.customer
      }
    }

    if (!paystackCustomer) {
      const customerResult = await paystackService.createCustomer({
        email: user.email!,
        first_name: userProfile.fullName?.split(' ')[0],
        last_name: userProfile.fullName?.split(' ').slice(1).join(' '),
        phone: userProfile.phone || undefined
      })

      if (!customerResult.success) {
        return NextResponse.json(
          { error: 'Failed to create customer profile' },
          { status: 500 }
        )
      }

      paystackCustomer = customerResult.customer
    }

    // Calculate total amount (subscription + setup fee if applicable)
    let totalAmount = plan.price
    if (paySetupFee && (plan.setupFee || 0) > 0 && !userProfile.setupFeesPaid) {
      totalAmount += (plan.setupFee || 0)
    }

    // Create transaction reference
    const reference = `duma_${user.id.slice(0, 8)}_${Date.now()}`

    // Initialize Paystack transaction
    const transactionResult = await paystackService.initializeTransaction({
      email: user.email!,
      amount: totalAmount,
      reference,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/success`,
      plan: plan.paystackPlanCode || undefined,
      channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer']
    })

    if (!transactionResult.success) {
      return NextResponse.json(
        { error: 'Failed to initialize payment' },
        { status: 500 }
      )
    }

    // Create payment record
    await prisma.payment.create({
      data: {
        userId: user.id,
        paystackReference: reference,
        amount: totalAmount,
        status: 'pending',
        type: paySetupFee && (plan.setupFee || 0) > 0 ? 'subscription_with_setup' : 'subscription',
        description: `${plan.displayName} subscription${paySetupFee && (plan.setupFee || 0) > 0 ? ' with setup fee' : ''}`
      }
    })

    return NextResponse.json({
      paymentUrl: transactionResult.transaction.authorization_url,
      reference,
      amount: totalAmount,
      plan: {
        id: plan.id,
        name: plan.displayName,
        monthlyCredits: plan.monthlyCredits
      }
    })
  } catch (error) {
    console.error('Error creating subscription:', error)
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    )
  }
}