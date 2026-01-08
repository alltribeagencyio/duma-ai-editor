# Why Prisma Migrations Are Failing

## Common Causes

### 1. **Database Connection URL Issues**
**Problem:** Prisma can't connect to your Supabase database.

**Check:**
```bash
# Look at your .env file
cat .env | grep DATABASE_URL
```

**What it should look like:**
```
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
```

**Common mistakes:**
- ❌ Missing `?pgbouncer=true` at the end
- ❌ Using direct connection (port 5432) instead of pooler (port 6543)
- ❌ Wrong password or project reference
- ❌ Using `Transaction` mode pooler instead of `Session` mode

**Fix:**
1. Go to Supabase Dashboard → Project Settings → Database
2. Copy the **Connection Pooling** URL (not Direct connection)
3. Make sure it's in **Session mode** not Transaction mode
4. Update your `.env` file

### 2. **Shadow Database Required**
**Problem:** Prisma needs a shadow database for migrations, but Supabase doesn't provide one by default.

**Error you might see:**
```
Error: A migration failed when applied to the shadow database
```

**Fix:** Add shadow database URL to your Prisma schema or use direct SQL instead.

### 3. **Prisma Schema Out of Sync**
**Problem:** Your Prisma schema defines fields that don't exist in the database.

**This is your current issue** - Tables exist but Prisma can't read them properly because:
- Column names don't match
- Data types are different
- Missing columns
- Extra columns that shouldn't be there

**How to check:**
Run `verify_user_table_columns.sql` in Supabase SQL Editor to see what columns actually exist.

### 4. **Case Sensitivity Issues**
**Problem:** PostgreSQL is case-sensitive with quoted identifiers.

Prisma generates:
```sql
CREATE TABLE "User" (...)  -- Capital U
```

But you might have:
```sql
CREATE TABLE "user" (...)  -- lowercase u
```

These are **different tables** in PostgreSQL!

### 5. **Permission Issues**
**Problem:** Database user doesn't have CREATE/ALTER permissions.

**Check:**
```sql
-- Run in Supabase SQL Editor
SELECT * FROM pg_roles WHERE rolname = 'postgres';
```

Should show `rolcreatedb = true`

## Why Direct SQL Works Better for Supabase

### Prisma Migrations (Complex):
```
1. Generate migration files
2. Connect to database
3. Create shadow database
4. Apply migration to shadow
5. Validate schema
6. Apply to real database
7. Update _prisma_migrations table
```
❌ Can fail at any step

### Direct SQL (Simple):
```
1. Copy SQL script
2. Paste in Supabase SQL Editor
3. Click Run
```
✅ Always works

## Solution: Sync Prisma Schema with Database

Since your tables already exist, you have two options:

### Option A: Pull Database Schema into Prisma
```bash
# This will update your Prisma schema to match the database
npx prisma db pull

# Then regenerate Prisma Client
npx prisma generate
```

### Option B: Fix Database to Match Prisma Schema
Run SQL scripts to add missing columns and fix data types.

## Recommended Steps

1. **Verify what columns exist:**
   ```sql
   -- Run verify_user_table_columns.sql
   ```

2. **Pull schema from database:**
   ```bash
   npx prisma db pull
   ```

3. **Check what changed:**
   ```bash
   git diff prisma/schema.prisma
   ```

4. **Regenerate Prisma Client:**
   ```bash
   npx prisma generate
   ```

5. **Test the profile page:**
   - Restart dev server
   - Navigate to /profile
   - Check terminal logs

## If Nothing Works

The nuclear option (start fresh):

```bash
# 1. Backup your .env file
cp .env .env.backup

# 2. Delete Prisma client
rm -rf node_modules/.prisma

# 3. Pull schema from database
npx prisma db pull

# 4. Generate new client
npx prisma generate

# 5. Restart dev server
npm run dev
```

This will make Prisma match whatever is actually in your database.
