const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkUserCredits() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        creditBalance: true,
        creditsUsed: true,
        pricingPlan: true,
        hasCompletedInitialPurchase: true,
      },
      take: 5
    })

    console.log('User Credit Data:')
    console.log(JSON.stringify(users, null, 2))

    // Also check credit transactions
    const transactions = await prisma.creditTransaction.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        userId: true,
        type: true,
        amount: true,
        creditsAdded: true,
        creditsDeducted: true,
        balanceBefore: true,
        balanceAfter: true,
        description: true,
        createdAt: true,
      }
    })

    console.log('\nRecent Credit Transactions:')
    console.log(JSON.stringify(transactions, null, 2))

    // Check jobs
    const jobs = await prisma.job.findMany({
      where: { status: 'completed' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        userId: true,
        status: true,
        creditDeducted: true,
        inputImages: true,
        outputData: true,
        createdAt: true,
      }
    })

    console.log('\nRecent Completed Jobs:')
    console.log(JSON.stringify(jobs, null, 2))

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUserCredits()
