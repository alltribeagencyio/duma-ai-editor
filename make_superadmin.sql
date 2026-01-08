-- =====================================================
-- MAKE USER SUPERADMIN
-- Run this in Supabase SQL Editor
-- =====================================================

-- Make nmkennedy5@gmail.com a superadmin
UPDATE "User"
SET "isAdmin" = true, "role" = 'superadmin'
WHERE "email" = 'nmkennedy5@gmail.com';

-- Verify the change
SELECT "id", "email", "fullName", "isAdmin", "role", "subscriptionTier", "monthlyCredits"
FROM "User"
WHERE "email" = 'nmkennedy5@gmail.com';

-- List all admins
SELECT "email", "isAdmin", "role"
FROM "User"
WHERE "isAdmin" = true
ORDER BY "createdAt" DESC;
