-- Create Subscription Plan Table
CREATE TABLE "SubscriptionPlan" (
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

CREATE INDEX "SubscriptionPlan_name_idx" ON "SubscriptionPlan"("name");
CREATE INDEX "SubscriptionPlan_isActive_idx" ON "SubscriptionPlan"("isActive");

-- Create Subscription Table
CREATE TABLE "Subscription" (
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

CREATE INDEX "Subscription_userId_idx" ON "Subscription"("userId");
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");
CREATE INDEX "Subscription_paystackSubscriptionCode_idx" ON "Subscription"("paystackSubscriptionCode");

-- Create Payment Table
CREATE TABLE "Payment" (
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

CREATE INDEX "Payment_userId_idx" ON "Payment"("userId");
CREATE INDEX "Payment_paystackReference_idx" ON "Payment"("paystackReference");
CREATE INDEX "Payment_status_idx" ON "Payment"("status");
CREATE INDEX "Payment_type_idx" ON "Payment"("type");