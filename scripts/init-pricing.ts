/**
 * Initialize default pricing plans in database
 * Run this script after applying Prisma migrations
 *
 * Usage: npx ts-node scripts/init-pricing.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const DEFAULT_PRICING_PLANS = [
  {
    plan: 'personal',
    displayName: 'Personal Plan',
    ratePerImage: 0.375,
    minimumInitialPurchase: 2.0,
    minimumTopUp: 1.5,
    description: 'Perfect for individuals and small projects',
    features: [
      '$0.375 per image',
      'All editing features',
      'High-quality outputs',
      'Email support',
      'Flexible top-ups from $1.50'
    ],
    isActive: true
  },
  {
    plan: 'business',
    displayName: 'Business Plan',
    ratePerImage: 0.35,
    minimumInitialPurchase: 20.0,
    minimumTopUp: 10.0,
    description: 'Best value for businesses and high-volume users',
    features: [
      '$0.35 per image (7% savings)',
      'All editing features',
      'High-quality outputs',
      'Priority support',
      'Bulk processing',
      'Flexible top-ups from $10'
    ],
    isActive: true
  }
]

async function main() {
  console.log('🚀 Initializing pricing plans...')

  for (const plan of DEFAULT_PRICING_PLANS) {
    console.log(`\n📝 Upserting ${plan.displayName}...`)

    const result = await prisma.pricingConfig.upsert({
      where: { plan: plan.plan },
      create: plan,
      update: plan
    })

    console.log(`✅ ${result.displayName} initialized:`)
    console.log(`   - Rate: $${result.ratePerImage} per image`)
    console.log(`   - Min initial purchase: $${result.minimumInitialPurchase}`)
    console.log(`   - Min top-up: $${result.minimumTopUp}`)
  }

  console.log('\n✅ All pricing plans initialized successfully!')
}

main()
  .catch((error) => {
    console.error('❌ Error initializing pricing plans:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
