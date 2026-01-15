const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkWebhookLogs() {
  try {
    // Check recent workflow logs
    const logs = await prisma.workflowLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        jobId: true,
        workflowType: true,
        status: true,
        errorMessage: true,
        createdAt: true,
        completedAt: true,
      }
    })

    console.log('Recent Workflow Logs:')
    console.log(JSON.stringify(logs, null, 2))

    // Check if there are any logs for the completed jobs
    const completedJobs = await prisma.job.findMany({
      where: { status: 'completed' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        userId: true,
        status: true,
        creditDeducted: true,
        createdAt: true,
      }
    })

    console.log('\nRecent Completed Jobs:')
    console.log(JSON.stringify(completedJobs, null, 2))

    // For each completed job, check if there's a corresponding workflow log
    for (const job of completedJobs) {
      const log = await prisma.workflowLog.findFirst({
        where: { jobId: job.id },
      })
      console.log(`\nJob ${job.id}: ${log ? 'HAS webhook log' : 'NO webhook log (webhook never called!)'}`)
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkWebhookLogs()
