# Complete Fix Guide - Profile Page & Database Issues

## What Was Wrong

1. **Wrong DATABASE_URL during initial deployment**
   - Used incorrect connection URL
   - Prisma migrations failed
   - Tables created but structure doesn't match Prisma schema

2. **Missing .env file**
   - Prisma only reads from `.env`, not `.env.local`
   - DATABASE_URL was in wrong file

3. **Tables exist but Prisma can't use them**
   - Schema mismatch between database and Prisma expectations
   - Missing columns like `isAdmin`, `role`, `lastLoginAt`

## What I Fixed

✅ Created `.env` file with correct DATABASE_URL
✅ Updated to use correct pooled connection URL
✅ Regenerated Prisma client successfully
✅ Added error handling to profile page
✅ Added diagnostic logging to API routes

## Steps to Complete the Fix

### Step 1: Fix Database Schema

Run this in **Supabase SQL Editor**:

1. Go to https://supabase.com/dashboard
2. Open your project
3. Click **SQL Editor**
4. Copy and paste contents of `fix_user_table_for_prisma.sql`
5. Click **Run**

This will:
- Check what columns exist in User table
- Add any missing columns (`isAdmin`, `role`, `brandColors`, `lastLoginAt`, `lastActiveAt`)
- Create necessary indexes
- Show you the final table structure

### Step 2: Verify the Fix

After running the SQL script, check the output shows:
```
✅ Added isAdmin column (or ✓ already exists)
✅ Added role column (or ✓ already exists)
...
✅ User table structure fixed!
```

### Step 3: Test the Application

1. **Restart your dev server:**
   ```bash
   npm run dev
   ```

2. **Navigate to `/profile`**

3. **Check terminal logs:**
   ```
   [Profile API] Starting profile fetch...
   [Profile API] User from auth: [your-id]
   [Profile API] Fetching user profile from database...
   [Profile API] User profile found: true (or creating new...)
   [Profile API] Returning profile data
   ```

4. **Check browser console (F12):**
   ```
   Profile loaded: {id: "...", email: "...", monthlyCredits: 0, ...}
   ```

5. **Profile page should display:**
   - Subscription card showing your tier
   - Credit usage card
   - Profile form with your email and settings

### Step 4: If Still Not Working

**Check for specific error in browser console:**

- **"Failed to load profile: 500"**
  - Check terminal logs for exact error
  - Likely missing column - run `verify_user_table_columns.sql` to see what's missing

- **"Network error: Could not load profile"**
  - Check dev server is running
  - Check Supabase is accessible

- **"Unauthorized" (401)**
  - You're not logged in
  - Log out and log back in

## For Production Deployment

When deploying, make sure to:

1. **Add DATABASE_URL to Vercel/deployment environment variables:**
   ```
   DATABASE_URL=postgresql://postgres.ulyhlahujgibuwsjxsxb:JwJmTbGD3Uadlsw9@aws-1-eu-central-1.pooler.supabase.com:5432/postgres
   ```

2. **Run the SQL fix script in production Supabase** (same as Step 1 above)

3. **Redeploy application** after adding environment variable

## Summary of Files Created

- ✅ `.env` - Correct environment variables for local development
- ✅ `fix_user_table_for_prisma.sql` - Adds missing columns to User table
- ✅ `verify_user_table_columns.sql` - Check what columns exist
- ✅ `PRISMA_MIGRATION_ISSUES.md` - Detailed explanation of why migrations fail
- ✅ `DATABASE_SETUP_GUIDE.md` - Complete database setup guide
- ✅ Enhanced ProfileClient with error handling
- ✅ Enhanced API route with detailed logging

## Next Steps After Fix

Once profile page works:

1. **Make yourself admin:**
   ```sql
   UPDATE "User"
   SET "isAdmin" = true, "role" = 'superadmin'
   WHERE "email" = 'your-email@example.com';
   ```

2. **Access admin dashboard:**
   - Navigate to `/admin`
   - Manage users and credits

3. **Remove debug logging (optional):**
   - Remove console.log statements from ProfileClient.tsx
   - Remove console.log statements from profile/route.ts
