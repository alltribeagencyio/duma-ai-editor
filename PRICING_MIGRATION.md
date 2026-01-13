# Pay-as-You-Go Credits System Migration Guide

This guide explains how to migrate from the old subscription-based credits system to the new pay-as-you-go credits system.

## Overview

The new system features:
- **Personal Plan**: $0.375 per image, minimum initial purchase $2, minimum top-up $1.50
- **Business Plan**: $0.35 per image (7% savings), minimum initial purchase $20, minimum top-up $10
- Dynamic pricing configuration via admin panel
- Proper credit allocation and deduction based on actual costs
- Transaction history tracking

## Migration Steps

### 1. Apply Database Migrations

```bash
# Generate Prisma migration
npx prisma migrate dev --name add_pay_as_you_go_credits

# Or apply existing migrations
npx prisma migrate deploy
```

### 2. Initialize Default Pricing Plans

```bash
# Run initialization script
npx ts-node scripts/init-pricing.ts

# Or using npm
npm run init-pricing
```

Add to `package.json` scripts:
```json
{
  "scripts": {
    "init-pricing": "ts-node scripts/init-pricing.ts"
  }
}
```

### 3. Environment Variables

Ensure these are set in your `.env` file:

```env
# Paystack (for payments)
PAYSTACK_SECRET_KEY=your_paystack_secret_key

# App URL (for payment callbacks)
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### 4. Migrate Existing Users (Optional)

If you want to migrate existing users' credits to the new system:

```typescript
// Example migration script
import { prisma } from './lib/prisma'

async function migrateUserCredits() {
  const users = await prisma.user.findMany({
    where: { monthlyCredits: { gt: 0 } }
  })

  for (const user of users) {
    const availableCredits = user.monthlyCredits - user.creditsUsed

    if (availableCredits > 0) {
      // Convert old credits to USD balance
      // Assuming old system: 1 credit = 1 image
      // Personal plan rate: $0.375 per image
      const creditBalanceUSD = availableCredits * 0.375

      await prisma.user.update({
        where: { id: user.id },
        data: {
          creditBalance: creditBalanceUSD,
          pricingPlan: 'personal',
          hasCompletedInitialPurchase: true
        }
      })

      // Create transaction record
      await prisma.creditTransaction.create({
        data: {
          userId: user.id,
          type: 'bonus',
          amount: creditBalanceUSD,
          creditsAdded: creditBalanceUSD,
          balanceBefore: 0,
          balanceAfter: creditBalanceUSD,
          pricingPlan: 'personal',
          ratePerImage: 0.375,
          description: 'Migration bonus from old credit system'
        }
      })
    }
  }
}
```

## Database Schema Changes

### New Fields in User Model

- `pricingPlan`: 'personal' | 'business' (default: 'personal')
- `creditBalance`: Float - Current available credits in USD
- `hasCompletedInitialPurchase`: Boolean - Tracks first purchase

### New Models

1. **PricingConfig**: Stores pricing plans configuration
   - Admins can update rates via `/api/admin/pricing`
   - Plans: personal, business

2. **CreditTransaction**: Tracks all credit movements
   - Types: purchase, deduction, refund, bonus
   - Links to payments and jobs

### Updated Models

**Payment**: Added credit-related fields
- `amountUSD`: Amount in USD
- `pricingPlan`: Plan used for purchase
- `creditsAllocated`: Credits given from payment

## API Endpoints

### User Endpoints

```typescript
// Get credit balance
GET /api/credits/balance
Response: {
  creditBalance: number,
  pricingPlan: string,
  ratePerImage: number,
  imagesAvailable: number,
  totalImagesProcessed: number
}

// Get pricing plans
GET /api/pricing/plans
Response: { plans: PricingConfig[] }

// Purchase credits
POST /api/credits/purchase
Body: { amountUSD: number, pricingPlan: 'personal' | 'business' }
Response: { paymentUrl: string, reference: string, creditsToReceive: number }

// Verify payment
GET /api/credits/verify?reference=xxx
Response: { success: true, creditsAdded: number, newBalance: number }

// Get transaction history
GET /api/credits/transactions?limit=50&offset=0&type=purchase
Response: { transactions: CreditTransaction[], total: number }
```

### Admin Endpoints

```typescript
// Get all pricing configs
GET /api/admin/pricing

// Update pricing config
POST /api/admin/pricing
Body: {
  plan: 'personal' | 'business',
  displayName: string,
  ratePerImage: number,
  minimumInitialPurchase: number,
  minimumTopUp: number,
  description?: string,
  features?: string[],
  isActive?: boolean
}

// Get specific plan
GET /api/admin/pricing/[plan]

// Deactivate plan
DELETE /api/admin/pricing/[plan]
```

## How Credit Deduction Works

1. **Job Creation**: System checks if user has sufficient credits
   ```typescript
   const hasSufficient = await pricingService.checkSufficientCredits(userId, numberOfImages)
   ```

2. **Job Completion**: Webhook callback deducts credits
   ```typescript
   const result = await pricingService.deductCredits(userId, numberOfImages, jobId)
   ```

3. **Transaction Logging**: Every deduction creates a `CreditTransaction` record

## Admin Rate Management

Admins can update pricing at any time:

1. Login as admin
2. Navigate to admin panel > Pricing Management
3. Update rates for Personal or Business plans
4. Changes apply immediately to new purchases
5. Existing credit balances remain unchanged

## Payment Flow

1. User selects plan and amount
2. System validates against minimum purchase rules
3. Creates payment record with `status: 'pending'`
4. Redirects to Paystack payment page
5. User completes payment
6. Paystack webhook fires `charge.success`
7. System allocates credits to user
8. Creates transaction record

## Testing

### Test Credit Purchase

```bash
# 1. Get pricing plans
curl http://localhost:3000/api/pricing/plans

# 2. Initialize purchase
curl -X POST http://localhost:3000/api/credits/purchase \
  -H "Content-Type: application/json" \
  -d '{"amountUSD": 2.0, "pricingPlan": "personal"}'

# 3. Complete payment via Paystack (use test card)

# 4. Verify payment
curl http://localhost:3000/api/credits/verify?reference=credit_xxx_123456789
```

### Test Image Processing

```bash
# Check if job creation checks credits properly
# Submit a job and verify:
# 1. System checks credit balance before creating job
# 2. Job completes successfully
# 3. Credits are deducted based on number of output images
# 4. Transaction is logged in CreditTransaction table
```

## Monitoring

Monitor these key metrics:

```sql
-- Total credits purchased today
SELECT SUM(amount) FROM "CreditTransaction"
WHERE type = 'purchase'
AND "createdAt" >= CURRENT_DATE;

-- Total credits deducted today
SELECT SUM(amount) FROM "CreditTransaction"
WHERE type = 'deduction'
AND "createdAt" >= CURRENT_DATE;

-- Users by pricing plan
SELECT "pricingPlan", COUNT(*)
FROM "User"
GROUP BY "pricingPlan";

-- Average purchase amount
SELECT AVG(amount) FROM "CreditTransaction"
WHERE type = 'purchase';
```

## Troubleshooting

### Issue: Credits not allocated after payment

**Solution**: Check Paystack webhook logs and Payment table
```sql
SELECT * FROM "Payment" WHERE "paystackReference" = 'credit_xxx';
```

### Issue: Insufficient credits error but user has balance

**Solution**: Check user's pricing plan and rate
```typescript
const creditInfo = await pricingService.getUserCreditInfo(userId)
console.log(creditInfo)
```

### Issue: Want to give user bonus credits

**Solution**: Create a bonus transaction
```typescript
await prisma.creditTransaction.create({
  data: {
    userId: 'user_id',
    type: 'bonus',
    amount: 10.0,
    creditsAdded: 10.0,
    balanceBefore: currentBalance,
    balanceAfter: currentBalance + 10.0,
    description: 'Promotional bonus'
  }
})

await prisma.user.update({
  where: { id: 'user_id' },
  data: { creditBalance: { increment: 10.0 } }
})
```

## Rollback Plan

If you need to rollback:

1. Revert database migrations:
   ```bash
   npx prisma migrate resolve --rolled-back <migration_name>
   ```

2. Restore previous API endpoints

3. Update environment to point to old system

**Note**: Rollback will lose transaction history created after migration.
