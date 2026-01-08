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
 * 1. Check for user-specific active webhooks
 * 2. Use the first active webhook (highest priority)
 * 3. Fallback to N8N_WEBHOOK_URL environment variable
 */
export async function selectWebhookForUser({
  userId,
  webhookType = 'image_processing',
}: WebhookSelectionOptions): Promise<SelectedWebhook> {
  try {
    console.log(`[Webhook Selector] Selecting webhook for user ${userId} (type: ${webhookType})`)

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

    // Return first active webhook (highest priority)
    if (webhooks.length > 0) {
      const selected = webhooks[0]
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
    console.log(`[Webhook Selector] No active user webhooks found, using fallback from env`)
    const webhookUrl = process.env.N8N_WEBHOOK_URL || ''

    if (!webhookUrl) {
      console.warn('[Webhook Selector] N8N_WEBHOOK_URL environment variable is not set!')
    }

    return {
      webhookUrl,
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
