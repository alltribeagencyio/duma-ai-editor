# Quick Fix Guide - Admin Access & Profile Display

## Problem
You're getting an "Application error" when accessing `/admin` and the profile page isn't displaying properly.

## Root Cause
Your database is missing the `isAdmin` and `role` fields that were added for admin functionality.

## Solution (Takes 2 minutes)

### Step 1: Fix Missing Database Fields

1. Go to your Supabase project dashboard
2. Click on **SQL Editor** in the left sidebar
3. Create a new query
4. Copy and paste the contents of **[fix_missing_fields.sql](fix_missing_fields.sql)**
5. Click **Run** button
6. You should see: `isAdmin field exists ✓`, `role field exists ✓`, `fullName field exists ✓`

### Step 2: Make Yourself an Admin

1. Still in the SQL Editor
2. Create another new query
3. Copy and paste the contents of **[make_admin.sql](make_admin.sql)**
4. **IMPORTANT:** Replace `'your-email@example.com'` with your actual email
5. Click **Run**
6. You should see your user record with `isAdmin: true`

### Step 3: Refresh Your Application

1. Go back to your application
2. Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)
3. Try accessing `/admin` again
4. ✅ Admin page should load successfully!
5. ✅ Profile page should display all your information!

## What Was Fixed

### 1. **Branding Updated** 🦁
- Sidebar now shows Duma lion logo + "DUMA" text
- Subtitle: "AI Image Editor"
- Collapsed sidebar shows just the lion emoji

### 2. **Dashboard Improvements** 📊
- Replaced "Time Saved" card with "Credits Remaining"
- Shows real-time credit balance from database
- Displays used credits as subtitle
- Example: "Credits Remaining: 95" with "5 credits used"

### 3. **Profile Page Fixed** ✅
- Now fetches complete user data
- Shows subscription details
- Displays credit usage with progress bar
- All profile fields editable

### 4. **Admin Page Fixed** ✅
- Added missing database fields
- Admin check now works properly
- Full admin dashboard accessible

## Verify Everything Works

### Test 1: Dashboard
1. Go to `/dashboard`
2. You should see 4 cards:
   - ✅ Total Enhanced
   - ✅ **Credits Remaining** (NEW - shows your credits!)
   - ✅ Storage Used
   - ✅ Engine Status

### Test 2: Profile Page
1. Go to `/profile`
2. You should see:
   - ✅ Subscription Card (shows your tier)
   - ✅ Credit Usage Card (shows credits with progress bar)
   - ✅ Profile Form (edit your information)

### Test 3: Admin Access
1. Go to `/admin`
2. You should see:
   - ✅ Admin Dashboard with stats
   - ✅ 5 tabs: Users, Jobs, Prompts, Analytics, Settings
   - ✅ User Management with "Create User" button
   - ✅ Prompt Management with all preset prompts

## If You Still Have Issues

### Issue: "isAdmin field already exists"
**Solution:** That's good! Just continue to Step 2 (make_admin.sql)

### Issue: "User not found" when making admin
**Solution:** Check your email is correct in the SQL query. Use quotes around the email!

### Issue: Profile page still shows loading spinner
**Possible causes:**
1. Database connection issue - check Supabase status
2. Auth session expired - try logging out and back in
3. Check browser console for errors (F12)

### Issue: Credits showing as 0
**Solution:** Run this SQL to add credits:
```sql
UPDATE "User"
SET "monthlyCredits" = 100,
    "creditsUsed" = 0,
    "subscriptionTier" = 'starter'
WHERE "email" = 'your-email@example.com';
```

## What's New on Dashboard

### Before:
```
┌─────────────────┐  ┌─────────────────┐
│ Total Enhanced  │  │  Time Saved     │
│      42         │  │    14h 0m       │
│                 │  │ Est. prep, shoot│
└─────────────────┘  └─────────────────┘
```

### After:
```
┌─────────────────┐  ┌──────────────────┐
│ Total Enhanced  │  │ Credits Remaining│
│      42         │  │       95         │
│                 │  │  5 credits used  │
└─────────────────┘  └──────────────────┘
```

## Files Changed

1. **components/layout/Sidebar.tsx**
   - Updated logo with 🦁 emoji + "DUMA" text

2. **components/dashboard/DashboardClient.tsx**
   - Added profile data fetching
   - Passes credit info to MetricCards

3. **components/dashboard/MetricCards.tsx**
   - Replaced Time Saved with Credits Remaining
   - Uses Coins icon instead of Clock
   - Shows credits used as subtitle

4. **New SQL Scripts**
   - fix_missing_fields.sql - Adds missing database fields
   - make_admin.sql - Makes you an admin user

## Need More Help?

Check these docs:
- [ADMIN_FEATURES.md](ADMIN_FEATURES.md) - Complete admin guide
- [DATA_FLOW_VERIFICATION.md](DATA_FLOW_VERIFICATION.md) - How data flows work
- [MVP_LAUNCH_CHECKLIST.md](MVP_LAUNCH_CHECKLIST.md) - Launch preparation
- [MANUAL_USER_SETUP.md](MANUAL_USER_SETUP.md) - User creation guide

## Database Schema Reference

Your User table should have these fields:
```
id                  - UUID (primary key)
email               - Text (unique)
fullName            - Text (nullable)
isAdmin             - Boolean (default: false)  ← NEW
role                - Text (default: 'user')     ← NEW
monthlyCredits      - Integer (default: 0)
creditsUsed         - Integer (default: 0)
subscriptionTier    - Text (default: 'free')
subscriptionStatus  - Text (default: 'active')
... (other fields)
```

## Success! 🎉

Once you complete the steps above, you'll have:
- ✅ Working admin dashboard
- ✅ Functional profile page with credit tracking
- ✅ Updated Duma branding throughout
- ✅ Real-time credit display on dashboard
- ✅ Full access to all admin features

**You're now ready to start managing users and credits!** 🚀
