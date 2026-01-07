CREATE TABLE "Job" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  "status" TEXT DEFAULT 'pending',
  "prompt" TEXT NOT NULL,
  "promptType" TEXT NOT NULL,
  "presetId" TEXT,
  "brandPromptId" TEXT,
  "parentJobId" TEXT,
  "isReEdit" BOOLEAN DEFAULT false,
  "creditsCost" INTEGER DEFAULT 1,
  "productName" TEXT,
  "productCategory" TEXT,
  "productSku" TEXT,
  "inputImages" TEXT[],
  "outputData" JSONB,
  "phone" TEXT,
  "notifyByEmail" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "startedAt" TIMESTAMPTZ,
  "completedAt" TIMESTAMPTZ,
  "errorMessage" TEXT,
  "notificationSent" BOOLEAN DEFAULT false
);

CREATE INDEX "Job_userId_idx" ON "Job"("userId");
CREATE INDEX "Job_status_idx" ON "Job"("status");
CREATE INDEX "Job_createdAt_idx" ON "Job"("createdAt");
CREATE INDEX "Job_parentJobId_idx" ON "Job"("parentJobId");