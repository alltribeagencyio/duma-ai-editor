// This script runs database setup on Vercel after deployment
const { execSync } = require('child_process');

async function setupDatabase() {
  try {
    console.log('🔄 Generating Prisma Client...');
    execSync('npx prisma generate', { stdio: 'inherit' });

    console.log('🔄 Running database migrations...');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });

    console.log('🔄 Seeding database with presets...');
    execSync('npx prisma db seed', { stdio: 'inherit' });

    console.log('✅ Database setup completed!');
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    // Don't exit with error to allow deployment to continue
    console.log('⚠️  Continuing deployment despite database setup issues');
  }
}

setupDatabase();