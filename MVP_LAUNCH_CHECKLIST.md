# 🚀 Duma AI MVP Launch Checklist

## Pre-Launch Setup (30 minutes)

### 1. Database Setup ✅
- [x] All tables created in Supabase
- [ ] Run admin fields migration:
  ```sql
  ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "isAdmin" BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS "role" TEXT DEFAULT 'user';

  CREATE INDEX IF NOT EXISTS "User_isAdmin_idx" ON "User"("isAdmin");
  ```
- [ ] Make yourself admin:
  ```sql
  UPDATE "User"
  SET "isAdmin" = true, "role" = 'superadmin'
  WHERE "email" = 'your-email@example.com';
  ```

### 2. Create Test Account (5 minutes)
Follow MANUAL_USER_SETUP.md to create your first test account:
- [ ] Create user in Supabase Auth
- [ ] Add user to database with 100 credits
- [ ] Test login with credentials
- [ ] Verify dashboard loads

### 3. Test Core Workflow (15 minutes)
- [ ] **Upload**: Can upload 1-5 product images
- [ ] **Prompt**: Can select/write prompt
- [ ] **Process**: Job gets created in database
- [ ] **n8n**: Verify n8n picks up job (check n8n logs)
- [ ] **Results**: Images appear in History
- [ ] **Download**: Can download processed images
- [ ] **Credits**: creditsUsed increments in database

### 4. n8n Automation Setup
Your n8n workflow should:
- [ ] Monitor "Job" table for new jobs (status = 'pending')
- [ ] Check user credits before processing:
  ```sql
  SELECT ("monthlyCredits" - "creditsUsed") as available
  FROM "User" WHERE "id" = 'user-id';
  ```
- [ ] If credits available:
  - Process images with your AI service
  - Update Job with outputData
  - Set status = 'completed'
  - Increment creditsUsed
- [ ] If no credits:
  - Set status = 'failed'
  - Set errorMessage = 'Insufficient credits'
- [ ] Send WhatsApp/Email notification when done

### 5. Environment Variables
Verify in Vercel:
- [ ] `DATABASE_URL` (Supabase)
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`

---

## Launch Day Checklist

### Morning (Before Client Call)
- [ ] Test full workflow end-to-end one more time
- [ ] Check error logs in Vercel
- [ ] Verify n8n automation is running
- [ ] Prepare demo images (3-5 product photos)

### During Demo
- [ ] Show upload process
- [ ] Demonstrate prompt options
- [ ] Walk through job status
- [ ] Show history/download
- [ ] Explain credit system

### After Sale
- [ ] Collect payment
- [ ] Create client account (use MANUAL_USER_SETUP.md)
- [ ] Send credentials email
- [ ] Add to payment tracking spreadsheet

---

## First Week Operations

### Daily Tasks
- [ ] Check for new jobs in /admin
- [ ] Monitor credit usage per user
- [ ] Review n8n logs for errors
- [ ] Respond to client questions

### Weekly Tasks
- [ ] Reset monthly credits (if applicable)
- [ ] Send usage reports to clients
- [ ] Collect feedback for improvements

---

## Pricing Examples (Adjust to Your Market)

| Package    | Credits/Month | Price  | Per Image Cost |
|------------|---------------|--------|----------------|
| Starter    | 100 images    | $49    | $0.49          |
| Pro        | 500 images    | $199   | $0.40          |
| Enterprise | 2000 images   | $599   | $0.30          |

**Setup Fee:** $99 (one-time, waived for first 10 clients)

---

## Quick Commands Reference

### Check User Credits
```sql
SELECT "email", ("monthlyCredits" - "creditsUsed") as "remaining"
FROM "User" WHERE "email" = 'client@example.com';
```

### Add Credits
```sql
UPDATE "User"
SET "monthlyCredits" = "monthlyCredits" + 100
WHERE "email" = 'client@example.com';
```

### View Recent Jobs
```sql
SELECT j."id", j."status", j."createdAt", u."email"
FROM "Job" j
JOIN "User" u ON j."userId" = u."id"
ORDER BY j."createdAt" DESC
LIMIT 20;
```

### Deactivate User
```sql
UPDATE "User"
SET "subscriptionStatus" = 'canceled'
WHERE "email" = 'client@example.com';
```

---

## Success Metrics to Track

**Week 1 Goals:**
- [ ] 3 paying clients
- [ ] 100+ images processed
- [ ] < 5% error rate
- [ ] < 5 minute avg processing time

**Month 1 Goals:**
- [ ] 10 paying clients
- [ ] 1000+ images processed
- [ ] Client testimonials collected
- [ ] Repeat purchases

---

## Common Issues & Fixes

### "Job stuck in pending"
1. Check n8n workflow is running
2. Verify n8n can connect to database
3. Check job in database for error

### "User can't log in"
1. Verify email in Supabase Auth
2. Reset password from Supabase
3. Check hasCompletedOnboarding = true

### "Images not appearing"
1. Check outputData in Job table
2. Verify n8n updated the record
3. Check browser console for errors

---

## When to Automate Billing

Switch to automated billing when:
- ✅ You have 15+ clients (manual is getting tedious)
- ✅ You validated the pricing model works
- ✅ Clients are asking for self-service signup
- ✅ You're spending >2 hours/week on manual billing

---

## Support Response Templates

**Credits Running Low:**
```
Hi [Name],

You've used 85 of your 100 monthly credits!

To add more credits:
- Reply to this email with how many you need
- I'll send an invoice
- Credits added within 24 hours

Need a larger package? Let's chat about Pro (500/month).
```

**Processing Error:**
```
Hi [Name],

I see one of your jobs failed. I've:
✅ Refunded the credit
✅ Re-processed your images
✅ Added 5 bonus credits for the inconvenience

Your images are ready in History!
```

---

**Ready to Launch! 🎉**

Remember: Focus on delivering value to your first 3 clients. Everything else can be automated later.
