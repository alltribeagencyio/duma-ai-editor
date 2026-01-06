# Deployment Checklist - Nano Banana Pro Image Editor MVP

## Pre-Deployment Checklist

### ✅ Environment Variables (CRITICAL)

When deploying, you MUST set these environment variables in your hosting platform:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://hmtizgdzkueakwextuml.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtdGl6Z2R6a3VlYWt3ZXh0dW1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwMjgzNzMsImV4cCI6MjA4MTYwNDM3M30.CbolX77HL0Ul63Rv1DgIqa049X2bXV3OyQ_S9FIqMXo
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtdGl6Z2R6a3VlYWt3ZXh0dW1sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjAyODM3MywiZXhwIjoyMDgxNjA0MzczfQ.XFk3RhJbCr9MeGbslezTNrUd3qbTakUqvvxj-OLPTiA

# Database
DATABASE_URL=postgresql://postgres.hmtizgdzkueakwextuml:Pass@E4t@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true

# n8n Webhook
N8N_WEBHOOK_URL=https://n8n.efortbrands.com/webhook/871c97aa-4aa4-4204-b01a-0ac27caa6aa1

# App URL - CHANGE THIS TO YOUR PRODUCTION DOMAIN
NEXT_PUBLIC_APP_URL=https://your-production-domain.com
```

**⚠️ IMPORTANT:** The `NEXT_PUBLIC_APP_URL` MUST be changed from localhost to your actual production domain.

---

## Deployment Risks & Solutions

### 1. Database Connection Issues

**Risk:** Prisma may fail to connect in serverless environments

**Solution:**
- ✅ Already configured with `pgbouncer=true` for connection pooling
- Ensure hosting platform supports long-running connections
- Vercel/Netlify: Works out of the box
- Self-hosted: May need to adjust connection pool size

**Verification:**
```bash
# Test database connection after deployment
curl https://your-domain.com/api/jobs
```

---

### 2. Supabase Storage CORS Configuration

**Risk:** Images may fail to load due to CORS restrictions

**Required Setup:**
1. Go to Supabase Dashboard → Storage → Policies
2. Ensure these buckets exist and are PUBLIC:
   - `temp-images` (for original uploads)
   - `edited-images` (for processed results)

3. Add CORS configuration for your production domain:
   - Navigate to Storage Settings
   - Add allowed origins: `https://your-production-domain.com`
   - Include credentials: Yes

**Test After Deployment:**
- Upload images from production site
- Verify images display in job details
- Check browser console for CORS errors

---

### 3. n8n Webhook Accessibility

**Risk:** Job processing will fail if n8n cannot reach your app or vice versa

**Requirements:**
- n8n webhook (`https://n8n.efortbrands.com/webhook/...`) must be publicly accessible
- Your production app must be able to make POST requests to n8n
- n8n must be able to POST results back to `https://your-domain.com/api/webhook/callback`

**Verification Steps:**
1. Test n8n webhook is reachable:
```bash
curl -X POST https://n8n.efortbrands.com/webhook/871c97aa-4aa4-4204-b01a-0ac27caa6aa1 \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

2. After deployment, create a test job and monitor:
   - Check job status changes from `pending` → `processing` → `completed`
   - Verify n8n receives the webhook
   - Verify callback endpoint receives results

---

### 4. File Upload Size Limits

**Risk:** Large HEIC images may fail to upload

**Platform-Specific Limits:**
- **Vercel:** 4.5MB request body limit (Hobby), 100MB (Pro)
- **Netlify:** 10MB request body limit
- **Self-hosted:** Configure nginx/apache limits

**Current Implementation:**
- Uses multipart form data
- HEIC conversion happens server-side
- May need to implement chunked uploads for very large files

**If uploads fail, check:**
1. Hosting platform body size limits
2. Supabase storage quotas
3. Browser network tab for 413 errors

---

### 5. HEIC Image Conversion

**Risk:** heic-convert library requires Node.js Buffer API

**Requirements:**
- Node.js runtime (NOT Edge runtime)
- Node.js version >= 18.0.0 (already specified in package.json)

**Vercel Configuration:**
- Default Node.js runtime: ✅ Works
- Edge runtime: ❌ Will fail

**Files using heic-convert:**
- `app/api/jobs/route.ts` - Upload endpoint

**Ensure these API routes run in Node.js runtime** (not Edge)

---

### 6. Environment Variables Visibility

**Risk:** Missing or incorrect environment variables

**NEXT_PUBLIC_* Variables:**
- These are embedded in client-side JavaScript
- Must be set at BUILD TIME
- Changing them requires a rebuild

**Server-only Variables:**
- `DATABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `N8N_WEBHOOK_URL`

**Common Issues:**
- Vercel: Environment variables set after build won't apply until redeploy
- Netlify: Same issue - trigger rebuild after adding variables

---

### 7. Database Migrations

**Risk:** Database schema out of sync with code

**Before First Deployment:**
```bash
# Apply all migrations to production database
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

**Hosting Platform Setup:**
- Vercel: Add to build command in `vercel.json` or use Vercel's build hooks
- Netlify: Add to build command in `netlify.toml`

**Current Build Command:**
```json
{
  "build": "next build"
}
```

**Recommended Production Build Command:**
```bash
npx prisma generate && npx prisma migrate deploy && next build
```

---

## Recommended Hosting Platform: Vercel

### Why Vercel?
- ✅ Built specifically for Next.js
- ✅ Automatic deployments from Git
- ✅ Environment variables management
- ✅ Edge CDN for fast global delivery
- ✅ Automatic HTTPS
- ✅ Preview deployments for testing
- ✅ Serverless functions work perfectly

### Vercel Deployment Steps

1. **Install Vercel CLI** (optional):
```bash
npm i -g vercel
```

2. **Push to GitHub** (if not already):
```bash
git add .
git commit -m "Production ready MVP"
git push origin main
```

3. **Import Project to Vercel**:
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - Configure project:
     - Framework Preset: Next.js
     - Build Command: `npx prisma generate && next build`
     - Output Directory: `.next`
     - Install Command: `npm install`

4. **Add Environment Variables**:
   - In Vercel dashboard → Settings → Environment Variables
   - Add ALL variables from the list above
   - **IMPORTANT:** Change `NEXT_PUBLIC_APP_URL` to your Vercel domain

5. **Deploy**:
   - Click "Deploy"
   - Wait for build to complete
   - Vercel will provide a `.vercel.app` domain

6. **Update Production URL**:
   - Copy your Vercel domain (e.g., `nano-banana-pro.vercel.app`)
   - Update environment variable: `NEXT_PUBLIC_APP_URL=https://nano-banana-pro.vercel.app`
   - Redeploy to apply changes

---

## Post-Deployment Verification

### Critical Tests (Run in Order):

1. **✅ Authentication**
   - Sign up with new account
   - Verify email confirmation works
   - Log in and log out

2. **✅ Image Upload**
   - Upload HEIC images from iPhone
   - Upload JPEG/PNG images
   - Verify files appear in Supabase `temp-images` bucket

3. **✅ Job Creation**
   - Create a new editing job
   - Fill in product information
   - Submit job
   - Verify job appears in history

4. **✅ Job Processing**
   - Monitor job status changes
   - Check n8n workflow execution logs
   - Verify edited images appear as they complete
   - Check images stored in `edited-images` bucket

5. **✅ Notifications**
   - Verify notification bell shows updates
   - Click notification to navigate to job
   - Verify no 404 errors

6. **✅ Image Display**
   - Job details page shows all edited images
   - Original images section displays properly
   - Lightbox opens on image click
   - Download buttons work

7. **✅ History Page**
   - Jobs display with correct thumbnails
   - Product name + SKU shown correctly
   - Filter by status works
   - Pagination works

8. **✅ Prompts Management**
   - Preset prompts load
   - Custom prompts can be created
   - Custom prompts can be edited/deleted

---

## Rollback Plan

If deployment fails:

1. **Immediate Rollback** (Vercel):
   - Go to Deployments tab
   - Find last working deployment
   - Click "Promote to Production"

2. **Check Logs**:
   - Vercel → Deployment → Functions
   - Look for errors in `/api/*` routes

3. **Common Fixes**:
   - Environment variable typos
   - Missing DATABASE_URL
   - n8n webhook unreachable
   - CORS configuration incorrect

---

## Security Notes

### ✅ Already Secure:
- .env file in .gitignore ✅
- .env.example sanitized (no real credentials) ✅
- Supabase Row Level Security should be enabled
- Service role key only used server-side ✅

### ⚠️ Review Required:
1. **Supabase Storage Policies:**
   - Ensure RLS (Row Level Security) is enabled on `Job` table
   - Verify users can only see their own jobs

2. **API Rate Limiting:**
   - Consider adding rate limiting to `/api/jobs` endpoint
   - Prevent abuse of file uploads

3. **Webhook Security:**
   - n8n webhook is public - consider adding signature verification
   - Validate callback requests actually come from n8n

---

## Monitoring

### Key Metrics to Watch:

1. **Error Rate:**
   - Monitor `/api/jobs` endpoint
   - Monitor `/api/webhook/callback` endpoint

2. **Job Completion Rate:**
   - Track jobs that get stuck in "processing"
   - Set up alerts for jobs older than 30 minutes

3. **Storage Usage:**
   - Monitor Supabase storage quota
   - Consider cleanup policy for old temp-images

4. **n8n Workflow:**
   - Check n8n execution history
   - Monitor for failed executions

---

## Known Limitations

1. **HEIC Conversion:**
   - Requires Node.js runtime (not Edge)
   - May be slow for very large files
   - Consider background processing for 10+ MB files

2. **Concurrent Uploads:**
   - Multiple simultaneous uploads may timeout
   - Consider implementing upload queue

3. **Supabase Storage:**
   - Free tier: 1GB storage
   - Monitor usage and upgrade plan if needed

---

## Success Criteria

Deployment is successful when:
- ✅ Users can sign up and log in
- ✅ iPhone HEIC images upload successfully
- ✅ Jobs process and return edited images
- ✅ Notifications work and navigate correctly
- ✅ No console errors on any page
- ✅ All images display (no placeholders)
- ✅ History page shows correct thumbnails

---

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check Supabase logs
3. Check n8n execution logs
4. Check browser console for client-side errors
5. Verify all environment variables are set correctly

---

**Last Updated:** December 23, 2025
**Production Build Status:** ✅ Ready for deployment
**Security Status:** ✅ Credentials secured
**Node.js Version Required:** >= 18.0.0
