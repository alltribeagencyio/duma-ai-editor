-- Fix Missing Database Fields
-- Run this script in your Supabase SQL Editor to add any missing fields

-- Add admin fields if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='isAdmin') THEN
        ALTER TABLE "User" ADD COLUMN "isAdmin" BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='role') THEN
        ALTER TABLE "User" ADD COLUMN "role" TEXT DEFAULT 'user';
    END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS "User_isAdmin_idx" ON "User"("isAdmin");
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");

-- Verify all required fields exist
SELECT
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='isAdmin')
        THEN 'isAdmin field exists ✓'
        ELSE 'isAdmin field MISSING ✗'
    END as admin_field_status,
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='role')
        THEN 'role field exists ✓'
        ELSE 'role field MISSING ✗'
    END as role_field_status,
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='fullName')
        THEN 'fullName field exists ✓'
        ELSE 'fullName field MISSING ✗'
    END as fullname_field_status;

-- Show current user data to verify
SELECT
    "email",
    "fullName",
    "isAdmin",
    "role",
    "monthlyCredits",
    "creditsUsed",
    "subscriptionTier",
    "subscriptionStatus"
FROM "User"
LIMIT 10;
