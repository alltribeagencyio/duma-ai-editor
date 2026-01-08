-- =====================================================
-- ADMIN ACCESS SETUP SCRIPT
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Check if new tables exist
SELECT
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_name IN ('UserWebhook', 'BrandPromptAssignment', 'WorkflowLog', 'SupportTicket', 'AdminLog')
ORDER BY table_name;

-- 2. Make your user an admin (REPLACE WITH YOUR EMAIL)
UPDATE "User"
SET
    "isAdmin" = true,
    "isSuperAdmin" = true,
    "role" = 'superadmin'
WHERE "email" = 'nmkennedy5@gmail.com';

-- 3. Verify your admin status
SELECT
    "id",
    "email",
    "fullName",
    "isAdmin",
    "isSuperAdmin",
    "role",
    "subscriptionTier",
    "monthlyCredits",
    "createdAt"
FROM "User"
WHERE "email" = 'nmkennedy5@gmail.com';

-- 4. List all admins
SELECT
    "email",
    "fullName",
    "isAdmin",
    "isSuperAdmin",
    "role",
    "createdAt"
FROM "User"
WHERE "isAdmin" = true OR "isSuperAdmin" = true
ORDER BY "createdAt" DESC;

-- 5. Check table record counts
SELECT
    'UserWebhook' as table_name,
    COUNT(*) as record_count
FROM "UserWebhook"
UNION ALL
SELECT
    'BrandPromptAssignment',
    COUNT(*)
FROM "BrandPromptAssignment"
UNION ALL
SELECT
    'WorkflowLog',
    COUNT(*)
FROM "WorkflowLog"
UNION ALL
SELECT
    'SupportTicket',
    COUNT(*)
FROM "SupportTicket"
UNION ALL
SELECT
    'AdminLog',
    COUNT(*)
FROM "AdminLog";

-- =====================================================
-- EXPECTED OUTPUT:
-- 1. All 5 new tables should exist with correct column counts
-- 2. Your user should show isAdmin=true, isSuperAdmin=true
-- 3. You should be listed in the admins list
-- 4. Table counts should all be 0 (empty) initially
-- =====================================================
