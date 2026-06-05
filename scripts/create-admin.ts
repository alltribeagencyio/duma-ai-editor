/**
 * One-off: create (or promote) an admin user for the native auth system.
 *
 * Credentials are read at runtime from env vars (or argv) so nothing sensitive
 * is committed. Requires DATABASE_URL to point at the target database and the
 * schema to be migrated.
 *
 * Usage (PowerShell):
 *   $env:ADMIN_EMAIL="admin@alltribeagency.io"; $env:ADMIN_PASSWORD="StrongPass123"; npm run create-admin
 * Usage (bash):
 *   ADMIN_EMAIL=admin@alltribeagency.io ADMIN_PASSWORD=StrongPass123 npm run create-admin
 */
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = (process.env.ADMIN_EMAIL || process.argv[2] || '').trim().toLowerCase()
  const password = process.env.ADMIN_PASSWORD || process.argv[3] || ''
  const fullName = process.env.ADMIN_NAME || 'Admin'

  if (!email || !password) {
    console.error('Missing credentials.')
    console.error('  ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=secret npm run create-admin')
    process.exit(1)
  }
  if (password.length < 8) {
    console.error('Password must be at least 8 characters.')
    process.exit(1)
  }

  const passwordHash = await bcrypt.hash(password, 12)

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      isAdmin: true,
      isSuperAdmin: true,
      role: 'admin',
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
    create: {
      email,
      passwordHash,
      fullName,
      isAdmin: true,
      isSuperAdmin: true,
      role: 'admin',
      emailVerified: true,
      emailVerifiedAt: new Date(),
      hasCompletedOnboarding: true,
    },
    select: { id: true, email: true, isAdmin: true, isSuperAdmin: true },
  })

  console.log(`✅ Admin ready: ${user.email} (id: ${user.id}, isAdmin: ${user.isAdmin}, isSuperAdmin: ${user.isSuperAdmin})`)
}

main()
  .catch((e) => {
    console.error('Failed to create admin:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
