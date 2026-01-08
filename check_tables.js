const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkTables() {
  try {
    console.log('Checking if new tables exist...\n')

    const tables = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema='public'
      AND table_name IN ('UserWebhook', 'BrandPromptAssignment', 'WorkflowLog', 'SupportTicket', 'AdminLog')
      ORDER BY table_name
    `

    console.log('Found tables:', tables)
    console.log(`\nTotal: ${tables.length}/5 tables exist`)

    // Try to count records in each table
    if (tables.length === 5) {
      console.log('\nTable record counts:')
      const webhookCount = await prisma.userWebhook.count()
      const assignmentCount = await prisma.brandPromptAssignment.count()
      const workflowLogCount = await prisma.workflowLog.count()
      const ticketCount = await prisma.supportTicket.count()
      const adminLogCount = await prisma.adminLog.count()

      console.log(`- UserWebhook: ${webhookCount}`)
      console.log(`- BrandPromptAssignment: ${assignmentCount}`)
      console.log(`- WorkflowLog: ${workflowLogCount}`)
      console.log(`- SupportTicket: ${ticketCount}`)
      console.log(`- AdminLog: ${adminLogCount}`)
    }

    await prisma.$disconnect()
    process.exit(0)
  } catch (error) {
    console.error('Error:', error.message)
    await prisma.$disconnect()
    process.exit(1)
  }
}

checkTables()
