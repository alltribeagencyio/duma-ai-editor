-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "prompt" TEXT NOT NULL,
    "promptType" TEXT NOT NULL,
    "presetId" TEXT,
    "productName" TEXT,
    "productCategory" TEXT,
    "productSku" TEXT,
    "inputImages" TEXT[],
    "outputData" JSONB,
    "phone" TEXT,
    "notifyByEmail" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "notificationSent" BOOLEAN NOT NULL DEFAULT false,
    "parentJobId" TEXT,
    "isReEdit" BOOLEAN DEFAULT false,
    "creditsCost" INTEGER DEFAULT 1,
    "brandPromptId" TEXT,
    "creditDeducted" BOOLEAN NOT NULL DEFAULT false,
    "webhookId" TEXT,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromptPreset" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "PromptPreset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomPrompt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomPrompt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT,
    "phone" TEXT,
    "phoneCountryCode" TEXT DEFAULT '+254',
    "avatar" TEXT,
    "subscriptionTier" TEXT NOT NULL DEFAULT 'free',
    "subscriptionStatus" TEXT NOT NULL DEFAULT 'active',
    "subscriptionId" TEXT,
    "planId" TEXT,
    "monthlyCredits" INTEGER NOT NULL DEFAULT 10,
    "practiceCredits" INTEGER NOT NULL DEFAULT 0,
    "creditsUsed" INTEGER NOT NULL DEFAULT 0,
    "creditsReset" TIMESTAMPTZ(6),
    "brandName" TEXT,
    "brandIndustry" TEXT,
    "brandAesthetic" TEXT,
    "brandColors" TEXT[],
    "brandRequirements" TEXT,
    "notificationsEmail" BOOLEAN DEFAULT true,
    "notificationsWhatsApp" BOOLEAN DEFAULT false,
    "whatsappNumber" TEXT,
    "language" TEXT DEFAULT 'en',
    "timezone" TEXT DEFAULT 'UTC',
    "hasCompletedOnboarding" BOOLEAN DEFAULT false,
    "setupFeesPaid" BOOLEAN DEFAULT false,
    "onboardingStep" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "lastLoginAt" TIMESTAMPTZ(6),
    "lastActiveAt" TIMESTAMPTZ(6),
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false,
    "role" TEXT NOT NULL DEFAULT 'user',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandPrompt" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "createdBy" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "industry" TEXT,
    "isActive" BOOLEAN DEFAULT true,
    "isDefault" BOOLEAN DEFAULT false,
    "usageCount" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BrandPrompt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditUsage" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "userId" TEXT NOT NULL,
    "jobId" TEXT,
    "amount" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionPlan" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "currency" TEXT DEFAULT 'NGN',
    "monthlyCredits" INTEGER NOT NULL,
    "maxBrandPrompts" INTEGER NOT NULL,
    "setupFee" INTEGER DEFAULT 0,
    "paystackPlanCode" TEXT,
    "hasWhatsAppSupport" BOOLEAN DEFAULT false,
    "hasPrioritySupport" BOOLEAN DEFAULT false,
    "hasBulkProcessing" BOOLEAN DEFAULT false,
    "hasAdvancedAnalytics" BOOLEAN DEFAULT false,
    "hasCustomBranding" BOOLEAN DEFAULT false,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "paystackCustomerCode" TEXT,
    "paystackSubscriptionCode" TEXT,
    "paystackAuthCode" TEXT,
    "status" TEXT DEFAULT 'active',
    "currentPeriodStart" TIMESTAMPTZ(6) NOT NULL,
    "currentPeriodEnd" TIMESTAMPTZ(6) NOT NULL,
    "cancelAtPeriodEnd" BOOLEAN DEFAULT false,
    "canceledAt" TIMESTAMPTZ(6),
    "setupFeePaid" BOOLEAN DEFAULT false,
    "setupFeeAmount" INTEGER,
    "setupFeePaidAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "userId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "paystackReference" TEXT NOT NULL,
    "paystackTransactionId" TEXT,
    "amount" INTEGER NOT NULL,
    "currency" TEXT DEFAULT 'NGN',
    "status" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "paidAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserWebhook" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "webhookUrl" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "webhookType" TEXT NOT NULL DEFAULT 'image_processing',
    "tierRestriction" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserWebhook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandPromptAssignment" (
    "id" TEXT NOT NULL,
    "brandPromptId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assignedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BrandPromptAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobId" TEXT,
    "webhookId" TEXT,
    "workflowType" TEXT NOT NULL,
    "executionId" TEXT,
    "executionUrl" TEXT,
    "status" TEXT NOT NULL,
    "requestPayload" JSONB,
    "responsePayload" JSONB,
    "errorMessage" TEXT,
    "duration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "WorkflowLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicket" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "userName" TEXT,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "status" TEXT NOT NULL DEFAULT 'open',
    "assignedTo" TEXT,
    "n8nExecutionId" TEXT,
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminLog" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Job_userId_idx" ON "Job"("userId");

-- CreateIndex
CREATE INDEX "Job_status_idx" ON "Job"("status");

-- CreateIndex
CREATE INDEX "Job_createdAt_idx" ON "Job"("createdAt");

-- CreateIndex
CREATE INDEX "Job_parentJobId_idx" ON "Job"("parentJobId");

-- CreateIndex
CREATE INDEX "Job_brandPromptId_idx" ON "Job"("brandPromptId");

-- CreateIndex
CREATE INDEX "Job_isReEdit_idx" ON "Job"("isReEdit");

-- CreateIndex
CREATE INDEX "Job_creditDeducted_idx" ON "Job"("creditDeducted");

-- CreateIndex
CREATE INDEX "Job_webhookId_idx" ON "Job"("webhookId");

-- CreateIndex
CREATE INDEX "PromptPreset_category_idx" ON "PromptPreset"("category");

-- CreateIndex
CREATE INDEX "PromptPreset_order_idx" ON "PromptPreset"("order");

-- CreateIndex
CREATE INDEX "CustomPrompt_userId_idx" ON "CustomPrompt"("userId");

-- CreateIndex
CREATE INDEX "CustomPrompt_category_idx" ON "CustomPrompt"("category");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_isAdmin_idx" ON "User"("isAdmin");

-- CreateIndex
CREATE INDEX "User_isSuperAdmin_idx" ON "User"("isSuperAdmin");

-- CreateIndex
CREATE INDEX "BrandPrompt_createdBy_idx" ON "BrandPrompt"("createdBy");

-- CreateIndex
CREATE INDEX "BrandPrompt_category_idx" ON "BrandPrompt"("category");

-- CreateIndex
CREATE INDEX "BrandPrompt_industry_idx" ON "BrandPrompt"("industry");

-- CreateIndex
CREATE INDEX "CreditUsage_userId_idx" ON "CreditUsage"("userId");

-- CreateIndex
CREATE INDEX "CreditUsage_type_idx" ON "CreditUsage"("type");

-- CreateIndex
CREATE INDEX "CreditUsage_createdAt_idx" ON "CreditUsage"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlan_name_key" ON "SubscriptionPlan"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlan_paystackPlanCode_key" ON "SubscriptionPlan"("paystackPlanCode");

-- CreateIndex
CREATE INDEX "SubscriptionPlan_name_idx" ON "SubscriptionPlan"("name");

-- CreateIndex
CREATE INDEX "SubscriptionPlan_isActive_idx" ON "SubscriptionPlan"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_paystackSubscriptionCode_key" ON "Subscription"("paystackSubscriptionCode");

-- CreateIndex
CREATE INDEX "Subscription_userId_idx" ON "Subscription"("userId");

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");

-- CreateIndex
CREATE INDEX "Subscription_paystackSubscriptionCode_idx" ON "Subscription"("paystackSubscriptionCode");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_paystackReference_key" ON "Payment"("paystackReference");

-- CreateIndex
CREATE INDEX "Payment_userId_idx" ON "Payment"("userId");

-- CreateIndex
CREATE INDEX "Payment_paystackReference_idx" ON "Payment"("paystackReference");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "Payment_type_idx" ON "Payment"("type");

-- CreateIndex
CREATE INDEX "UserWebhook_userId_idx" ON "UserWebhook"("userId");

-- CreateIndex
CREATE INDEX "UserWebhook_isActive_idx" ON "UserWebhook"("isActive");

-- CreateIndex
CREATE INDEX "UserWebhook_webhookType_idx" ON "UserWebhook"("webhookType");

-- CreateIndex
CREATE INDEX "BrandPromptAssignment_userId_idx" ON "BrandPromptAssignment"("userId");

-- CreateIndex
CREATE INDEX "BrandPromptAssignment_brandPromptId_idx" ON "BrandPromptAssignment"("brandPromptId");

-- CreateIndex
CREATE UNIQUE INDEX "BrandPromptAssignment_brandPromptId_userId_key" ON "BrandPromptAssignment"("brandPromptId", "userId");

-- CreateIndex
CREATE INDEX "WorkflowLog_userId_idx" ON "WorkflowLog"("userId");

-- CreateIndex
CREATE INDEX "WorkflowLog_jobId_idx" ON "WorkflowLog"("jobId");

-- CreateIndex
CREATE INDEX "WorkflowLog_workflowType_idx" ON "WorkflowLog"("workflowType");

-- CreateIndex
CREATE INDEX "WorkflowLog_status_idx" ON "WorkflowLog"("status");

-- CreateIndex
CREATE INDEX "WorkflowLog_createdAt_idx" ON "WorkflowLog"("createdAt");

-- CreateIndex
CREATE INDEX "SupportTicket_userId_idx" ON "SupportTicket"("userId");

-- CreateIndex
CREATE INDEX "SupportTicket_status_idx" ON "SupportTicket"("status");

-- CreateIndex
CREATE INDEX "SupportTicket_category_idx" ON "SupportTicket"("category");

-- CreateIndex
CREATE INDEX "SupportTicket_createdAt_idx" ON "SupportTicket"("createdAt");

-- CreateIndex
CREATE INDEX "AdminLog_adminId_idx" ON "AdminLog"("adminId");

-- CreateIndex
CREATE INDEX "AdminLog_action_idx" ON "AdminLog"("action");

-- CreateIndex
CREATE INDEX "AdminLog_createdAt_idx" ON "AdminLog"("createdAt");

