# Profile Page Loading Issue - Debugging Guide

## Problem
Profile page shows infinite loading spinner without displaying content.

## What Was Fixed

### 1. Better Error Handling
- Added error state to ProfileClient component
- Now shows error message instead of infinite loading
- Added "Retry" button to attempt reload
- Added detailed console logging

### 2. Diagnostic Logging
- Added console logs throughout the API route
- Logs will show in your terminal/server console
- Helps identify exactly where the issue occurs

## How to Debug

### Step 1: Check Browser Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Navigate to `/profile`
4. Look for error messages or logs like:
   - "Profile loaded: {...}" (success)
   - "Profile fetch failed: 500 {...}" (server error)
   - "Network error: Could not load profile" (connection issue)

### Step 2: Check Server Logs
1. Open your terminal where `npm run dev` is running
2. Navigate to `/profile`
3. Look for logs starting with `[Profile API]`:
   - "Starting profile fetch..." - API route was called
   - "User from auth: [id]" - User is authenticated
   - "User profile found: true/false" - Database query result
   - Any error messages with details

### Step 3: Common Issues & Solutions

#### Issue: "Unauthorized" (401)
**Cause:** Not logged in or session expired
**Solution:**
- Log out and log back in
- Clear browser cookies and login again

#### Issue: "Failed to load profile: 500"
**Cause:** Database connection or Prisma error
**Solution:**
1. Check `.env` file has correct `DATABASE_URL`
2. Run: `npx prisma generate`
3. Run: `npx prisma db push`
4. Restart dev server

#### Issue: Profile API never called
**Cause:** Client-side error before API call
**Solution:**
- Check browser console for JavaScript errors
- Check if Supabase client is initialized correctly

#### Issue: Database missing fields
**Cause:** Schema out of sync with database
**Solution:**
1. Run the SQL scripts from previous fixes:
   - `fix_missing_fields.sql`
   - `make_admin.sql` (if accessing admin)
2. Or run: `npx prisma db push`

### Step 4: Verify Database Connection

Run this in Supabase SQL Editor:
```sql
-- Check if your user exists
SELECT id, email, "fullName", "subscriptionTier", "monthlyCredits"
FROM "User"
LIMIT 5;

-- Check for missing columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'User'
ORDER BY ordinal_position;
```

### Step 5: Test API Endpoint Directly

Open in browser or use curl:
```
http://localhost:3000/api/user/profile
```

You should see either:
- `{"user": {...}}` - Success
- `{"error": "Unauthorized"}` - Not logged in
- `{"error": "Failed to fetch user profile", "details": "..."}` - Server error with details

## Expected Behavior After Fix

1. **On Success:**
   - Loading spinner shows briefly
   - Profile page displays with subscription card, credit card, and form
   - Console shows: "Profile loaded: {...}"

2. **On Error:**
   - Loading spinner shows briefly
   - Error message appears with description
   - "Retry" button allows manual retry
   - Console shows detailed error information

## Next Steps

1. Restart your dev server
2. Hard refresh browser (Ctrl+Shift+R)
3. Navigate to `/profile`
4. Check browser console and server logs
5. Report what you see in the logs for further debugging

## Files Modified

- `components/profile/ProfileClient.tsx` - Added error handling and retry
- `app/api/user/profile/route.ts` - Added detailed logging
