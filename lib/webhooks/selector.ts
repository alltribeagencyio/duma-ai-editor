import { prisma } from '@/lib/prisma'

/**
 * Webhook Selector Utility
 *
 * Selects the appropriate webhook URL for a user based on:
 * - Active webhooks
 * - Priority order
 * - Subscription tier restrictions
 * - Fallback to environment variable
 */

interface WebhookSelectionOptions {
  userId: string
  webhookType?: string
}

interface SelectedWebhook {
  webhookUrl: string
  webhookId?: string
  webhookName?: string
}

/**
 * Checks if a user's subscription tier meets the webhook's tier requirement
 */
function meetsTierRequirement(userTier: string, tierRestriction: string | null): boolean {
  if (!tierRestriction) {
    return true // No restriction
  }

  const tierHierarchy: Record<string, number> = {
    'free': 0,
    'starter': 1,
    'professional': 2,
    'enterprise': 3,
  }

  const userTierLevel = tierHierarchy[userTier.toLowerCase()] ?? 0
  const requiredTierLevel = tierHierarchy[tierRestriction.toLowerCase()] ?? 0

  return userTierLevel >= requiredTierLevel
}

/**
 * Selects the appropriate webhook URL for a user
 *
 * Selection logic:
 * 1. Use N8N_WEBHOOK_URL environment variable (single webhook for all users)
 *
 * Note: User-specific webhooks are disabled for now
 */
export async function selectWebhookForUser({
  userId,
  webhookType = 'image_processing',
}: WebhookSelectionOptions): Promise<SelectedWebhook> {
  try {
    console.log(`[Webhook Selector] Using global webhook for all users`)

    // Use environment variable webhook (single webhook for all users)
    const webhookUrl = process.env.N8N_WEBHOOK_URL || ''

    if (!webhookUrl) {
      console.error('[Webhook Selector] N8N_WEBHOOK_URL environment variable is not set!')
      console.error('[Webhook Selector] Please add N8N_WEBHOOK_URL to your environment variables')
    } else {
      console.log('[Webhook Selector] Using webhook from N8N_WEBHOOK_URL:', webhookUrl)
    }

    return {
      webhookUrl,
    }
  } catch (error) {
    console.error('[Webhook Selector] Error selecting webhook:', error)

    // Safe fallback on error
    return {
      webhookUrl: process.env.N8N_WEBHOOK_URL || '',
    }
  }
}

/**
 * Get all webhooks for a user (for management UI)
 */
export async function getUserWebhooks(userId: string) {
  return await prisma.userWebhook.findMany({
    where: { userId },
    orderBy: [
      { isActive: 'desc' }, // Active first
      { priority: 'asc' },  // Then by priority
    ],
  })
}

/**
 * Validate webhook URL format
 */
export function isValidWebhookUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}
