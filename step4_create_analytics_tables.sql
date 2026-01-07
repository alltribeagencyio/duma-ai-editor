-- Create Brand Prompt Table
CREATE TABLE "BrandPrompt" (
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

CREATE INDEX "BrandPrompt_userId_idx" ON "BrandPrompt"("userId");
CREATE INDEX "BrandPrompt_category_idx" ON "BrandPrompt"("category");
CREATE INDEX "BrandPrompt_industry_idx" ON "BrandPrompt"("industry");

-- Create Credit Usage Table
CREATE TABLE "CreditUsage" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  "jobId" TEXT,
  "amount" INTEGER NOT NULL,
  "type" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX "CreditUsage_userId_idx" ON "CreditUsage"("userId");
CREATE INDEX "CreditUsage_type_idx" ON "CreditUsage"("type");
CREATE INDEX "CreditUsage_createdAt_idx" ON "CreditUsage"("createdAt");