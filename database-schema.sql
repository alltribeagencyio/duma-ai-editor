-- AI Image Editor Database Schema
-- Run this in Supabase SQL Editor: https://hmtizgdzkueakwextuml.supabase.co

-- Create Job table
CREATE TABLE IF NOT EXISTS "Job" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "prompt" TEXT NOT NULL,
  "promptType" TEXT NOT NULL,
  "presetId" TEXT,
  "inputImages" TEXT[] NOT NULL,
  "outputData" JSONB,
  "phone" TEXT,
  "notifyByEmail" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "startedAt" TIMESTAMP,
  "completedAt" TIMESTAMP,
  "errorMessage" TEXT,
  "notificationSent" BOOLEAN NOT NULL DEFAULT false
);

-- Create indexes for Job table
CREATE INDEX IF NOT EXISTS "Job_userId_idx" ON "Job"("userId");
CREATE INDEX IF NOT EXISTS "Job_status_idx" ON "Job"("status");
CREATE INDEX IF NOT EXISTS "Job_createdAt_idx" ON "Job"("createdAt");

-- Create PromptPreset table
CREATE TABLE IF NOT EXISTS "PromptPreset" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "prompt" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "icon" TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- Create indexes for PromptPreset table
CREATE INDEX IF NOT EXISTS "PromptPreset_category_idx" ON "PromptPreset"("category");
CREATE INDEX IF NOT EXISTS "PromptPreset_order_idx" ON "PromptPreset"("order");
