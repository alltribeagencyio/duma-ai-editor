-- Migration: Add UserWebhook, BrandPromptAssignment, WorkflowLog, SupportTicket, AdminLog tables
-- Also add new fields to existing Job table

-- Add new fields to Job table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Job' AND column_name='creditDeducted') THEN
    ALTER TABLE "Job" ADD COLUMN "creditDeducted" BOOLEAN NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Job' AND column_name='webhookId') THEN
    ALTER TABLE "Job" ADD COLUMN "webhookId" TEXT;
  END IF;
END $$;

-- Create index for Job.creditDeducted if it doesn't exist
CREATE INDEX IF NOT EXISTS "Job_creditDeducted_idx" ON "Job"("creditDeducted");

-- Create index for Job.webhookId if it doesn't exist
CREATE INDEX IF NOT EXISTS "Job_webhookId_idx" ON "Job"("webhookId");

-- Add phoneCountryCode to User table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='phoneCountryCode') THEN
    ALTER TABLE "User" ADD COLUMN "phoneCountryCode" TEXT DEFAULT '+254';
  END IF;
END $$;

-- Create UserWebhook table
CREATE TABLE IF NOT EXISTS "UserWebhook" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "webhookUrl" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "webhookType" TEXT NOT NULL DEFAULT 'image_processing',
    "tierRestriction" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserWebhook_pkey" PRIMARY KEY ("id")
);

-- Create indexes for UserWebhook
CREATE INDEX IF NOT EXISTS "UserWebhook_userId_idx" ON "UserWebhook"("userId");
CREATE INDEX IF NOT EXISTS "UserWebhook_isActive_idx" ON "UserWebhook"("isActive");
CREATE INDEX IF NOT EXISTS "UserWebhook_webhookType_idx" ON "UserWebhook"("webhookType");

-- Create BrandPromptAssignment table
CREATE TABLE IF NOT EXISTS "BrandPromptAssignment" (
    "id" TEXT NOT NULL,
    "brandPromptId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assignedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BrandPromptAssignment_pkey" PRIMARY KEY ("id")
);

-- Create indexes for BrandPromptAssignment
CREATE INDEX IF NOT EXISTS "BrandPromptAssignment_userId_idx" ON "BrandPromptAssignment"("userId");
CREATE INDEX IF NOT EXISTS "BrandPromptAssignment_brandPromptId_idx" ON "BrandPromptAssignment"("brandPromptId");
CREATE UNIQUE INDEX IF NOT EXISTS "BrandPromptAssignment_brandPromptId_userId_key" ON "BrandPromptAssignment"("brandPromptId", "userId");

-- Create WorkflowLog table
CREATE TABLE IF NOT EXISTS "WorkflowLog" (
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

-- Create indexes for WorkflowLog
CREATE INDEX IF NOT EXISTS "WorkflowLog_userId_idx" ON "WorkflowLog"("userId");
CREATE INDEX IF NOT EXISTS "WorkflowLog_jobId_idx" ON "WorkflowLog"("jobId");
CREATE INDEX IF NOT EXISTS "WorkflowLog_workflowType_idx" ON "WorkflowLog"("workflowType");
CREATE INDEX IF NOT EXISTS "WorkflowLog_status_idx" ON "WorkflowLog"("status");
CREATE INDEX IF NOT EXISTS "WorkflowLog_createdAt_idx" ON "WorkflowLog"("createdAt");

-- Create SupportTicket table
CREATE TABLE IF NOT EXISTS "SupportTicket" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- Create indexes for SupportTicket
CREATE INDEX IF NOT EXISTS "SupportTicket_userId_idx" ON "SupportTicket"("userId");
CREATE INDEX IF NOT EXISTS "SupportTicket_status_idx" ON "SupportTicket"("status");
CREATE INDEX IF NOT EXISTS "SupportTicket_category_idx" ON "SupportTicket"("category");
CREATE INDEX IF NOT EXISTS "SupportTicket_createdAt_idx" ON "SupportTicket"("createdAt");

-- Create AdminLog table
CREATE TABLE IF NOT EXISTS "AdminLog" (
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

-- Create indexes for AdminLog
CREATE INDEX IF NOT EXISTS "AdminLog_adminId_idx" ON "AdminLog"("adminId");
CREATE INDEX IF NOT EXISTS "AdminLog_action_idx" ON "AdminLog"("action");
CREATE INDEX IF NOT EXISTS "AdminLog_createdAt_idx" ON "AdminLog"("createdAt");

-- Success message
SELECT 'Migration completed successfully! Added 5 new tables and updated existing tables.' AS result;
