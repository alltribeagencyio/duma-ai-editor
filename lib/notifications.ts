import { whatsappService, shouldSendWhatsAppNotification } from './whatsapp'
import { getWebhookSecret } from './webhook-auth'

/**
 * Customer "keep-in-the-loop" notifications, delivered via an n8n workflow.
 * The webhook URL is configured in N8N_NOTIFICATIONS_WEBHOOK_URL (Vercel settings).
 * n8n decides the channel (email, WhatsApp, etc.) based on the `type`.
 */
export type CustomerNotificationType =
  | 'password_reset'
  | 'job_completed'
  | 'job_failed'
  | 'welcome'
  | 'credit_low'

export async function sendCustomerNotification(
  type: CustomerNotificationType,
  payload: Record<string, unknown>
): Promise<{ success: boolean; skipped?: boolean; error?: string }> {
  const url = process.env.N8N_NOTIFICATIONS_WEBHOOK_URL
  if (!url) {
    console.warn(`[notifications] N8N_NOTIFICATIONS_WEBHOOK_URL not set; skipping "${type}"`)
    return { success: true, skipped: true }
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    const secret = getWebhookSecret()
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(secret ? { 'X-Webhook-Secret': secret } : {}),
      },
      body: JSON.stringify({ type, ...payload }),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!res.ok) {
      console.error(`[notifications] webhook returned ${res.status} for "${type}"`)
      return { success: false, error: `Webhook returned ${res.status}` }
    }
    return { success: true }
  } catch (error) {
    console.error(`[notifications] failed to send "${type}":`, error)
    return { success: false, error: 'Failed to send notification' }
  }
}

interface NotificationData {
  jobId?: string
  userName?: string
  planName?: string
  isUpgrade?: boolean
  remainingCredits?: number
  downloadUrl?: string
  failureReason?: string
}

type NotificationType = 'job_started' | 'job_completed' | 'job_failed' | 'welcome' | 'subscription_update' | 'credit_warning'

export async function triggerWhatsAppNotification(
  type: NotificationType,
  userId: string,
  data?: NotificationData
) {
  try {
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