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
 * 1. Fetch all active webhooks for the user and webhook type
 * 2. Filter by tier restrictions
 * 3. Return highest priority webhook
 * 4. Fallback to N8N_WEBHOOK_URL environment variable
 */
export async function selectWebhookForUser({
  userId,
  webhookType = 'image_processing',
}: WebhookSelectionOptions): Promise<SelectedWebhook> {
  try {
    // Fetch user to check subscription tier
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionTier: true },
    })

    if (!user) {
      console.warn(`[Webhook Selector] User ${userId} not found, using fallback webhook`)
      return {
        webhookUrl: process.env.N8N_WEBHOOK_URL || '',
      }
    }

    // Fetch active webhooks for user, ordered by priority (ascending)
    const webhooks = await prisma.userWebhook.findMany({
      where: {
        userId,
        webhookType,
        isActive: true,
      },
      orderBy: {
        priority: 'asc', // Lower priority number = higher priority
      },
    })

    console.log(`[Webhook Selector] Found ${webhooks.length} active webhooks for user ${userId}`)

    // Filter by tier restrictions
    const eligibleWebhooks = webhooks.filter((webhook) => {
      const meetsRequirement = meetsTierRequirement(
        user.subscriptionTier,
        webhook.tierRestriction
      )

      if (!meetsRequirement) {
        console.log(
          `[Webhook Selector] Webhook ${webhook.name} (${webhook.id}) filtered out due to tier restriction: ${webhook.tierRestriction} > ${user.subscriptionTier}`
        )
      }

      return meetsRequirement
    })

    console.log(`[Webhook Selector] ${eligibleWebhooks.length} eligible webhooks after tier filtering`)

    // Return highest priority webhook (first in list after sorting)
    if (eligibleWebhooks.length > 0) {
      const selected = eligibleWebhooks[0]
      console.log(
        `[Webhook Selector] Selected webhook: ${selected.name} (${selected.id}) with priority ${selected.priority}`
      )
      return {
        webhookUrl: selected.webhookUrl,
        webhookId: selected.id,
        webhookName: selected.name,
      }
    }

    // Fallback to environment variable
    console.log(`[Webhook Selector] No eligible webhooks found, using fallback from env`)
    return {
      webhookUrl: process.env.N8N_WEBHOOK_URL || '',
    }
  } catch (error) {
    console.error('[Webhook Selector] Error selecting webhook:', error)
    console.log('[Webhook Selector] Falling back to environment variable webhook')

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
