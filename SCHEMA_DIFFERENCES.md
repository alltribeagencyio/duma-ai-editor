# Database Schema Differences - Actual vs Expected

## Summary
The database schema was pulled successfully. Here are the key differences between what exists in Supabase vs what the app expects:

## Critical Issues Found

### 1. **User Table - Field Name Mismatches**

**Database Has:**
- `emailNotifications`
- `whatsappNotifications`

**App Expects:**
- `notificationsEmail`
- `notificationsWhatsApp`

**Impact:** Profile page will fail when trying to save notification settings.

---

### 2. **User Table - Missing Fields**

**Database Missing:**
- `isAdmin` - **CRITICAL** - Admin pages won't work
- `role` - **CRITICAL** - Role-based access control broken

**Extra fields in database (not in schema):**
- `industry` - Seems to be duplicate of `brandIndustry`
- `businessType` - Not used anywhere in codebase

---

### 3. **User Table - Type Mismatches**

**Database has these as NULLABLE (String?):**
- `subscriptionTier` - Should be NOT NULL with default "free"
- `subscriptionStatus` - Should be NOT NULL with default "active"
- `monthlyCredits` - Should be NOT NULL with default 0
- `practiceCredits` - Should be NOT NULL with default 0
- `creditsUsed` - Should be NOT NULL with default 0

**Impact:** Queries like `user.monthlyCredits` could be null, causing errors.

---

### 4. **Job Table - Missing Fields**

**Database Missing:**
- None - Job table looks correct!

---

### 5. **All Tables - Default Value Functions**

**Database Uses:**
```sql
@default(dbgenerated("(gen_random_uuid())::text"))
```

**Should Be:**
```sql
@default(uuid())
```

**Impact:** IDs are generated as text instead of proper UUIDs. Works but not optimal.

---

## Non-Critical Differences

### Timestamp Types
- Database uses `@db.Timestamptz(6)` (timezone-aware)
- Schema uses `DateTime` (timezone-naive)
- **Impact:** None - PostgreSQL handles this automatically

### Nullable Booleans
Most boolean fields in database are nullable (`Boolean?`) but have defaults.
This works fine but is not ideal.

---

## Fix Strategy

### Option 1: Fix Database to Match App (RECOMMENDED)
Run SQL to:
1. Rename `emailNotifications` → `notificationsEmail`
2. Rename `whatsappNotifications` → `notificationsWhatsApp`
3. Add `isAdmin` column (Boolean, default false)
4. Add `role` column (String, default 'user')
5. Remove unused `industry` and `businessType` columns
6. Make credit fields NOT NULL

**Pros:**
- App code works as-is
- Clean schema
- Type safety

**Cons:**
- Need to run SQL migration

### Option 2: Update App to Match Database
Change all code references:
- `notificationsEmail` → `emailNotifications`
- `notificationsWhatsApp` → `whatsappNotifications`

**Pros:**
- No SQL needed

**Cons:**
- Have to update ~20 files
- Still missing isAdmin/role columns
- Error-prone

---

## Recommended Action

**Use Option 1** - I'll create a SQL migration script to:
1. Fix column names
2. Add missing columns
3. Set proper NOT NULL constraints
4. Clean up unused columns
