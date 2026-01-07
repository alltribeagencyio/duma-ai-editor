-- =============================================
-- STEP 1: CREATE USER TABLE FROM SCRATCH
-- =============================================
-- Run this first to create the User table completely

CREATE TABLE "User" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT UNIQUE NOT NULL,
  "fullName" TEXT,
  "phone" TEXT,
  "avatar" TEXT,

  -- Subscription & Billing
  "subscriptionTier" TEXT DEFAULT 'free',
  "subscriptionStatus" TEXT DEFAULT 'active',
  "subscriptionId" TEXT,
  "planId" TEXT,

  -- Credits
  "monthlyCredits" INTEGER DEFAULT 10,
  "practiceCredits" INTEGER DEFAULT 0,
  "creditsUsed" INTEGER DEFAULT 0,
  "creditsReset" TIMESTAMPTZ,

  -- Brand & Preferences
  "industry" TEXT,
  "businessType" TEXT,
  "brandName" TEXT,
  "brandIndustry" TEXT,
  "brandAesthetic" TEXT,
  "brandColors" TEXT[],
  "brandRequirements" TEXT,

  -- Settings
  "emailNotifications" BOOLEAN DEFAULT true,
  "whatsappNotifications" BOOLEAN DEFAULT false,
  "whatsappNumber" TEXT,
  "language" TEXT DEFAULT 'en',
  "timezone" TEXT DEFAULT 'UTC',

  -- Setup & Onboarding
  "hasCompletedOnboarding" BOOLEAN DEFAULT false,
  "setupFeesPaid" BOOLEAN DEFAULT false,
  "onboardingStep" INTEGER DEFAULT 0,

  -- Metadata
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  "lastLoginAt" TIMESTAMPTZ,
  "lastActiveAt" TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_subscriptionTier_idx" ON "User"("subscriptionTier");
CREATE INDEX "User_subscriptionStatus_idx" ON "User"("subscriptionStatus");
CREATE INDEX "User_hasCompletedOnboarding_idx" ON "User"("hasCompletedOnboarding");

-- =============================================
-- STEP 1 COMPLETE!
-- =============================================
-- User table has been created with all required columns
-- Ready for Step 2 (Job table)
-- =============================================