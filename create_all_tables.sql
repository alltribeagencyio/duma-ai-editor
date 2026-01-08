-- =====================================================
-- DUMA AI - Complete Database Schema
-- Run this in Supabase SQL Editor to create all tables
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. USER TABLE
-- =====================================================
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

-- User Indexes
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");
CREATE INDEX IF NOT EXISTS "User_subscriptionTier_idx" ON "User"("subscriptionTier");
CREATE INDEX IF NOT EXISTS "User_subscriptionStatus_idx" ON "User"("subscriptionStatus");
CREATE INDEX IF NOT EXISTS "User_isAdmin_idx" ON "User"("isAdmin");

-- =====================================================
-- 2. JOB TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS "Job" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" TEXT NOT NULL,

  -- Job Data
  "status" TEXT DEFAULT 'pending' NOT NULL,
  "prompt" TEXT NOT NULL,
  "promptType" TEXT NOT NULL,
  "presetId" TEXT,
  "brandPromptId" TEXT,

  -- Re-editing & Versions
  "parentJobId" TEXT,
  "isReEdit" BOOLEAN DEFAULT false NOT NULL,
  "creditsCost" INTEGER DEFAULT 1 NOT NULL,

  -- Product Information
  "productName" TEXT,
  "productCategory" TEXT,
  "productSku" TEXT,

  -- Images
  "inputImages" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "outputData" JSONB,

  -- Contact
  "phone" TEXT,
  "notifyByEmail" BOOLEAN DEFAULT true NOT NULL,

  -- Metadata
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "startedAt" TIMESTAMP,
  "completedAt" TIMESTAMP,
  "errorMessage" TEXT,

  -- Notification
  "notificationSent" BOOLEAN DEFAULT false NOT NULL
);

-- Job Indexes
CREATE INDEX IF NOT EXISTS "Job_userId_idx" ON "Job"("userId");
CREATE INDEX IF NOT EXISTS "Job_status_idx" ON "Job"("status");
CREATE INDEX IF NOT EXISTS "Job_createdAt_idx" ON "Job"("createdAt");
CREATE INDEX IF NOT EXISTS "Job_parentJobId_idx" ON "Job"("parentJobId");

-- =====================================================
-- 3. PROMPT PRESET TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS "PromptPreset" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "prompt" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "icon" TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  "isActive" BOOLEAN DEFAULT true NOT NULL
);

-- PromptPreset Indexes
CREATE INDEX IF NOT EXISTS "PromptPreset_category_idx" ON "PromptPreset"("category");
CREATE INDEX IF NOT EXISTS "PromptPreset_order_idx" ON "PromptPreset"("order");

-- =====================================================
-- 4. CUSTOM PROMPT TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS "CustomPrompt" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "prompt" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- CustomPrompt Indexes
CREATE INDEX IF NOT EXISTS "CustomPrompt_userId_idx" ON "CustomPrompt"("userId");
CREATE INDEX IF NOT EXISTS "CustomPrompt_category_idx" ON "CustomPrompt"("category");

-- =====================================================
-- 5. BRAND PROMPT TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS "BrandPrompt" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "prompt" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "industry" TEXT,
  "isActive" BOOLEAN DEFAULT true NOT NULL,
  "usageCount" INTEGER DEFAULT 0 NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- BrandPrompt Indexes
CREATE INDEX IF NOT EXISTS "BrandPrompt_userId_idx" ON "BrandPrompt"("userId");
CREATE INDEX IF NOT EXISTS "BrandPrompt_category_idx" ON "BrandPrompt"("category");
CREATE INDEX IF NOT EXISTS "BrandPrompt_industry_idx" ON "BrandPrompt"("industry");

-- =====================================================
-- 6. CREDIT USAGE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS "CreditUsage" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" TEXT NOT NULL,
  "jobId" TEXT,
  "amount" INTEGER NOT NULL,
  "type" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- CreditUsage Indexes
CREATE INDEX IF NOT EXISTS "CreditUsage_userId_idx" ON "CreditUsage"("userId");
CREATE INDEX IF NOT EXISTS "CreditUsage_type_idx" ON "CreditUsage"("type");
CREATE INDEX IF NOT EXISTS "CreditUsage_createdAt_idx" ON "CreditUsage"("createdAt");

-- =====================================================
-- 7. SUBSCRIPTION PLAN TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS "SubscriptionPlan" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "name" TEXT UNIQUE NOT NULL,
  "displayName" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "price" INTEGER NOT NULL,
  "currency" TEXT DEFAULT 'NGN' NOT NULL,

  -- Features
  "monthlyCredits" INTEGER NOT NULL,
  "maxBrandPrompts" INTEGER NOT NULL,
  "setupFee" INTEGER DEFAULT 0 NOT NULL,

  -- Paystack Integration
  "paystackPlanCode" TEXT UNIQUE,

  -- Feature flags
  "hasWhatsAppSupport" BOOLEAN DEFAULT false NOT NULL,
  "hasPrioritySupport" BOOLEAN DEFAULT false NOT NULL,
  "hasBulkProcessing" BOOLEAN DEFAULT false NOT NULL,
  "hasAdvancedAnalytics" BOOLEAN DEFAULT false NOT NULL,
  "hasCustomBranding" BOOLEAN DEFAULT false NOT NULL,

  "isActive" BOOLEAN DEFAULT true NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- SubscriptionPlan Indexes
CREATE INDEX IF NOT EXISTS "SubscriptionPlan_name_idx" ON "SubscriptionPlan"("name");
CREATE INDEX IF NOT EXISTS "SubscriptionPlan_isActive_idx" ON "SubscriptionPlan"("isActive");

-- =====================================================
-- 8. SUBSCRIPTION TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS "Subscription" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" TEXT UNIQUE NOT NULL,
  "planId" TEXT NOT NULL,

  -- Paystack Integration
  "paystackCustomerCode" TEXT,
  "paystackSubscriptionCode" TEXT UNIQUE,
  "paystackAuthCode" TEXT,

  "status" TEXT DEFAULT 'active' NOT NULL,
  "currentPeriodStart" TIMESTAMP NOT NULL,
  "currentPeriodEnd" TIMESTAMP NOT NULL,
  "cancelAtPeriodEnd" BOOLEAN DEFAULT false NOT NULL,
  "canceledAt" TIMESTAMP,

  -- Setup fees
  "setupFeePaid" BOOLEAN DEFAULT false NOT NULL,
  "setupFeeAmount" INTEGER,
  "setupFeePaidAt" TIMESTAMP,

  -- Metadata
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Subscription Indexes
CREATE INDEX IF NOT EXISTS "Subscription_userId_idx" ON "Subscription"("userId");
CREATE INDEX IF NOT EXISTS "Subscription_status_idx" ON "Subscription"("status");
CREATE INDEX IF NOT EXISTS "Subscription_paystackSubscriptionCode_idx" ON "Subscription"("paystackSubscriptionCode");

-- =====================================================
-- 9. PAYMENT TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS "Payment" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" TEXT NOT NULL,
  "subscriptionId" TEXT,

  -- Paystack Integration
  "paystackReference" TEXT UNIQUE NOT NULL,
  "paystackTransactionId" TEXT,

  "amount" INTEGER NOT NULL,
  "currency" TEXT DEFAULT 'NGN' NOT NULL,
  "status" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "description" TEXT,

  -- Metadata
  "metadata" JSONB,
  "paidAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Payment Indexes
CREATE INDEX IF NOT EXISTS "Payment_userId_idx" ON "Payment"("userId");
CREATE INDEX IF NOT EXISTS "Payment_paystackReference_idx" ON "Payment"("paystackReference");
CREATE INDEX IF NOT EXISTS "Payment_status_idx" ON "Payment"("status");
CREATE INDEX IF NOT EXISTS "Payment_type_idx" ON "Payment"("type");

-- =====================================================
-- UPDATE TRIGGERS FOR updatedAt
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updatedAt
DROP TRIGGER IF EXISTS update_user_updated_at ON "User";
CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON "User"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_custom_prompt_updated_at ON "CustomPrompt";
CREATE TRIGGER update_custom_prompt_updated_at BEFORE UPDATE ON "CustomPrompt"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_brand_prompt_updated_at ON "BrandPrompt";
CREATE TRIGGER update_brand_prompt_updated_at BEFORE UPDATE ON "BrandPrompt"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscription_plan_updated_at ON "SubscriptionPlan";
CREATE TRIGGER update_subscription_plan_updated_at BEFORE UPDATE ON "SubscriptionPlan"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscription_updated_at ON "Subscription";
CREATE TRIGGER update_subscription_updated_at BEFORE UPDATE ON "Subscription"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================
-- Run this after creating tables to verify
SELECT
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
    AND table_name IN ('User', 'Job', 'PromptPreset', 'CustomPrompt', 'BrandPrompt',
                       'CreditUsage', 'SubscriptionPlan', 'Subscription', 'Payment')
ORDER BY table_name;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '✅ Database schema created successfully!';
    RAISE NOTICE 'Tables created: User, Job, PromptPreset, CustomPrompt, BrandPrompt, CreditUsage, SubscriptionPlan, Subscription, Payment';
    RAISE NOTICE 'Next step: Run seed_initial_data.sql to populate default data';
END $$;
