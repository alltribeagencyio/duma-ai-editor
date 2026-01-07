-- =============================================
-- DUMA AI DATABASE SETUP - COMPLETE SCHEMA
-- =============================================
-- Copy and paste this entire file into your Supabase SQL Editor
-- This will create all tables and default data needed for the application

-- ===== 1. CREATE USER TABLE =====
CREATE TABLE IF NOT EXISTS "User" (
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

CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");
CREATE INDEX IF NOT EXISTS "User_subscriptionTier_idx" ON "User"("subscriptionTier");
CREATE INDEX IF NOT EXISTS "User_subscriptionStatus_idx" ON "User"("subscriptionStatus");

-- ===== 2. CREATE JOB TABLE =====
CREATE TABLE IF NOT EXISTS "Job" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,

  -- Job Data
  "status" TEXT DEFAULT 'pending',
  "prompt" TEXT NOT NULL,
  "promptType" TEXT NOT NULL,
  "presetId" TEXT,
  "brandPromptId" TEXT,

  -- Re-editing & Versions
  "parentJobId" TEXT,
  "isReEdit" BOOLEAN DEFAULT false,
  "creditsCost" INTEGER DEFAULT 1,

  -- Product Information
  "productName" TEXT,
  "productCategory" TEXT,
  "productSku" TEXT,

  -- Images
  "inputImages" TEXT[],
  "outputData" JSONB,

  -- Contact
  "phone" TEXT,
  "notifyByEmail" BOOLEAN DEFAULT true,

  -- Metadata
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "startedAt" TIMESTAMPTZ,
  "completedAt" TIMESTAMPTZ,
  "errorMessage" TEXT,

  -- Notification
  "notificationSent" BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS "Job_userId_idx" ON "Job"("userId");
CREATE INDEX IF NOT EXISTS "Job_status_idx" ON "Job"("status");
CREATE INDEX IF NOT EXISTS "Job_createdAt_idx" ON "Job"("createdAt");
CREATE INDEX IF NOT EXISTS "Job_parentJobId_idx" ON "Job"("parentJobId");

-- ===== 3. CREATE PROMPT PRESET TABLE =====
CREATE TABLE IF NOT EXISTS "PromptPreset" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "prompt" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "icon" TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  "isActive" BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS "PromptPreset_category_idx" ON "PromptPreset"("category");
CREATE INDEX IF NOT EXISTS "PromptPreset_order_idx" ON "PromptPreset"("order");

-- ===== 4. CREATE CUSTOM PROMPT TABLE =====
CREATE TABLE IF NOT EXISTS "CustomPrompt" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "prompt" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "CustomPrompt_userId_idx" ON "CustomPrompt"("userId");
CREATE INDEX IF NOT EXISTS "CustomPrompt_category_idx" ON "CustomPrompt"("category");

-- ===== 5. CREATE BRAND PROMPT TABLE =====
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

-- ===== 6. CREATE CREDIT USAGE TABLE =====
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

-- ===== 7. CREATE SUBSCRIPTION PLAN TABLE =====
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

-- ===== 8. CREATE SUBSCRIPTION TABLE =====
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

-- ===== 9. CREATE PAYMENT TABLE =====
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

-- ===== 10. INSERT DEFAULT DATA =====

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

-- Insert some default prompt presets
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

-- ===== 11. FOREIGN KEY CONSTRAINTS (Optional - Add if you want strict referential integrity) =====
-- Uncomment these if you want to enforce foreign key relationships

-- ALTER TABLE "Job" ADD CONSTRAINT "Job_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
-- ALTER TABLE "Job" ADD CONSTRAINT "Job_presetId_fkey" FOREIGN KEY ("presetId") REFERENCES "PromptPreset"("id") ON DELETE SET NULL;
-- ALTER TABLE "Job" ADD CONSTRAINT "Job_brandPromptId_fkey" FOREIGN KEY ("brandPromptId") REFERENCES "BrandPrompt"("id") ON DELETE SET NULL;
-- ALTER TABLE "Job" ADD CONSTRAINT "Job_parentJobId_fkey" FOREIGN KEY ("parentJobId") REFERENCES "Job"("id") ON DELETE SET NULL;

-- ALTER TABLE "CustomPrompt" ADD CONSTRAINT "CustomPrompt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
-- ALTER TABLE "BrandPrompt" ADD CONSTRAINT "BrandPrompt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
-- ALTER TABLE "CreditUsage" ADD CONSTRAINT "CreditUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
-- ALTER TABLE "CreditUsage" ADD CONSTRAINT "CreditUsage_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL;

-- ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
-- ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE RESTRICT;

-- ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
-- ALTER TABLE "Payment" ADD CONSTRAINT "Payment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL;

-- =============================================
-- SETUP COMPLETE!
-- =============================================
-- After running this SQL:
-- 1. Your database will have all required tables
-- 2. Default subscription plans will be available
-- 3. Sample prompt presets will be ready
-- 4. All indexes are created for optimal performance
-- 5. Your Duma AI app should work with all new features!
--
-- Next steps:
-- 1. Go to your deployed app
-- 2. You should see Analytics and Subscription in the sidebar
-- 3. New users will go through onboarding flow
-- 4. All features are ready to use!
-- =============================================