# N8N Integration Architecture

## Overview

This document explains how the application integrates with N8N workflows and handles asynchronous job processing.

## Key Architectural Decision

**N8N updates the database directly** instead of calling webhook callbacks for image processing jobs.

### How It Works

1. **Job Submission** → App creates job in database with `status: 'pending'`
2. **N8N Trigger** → N8N workflow is triggered via webhook
3. **Direct Database Update** → N8N updates job record directly:
   - Sets `status: 'completed'` or `status: 'failed'`
   - Adds `outputData` (array of image URLs)
   - Updates `completedAt` timestamp
4. **App Polling** → App components poll database to detect changes

## Components Using Polling (NOT Webhook Callbacks)

### 1. Job Detail Page (`components/job-detail/JobDetailClient.tsx`)
- **Polling Interval**: Every 2 seconds
- **Condition**: Only polls while `status === 'pending' || status === 'processing'`
- **Endpoint**: `GET /api/jobs/${jobId}`
- **Stops When**: Job reaches `completed` or `failed` status

```typescript
// Lines 64-99
useEffect(() => {
  if (job.status !== 'pending' && job.status !== 'processing') {
    return
  }

  const interval = setInterval(async () => {
    const response = await fetch(`/api/jobs/${job.id}`)
    if (response.ok) {
      const { job: updatedJob } = await response.json()
      setJob(updatedJob)

      if (updatedJob.status === 'completed' || updatedJob.status === 'failed') {
        clearInterval(interval)
      }
    }
  }, 2000)

  return () => clearInterval(interval)
}, [job.id, job.status])
```

### 2. Dashboard (`components/dashboard/DashboardClient.tsx`)
- **Refresh Interval**: Every 30 seconds
- **Also Refreshes**: On page visibility change (tab switching)
- **Endpoints**:
  - `POST /api/jobs/process-completed` (processes completed jobs)
  - `GET /api/jobs` (fetches all jobs)
  - `GET /api/credits/balance` (updated credit balance)

```typescript
// Lines 54-73
useEffect(() => {
  fetchData()

  const handleVisibilityChange = () => {
    if (!document.hidden) {
      fetchData()
    }
  }

  document.addEventListener('visibilitychange', handleVisibilityChange)

  const intervalId = setInterval(() => {
    fetchData()
  }, 30000)

  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    clearInterval(intervalId)
  }
}, [])
```

### 3. Gallery (`components/gallery/GalleryClient.tsx`)
- **Fetch**: On component mount
- **Calls**: `POST /api/jobs/process-completed` before fetching jobs
- **Filters**: Only shows `completed` jobs with `outputData`

### 4. History (`components/history/EnhancedJobList.tsx`)
- **Fetch**: On component mount
- **Calls**: `POST /api/jobs/process-completed` before fetching jobs
- **Displays**: All jobs with filtering and sorting

### 5. Profile Credit Card (`components/profile/CreditUsageCard.tsx`)
- **Refresh Interval**: Every 30 seconds
- **Also Refreshes**: On page visibility change
- **Calls**: `POST /api/jobs/process-completed` before fetching balance

## Credit Deduction System

### Problem
Since N8N doesn't call webhook callbacks, credits were never being deducted for completed jobs.

### Solution: Automatic Processing Endpoint

**Endpoint**: `POST /api/jobs/process-completed`

**Purpose**: Finds completed jobs without credit deductions and processes them automatically.

**Called By**:
- Dashboard (every 30 seconds)
- Profile credit card (every 30 seconds)
- Gallery (on mount)
- History (on mount)

**Logic** (`app/api/jobs/process-completed/route.ts`):
1. Find all jobs where `status === 'completed' AND creditDeducted === false`
2. Filter to only jobs with `outputData.length > 0`
3. For each job:
   - Calculate cost based on user's pricing plan
   - Deduct credits using `pricingService.deductCredits()`
   - Update `creditBalance` and increment `creditsUsed`
   - Create `creditTransaction` record
   - Mark `job.creditDeducted = true`

### Retroactive Credit Deduction

**Script**: `scripts/fix_missing_credit_deductions.js`

Used to fix historical data where credits weren't deducted.

```bash
node scripts/fix_missing_credit_deductions.js
```

## Exception: Chatbot Uses Synchronous Webhook

**Only the chatbot** waits for N8N webhook response because it needs the AI's reply immediately.

**Endpoint**: `POST /api/support/chatbot`

**Flow**:
1. User sends message
2. App calls N8N chatbot webhook with `await fetch()`
3. **Waits for response** (synchronous)
4. Returns AI reply to user immediately

```typescript
// app/api/support/chatbot/route.ts (lines 61-89)
const response = await fetch(chatbotWebhookUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: user.id,
    message,
    context: {...}
  }),
})

const data = await response.json()
return NextResponse.json({
  reply: data.reply || 'How can I help you?',
})
```

## Webhook Callback Endpoint (Legacy)

**File**: `app/api/webhook/callback/route.ts`

**Status**: Still exists but **not used by N8N for image processing**

**Why It Exists**:
- Historical implementation
- May be used by other N8N workflows in future
- Handles credit deduction if called (defensive programming)

**What It Does If Called**:
1. Validates `jobId` and `status`
2. Updates job status and `outputData`
3. Deducts credits (if not already deducted)
4. Creates `workflowLog` entry

## Summary

| Feature | Method | Update Frequency | Calls process-completed? |
|---------|--------|------------------|--------------------------|
| Job Detail Page | Polling | Every 2 seconds (if pending/processing) | No |
| Dashboard | Polling | Every 30 seconds | Yes |
| Gallery | One-time fetch | On mount | Yes |
| History | One-time fetch | On mount | Yes |
| Profile Credits | Polling | Every 30 seconds | Yes |
| Chatbot | Synchronous webhook | Real-time | N/A |

## Best Practices

### When Adding New Job-Related Features:

1. **Always call** `POST /api/jobs/process-completed` before fetching jobs
2. **Never wait** for webhook callbacks for image processing
3. **Use polling** for real-time status updates
4. **Check `creditDeducted` flag** to prevent duplicate deductions
5. **Only use synchronous webhooks** for features requiring immediate responses (like chat)

### Example: Adding a New Page That Shows Jobs

```typescript
const fetchJobs = async () => {
  try {
    // STEP 1: Process any completed jobs first
    await fetch('/api/jobs/process-completed', { method: 'POST' }).catch(() => {
      // Silent fail - will retry on next fetch
    })

    // STEP 2: Fetch jobs from database
    const response = await fetch('/api/jobs')
    if (response.ok) {
      const { jobs } = await response.json()
      setJobs(jobs)
    }
  } catch (error) {
    console.error('Error fetching jobs:', error)
  }
}
```

## Database Schema Notes

### Job Table
- `status`: 'pending' | 'processing' | 'completed' | 'failed'
- `creditDeducted`: boolean (prevents duplicate deductions)
- `outputData`: string[] (array of image URLs)
- `completedAt`: timestamp (set by N8N when job completes)

### CreditTransaction Table
- `type`: 'purchase' | 'deduction' | 'refund' | 'bonus'
- `amount`: USD amount
- `creditsDeducted`: Number of credits/images
- `balanceBefore`: Balance before transaction
- `balanceAfter`: Balance after transaction
- `jobId`: Reference to job (for deductions)

## Troubleshooting

### Credits Not Being Deducted?

1. Check if `creditDeducted` is still `false` in database
2. Check if `outputData` exists and has length > 0
3. Run the retroactive script: `node scripts/fix_missing_credit_deductions.js`
4. Verify `/api/jobs/process-completed` is being called

### Jobs Stuck in Pending?

1. Check if N8N workflow is running
2. Verify N8N can access database (check connection string)
3. Look for errors in N8N workflow logs
4. Check if N8N updated the job status directly in database

### Images Not Showing?

1. Verify `job.status === 'completed'`
2. Check if `job.outputData` is populated
3. Ensure image URLs in `outputData` are valid
4. Check browser console for CORS or loading errors

## Migration Notes

If you need to change back to webhook callbacks:

1. Update N8N workflow to call `POST /api/webhook/callback`
2. Remove `POST /api/jobs/process-completed` calls from components
3. Credits will be deducted by webhook callback instead
4. Keep polling for status updates (still needed for UX)
