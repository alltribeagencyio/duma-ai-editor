-- =====================================================
-- VERIFY USER TABLE STRUCTURE
-- Run this to see what columns exist vs what Prisma expects
-- =====================================================

-- Check all columns in User table
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'User'
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- Check if critical columns are missing
-- =====================================================
SELECT
    CASE
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'User'
            AND column_name = 'isAdmin'
            AND table_schema = 'public'
        )
        THEN '✅ isAdmin column EXISTS'
        ELSE '❌ isAdmin column MISSING - Run fix_missing_fields.sql'
    END as isAdmin_status,

    CASE
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'User'
            AND column_name = 'role'
            AND table_schema = 'public'
        )
        THEN '✅ role column EXISTS'
        ELSE '❌ role column MISSING - Run fix_missing_fields.sql'
    END as role_status,

    CASE
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'User'
            AND column_name = 'monthlyCredits'
            AND table_schema = 'public'
        )
        THEN '✅ monthlyCredits column EXISTS'
        ELSE '❌ monthlyCredits column MISSING'
    END as monthlyCredits_status,

    CASE
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'User'
            AND column_name = 'brandColors'
            AND table_schema = 'public'
        )
        THEN '✅ brandColors column EXISTS'
        ELSE '❌ brandColors column MISSING'
    END as brandColors_status;
