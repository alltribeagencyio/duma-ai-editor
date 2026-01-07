-- =============================================
-- STEP 2: UPDATE JOB TABLE ONLY
-- =============================================
-- Run this after Step 1 to add missing columns to your existing Job table

-- Add new columns to existing Job table
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "parentJobId" TEXT;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "isReEdit" BOOLEAN DEFAULT false;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "creditsCost" INTEGER DEFAULT 1;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "brandPromptId" TEXT;

-- Add indexes for Job table
CREATE INDEX IF NOT EXISTS "Job_parentJobId_idx" ON "Job"("parentJobId");
CREATE INDEX IF NOT EXISTS "Job_isReEdit_idx" ON "Job"("isReEdit");
CREATE INDEX IF NOT EXISTS "Job_brandPromptId_idx" ON "Job"("brandPromptId");

-- =============================================
-- STEP 2 COMPLETE!
-- =============================================
-- Job table has been updated with re-editing support
-- Ready for Step 3 (Create new tables)
-- =============================================