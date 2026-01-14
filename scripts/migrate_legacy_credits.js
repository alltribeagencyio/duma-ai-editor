const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Pricing per image based on plan
const PRICING = {
  personal: 0.375,
  business: 0.35
}

async function migrateLegacyCredits() {
  console.log('Starting legacy credit migration...\n')

  try {
    // Find all users who have legacy credits (monthlyCredits = 10) and haven't completed initial purchase
    const legacyUsers = await prisma.user.findMany({
      where: {
        monthlyCredits: 10,
        hasCompletedInitialPurchase: false,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        monthlyCredits: true,
        creditBalance: true,
        pricingPlan: true,
        hasCompletedInitialPurchase: true,
      }
    })

    console.log(`Found ${legacyUsers.length} users with legacy credits to migrate\n`)

    if (legacyUsers.length === 0) {
      console.log('No users to migrate. All done!')
      return
    }

    let migratedCount = 0
    let skippedCount = 0
    const migrationLog = []

    for (const user of legacyUsers) {
      try {
        // Get the rate based on user's pricing plan
        const ratePerImage = PRICING[user.pricingPlan] || PRICING.personal

        // Convert 10 legacy credits to USD credit balance
        // 10 credits = 10 images worth of credit
        const creditsToAdd = 10 * ratePerImage

        // Update the user
        const updated = await prisma.user.update({
          where: { id: user.id },
          data: {
            creditBalance: {
              increment: creditsToAdd
            },
            monthlyCredits: 0, // Reset legacy credits
            hasCompletedInitialPurchase: true, // Mark as migrated
          },
          select: {
            id: true,
            email: true,
            creditBalance: true,
            pricingPlan: true,
          }
        })

        const logEntry = {
          email: user.email,
          fullName: user.fullName || 'N/A',
          pricingPlan: user.pricingPlan,
          oldMonthlyCredits: user.monthlyCredits,
          oldCreditBalance: user.creditBalance,
          creditsAdded: creditsToAdd,
          newCreditBalance: updated.creditBalance,
          rateUsed: ratePerImage,
        }

        migrationLog.push(logEntry)
        migratedCount++

        console.log(`✓ Migrated: ${user.email}`)
        console.log(`  Plan: ${user.pricingPlan}`)
        console.log(`  Old Balance: $${user.creditBalance.toFixed(2)}`)
        console.log(`  Added: $${creditsToAdd.toFixed(2)} (10 images × $${ratePerImage})`)
        console.log(`  New Balance: $${updated.creditBalance.toFixed(2)}`)
        console.log('')

      } catch (error) {
        console.error(`✗ Failed to migrate ${user.email}:`, error.message)
        skippedCount++
      }
    }

    // Summary
    console.log('\n========================================')
    console.log('MIGRATION SUMMARY')
    console.log('========================================')
    console.log(`Total users found: ${legacyUsers.length}`)
    console.log(`Successfully migrated: ${migratedCount}`)
    console.log(`Failed/Skipped: ${skippedCount}`)
    console.log('========================================\n')

    // Detailed log
    if (migrationLog.length > 0) {
      console.log('Detailed Migration Log:')
      console.table(migrationLog)
    }

  } catch (error) {
    console.error('Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the migration
migrateLegacyCredits()
  .then(() => {
    console.log('\nMigration completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\nMigration failed with error:', error)
    process.exit(1)
  })
