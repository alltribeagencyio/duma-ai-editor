import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { paystackService } from '@/lib/paystack'

// POST /api/webhooks/paystack - Handle Paystack webhooks
export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = req.headers.get('x-paystack-signature')

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    // Verify webhook signature
    if (!paystackService.verifyWebhookSignature(body, signature)) {
      console.error('Invalid Paystack webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const event = JSON.parse(body)
    console.log('📦 Paystack webhook received:', event.event)

    switch (event.event) {
      case 'charge.success':
        await handleChargeSuccess(event.data)
        break

      case 'subscription.create':
        await handleSubscriptionCreate(event.data)
        break

      case 'subscription.disable':
        await handleSubscriptionDisable(event.data)
        break

      case 'invoice.create':
        await handleInvoiceCreate(event.data)
        break

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data)
        break

      default:
        console.log('Unhandled Paystack event:', event.event)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing Paystack webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handleChargeSuccess(data: any) {
  try {
    const { reference, customer, amount, status } = data

    // Find payment record
    const payment = await prisma.payment.findUnique({
      where: { paystackReference: reference }
    })

    if (!payment) {
      console.error('Payment not found for reference:', reference)
      return
    }

    // Update payment status
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: status,
        paidAt: new Date(),
        paystackTransactionId: data.id
      }
    })

    // Handle different payment types
    if (payment.type.includes('subscription')) {
      await handleSubscriptionPayment(payment, data)
    }

    console.log('✅ Charge success processed for:', reference)
  } catch (error) {
    console.error('Error handling charge success:', error)
  }
}

async function handleSubscriptionPayment(payment: any, chargeData: any) {
  try {
    // Get user
    const user = await prisma.user.findUnique({
      where: { id: payment.userId }
    })

    if (!user) {
      console.error('User not found for payment:', payment.id)
      return
    }

    // Update user profile based on payment type
    if (payment.type === 'subscription_with_setup' || payment.type === 'setup_fee') {
      await prisma.user.update({
        where: { id: payment.userId },
        data: {
          setupFeesPaid: true,
          hasCompletedOnboarding: true
        }
      })
    }

    console.log('✅ Subscription payment processed for user:', payment.userId)
  } catch (error) {
    console.error('Error handling subscription payment:', error)
  }
}

async function handleSubscriptionCreate(data: any) {
  try {
    const { customer, plan, subscription_code, status } = data

    // Find user by customer code
    const existingSubscription = await prisma.subscription.findFirst({
      where: { paystackCustomerCode: customer.customer_code }
    })

    if (existingSubscription) {
      // Update existing subscription
      await prisma.subscription.update({
        where: { id: existingSubscription.id },
        data: {
          paystackSubscriptionCode: subscription_code,
          status: mapPaystackStatus(status),
          currentPeriodStart: new Date(data.created_at),
          currentPeriodEnd: new Date(data.next_payment_date)
        }
      })
    }

    console.log('✅ Subscription created:', subscription_code)
  } catch (error) {
    console.error('Error handling subscription create:', error)
  }
}

async function handleSubscriptionDisable(data: any) {
  try {
    const { subscription_code } = data

    // Update subscription status
    await prisma.subscription.updateMany({
      where: { paystackSubscriptionCode: subscription_code },
      data: {
        status: 'canceled',
        canceledAt: new Date()
      }
    })

    console.log('✅ Subscription disabled:', subscription_code)
  } catch (error) {
    console.error('Error handling subscription disable:', error)
  }
}

async function handleInvoiceCreate(data: any) {
  try {
    const { customer, amount, due_date, subscription } = data

    // Log invoice creation for monitoring
    console.log('📧 Invoice created for customer:', customer.customer_code)
  } catch (error) {
    console.error('Error handling invoice create:', error)
  }
}

async function handleInvoicePaymentFailed(data: any) {
  try {
    const { customer, subscription } = data

    // Update subscription status to past_due
    if (subscription?.subscription_code) {
      await prisma.subscription.updateMany({
        where: { paystackSubscriptionCode: subscription.subscription_code },
        data: { status: 'past_due' }
      })
    }

    console.log('❌ Invoice payment failed for customer:', customer.customer_code)
  } catch (error) {
    console.error('Error handling invoice payment failed:', error)
  }
}

function mapPaystackStatus(paystackStatus: string): string {
  switch (paystackStatus) {
    case 'active': return 'active'
    case 'non-renewing': return 'canceled'
    case 'cancelled': return 'canceled'
    case 'attention': return 'past_due'
    default: return 'incomplete'
  }
}