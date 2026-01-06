# 🚀 Quick Deployment Guide

## Prerequisites Checklist
- [ ] GitHub account
- [ ] Vercel account (sign up at vercel.com)
- [ ] Production environment variables ready

---

## 5-Minute Deployment (Vercel)

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Production ready MVP"
git push origin main
```

### Step 2: Import to Vercel
1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select your repository
4. Click "Import"

### Step 3: Configure Build Settings
- **Framework Preset:** Next.js (auto-detected)
- **Build Command:** `npx prisma generate && next build`
- **Output Directory:** `.next` (default)
- **Install Command:** `npm install` (default)

### Step 4: Add Environment Variables

Copy these to Vercel → Settings → Environment Variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://hmtizgdzkueakwextuml.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtdGl6Z2R6a3VlYWt3ZXh0dW1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwMjgzNzMsImV4cCI6MjA4MTYwNDM3M30.CbolX77HL0Ul63Rv1DgIqa049X2bXV3OyQ_S9FIqMXo
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtdGl6Z2R6a3VlYWt3ZXh0dW1sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjAyODM3MywiZXhwIjoyMDgxNjA0MzczfQ.XFk3RhJbCr9MeGbslezTNrUd3qbTakUqvvxj-OLPTiA
DATABASE_URL=postgresql://postgres.hmtizgdzkueakwextuml:Pass@E4t@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true
N8N_WEBHOOK_URL=https://n8n.efortbrands.com/webhook/871c97aa-4aa4-4204-b01a-0ac27caa6aa1
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

**⚠️ IMPORTANT:**
- Set all environments: Production, Preview, Development
- You'll update `NEXT_PUBLIC_APP_URL` after first deploy

### Step 5: Deploy
1. Click "Deploy"
2. Wait 2-3 minutes for build
3. Get your deployment URL (e.g., `nano-banana-pro.vercel.app`)

### Step 6: Update App URL
1. Copy your Vercel URL
2. Go to Settings → Environment Variables
3. Edit `NEXT_PUBLIC_APP_URL`
4. Change to: `https://your-actual-url.vercel.app`
5. Click "Save"
6. Go to Deployments → Click "⋯" → "Redeploy"

### Step 7: Configure Supabase CORS
1. Go to Supabase Dashboard
2. Navigate to Storage → Configuration
3. Add your Vercel domain to allowed origins:
   - `https://your-app.vercel.app`
4. Ensure these buckets are PUBLIC:
   - `temp-images`
   - `edited-images`

---

## Post-Deployment Tests

Run these tests in order:

### ✅ Test 1: Authentication
- [ ] Sign up with new account
- [ ] Log in successfully

### ✅ Test 2: Image Upload
- [ ] Upload HEIC image (iPhone)
- [ ] Upload JPEG/PNG image
- [ ] Check Supabase storage for uploaded files

### ✅ Test 3: Job Processing
- [ ] Create new editing job
- [ ] Job status changes: pending → processing → completed
- [ ] Edited images appear
- [ ] Can download edited images

### ✅ Test 4: Navigation
- [ ] Notifications work
- [ ] Clicking notification goes to job details (not 404)
- [ ] History page shows jobs
- [ ] Product name + SKU displayed correctly

---

## Troubleshooting

### "Images not loading"
- Check Supabase CORS configuration
- Verify buckets are PUBLIC
- Check browser console for errors

### "Job stuck in pending"
- Verify n8n webhook is accessible
- Check n8n workflow is active
- Check Vercel function logs

### "Build failed"
- Ensure all environment variables are set
- Check Node.js version (>= 18.0.0)
- Verify `npx prisma generate` runs successfully

### "404 on notification click"
- Clear browser cache
- Verify `NEXT_PUBLIC_APP_URL` is set correctly
- Redeploy after changing environment variables

---

## Custom Domain (Optional)

### Add Custom Domain to Vercel:
1. Go to Project Settings → Domains
2. Add your domain (e.g., `app.yourdomain.com`)
3. Follow Vercel's DNS configuration instructions
4. Update `NEXT_PUBLIC_APP_URL` to your custom domain
5. Redeploy
6. Update Supabase CORS with new domain

---

## Environment Variables Reference

| Variable | Type | Required | Example |
|----------|------|----------|---------|
| NEXT_PUBLIC_SUPABASE_URL | Public | Yes | https://xxx.supabase.co |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Public | Yes | eyJhbG... |
| SUPABASE_SERVICE_ROLE_KEY | Secret | Yes | eyJhbG... |
| DATABASE_URL | Secret | Yes | postgresql://... |
| N8N_WEBHOOK_URL | Secret | Yes | https://n8n... |
| NEXT_PUBLIC_APP_URL | Public | Yes | https://your-app.vercel.app |

---

## Performance Monitoring

After deployment, monitor:
- Vercel Analytics → Speed Insights
- Vercel Functions → Check execution times
- Supabase → Storage usage
- n8n → Workflow execution success rate

---

## Next Steps

After successful deployment:
1. Test all user flows
2. Monitor error logs for 24 hours
3. Set up automatic backups for Supabase
4. Configure domain email for notifications
5. Set up monitoring/alerts

---

## Rollback Procedure

If something goes wrong:
1. Go to Vercel → Deployments
2. Find last working deployment
3. Click "⋯" menu → "Promote to Production"
4. Site reverts instantly

---

## Support Resources

- [Full Deployment Guide](./DEPLOYMENT.md)
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)

---

**Estimated Deployment Time:** 10-15 minutes
**Difficulty:** Easy
**Cost:** Free (Vercel Hobby + Supabase Free Tier)
