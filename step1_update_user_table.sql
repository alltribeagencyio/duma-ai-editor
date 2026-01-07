-- =============================================
-- STEP 1: UPDATE USER TABLE ONLY
-- =============================================
-- Run this first to add missing columns to your existing User table

-- Add new columns to existing User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "fullName" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "subscriptionTier" TEXT DEFAULT 'free';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "subscriptionStatus" TEXT DEFAULT 'active';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "subscriptionId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "planId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "monthlyCredits" INTEGER DEFAULT 10;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "practiceCredits" INTEGER DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "creditsUsed" INTEGER DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "creditsReset" TIMESTAMPTZ;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "industry" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "businessType" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "brandName" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "brandIndustry" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "brandAesthetic" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "brandColors" TEXT[];
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "brandRequirements" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailNotifications" BOOLEAN DEFAULT true;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "whatsappNotifications" BOOLEAN DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "whatsappNumber" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "language" TEXT DEFAULT 'en';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "timezone" TEXT DEFAULT 'UTC';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "hasCompletedOnboarding" BOOLEAN DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "setupFeesPaid" BOOLEAN DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "onboardingStep" INTEGER DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMPTZ;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastActiveAt" TIMESTAMPTZ;

-- Add indexes for User table
CREATE INDEX IF NOT EXISTS "User_subscriptionTier_idx" ON "User"("subscriptionTier");
CREATE INDEX IF NOT EXISTS "User_subscriptionStatus_idx" ON "User"("subscriptionStatus");
CREATE INDEX IF NOT EXISTS "User_hasCompletedOnboarding_idx" ON "User"("hasCompletedOnboarding");

-- Update existing users with default values
UPDATE "User"
SET
  "subscriptionTier" = 'free',
  "subscriptionStatus" = 'active',
  "monthlyCredits" = 10,
  "practiceCredits" = 0,
  "creditsUsed" = 0,
  "emailNotifications" = true,
  "whatsappNotifications" = false,
  "hasCompletedOnboarding" = true, -- Existing users skip onboarding
  "setupFeesPaid" = false
WHERE "subscriptionTier" IS NULL OR "subscriptionTier" = '';

-- =============================================
-- STEP 1 COMPLETE!
-- =============================================
-- User table has been updated with all new columns
-- Existing users now have free plan settings
-- Ready for Step 2 (Job table updates)
-- =============================================