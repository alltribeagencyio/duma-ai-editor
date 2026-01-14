const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkLegacyCredits() {
  console.log('Checking for users with legacy credits...\n')

  try {
    // Find users with legacy credits (monthlyCredits = 10) and haven't completed initial purchase
    const legacyUsers = await prisma.user.findMany({
      where: {
        monthlyCredits: 10,
        hasCompletedInitialPurchase: false,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        pricingPlan: true,
        creditBalance: true,
        monthlyCredits: true,
        creditsUsed: true,
        hasCompletedInitialPurchase: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`Found ${legacyUsers.length} users with legacy credits (10 monthlyCredits, not migrated)\n`)

    if (legacyUsers.length === 0) {
      console.log('No legacy credits found. All users have been migrated!')
      return
    }

    // Display summary
    const summary = legacyUsers.map(user => ({
      Email: user.email,
      'Full Name': user.fullName || 'N/A',
      'Pricing Plan': user.pricingPlan,
      'Credit Balance': `$${user.creditBalance.toFixed(2)}`,
      'Monthly Credits': user.monthlyCredits,
      'Credits Used': user.creditsUsed,
      'Created': new Date(user.createdAt).toLocaleDateString(),
    }))

    console.table(summary)

    // Calculate what the migration would do
    console.log('\n========================================')
    console.log('MIGRATION PREVIEW')
    console.log('========================================')

    const preview = legacyUsers.map(user => {
      const ratePerImage = user.pricingPlan === 'business' ? 0.35 : 0.375
      const creditsToAdd = 10 * ratePerImage
      const newBalance = user.creditBalance + creditsToAdd

      return {
        Email: user.email,
        'Current Plan': user.pricingPlan,
        'Current Balance': `$${user.creditBalance.toFixed(2)}`,
        'Credits to Add': `$${creditsToAdd.toFixed(2)}`,
        'New Balance': `$${newBalance.toFixed(2)}`,
      }
    })

    console.table(preview)

    console.log('\nTo migrate these users, run:')
    console.log('node scripts/migrate_legacy_credits.js\n')

  } catch (error) {
    console.error('Error checking legacy credits:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the check
checkLegacyCredits()
  .then(() => {
    console.log('Check completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Check failed with error:', error)
    process.exit(1)
  })
