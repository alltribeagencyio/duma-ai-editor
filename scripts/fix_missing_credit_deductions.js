const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Import pricing service logic inline since we can't import ES modules
async function getPlanConfig(plan) {
  const config = await prisma.pricingConfig.findUnique({
    where: { plan, isActive: true }
  })

  if (!config) {
    // Fallback to defaults
    return plan === 'business'
      ? { ratePerImage: 0.35 }
      : { ratePerImage: 0.375 }
  }

  return config
}

async function deductCreditsForJob(job) {
  try {
    // Get user
    const user = await prisma.user.findUnique({
      where: { id: job.userId },
      select: { creditBalance: true, pricingPlan: true }
    })

    if (!user) {
      console.error(`❌ User not found: ${job.userId}`)
      return false
    }

    // Get plan config
    const planConfig = await getPlanConfig(user.pricingPlan || 'personal')

    // Calculate number of images from outputData
    const numberOfImages = Array.isArray(job.outputData)
      ? job.outputData.length
      : job.inputImages?.length || 1

    const costUSD = numberOfImages * planConfig.ratePerImage

    console.log(`\n💳 Processing job ${job.id}:`)
    console.log(`   User: ${job.userId}`)
    console.log(`   Images: ${numberOfImages}`)
    console.log(`   Cost: $${costUSD.toFixed(2)} at $${planConfig.ratePerImage}/image`)
    console.log(`   Current balance: $${user.creditBalance.toFixed(2)}`)

    // Check sufficient balance
    if (user.creditBalance < costUSD) {
      console.error(`   ❌ Insufficient balance (needs $${costUSD.toFixed(2)})`)
      return false
    }

    const balanceBefore = user.creditBalance
    const balanceAfter = balanceBefore - costUSD

    // Update user balance in a transaction
    await prisma.$transaction([
      // Update user
      prisma.user.update({
        where: { id: job.userId },
        data: {
          creditBalance: balanceAfter,
          creditsUsed: { increment: numberOfImages }
        }
      }),

      // Create credit transaction
      prisma.creditTransaction.create({
        data: {
          userId: job.userId,
          type: 'deduction',
          amount: costUSD,
          creditsDeducted: costUSD,
          balanceBefore,
          balanceAfter,
          pricingPlan: user.pricingPlan,
          ratePerImage: planConfig.ratePerImage,
          jobId: job.id,
          description: `Retroactive: ${numberOfImages} image${numberOfImages > 1 ? 's' : ''} at $${planConfig.ratePerImage}/image`
        }
      }),

      // Update job
      prisma.job.update({
        where: { id: job.id },
        data: { creditDeducted: true }
      })
    ])

    console.log(`   ✅ Credits deducted successfully`)
    console.log(`   New balance: $${balanceAfter.toFixed(2)}`)
    console.log(`   Credits used: ${numberOfImages}`)

    return true
  } catch (error) {
    console.error(`   ❌ Error processing job ${job.id}:`, error.message)
    return false
  }
}

async function fixMissingCreditDeductions() {
  try {
    console.log('🔍 Finding completed jobs without credit deductions...\n')

    // Find all completed jobs that haven't had credits deducted
    const jobs = await prisma.job.findMany({
      where: {
        status: 'completed',
        creditDeducted: false
      },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        userId: true,
        outputData: true,
        inputImages: true,
        createdAt: true,
      }
    })

    // Filter to only those with actual output data
    const jobsWithOutput = jobs.filter(job =>
      job.outputData && Array.isArray(job.outputData) && job.outputData.length > 0
    )

    console.log(`Found ${jobsWithOutput.length} jobs requiring credit deduction\n`)
    console.log('=' .repeat(60))

    let successful = 0
    let failed = 0

    for (const job of jobsWithOutput) {
      const result = await deductCreditsForJob(job)
      if (result) {
        successful++
      } else {
        failed++
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log('\n📊 Summary:')
    console.log(`   Total jobs: ${jobsWithOutput.length}`)
    console.log(`   ✅ Successfully processed: ${successful}`)
    console.log(`   ❌ Failed: ${failed}`)
    console.log('\n✅ Credit deduction fix completed!')

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixMissingCreditDeductions()
