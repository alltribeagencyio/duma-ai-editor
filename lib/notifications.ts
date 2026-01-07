import { whatsappService, shouldSendWhatsAppNotification } from './whatsapp'

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