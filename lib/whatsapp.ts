interface WhatsAppMessage {
  to: string
  text: string
}

interface WhatsAppResponse {
  success: boolean
  messageId?: string
  error?: string
}

class WhatsAppService {
  private apiUrl: string
  private accessToken: string

  constructor() {
    this.apiUrl = process.env.WHATSAPP_API_URL || ''
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || ''
  }

  private isConfigured(): boolean {
    return Boolean(this.apiUrl && this.accessToken)
  }

  private formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '')

    // If it starts with 0, replace with country code (assuming Nigeria +234)
    if (cleaned.startsWith('0')) {
      cleaned = '234' + cleaned.substring(1)
    }

    // If it doesn't start with a country code, assume Nigeria
    if (!cleaned.startsWith('234')) {
      cleaned = '234' + cleaned
    }

    return cleaned
  }

  async sendMessage(to: string, text: string): Promise<WhatsAppResponse> {
    if (!this.isConfigured()) {
      console.warn('WhatsApp service not configured')
      return { success: false, error: 'WhatsApp service not configured' }
    }

    try {
      const formattedNumber = this.formatPhoneNumber(to)

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: formattedNumber,
          type: 'text',
          text: {
            body: text
          }
        })
      })

      const data = await response.json()

      if (response.ok) {
        return {
          success: true,
          messageId: data.messages?.[0]?.id
        }
      } else {
        console.error('WhatsApp API error:', data)
        return {
          success: false,
          error: data.error?.message || 'Failed to send message'
        }
      }
    } catch (error) {
      console.error('WhatsApp service error:', error)
      return {
        success: false,
        error: 'Network error'
      }
    }
  }

  // Job-specific message templates
  async sendJobStartedMessage(to: string, jobId: string): Promise<WhatsAppResponse> {
    const message = `🎨 *Duma AI Update*\n\nYour image editing job has started!\n\nJob ID: ${jobId}\nStatus: Processing\n\nWe'll notify you when it's complete. This usually takes 2-5 minutes.`
    return this.sendMessage(to, message)
  }

  async sendJobCompletedMessage(to: string, jobId: string, downloadUrl?: string): Promise<WhatsAppResponse> {
    let message = `✅ *Duma AI Update*\n\nYour image editing job is complete!\n\nJob ID: ${jobId}\nStatus: Completed\n\n`

    if (downloadUrl) {
      message += `You can view and download your edited image from your dashboard: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
    } else {
      message += `Your edited image is ready! Visit your dashboard to view and download it.`
    }

    return this.sendMessage(to, message)
  }

  async sendJobFailedMessage(to: string, jobId: string, reason?: string): Promise<WhatsAppResponse> {
    let message = `❌ *Duma AI Update*\n\nYour image editing job encountered an error.\n\nJob ID: ${jobId}\nStatus: Failed\n\n`

    if (reason) {
      message += `Reason: ${reason}\n\n`
    }

    message += `Please try again or contact support if the issue persists. Your credits have been refunded.`

    return this.sendMessage(to, message)
  }

  async sendWelcomeMessage(to: string, userName: string): Promise<WhatsAppResponse> {
    const message = `🎉 *Welcome to Duma AI!*\n\nHi ${userName},\n\nThanks for joining Duma AI! We're excited to help you create amazing product images.\n\n🎨 Start editing: ${process.env.NEXT_PUBLIC_APP_URL}/new\n📊 View dashboard: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard\n\nYou'll receive updates about your image editing jobs here. You can disable these notifications anytime in your profile settings.`

    return this.sendMessage(to, message)
  }

  async sendSubscriptionUpdateMessage(to: string, planName: string, isUpgrade: boolean): Promise<WhatsAppResponse> {
    const action = isUpgrade ? 'upgraded' : 'changed'
    const message = `💎 *Duma AI Subscription Update*\n\nYour subscription has been ${action} to the *${planName}* plan!\n\n✨ New features and credits are now available in your account.\n\nView details: ${process.env.NEXT_PUBLIC_APP_URL}/subscription`

    return this.sendMessage(to, message)
  }

  async sendCreditLowWarningMessage(to: string, remainingCredits: number): Promise<WhatsAppResponse> {
    const message = `⚠️ *Duma AI Credit Alert*\n\nYou have ${remainingCredits} credits remaining.\n\nTo continue editing images, consider upgrading your plan or wait for your monthly credits to refresh.\n\nUpgrade now: ${process.env.NEXT_PUBLIC_APP_URL}/subscription`

    return this.sendMessage(to, message)
  }
}

export const whatsappService = new WhatsAppService()

// Helper function to check if user has WhatsApp notifications enabled
export async function shouldSendWhatsAppNotification(userId: string): Promise<{ enabled: boolean; phoneNumber?: string }> {
  try {
    const { prisma } = require('@/lib/prisma')

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        whatsappNotifications: true,
        whatsappNumber: true
      }
    })

    if (!user || !user.whatsappNotifications || !user.whatsappNumber) {
      return { enabled: false }
    }

    return {
      enabled: true,
      phoneNumber: user.whatsappNumber
    }
  } catch (error) {
    console.error('Error checking WhatsApp notification settings:', error)
    return { enabled: false }
  }
}