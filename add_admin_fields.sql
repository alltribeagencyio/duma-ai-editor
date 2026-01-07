-- Add admin fields to User table

ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "isAdmin" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "role" TEXT DEFAULT 'user';

-- Create index for admin queries
CREATE INDEX IF NOT EXISTS "User_isAdmin_idx" ON "User"("isAdmin");

-- Optional: Set a specific user as admin (replace with your email)
-- UPDATE "User" SET "isAdmin" = true, "role" = 'superadmin' WHERE "email" = 'your-admin@email.com';
