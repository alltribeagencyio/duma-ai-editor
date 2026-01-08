# Admin Panel Setup Guide

## ✅ What's Been Fixed

All TypeScript errors have been resolved and the build is now passing successfully. The admin panel infrastructure is fully built and deployed.

## 🔧 Setup Steps

### 1. Run Database Migration (If Not Already Done)

The new tables should already exist since `prisma db push` showed "database is in sync". But to verify:

```bash
node check_tables.js
```

Expected output: All 5 tables exist (UserWebhook, BrandPromptAssignment, WorkflowLog, SupportTicket, AdminLog)

### 2. Grant Admin Access

1. Go to your [Supabase Dashboard](https://supabase.com)
2. Navigate to **SQL Editor**
3. Run the [setup_admin_access.sql](./setup_admin_access.sql) script
4. **IMPORTANT**: Replace `nmkennedy5@gmail.com` with your actual email address

The script will:
- ✅ Verify all new tables exist
- ✅ Make your user an admin
- ✅ Show your admin status
- ✅ List all admins

### 3. Access Admin Panel

Once you're marked as admin in the database:

1. **Log out** and **log back in** (to refresh your session)
2. Visit: `https://your-domain.com/admin/dashboard`
3. You should see the admin sidebar with gradient background

## 🎨 Admin Routes

All admin pages are now live at:

- `/admin/dashboard` - Overview and quick actions
- `/admin/users` - User management (view, edit credits, subscription)
- `/admin/webhooks` - Per-user webhook configuration
- `/admin/prompts` - Brand prompt management & assignments
- `/admin/support` - Support ticket management
- `/admin/analytics` - Usage analytics
- `/admin/settings` - System settings

## 🐛 Troubleshooting

### Admin Sidebar Not Showing?

**Likely causes:**

1. **You're not marked as admin in the database**
   - Run `setup_admin_access.sql` to fix this
   - Check the output - your `isAdmin` should be `true`

2. **You haven't logged out/in after becoming admin**
   - Your session doesn't know you're an admin yet
   - Log out and log back in

3. **You're accessing the wrong URL**
   - ✅ Correct: `/admin/dashboard`
   - ❌ Wrong: `/admin` (this redirects to dashboard)

4. **Database tables don't exist**
   - Run `node check_tables.js` to verify
   - If missing, run `add_new_tables.sql` in Supabase SQL Editor

### Build Errors?

All TypeScript errors have been fixed in commit `578fc0b`. If you see errors:

1. Pull latest changes: `git pull`
2. Reinstall dependencies: `npm install`
3. Clear cache: `rm -rf .next`
4. Rebuild: `npm run build`

## 📝 New Database Tables

### UserWebhook
Per-user N8N webhook configurations with priority and tier restrictions.

### BrandPromptAssignment
One-to-many assignments of brand prompts to users.

### WorkflowLog
Tracks N8N workflow executions with duration and status.

### SupportTicket
User support requests with category, priority, and status tracking.

### AdminLog
Logs all admin actions for audit trail.

## 🎯 Next Steps

1. ✅ Run `setup_admin_access.sql` to become admin
2. ✅ Log out and log back in
3. ✅ Visit `/admin/dashboard`
4. ✅ Start managing users, webhooks, and prompts!

---

**Build Status**: ✅ Passing (all TypeScript errors fixed)
**Deployment**: Live on Vercel
**Last Updated**: 2026-01-08
