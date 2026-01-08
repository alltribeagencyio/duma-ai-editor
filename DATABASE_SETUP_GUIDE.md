# Database Setup Guide - Fix Profile Page

## The Problem
Your profile page is stuck loading because Prisma migrations are failing, which means the database tables don't exist.

## Quick Fix Steps

### Step 1: Check What Tables Exist

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Click on your project
3. Go to **SQL Editor** (left sidebar)
4. Copy and paste the contents of `check_existing_tables.sql`
5. Click **Run**

This will show you:
- ✅ Which tables already exist
- ❌ Which tables are missing
- List of all columns in the User table (if it exists)

### Step 2: Identify What's Missing

After running the check, you'll see output like:
```
❌ User table MISSING
❌ Job table MISSING
✅ PromptPreset table EXISTS
...etc
```

**Take a screenshot or copy the results** and share them with me so I can create a targeted SQL script to create only the missing tables.

### Step 3: Most Likely Issue - User Table Missing

If the User table is missing (most common issue), here's a quick fix:

```sql
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create User table
CREATE TABLE IF NOT EXISTS "User" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "email" TEXT UNIQUE NOT NULL,
  "fullName" TEXT,
  "phone" TEXT,
  "avatar" TEXT,

  -- Subscription & Billing
  "subscriptionTier" TEXT DEFAULT 'free' NOT NULL,
  "subscriptionStatus" TEXT DEFAULT 'active' NOT NULL,
  "subscriptionId" TEXT,
  "planId" TEXT,

  -- Credits
  "monthlyCredits" INTEGER DEFAULT 0 NOT NULL,
  "practiceCredits" INTEGER DEFAULT 0 NOT NULL,
  "creditsUsed" INTEGER DEFAULT 0 NOT NULL,
  "creditsReset" TIMESTAMP,

  -- Brand & Preferences
  "brandName" TEXT,
  "brandIndustry" TEXT,
  "brandAesthetic" TEXT,
  "brandColors" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "brandRequirements" TEXT,

  -- Settings
  "notificationsEmail" BOOLEAN DEFAULT true NOT NULL,
  "notificationsWhatsApp" BOOLEAN DEFAULT false NOT NULL,
  "whatsappNumber" TEXT,
  "language" TEXT DEFAULT 'en' NOT NULL,
  "timezone" TEXT DEFAULT 'UTC' NOT NULL,

  -- Setup & Onboarding
  "hasCompletedOnboarding" BOOLEAN DEFAULT false NOT NULL,
  "setupFeesPaid" BOOLEAN DEFAULT false NOT NULL,
  "onboardingStep" INTEGER DEFAULT 0 NOT NULL,

  -- Admin & Roles
  "isAdmin" BOOLEAN DEFAULT false NOT NULL,
  "role" TEXT DEFAULT 'user' NOT NULL,

  -- Metadata
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "lastLoginAt" TIMESTAMP,
  "lastActiveAt" TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");
CREATE INDEX IF NOT EXISTS "User_subscriptionTier_idx" ON "User"("subscriptionTier");
CREATE INDEX IF NOT EXISTS "User_subscriptionStatus_idx" ON "User"("subscriptionStatus");
CREATE INDEX IF NOT EXISTS "User_isAdmin_idx" ON "User"("isAdmin");

-- Create trigger for updatedAt
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_user_updated_at ON "User";
CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON "User"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Step 4: Verify the Fix

After creating the tables, test the profile page:

1. **Restart your dev server:**
   ```bash
   # Stop the server (Ctrl+C)
   npm run dev
   ```

2. **Hard refresh your browser:** `Ctrl + Shift + R`

3. **Navigate to `/profile`**

4. **Check the terminal logs for:**
   ```
   [Profile API] Starting profile fetch...
   [Profile API] User from auth: [your-user-id]
   [Profile API] Fetching user profile from database...
   [Profile API] User profile found: false
   [Profile API] Creating new user profile...
   [Profile API] User profile created
   [Profile API] Returning profile data
   ```

5. **Check browser console (F12):**
   - Should see: `Profile loaded: {id: "...", email: "...", ...}`

### Step 5: Why Prisma Migrations Failed

Common reasons:
1. **Database connection issue** - Check `.env` has correct `DATABASE_URL`
2. **Permission issues** - Supabase database user needs CREATE TABLE permissions
3. **Syntax differences** - Prisma migration SQL might not match PostgreSQL exactly

**Workaround:** We're bypassing Prisma migrations and creating tables directly in Supabase SQL Editor, which always works.

## What Happens Next

Once the User table exists:
- ✅ Profile page will load
- ✅ User data will be automatically created on first login
- ✅ Credits, subscription info will be tracked
- ✅ Admin features will work

## If You Still Have Issues

Share the output from `check_existing_tables.sql` and I'll create a custom SQL script for your specific situation.
