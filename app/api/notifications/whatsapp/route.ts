import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { whatsappService } from '@/lib/whatsapp'

interface WhatsAppNotificationRequest {
  userId: string
  type: 'job_started' | 'job_completed' | 'job_failed' | 'welcome' | 'subscription_update' | 'credit_warning'
  data?: {
    jobId?: string
    userName?: string
    planName?: string
    isUpgrade?: boolean
    remainingCredits?: number
    downloadUrl?: string
    failureReason?: string
  }
}

// POST /api/notifications/whatsapp - Send WhatsApp notification
export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient()

    // Verify authentication (this endpoint should be called internally or by authenticated users)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: WhatsAppNotificationRequest = await req.json()
    const { userId, type, data = {} } = body

    // Check if user has WhatsApp notifications enabled
    const { shouldSendWhatsAppNotification } = await import('@/lib/whatsapp')
    const notificationSettings = await shouldSendWhatsAppNotification(userId)

    if (!notificationSettings.enabled || !notificationSettings.phoneNumber) {
      return NextResponse.json({
        success: true,
        message: 'WhatsApp notifications disabled for user'
      })
    }

    let result

    switch (type) {
      case 'job_started':
        if (!data.jobId) {
          return NextResponse.json({ error: 'Job ID required for job_started notification' }, { status: 400 })
        }
        result = await whatsappService.sendJobStartedMessage(notificationSettings.phoneNumber, data.jobId)
        break

      case 'job_completed':
        if (!data.jobId) {
          return NextResponse.json({ error: 'Job ID required for job_completed notification' }, { status: 400 })
        }
        result = await whatsappService.sendJobCompletedMessage(
          notificationSettings.phoneNumber,
          data.jobId,
          data.downloadUrl
        )
        break

      case 'job_failed':
        if (!data.jobId) {
          return NextResponse.json({ error: 'Job ID required for job_failed notification' }, { status: 400 })
        }
        result = await whatsappService.sendJobFailedMessage(
          notificationSettings.phoneNumber,
          data.jobId,
          data.failureReason
        )
        break

      case 'welcome':
        if (!data.userName) {
          return NextResponse.json({ error: 'User name required for welcome notification' }, { status: 400 })
        }
        result = await whatsappService.sendWelcomeMessage(notificationSettings.phoneNumber, data.userName)
        break

      case 'subscription_update':
        if (!data.planName) {
          return NextResponse.json({ error: 'Plan name required for subscription_update notification' }, { status: 400 })
        }
        result = await whatsappService.sendSubscriptionUpdateMessage(
          notificationSettings.phoneNumber,
          data.planName,
          data.isUpgrade || false
        )
        break

      case 'credit_warning':
        if (typeof data.remainingCredits !== 'number') {
          return NextResponse.json({ error: 'Remaining credits required for credit_warning notification' }, { status: 400 })
        }
        result = await whatsappService.sendCreditLowWarningMessage(
          notificationSettings.phoneNumber,
          data.remainingCredits
        )
        break

      default:
        return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 })
    }

    if (result.success) {
      // Log successful notification (optional: store in database for audit)
      console.log(`WhatsApp notification sent: ${type} to ${notificationSettings.phoneNumber}`)

      return NextResponse.json({
        success: true,
        messageId: result.messageId
      })
    } else {
      console.error(`Failed to send WhatsApp notification: ${result.error}`)
      return NextResponse.json(
        { error: result.error || 'Failed to send notification' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error sending WhatsApp notification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Utility function to trigger notifications (can be called from other API routes)
export async function triggerWhatsAppNotification(
  type: WhatsAppNotificationRequest['type'],
  userId: string,
  data?: WhatsAppNotificationRequest['data']
) {
  try {
    const { shouldSendWhatsAppNotification } = await import('@/lib/whatsapp')
    const notificationSettings = await shouldSendWhatsAppNotification(userId)

    if (!notificationSettings.enabled || !notificationSettings.phoneNumber) {
      return { success: true, skipped: true }
    }

    let result

    switch (type) {
      case 'job_started':
        result = await whatsappService.sendJobStartedMessage(
          notificationSettings.phoneNumber,
          data?.jobId || ''
        )
        break

      case 'job_completed':
        result = await whatsappService.sendJobCompletedMessage(
          notificationSettings.phoneNumber,
          data?.jobId || '',
          data?.downloadUrl
        )
        break

      case 'job_failed':
        result = await whatsappService.sendJobFailedMessage(
          notificationSettings.phoneNumber,
          data?.jobId || '',
          data?.failureReason
        )
        break

      case 'welcome':
        result = await whatsappService.sendWelcomeMessage(
          notificationSettings.phoneNumber,
          data?.userName || ''
        )
        break

      case 'subscription_update':
        result = await whatsappService.sendSubscriptionUpdateMessage(
          notificationSettings.phoneNumber,
          data?.planName || '',
          data?.isUpgrade || false
        )
        break

      case 'credit_warning':
        result = await whatsappService.sendCreditLowWarningMessage(
          notificationSettings.phoneNumber,
          data?.remainingCredits || 0
        )
        break

      default:
        return { success: false, error: 'Invalid notification type' }
    }

    return result
  } catch (error) {
    console.error('Error triggering WhatsApp notification:', error)
    return { success: false, error: 'Failed to trigger notification' }
  }
}