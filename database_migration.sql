-- =============================================
-- DUMA AI DATABASE MIGRATION - UPDATE EXISTING TABLES
-- =============================================
-- Use this if you already have User and Job tables
-- This will add missing columns and create new tables

-- ===== 1. UPDATE EXISTING USER TABLE =====
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

-- ===== 2. UPDATE EXISTING JOB TABLE =====
-- Add new columns to existing Job table
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "parentJobId" TEXT;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "isReEdit" BOOLEAN DEFAULT false;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "creditsCost" INTEGER DEFAULT 1;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "brandPromptId" TEXT;

-- Add indexes for Job table
CREATE INDEX IF NOT EXISTS "Job_parentJobId_idx" ON "Job"("parentJobId");
CREATE INDEX IF NOT EXISTS "Job_isReEdit_idx" ON "Job"("isReEdit");
CREATE INDEX IF NOT EXISTS "Job_brandPromptId_idx" ON "Job"("brandPromptId");

-- ===== 3. CREATE NEW TABLES =====

-- Create Brand Prompt Table
CREATE TABLE IF NOT EXISTS "BrandPrompt" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "prompt" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "industry" TEXT,
  "isActive" BOOLEAN DEFAULT true,
  "isDefault" BOOLEAN DEFAULT false,
  "usageCount" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "BrandPrompt_userId_idx" ON "BrandPrompt"("userId");
CREATE INDEX IF NOT EXISTS "BrandPrompt_category_idx" ON "BrandPrompt"("category");
CREATE INDEX IF NOT EXISTS "BrandPrompt_industry_idx" ON "BrandPrompt"("industry");

-- Create Credit Usage Table
CREATE TABLE IF NOT EXISTS "CreditUsage" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  "jobId" TEXT,
  "amount" INTEGER NOT NULL,
  "type" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "CreditUsage_userId_idx" ON "CreditUsage"("userId");
CREATE INDEX IF NOT EXISTS "CreditUsage_type_idx" ON "CreditUsage"("type");
CREATE INDEX IF NOT EXISTS "CreditUsage_createdAt_idx" ON "CreditUsage"("createdAt");

-- Create Subscription Plan Table
CREATE TABLE IF NOT EXISTS "SubscriptionPlan" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT UNIQUE NOT NULL,
  "displayName" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "price" INTEGER NOT NULL,
  "currency" TEXT DEFAULT 'NGN',
  "monthlyCredits" INTEGER NOT NULL,
  "maxBrandPrompts" INTEGER NOT NULL,
  "setupFee" INTEGER DEFAULT 0,
  "paystackPlanCode" TEXT UNIQUE,
  "hasWhatsAppSupport" BOOLEAN DEFAULT false,
  "hasPrioritySupport" BOOLEAN DEFAULT false,
  "hasBulkProcessing" BOOLEAN DEFAULT false,
  "hasAdvancedAnalytics" BOOLEAN DEFAULT false,
  "hasCustomBranding" BOOLEAN DEFAULT false,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "SubscriptionPlan_name_idx" ON "SubscriptionPlan"("name");
CREATE INDEX IF NOT EXISTS "SubscriptionPlan_isActive_idx" ON "SubscriptionPlan"("isActive");

-- Create Subscription Table
CREATE TABLE IF NOT EXISTS "Subscription" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT UNIQUE NOT NULL,
  "planId" TEXT NOT NULL,
  "paystackCustomerCode" TEXT,
  "paystackSubscriptionCode" TEXT UNIQUE,
  "paystackAuthCode" TEXT,
  "status" TEXT DEFAULT 'active',
  "currentPeriodStart" TIMESTAMPTZ NOT NULL,
  "currentPeriodEnd" TIMESTAMPTZ NOT NULL,
  "cancelAtPeriodEnd" BOOLEAN DEFAULT false,
  "canceledAt" TIMESTAMPTZ,
  "setupFeePaid" BOOLEAN DEFAULT false,
  "setupFeeAmount" INTEGER,
  "setupFeePaidAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "Subscription_userId_idx" ON "Subscription"("userId");
CREATE INDEX IF NOT EXISTS "Subscription_status_idx" ON "Subscription"("status");
CREATE INDEX IF NOT EXISTS "Subscription_paystackSubscriptionCode_idx" ON "Subscription"("paystackSubscriptionCode");

-- Create Payment Table
CREATE TABLE IF NOT EXISTS "Payment" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  "subscriptionId" TEXT,
  "paystackReference" TEXT UNIQUE NOT NULL,
  "paystackTransactionId" TEXT,
  "amount" INTEGER NOT NULL,
  "currency" TEXT DEFAULT 'NGN',
  "status" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "description" TEXT,
  "metadata" JSONB,
  "paidAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "Payment_userId_idx" ON "Payment"("userId");
CREATE INDEX IF NOT EXISTS "Payment_paystackReference_idx" ON "Payment"("paystackReference");
CREATE INDEX IF NOT EXISTS "Payment_status_idx" ON "Payment"("status");
CREATE INDEX IF NOT EXISTS "Payment_type_idx" ON "Payment"("type");

-- ===== 4. INSERT DEFAULT DATA =====

-- Insert default subscription plans
INSERT INTO "SubscriptionPlan" (
  "name", "displayName", "description", "price", "monthlyCredits",
  "maxBrandPrompts", "setupFee", "hasWhatsAppSupport", "hasPrioritySupport",
  "hasBulkProcessing", "hasAdvancedAnalytics", "hasCustomBranding"
) VALUES
('free', 'Free Plan', 'Perfect for trying out Duma AI', 0, 10, 1, 0, false, false, false, false, false),
('starter', 'Starter Plan', 'Great for small businesses and freelancers', 500000, 100, 3, 2500000, true, false, false, false, false),
('pro', 'Pro Plan', 'Perfect for growing businesses', 1500000, 500, 10, 5000000, true, true, true, true, false),
('enterprise', 'Enterprise Plan', 'For large teams and agencies', 5000000, 2000, 50, 10000000, true, true, true, true, true)
ON CONFLICT (name) DO NOTHING;

-- Insert default prompt presets (if table exists)
INSERT INTO "PromptPreset" (
  "name", "description", "prompt", "category", "icon", "order"
) VALUES
('Clean White Background', 'Replace background with clean white', 'professional product photography, clean white background, studio lighting, high quality', 'background', 'Square', 1),
('Lifestyle Scene', 'Place product in natural lifestyle setting', 'lifestyle photography, natural setting, ambient lighting, realistic environment', 'background', 'Home', 2),
('Premium Studio', 'High-end studio photography look', 'premium studio photography, professional lighting, luxury presentation, commercial quality', 'enhancement', 'Crown', 3),
('Color Enhancement', 'Enhance and boost colors', 'vibrant colors, enhanced saturation, professional color grading, crisp details', 'enhancement', 'Palette', 4),
('Minimal Clean', 'Minimal and clean aesthetic', 'minimal design, clean composition, modern aesthetic, professional presentation', 'enhancement', 'Minimize', 5),
('Natural Lighting', 'Soft natural lighting enhancement', 'natural lighting, soft shadows, warm tones, organic feel', 'enhancement', 'Sun', 6)
ON CONFLICT DO NOTHING;

-- ===== 5. UPDATE EXISTING USERS =====
-- Give existing users free plan defaults
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
-- MIGRATION COMPLETE!
-- =============================================
-- This migration has:
-- 1. Added all missing columns to existing User and Job tables
-- 2. Created all new tables (BrandPrompt, CreditUsage, SubscriptionPlan, Subscription, Payment)
-- 3. Added default subscription plans
-- 4. Updated existing users with default values
-- 5. Added all necessary indexes
--
-- Your app should now work with all new features!
-- =============================================