-- Update existing Job table with missing columns
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "parentJobId" TEXT;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "isReEdit" BOOLEAN DEFAULT false;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "creditsCost" INTEGER DEFAULT 1;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "brandPromptId" TEXT;

-- Add missing indexes
CREATE INDEX IF NOT EXISTS "Job_parentJobId_idx" ON "Job"("parentJobId");
CREATE INDEX IF NOT EXISTS "Job_isReEdit_idx" ON "Job"("isReEdit");
CREATE INDEX IF NOT EXISTS "Job_brandPromptId_idx" ON "Job"("brandPromptId");