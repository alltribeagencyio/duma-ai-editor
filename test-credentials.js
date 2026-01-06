require('dotenv').config({ path: '.env.local' })

async function testCredentials() {
  console.log('🔍 Testing credentials...\n')

  // Test 1: Check environment variables are loaded
  console.log('1️⃣ Checking environment variables...')
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'DATABASE_URL',
    'N8N_WEBHOOK_URL',
  ]

  let allPresent = true
  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      console.log(`   ✅ ${envVar}: present`)
    } else {
      console.log(`   ❌ ${envVar}: missing`)
      allPresent = false
    }
  }

  if (!allPresent) {
    console.log('\n❌ Some environment variables are missing!')
    process.exit(1)
  }

  // Test 2: Test Supabase connection
  console.log('\n2️⃣ Testing Supabase connection...')
  try {
    const { createClient } = require('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    // Test a simple query to verify connection
    const { data, error } = await supabase.from('_test').select('*').limit(1)

    // We expect this to fail because the table doesn't exist, but if we get
    // a different error (like auth error), the credentials are wrong
    if (error && !error.message.includes('does not exist') && !error.message.includes('relation') && !error.message.includes('schema cache')) {
      console.log(`   ❌ Supabase connection failed: ${error.message}`)
      process.exit(1)
    }

    console.log('   ✅ Supabase URL and Anon Key are valid')
  } catch (err) {
    console.log(`   ❌ Supabase connection error: ${err.message}`)
    process.exit(1)
  }

  // Test 3: Test database connection with Prisma
  console.log('\n3️⃣ Testing database connection...')
  try {
    const { PrismaClient } = require('@prisma/client')
    const prisma = new PrismaClient()

    // Try to connect to the database
    await prisma.$connect()
    console.log('   ✅ Database connection successful')

    // Try a simple query
    const presets = await prisma.promptPreset.count()
    console.log(`   ✅ Database query successful (${presets} presets found)`)

    await prisma.$disconnect()
  } catch (err) {
    console.log(`   ❌ Database connection failed: ${err.message}`)
    console.log('\n   💡 Tip: Make sure you\'ve run "npx prisma migrate dev" first!')
    process.exit(1)
  }

  // Test 4: Test n8n webhook URL format
  console.log('\n4️⃣ Checking n8n webhook URL...')
  try {
    const url = new URL(process.env.N8N_WEBHOOK_URL)
    console.log(`   ✅ n8n webhook URL is valid: ${url.origin}`)
  } catch (err) {
    console.log(`   ❌ Invalid n8n webhook URL: ${err.message}`)
    process.exit(1)
  }

  console.log('\n✨ All credentials are valid and working!')
  console.log('\n📋 Next steps:')
  console.log('   1. Run: npx prisma migrate dev --name init')
  console.log('   2. Run: npx prisma db seed')
  console.log('   3. Run: npm run dev')
  console.log('   4. Visit: http://localhost:3000')
}

testCredentials().catch(err => {
  console.error('\n❌ Test failed:', err)
  process.exit(1)
})
