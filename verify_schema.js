const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function verifySchema() {
  try {
    console.log('Checking database schema...\n')

    // Check if we can query the new tables
    console.log('1. Testing UserWebhook table...')
    const webhookTest = await prisma.userWebhook.findMany({ take: 1 })
    console.log('   ✓ UserWebhook table accessible')

    console.log('2. Testing BrandPromptAssignment table...')
    const assignmentTest = await prisma.brandPromptAssignment.findMany({ take: 1 })
    console.log('   ✓ BrandPromptAssignment table accessible')

    console.log('3. Testing WorkflowLog table...')
    const logTest = await prisma.workflowLog.findMany({ take: 1 })
    console.log('   ✓ WorkflowLog table accessible')

    console.log('4. Testing SupportTicket table...')
    const ticketTest = await prisma.supportTicket.findMany({ take: 1 })
    console.log('   ✓ SupportTicket table accessible')

    console.log('5. Testing AdminLog table...')
    const adminLogTest = await prisma.adminLog.findMany({ take: 1 })
    console.log('   ✓ AdminLog table accessible')

    console.log('6. Testing BrandPrompt table (existing)...')
    const brandPromptTest = await prisma.brandPrompt.findMany({ take: 1 })
    console.log('   ✓ BrandPrompt table accessible')

    console.log('\n✅ All tables are accessible!')
    console.log('\nPrisma Client Info:')
    console.log('- Version:', require('./node_modules/@prisma/client/package.json').version)
    console.log('- Database URL:', process.env.DATABASE_URL ? 'Set' : 'Not set')

    await prisma.$disconnect()
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Error:', error.message)
    console.error('\nFull error:', error)
    await prisma.$disconnect()
    process.exit(1)
  }
}

verifySchema()
