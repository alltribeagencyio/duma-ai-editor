-- =====================================================
-- FIX USER TABLE TO MATCH PRISMA SCHEMA
-- This ensures the User table has all required columns
-- =====================================================

-- First, let's see what we have
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'User'
ORDER BY ordinal_position;

-- =====================================================
-- Add any missing columns
-- =====================================================

-- Add isAdmin if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'User' AND column_name = 'isAdmin'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "isAdmin" BOOLEAN DEFAULT false NOT NULL;
        RAISE NOTICE '✅ Added isAdmin column';
    ELSE
        RAISE NOTICE '✓ isAdmin column already exists';
    END IF;
END $$;

-- Add role if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'User' AND column_name = 'role'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "role" TEXT DEFAULT 'user' NOT NULL;
        RAISE NOTICE '✅ Added role column';
    ELSE
        RAISE NOTICE '✓ role column already exists';
    END IF;
END $$;

-- Add brandColors if missing (array type)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'User' AND column_name = 'brandColors'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "brandColors" TEXT[] DEFAULT ARRAY[]::TEXT[];
        RAISE NOTICE '✅ Added brandColors column';
    ELSE
        RAISE NOTICE '✓ brandColors column already exists';
    END IF;
END $$;

-- Add lastLoginAt if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'User' AND column_name = 'lastLoginAt'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "lastLoginAt" TIMESTAMP;
        RAISE NOTICE '✅ Added lastLoginAt column';
    ELSE
        RAISE NOTICE '✓ lastLoginAt column already exists';
    END IF;
END $$;

-- Add lastActiveAt if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'User' AND column_name = 'lastActiveAt'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "lastActiveAt" TIMESTAMP;
        RAISE NOTICE '✅ Added lastActiveAt column';
    ELSE
        RAISE NOTICE '✓ lastActiveAt column already exists';
    END IF;
END $$;

-- =====================================================
-- Create indexes if missing
-- =====================================================

CREATE INDEX IF NOT EXISTS "User_isAdmin_idx" ON "User"("isAdmin");
RAISE NOTICE '✅ Created/verified isAdmin index';

-- =====================================================
-- Verify final structure
-- =====================================================
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'User'
ORDER BY ordinal_position;

-- =====================================================
-- Success message
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ User table structure fixed!';
    RAISE NOTICE 'Next step: Run "npx prisma generate" in terminal';
    RAISE NOTICE '========================================';
END $$;
