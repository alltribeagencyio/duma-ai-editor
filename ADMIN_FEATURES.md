# Admin Dashboard Features

## Overview
This document describes the admin user management and credit assignment features added to the Duma AI platform.

## Features Implemented

### 1. User Creation from Admin Dashboard

**Location:** [/admin](http://localhost:3000/admin) → User Management tab

**Functionality:**
- Create new users directly from the admin interface
- Set initial monthly credits and subscription tier
- Automatic Supabase Auth account creation
- Automatic database record creation
- Toast notifications for success/error feedback

**Form Fields:**
- Email (required)
- Full Name (optional)
- Password (required, min 6 characters)
- Monthly Credits (default: 100)
- Subscription Tier (free, starter, pro, enterprise)

**API Endpoint:** `POST /api/admin/users/create`

**Example Usage:**
```typescript
const response = await fetch('/api/admin/users/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'client@example.com',
    fullName: 'John Doe',
    password: 'secure123',
    monthlyCredits: 100,
    subscriptionTier: 'starter'
  })
})
```

### 2. Credit Management

**Location:** [/admin](http://localhost:3000/admin) → User Management tab → Edit button (on each user row)

**Functionality:**
- Add credits to existing monthly allocation
- Set monthly credits to specific amount
- Reset used credits to 0
- Automatic audit logging in CreditUsage table
- Real-time credit display and updates

**Actions:**
1. **Add Credits** - Increases monthly allocation by specified amount
   ```typescript
   // If user has 100 monthly credits, adding 50 gives 150 total
   ```

2. **Set Credits** - Sets monthly allocation to specific amount
   ```typescript
   // Sets monthly credits to exact number regardless of current value
   ```

3. **Reset Used Credits** - Resets creditsUsed to 0
   ```typescript
   // Useful at start of new billing period or for refunds
   ```

**API Endpoint:** `POST /api/admin/users/credits`

**Example Usage:**
```typescript
// Add 100 credits
const response = await fetch('/api/admin/users/credits', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user-uuid',
    action: 'add',
    amount: 100
  })
})

// Set to 500 credits
const response = await fetch('/api/admin/users/credits', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user-uuid',
    action: 'set',
    amount: 500
  })
})

// Reset used credits
const response = await fetch('/api/admin/users/credits', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user-uuid',
    action: 'reset',
    amount: 0 // amount ignored for reset
  })
})
```

## User Interface

### User Creation Modal
- Clean, centered modal with form validation
- Real-time input validation
- Loading states during submission
- Toast notifications on success/error
- Automatically refreshes user list on success

### Credit Management Modal
- Shows current user information
- Displays current credit usage (e.g., "45 / 100 credits used")
- Dropdown for action selection
- Dynamic amount input (hidden for 'reset' action)
- Preview of what will happen before submission

## Security

### Admin-Only Access
All admin endpoints verify:
1. User is authenticated (via Supabase session)
2. User has `isAdmin: true` in database
3. Returns 401 Unauthorized if not logged in
4. Returns 403 Forbidden if not admin

**Example Security Check:**
```typescript
const userProfile = await prisma.user.findUnique({
  where: { id: user.id },
  select: { isAdmin: true }
})

if (!userProfile?.isAdmin) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

### Audit Logging
All credit changes are logged in the `CreditUsage` table:
```typescript
await prisma.creditUsage.create({
  data: {
    userId,
    amount: amount,
    type: 'manual_adjustment',
    description: `Admin ${action} credits: ${amount}`
  }
})
```

## Making Yourself Admin

To access the admin dashboard, you need to set your account as admin:

```sql
-- Make your account an admin
UPDATE "User"
SET "isAdmin" = true, "role" = 'superadmin'
WHERE "email" = 'your-email@example.com';
```

## Common Admin Tasks

### 1. Create Client Account
1. Go to `/admin`
2. Click "Create User" button
3. Fill in client details:
   - Email: client@example.com
   - Full Name: Client Name
   - Password: temporary123 (tell them to change it)
   - Monthly Credits: 100 (or package amount)
   - Tier: starter/pro/enterprise
4. Click "Create User"
5. Copy credentials and send to client

### 2. Add Credits to Existing User
1. Go to `/admin`
2. Find user in list (use search if needed)
3. Click Edit button on their row
4. Select "Add Credits"
5. Enter amount (e.g., 100)
6. Click "Update Credits"

### 3. Change Monthly Allocation
1. Go to `/admin`
2. Find user and click Edit
3. Select "Set Credits"
4. Enter new monthly amount (e.g., 500)
5. Click "Update Credits"

### 4. Reset Credits for New Month
1. Go to `/admin`
2. Find user and click Edit
3. Select "Reset Used Credits"
4. Click "Update Credits"
5. This sets creditsUsed back to 0

## Integration with Manual Billing Workflow

These features support the MVP manual billing approach:

### Workflow:
1. **Client pays you** via bank transfer, PayPal, etc.
2. **Create account** using admin dashboard (2 minutes)
3. **Assign credits** based on package purchased
4. **Send credentials** to client via email
5. **n8n automation** handles credit checking during job processing

### Package Examples:
- **Starter**: 100 credits/month = $49
- **Pro**: 500 credits/month = $199
- **Enterprise**: 2000 credits/month = $599

### Credit Allocation:
```typescript
// Starter package
{
  email: 'client@example.com',
  monthlyCredits: 100,
  subscriptionTier: 'starter'
}

// Pro package
{
  email: 'client@example.com',
  monthlyCredits: 500,
  subscriptionTier: 'pro'
}

// Enterprise package
{
  email: 'client@example.com',
  monthlyCredits: 2000,
  subscriptionTier: 'enterprise'
}
```

## Error Handling

### User Creation Errors
- Email already exists → Shows error toast
- Weak password (< 6 chars) → Browser validation prevents submission
- Supabase Auth error → Shows specific error message
- Database error → Generic error toast

### Credit Management Errors
- Invalid action → 400 Bad Request
- User not found → 404 Not Found
- Database error → 500 Internal Server Error
- All errors show user-friendly toast notifications

## Toast Notifications

Success messages:
- ✅ "User Created - {email} has been created successfully"
- ✅ "Credits Updated - Credits {action} successful"

Error messages:
- ❌ "Creation Failed - {error details}"
- ❌ "Update Failed - {error details}"

## Database Schema

### User Table Changes
```prisma
model User {
  // ... existing fields
  isAdmin    Boolean @default(false)
  role       String  @default("user")  // user, admin, superadmin

  @@index([isAdmin])
}
```

### Credit Usage Audit Log
```prisma
model CreditUsage {
  id          String   @id @default(uuid())
  userId      String
  jobId       String?
  amount      Int      // Credits consumed/added
  type        String   // "manual_adjustment", "upload", "re_edit", etc.
  description String?
  createdAt   DateTime @default(now())

  @@index([userId])
  @@index([type])
  @@index([createdAt])
}
```

## Testing Checklist

- [ ] Can create user with email and password
- [ ] User can log in with created credentials
- [ ] User appears in user list after creation
- [ ] Can add credits to user
- [ ] Can set credits to specific amount
- [ ] Can reset used credits
- [ ] Toast notifications show on success/error
- [ ] Non-admin users cannot access admin endpoints
- [ ] Credit changes are logged in CreditUsage table

## Future Enhancements

When you're ready to automate billing (15+ clients):

1. **Remove admin creation** - Users self-signup
2. **Add Paystack integration** - Automatic payment processing
3. **Auto credit allocation** - Credits assigned on payment
4. **Auto credit reset** - Monthly cron job to reset credits
5. **Email notifications** - Low credit warnings, billing reminders
6. **Subscription management** - Upgrade/downgrade flows

But for MVP: **Keep it manual and simple!** This approach lets you:
- Validate pricing before committing to payment infrastructure
- Build relationships with first 10-15 clients
- Get feedback on packaging before automating
- Launch TODAY instead of spending 2 weeks on billing

## Support

For questions or issues:
1. Check the [MVP_LAUNCH_CHECKLIST.md](MVP_LAUNCH_CHECKLIST.md)
2. Review [MANUAL_USER_SETUP.md](MANUAL_USER_SETUP.md)
3. Check build logs for errors
4. Verify database connection in Supabase
