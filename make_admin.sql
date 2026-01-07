-- Make yourself an admin
-- Replace 'your-email@example.com' with your actual email

-- Method 1: Update by email
UPDATE "User"
SET "isAdmin" = true, "role" = 'superadmin'
WHERE "email" = 'your-email@example.com';

-- Method 2: If you know your user ID
-- UPDATE "User"
-- SET "isAdmin" = true, "role" = 'superadmin'
-- WHERE "id" = 'your-user-id-here';

-- Verify the update
SELECT
    "id",
    "email",
    "fullName",
    "isAdmin",
    "role",
    "monthlyCredits",
    "creditsUsed"
FROM "User"
WHERE "isAdmin" = true;
