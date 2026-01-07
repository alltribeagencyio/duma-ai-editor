# Manual User Setup Guide for Duma AI MVP

## Quick Start: Create a Client Account in 2 Minutes

### Step 1: Create User in Supabase Auth (1 min)

1. Go to your Supabase Dashboard → Authentication → Users
2. Click **"Add user"** or **"Invite user"**
3. Enter client's email
4. Set a temporary password (e.g., `DumaAI2024!`) - they can change it later
5. **IMPORTANT**: Copy the User ID (UUID) - you'll need it for Step 2

### Step 2: Add User to Database (1 min)

Go to Supabase → SQL Editor → New query, paste and run:

```sql
-- Replace these values:
-- USER_ID: The UUID from Step 1
-- CLIENT_EMAIL: The client's email
-- CLIENT_NAME: The client's name
-- CREDITS: Number of credits to give them (e.g., 100)

INSERT INTO "User" (
  "id",
  "email",
  "fullName",
  "subscriptionTier",
  "subscriptionStatus",
  "monthlyCredits",
  "practiceCredits",
  "creditsUsed",
  "hasCompletedOnboarding",
  "notificationsEmail",
  "notificationsWhatsApp",
  "language",
  "timezone",
  "isAdmin",
  "role",
  "createdAt",
  "updatedAt"
) VALUES (
  'USER_ID_HERE',                    -- Replace with UUID from Step 1
  'client@example.com',              -- Replace with client email
  'Client Name',                     -- Replace with client name
  'pro',                             -- Tier: 'free', 'starter', 'pro', or 'enterprise'
  'active',                          -- Status: 'active'
  100,                               -- Monthly credits allocation
  0,                                 -- Practice credits (bonus credits)
  0,                                 -- Credits used (starts at 0)
  true,                              -- Skip onboarding for manual setup
  true,                              -- Enable email notifications
  false,                             -- WhatsApp notifications (set to true if needed)
  'en',                              -- Language
  'UTC',                             -- Timezone
  false,                             -- Is admin (set to true if you want them as admin)
  'user',                            -- Role: 'user' or 'admin'
  NOW(),                             -- Created date
  NOW()                              -- Updated date
);
```

### Step 3: Send Credentials to Client

**Email Template:**

```
Subject: Your Duma AI Account is Ready!

Hi [Client Name],

Your Duma AI account has been activated! Here are your login details:

🔐 Login URL: https://your-app.vercel.app/login
📧 Email: [client@example.com]
🔑 Password: [temporary-password]

💳 Credits Allocated: 100 images

📝 Next Steps:
1. Visit the login URL
2. Sign in with your credentials
3. Change your password in Profile settings
4. Start editing your product images!

Need help? Visit /help or reply to this email.

Best regards,
Your Name
```

---

## Quick Reference: Common Tasks

### Check User Credits

```sql
SELECT "email", "fullName", "monthlyCredits", "creditsUsed",
       ("monthlyCredits" - "creditsUsed") as "remainingCredits"
FROM "User"
WHERE "email" = 'client@example.com';
```

### Add More Credits

```sql
UPDATE "User"
SET "monthlyCredits" = "monthlyCredits" + 50  -- Add 50 more credits
WHERE "email" = 'client@example.com';
```

### Reset Credits Used (Monthly Reset)

```sql
UPDATE "User"
SET "creditsUsed" = 0,
    "creditsReset" = NOW()
WHERE "email" = 'client@example.com';
```

### Make User Admin

```sql
UPDATE "User"
SET "isAdmin" = true,
    "role" = 'admin'
WHERE "email" = 'your-email@example.com';
```

### View All Users

```sql
SELECT "email", "fullName", "subscriptionTier",
       "monthlyCredits", "creditsUsed",
       "createdAt"
FROM "User"
ORDER BY "createdAt" DESC;
```

### Deactivate User

```sql
UPDATE "User"
SET "subscriptionStatus" = 'canceled'
WHERE "email" = 'client@example.com';
```

---

## Credit Allocation Guidelines

**Recommended Credits by Package:**

| Package    | Monthly Credits | Price Suggestion |
|------------|----------------|------------------|
| Starter    | 100 images     | $49/month        |
| Pro        | 500 images     | $199/month       |
| Enterprise | 2000+ images   | $599/month       |

---

## Troubleshooting

### Client Can't Log In
1. Verify email in Supabase Auth → Users
2. Check if user exists in "User" table
3. Try password reset link from Supabase Auth

### Credits Not Updating
1. Check n8n automation is running
2. Verify `creditsUsed` is incrementing in database
3. Check job status in "Job" table

### User Stuck in Onboarding
```sql
UPDATE "User"
SET "hasCompletedOnboarding" = true
WHERE "email" = 'client@example.com';
```

---

## n8n Integration Notes

Your n8n automation should:
1. Check `creditsUsed` < `monthlyCredits` before processing
2. Increment `creditsUsed` after successful processing
3. Set job status to 'failed' if insufficient credits

**SQL to check credits:**
```sql
SELECT ("monthlyCredits" - "creditsUsed") as "availableCredits"
FROM "User"
WHERE "id" = 'user-id-here';
```

**SQL to deduct credits:**
```sql
UPDATE "User"
SET "creditsUsed" = "creditsUsed" + 1
WHERE "id" = 'user-id-here'
RETURNING "creditsUsed", "monthlyCredits";
```

---

## Quick Create Script (Bulk)

If you need to create multiple users quickly:

```sql
-- Create multiple users at once
INSERT INTO "User" ("id", "email", "fullName", "subscriptionTier", "monthlyCredits", "hasCompletedOnboarding", "createdAt", "updatedAt")
VALUES
  ('uuid-1', 'client1@example.com', 'Client One', 'pro', 100, true, NOW(), NOW()),
  ('uuid-2', 'client2@example.com', 'Client Two', 'pro', 100, true, NOW(), NOW()),
  ('uuid-3', 'client3@example.com', 'Client Three', 'starter', 50, true, NOW(), NOW());
```

Note: You still need to create them in Supabase Auth first to get their UUIDs.

---

## Payment Tracking (Spreadsheet)

Keep a simple spreadsheet:

| Client Email | Package | Monthly Price | Credits | Payment Date | Next Billing | Status |
|--------------|---------|---------------|---------|--------------|--------------|--------|
| client@...   | Pro     | $199          | 500     | 2024-01-01   | 2024-02-01   | Active |

---

**Pro Tip:** Use Supabase SQL Editor "Saved Queries" to save these common queries for one-click access!
