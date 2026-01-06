require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const setupDatabase = async () => {
  console.log('🗄️  Setting up database tables...\n')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // SQL to create tables
  const createTablesSQL = `
-- Create Job table
CREATE TABLE IF NOT EXISTS "Job" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "prompt" TEXT NOT NULL,
  "promptType" TEXT NOT NULL,
  "presetId" TEXT,
  "inputImages" TEXT[] NOT NULL,
  "outputData" JSONB,
  "phone" TEXT,
  "notifyByEmail" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "startedAt" TIMESTAMP,
  "completedAt" TIMESTAMP,
  "errorMessage" TEXT,
  "notificationSent" BOOLEAN NOT NULL DEFAULT false
);

-- Create indexes for Job table
CREATE INDEX IF NOT EXISTS "Job_userId_idx" ON "Job"("userId");
CREATE INDEX IF NOT EXISTS "Job_status_idx" ON "Job"("status");
CREATE INDEX IF NOT EXISTS "Job_createdAt_idx" ON "Job"("createdAt");

-- Create PromptPreset table
CREATE TABLE IF NOT EXISTS "PromptPreset" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "prompt" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "icon" TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- Create indexes for PromptPreset table
CREATE INDEX IF NOT EXISTS "PromptPreset_category_idx" ON "PromptPreset"("category");
CREATE INDEX IF NOT EXISTS "PromptPreset_order_idx" ON "PromptPreset"("order");
  `

  try {
    console.log('Creating tables...')
    const { data, error } = await supabase.rpc('exec_sql', { sql: createTablesSQL })

    if (error) {
      // If RPC doesn't exist, provide alternative instructions
      if (error.message.includes('exec_sql')) {
        console.log('\n⚠️  Direct SQL execution via Supabase client is not available.')
        console.log('\n📋 Please run this SQL in your Supabase SQL Editor:\n')
        console.log('1. Go to: https://hmtizgdzkueakwextuml.supabase.co')
        console.log('2. Click "SQL Editor" in the left sidebar')
        console.log('3. Copy and paste this SQL:\n')
        console.log('─'.repeat(60))
        console.log(createTablesSQL)
        console.log('─'.repeat(60))
        console.log('\n4. Click "Run" to execute')
        console.log('\n5. Then run: npx prisma db seed')
        console.log('6. Finally run: npm run dev\n')
        return
      }
      throw error
    }

    console.log('✅ Tables created successfully!\n')

    // Run seed
    console.log('📦 Seeding database with preset prompts...')
    const { execSync } = require('child_process')
    execSync('npx prisma db seed', { stdio: 'inherit' })

    console.log('\n✨ Database setup complete!')
    console.log('\n🚀 Next steps:')
    console.log('   1. Run: npm run dev')
    console.log('   2. Visit: http://localhost:3000')

  } catch (error) {
    console.error('❌ Error:', error.message)
    console.log('\n📋 Alternative: Use Supabase SQL Editor')
    console.log('\n1. Go to: https://hmtizgdzkueakwextuml.supabase.co')
    console.log('2. Click "SQL Editor"')
    console.log('3. Run the SQL above')
    console.log('4. Then run: npx prisma db seed')
    process.exit(1)
  }
}

setupDatabase()
