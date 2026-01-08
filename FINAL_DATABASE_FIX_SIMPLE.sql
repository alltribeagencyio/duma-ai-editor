-- =====================================================
-- FINAL DATABASE FIX - Align Database with App
-- Run this in Supabase SQL Editor (WITHOUT Explain mode)
-- =====================================================

-- Step 1: Rename notification columns to match app expectations
ALTER TABLE "User" RENAME COLUMN "emailNotifications" TO "notificationsEmail";
ALTER TABLE "User" RENAME COLUMN "whatsappNotifications" TO "notificationsWhatsApp";

-- Step 2: Add missing critical columns
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isAdmin" BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "role" TEXT DEFAULT 'user' NOT NULL;

-- Step 3: Drop unused columns
ALTER TABLE "User" DROP COLUMN IF EXISTS "industry";
ALTER TABLE "User" DROP COLUMN IF EXISTS "businessType";

-- Step 4: Make credit fields NOT NULL (set defaults for existing nulls first)
UPDATE "User" SET "monthlyCredits" = 10 WHERE "monthlyCredits" IS NULL;
UPDATE "User" SET "practiceCredits" = 0 WHERE "practiceCredits" IS NULL;
UPDATE "User" SET "creditsUsed" = 0 WHERE "creditsUsed" IS NULL;

ALTER TABLE "User" ALTER COLUMN "monthlyCredits" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "practiceCredits" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "creditsUsed" SET NOT NULL;

-- Step 5: Make subscription fields NOT NULL
UPDATE "User" SET "subscriptionTier" = 'free' WHERE "subscriptionTier" IS NULL;
UPDATE "User" SET "subscriptionStatus" = 'active' WHERE "subscriptionStatus" IS NULL;

ALTER TABLE "User" ALTER COLUMN "subscriptionTier" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "subscriptionStatus" SET NOT NULL;

-- Step 6: Add index for isAdmin (for admin queries)
CREATE INDEX IF NOT EXISTS "User_isAdmin_idx" ON "User"("isAdmin");
