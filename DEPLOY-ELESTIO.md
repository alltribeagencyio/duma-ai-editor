# 🚀 Elest.io Docker Deployment Guide

## Overview
This guide covers deploying the Nano Banana Pro Image Editor to elest.io using Docker.

**Deployment Method:** Docker Container
**Estimated Time:** 20-30 minutes
**Cost:** Varies by elest.io plan

---

## Prerequisites

- [ ] elest.io account ([sign up here](https://elest.io))
- [ ] Git repository (GitHub, GitLab, or Bitbucket)
- [ ] Production environment variables ready
- [ ] Docker installed locally for testing (optional but recommended)

---

## Part 1: Local Docker Testing (Optional but Recommended)

Before deploying to elest.io, test the Docker build locally:

### Step 1: Create Production Environment File

```bash
# Copy the example file
cp .env.production.example .env.production

# Edit with your actual values
# Make sure NEXT_PUBLIC_APP_URL is set to http://localhost:3000 for testing
```

### Step 2: Build Docker Image

```bash
# Build the image (takes 3-5 minutes)
docker build -t nano-banana-image-editor .

# Check if image was created
docker images | grep nano-banana
```

### Step 3: Run Container Locally

```bash
# Run with environment file
docker run -p 3000:3000 --env-file .env.production nano-banana-image-editor

# Or use docker-compose
docker-compose up
```

### Step 4: Test Locally

Open http://localhost:3000 and verify:
- [ ] App loads without errors
- [ ] Can sign up/login
- [ ] Can upload images
- [ ] Images display correctly

### Step 5: Stop and Clean Up

```bash
# Stop container
docker-compose down

# Or if using docker run
docker ps  # Find container ID
docker stop <container-id>
```

---

## Part 2: Deploy to Elest.io

### Method A: Deploy from GitHub (Recommended)

#### Step 1: Push Code to GitHub

```bash
# Ensure all files are committed
git add .
git commit -m "Add Docker configuration for elest.io deployment"
git push origin main
```

#### Step 2: Create Service on Elest.io

1. Log in to https://elest.io
2. Click **"Create Service"**
3. Select **"Docker"** as the service type
4. Choose **"From Git Repository"**
5. Connect your GitHub account (if not already connected)
6. Select your repository
7. Select branch: `main`

#### Step 3: Configure Build Settings

In the elest.io service configuration:

**Build Configuration:**
- **Dockerfile Path:** `Dockerfile`
- **Build Context:** `/` (root directory)
- **Build Arguments:** None required

**Port Configuration:**
- **Internal Port:** `3000`
- **External Port:** `80` or `443` (HTTPS)
- **Protocol:** HTTP

**Health Check:**
- **Enabled:** Yes
- **Path:** `/api/presets`
- **Interval:** 30 seconds
- **Timeout:** 10 seconds
- **Retries:** 3

#### Step 4: Set Environment Variables

In the elest.io service → **Environment Variables** section, add:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://hmtizgdzkueakwextuml.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtdGl6Z2R6a3VlYWt3ZXh0dW1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwMjgzNzMsImV4cCI6MjA4MTYwNDM3M30.CbolX77HL0Ul63Rv1DgIqa049X2bXV3OyQ_S9FIqMXo
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtdGl6Z2R6a3VlYWt3ZXh0dW1sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjAyODM3MywiZXhwIjoyMDgxNjA0MzczfQ.XFk3RhJbCr9MeGbslezTNrUd3qbTakUqvvxj-OLPTiA
DATABASE_URL=postgresql://postgres.hmtizgdzkueakwextuml:Pass@E4t@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true
N8N_WEBHOOK_URL=https://n8n.efortbrands.com/webhook/871c97aa-4aa4-4204-b01a-0ac27caa6aa1
NEXT_PUBLIC_APP_URL=https://your-service-name.elest.io
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
```

**⚠️ CRITICAL:** Replace `your-service-name.elest.io` with your actual elest.io domain (you'll get this after deployment)

#### Step 5: Configure Resources

**Recommended Specifications:**
- **CPU:** 1-2 vCPU (2 recommended for HEIC conversion)
- **RAM:** 1-2 GB (2 GB recommended)
- **Storage:** 10 GB (depending on image volume)
- **Auto-scaling:** Enable if available

**Why these specs?**
- HEIC conversion is CPU-intensive
- Next.js build requires ~1GB RAM
- Image processing benefits from extra resources

#### Step 6: Deploy

1. Click **"Deploy"** or **"Create Service"**
2. Wait for build (typically 5-10 minutes)
3. Monitor build logs for errors
4. Once deployed, copy your service URL

#### Step 7: Update App URL

1. Copy your elest.io URL (e.g., `https://nano-banana-pro.elest.io`)
2. Go to Service → **Environment Variables**
3. Update `NEXT_PUBLIC_APP_URL` with the actual URL
4. Click **"Redeploy"** to apply changes

---

### Method B: Deploy Using Docker Compose

If elest.io supports docker-compose:

1. Select **"Docker Compose"** during service creation
2. Elest.io will detect your `docker-compose.yml`
3. Set environment variables as above
4. Deploy

---

## Part 3: Post-Deployment Configuration

### 1. Configure Supabase CORS

**Critical for image loading:**

1. Go to Supabase Dashboard → **Storage** → **Configuration**
2. Add your elest.io domain to allowed origins:
   ```
   https://your-service-name.elest.io
   ```
3. Ensure these buckets are **PUBLIC**:
   - `temp-images`
   - `edited-images`

**Verify Bucket Policies:**
```sql
-- In Supabase SQL Editor, verify policies exist
SELECT * FROM storage.buckets WHERE name IN ('temp-images', 'edited-images');
```

### 2. Update n8n Callback URL

Ensure n8n workflow can reach your elest.io deployment:

1. Your app will POST to: `https://n8n.efortbrands.com/webhook/...`
2. n8n will callback to: `https://your-service-name.elest.io/api/webhook/callback`

**Test n8n connectivity:**
```bash
curl -X POST https://your-service-name.elest.io/api/webhook/callback \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

### 3. Configure Custom Domain (Optional)

If you want to use your own domain:

1. In elest.io → Service → **Domains**
2. Add custom domain (e.g., `app.yourdomain.com`)
3. Update DNS records as instructed by elest.io
4. Update environment variables:
   - `NEXT_PUBLIC_APP_URL=https://app.yourdomain.com`
5. Update Supabase CORS with new domain
6. Redeploy service

---

## Part 4: Verification Tests

Run these tests after deployment:

### ✅ Test 1: Application Loads
```bash
curl https://your-service-name.elest.io
# Should return HTML (status 200)
```

### ✅ Test 2: API Endpoints
```bash
# Test presets endpoint
curl https://your-service-name.elest.io/api/presets
# Should return JSON with presets

# Test health check
curl https://your-service-name.elest.io/api/presets
# Should return 200 OK
```

### ✅ Test 3: Authentication Flow
1. Open app in browser
2. Sign up with new account
3. Verify email works
4. Log in successfully

### ✅ Test 4: Image Upload
1. Create new editing job
2. Upload HEIC image from iPhone
3. Upload JPEG/PNG image
4. Verify images appear in job details

### ✅ Test 5: Job Processing
1. Submit editing job
2. Monitor status: `pending → processing → completed`
3. Verify edited images appear
4. Test image download

### ✅ Test 6: Notifications
1. Wait for job completion
2. Check notification bell
3. Click notification → should navigate to job details (not 404)

### ✅ Test 7: Image Display
1. Go to History page
2. Verify thumbnails load (not placeholders)
3. Click job → verify all images display
4. Test lightbox functionality

---

## Part 5: Monitoring & Maintenance

### Viewing Logs

**In elest.io dashboard:**
1. Go to your service
2. Click **"Logs"** tab
3. Filter by:
   - Build logs (for deployment issues)
   - Runtime logs (for application errors)
   - Error logs only

**Key logs to monitor:**
```bash
# HEIC conversion
🔄 Converting HEIC to JPEG: image.heic
✅ Converted to: image.jpg

# Job processing
📡 Poll update: completed Images: 5

# Errors to watch for
Error uploading image
Error polling job
Failed to create job
```

### Resource Monitoring

Monitor in elest.io dashboard:
- **CPU Usage:** Should stay below 70% normally
- **Memory Usage:** Should stay below 80%
- **Disk Usage:** Monitor image storage growth
- **Network I/O:** Spikes during image uploads

**Alerts to set up:**
- CPU > 90% for 5 minutes
- Memory > 90% for 5 minutes
- Disk > 80%
- Service downtime

### Scaling Recommendations

**Scale up if you see:**
- CPU consistently > 70%
- Memory consistently > 80%
- Slow HEIC conversion times
- Image upload timeouts

**Upgrade to:**
- 2 vCPU → 4 vCPU
- 2 GB RAM → 4 GB RAM
- Enable auto-scaling if available

---

## Troubleshooting

### Issue: Build Fails

**Symptom:** Docker build fails in elest.io

**Common Causes:**
1. Insufficient memory during build
2. Network timeout downloading dependencies
3. Prisma generation fails

**Solutions:**
```bash
# Check build logs for specific error
# If memory issue, increase build resources
# If network timeout, retry deployment
# If Prisma fails, verify DATABASE_URL is set
```

### Issue: Container Starts but Crashes

**Symptom:** Health check fails, container restarts

**Check:**
1. Environment variables are set correctly
2. DATABASE_URL is accessible from elest.io
3. Port 3000 is correctly mapped

**Debug:**
```bash
# View runtime logs in elest.io
# Look for:
# - Prisma connection errors
# - Missing environment variables
# - Port binding issues
```

### Issue: Images Not Loading

**Symptom:** Placeholder icons instead of images

**Solutions:**
1. **Check Supabase CORS:**
   - Verify elest.io domain is in allowed origins
   - Check bucket policies are PUBLIC

2. **Check Browser Console:**
   - Look for CORS errors
   - Look for 403 Forbidden errors

3. **Verify Image URLs:**
   ```bash
   # Test image URL directly
   curl -I https://hmtizgdzkueakwextuml.supabase.co/storage/v1/object/public/temp-images/...
   # Should return 200 OK
   ```

### Issue: Job Processing Fails

**Symptom:** Jobs stuck in "pending" or "processing"

**Check:**
1. **n8n Webhook Reachable:**
   ```bash
   curl -X POST https://n8n.efortbrands.com/webhook/871c97aa-4aa4-4204-b01a-0ac27caa6aa1
   # Should not timeout
   ```

2. **Callback Endpoint Works:**
   ```bash
   curl https://your-service-name.elest.io/api/webhook/callback
   # Should return 405 (Method Not Allowed) - means endpoint exists
   ```

3. **Check n8n Logs:**
   - Verify workflow executions
   - Check for errors calling callback URL

### Issue: HEIC Conversion Fails

**Symptom:** HEIC images fail to upload or convert

**Solutions:**
1. **Check Container Logs:**
   ```bash
   # Look for:
   Error converting HEIC
   heic-convert module errors
   ```

2. **Verify Dependencies:**
   - Dockerfile includes python3, make, g++
   - heic-convert npm package installed

3. **CPU/Memory:**
   - HEIC conversion requires resources
   - May need to increase CPU/RAM

### Issue: Slow Performance

**Symptom:** App loads slowly, timeouts

**Optimizations:**
1. Enable elest.io CDN if available
2. Increase container resources
3. Check Supabase response times
4. Monitor network latency to n8n

### Issue: Environment Variables Not Applied

**Symptom:** App uses wrong values after update

**Solution:**
1. Verify variables saved in elest.io
2. **Critical:** Must redeploy after changing env vars
3. NEXT_PUBLIC_* vars require rebuild
4. Clear browser cache after update

---

## Continuous Deployment

### Auto-Deploy on Git Push

Enable in elest.io:
1. Service → **Settings** → **Git Integration**
2. Enable **"Auto Deploy"**
3. Select branch: `main`
4. Choose deployment trigger: **"On Push"**

Now every push to `main` will automatically:
1. Pull latest code
2. Build Docker image
3. Deploy new container
4. Run health checks

### Rollback Strategy

If deployment fails:

**Quick Rollback:**
1. Go to elest.io → Service → **Deployments**
2. Find last working deployment
3. Click **"Redeploy"** on that version

**Git Rollback:**
```bash
# Revert to previous commit
git revert HEAD
git push origin main
# Auto-deploy will trigger
```

---

## Security Best Practices

### 1. Environment Variables

✅ **Do:**
- Store secrets in elest.io environment variables
- Never commit .env.production to git
- Rotate keys periodically

❌ **Don't:**
- Hardcode secrets in Dockerfile
- Expose service role keys in client code

### 2. Network Security

✅ **Do:**
- Use HTTPS only (elest.io provides free SSL)
- Configure Supabase RLS policies
- Validate n8n webhook signatures (if possible)

❌ **Don't:**
- Allow HTTP connections
- Expose internal ports

### 3. Container Security

✅ **Do:**
- Use non-root user (already configured in Dockerfile)
- Keep base image updated (node:18-alpine)
- Scan for vulnerabilities regularly

---

## Performance Optimization

### 1. Docker Image Size

Current optimizations in Dockerfile:
- Multi-stage build (reduces image size by ~60%)
- Alpine Linux base (minimal OS)
- Standalone Next.js output
- Only production dependencies copied

**Check image size:**
```bash
docker images nano-banana-image-editor
# Should be ~500MB - 800MB
```

### 2. Build Caching

Optimize build times:
- Dependencies cached in separate layer
- Rebuild only when package.json changes
- Prisma client generation cached

### 3. Runtime Performance

Already configured:
- Production mode enabled
- Console logs removed (except errors)
- SWC minification enabled
- Source maps disabled

---

## Backup & Disaster Recovery

### Database Backups

Supabase handles database backups:
- Daily automatic backups (free tier)
- Point-in-time recovery (pro tier)

**Manual backup:**
```bash
# Export database
npx prisma db pull
npx prisma db push
```

### Storage Backups

Supabase Storage backups:
- Manual: Download buckets via Supabase dashboard
- Automated: Use Supabase backup features (pro tier)

### Application State

**What to backup:**
- Git repository (source code)
- Environment variables (document separately)
- Database schema (Prisma schema file)

**Recovery procedure:**
1. Redeploy from git
2. Restore environment variables
3. Run migrations: `npx prisma migrate deploy`
4. Verify functionality

---

## Cost Estimation

### elest.io Costs

**Typical configuration:**
- 2 vCPU, 2 GB RAM: ~$15-25/month
- 4 vCPU, 4 GB RAM: ~$30-50/month
- Additional storage: ~$0.10/GB/month

### Supabase Costs

**Free Tier:**
- 500 MB database
- 1 GB storage
- 2 GB bandwidth

**Pro Tier ($25/month):**
- 8 GB database
- 100 GB storage
- 250 GB bandwidth

### n8n Costs

Already hosted at: `https://n8n.efortbrands.com`
- Included in your existing setup

**Total Monthly Cost Estimate:**
- Minimum: ~$15 (elest.io) + $0 (Supabase free tier)
- Recommended: ~$25 (elest.io) + $25 (Supabase pro)
- **Total: $50-75/month for production-grade hosting**

---

## Checklist Summary

Before deploying:
- [ ] Docker files created (Dockerfile, .dockerignore, docker-compose.yml)
- [ ] next.config.js has `output: 'standalone'`
- [ ] .env.production.example has production values
- [ ] Git repository up to date
- [ ] All environment variables documented

During deployment:
- [ ] Service created on elest.io
- [ ] All environment variables set
- [ ] Resources allocated (2 vCPU, 2 GB RAM minimum)
- [ ] Health check configured
- [ ] Auto-deploy enabled (optional)

After deployment:
- [ ] NEXT_PUBLIC_APP_URL updated with actual domain
- [ ] Supabase CORS configured
- [ ] n8n callback tested
- [ ] All verification tests passed
- [ ] Monitoring/alerts configured
- [ ] Custom domain configured (optional)

---

## Support & Resources

- **elest.io Documentation:** https://docs.elest.io
- **Docker Documentation:** https://docs.docker.com
- **Next.js Docker Guide:** https://nextjs.org/docs/deployment
- **This App's Docker Config:** `Dockerfile`, `docker-compose.yml`

---

**Last Updated:** December 23, 2025
**Docker Configuration:** ✅ Ready
**Deployment Method:** Docker Container
**Estimated Build Time:** 5-10 minutes
**Estimated Total Deployment Time:** 20-30 minutes
