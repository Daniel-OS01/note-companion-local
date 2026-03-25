# Subscription Sync Scripts

## sync-subscriptions.ts

This script syncs subscription data from Stripe to your database. Use it when webhook events have failed and user data is out of sync.

### What it fixes:

1. **Subscription Status Sync** - Updates user subscription status, payment status, and token limits from Stripe
2. **Billing Cycle Fix** - Corrects users with `billingCycle = "subscription"` to proper `"monthly"` or `"yearly"` values
3. **Token Limits** - Ensures active subscribers have correct 5M token limit
4. **Metadata** - Syncs product, plan, and other subscription metadata

### Usage:

```bash
# Run full sync (recommended)
pnpm sync-subscriptions

# Or with specific commands:
pnpm sync-subscriptions all          # Full sync + fix billing cycles
pnpm sync-subscriptions sync         # Only sync subscription data
pnpm sync-subscriptions fix-billing  # Only fix billing cycle inconsistencies
```

### What happens:

1. **Sync mode**: 
   - Finds all active subscription users in database
   - Looks up their subscription in Stripe (by userId in metadata)
   - Updates database with current Stripe data:
     - Status (active, trialing, canceled, etc.)
     - Billing cycle (monthly/yearly)
     - Token limits (5M for active, 0 for inactive)
     - Product/plan metadata
     - Last payment date

2. **Fix billing mode**:
   - Finds users with `billingCycle = "subscription"` 
   - Determines actual billing cycle from Stripe (monthly/yearly)
   - Updates database with correct value

### Output:

```
Starting subscription sync...

Found 150 subscription users to sync

✓ Synced user_123: active (monthly)
✓ Synced user_456: active (yearly)
⚠ No Stripe subscription found for user_789
✗ Error syncing user_999: API error

=== Sync Complete ===
✓ Synced: 145
⚠ Not found in Stripe: 3
✗ Errors: 2
Total: 150
```

### When to use:

- After webhook failures or downtime
- When users report incorrect subscription status
- After fixing billing cycle inconsistencies
- During database migrations
- When Stripe and database are out of sync

### Safety:

- Script is read-mostly (only updates existing users)
- Does not delete data
- Does not create new subscriptions
- Only updates users who have subscription billing cycles
- Logs all operations for review

### Requirements:

- `STRIPE_SECRET_KEY` environment variable
- Database connection configured
- Run from web package directory

---

## find-active-subscriptions.ts

This script provides a comprehensive audit of all Stripe subscriptions.

### What it shows:

1. **Total subscription count** - All subscriptions across all statuses
2. **Active subscriptions** - Detailed breakdown of active/trialing subscriptions
3. **Status breakdown** - Count of subscriptions by status (active, canceled, etc.)
4. **Subscription details** - For each active subscription:
   - Subscription ID
   - User ID (from metadata)
   - Status and billing interval (monthly/yearly)
   - Amount and currency
   - Creation date and period end
   - Customer ID
   - All metadata

5. **Revenue metrics**:
   - MRR (Monthly Recurring Revenue)
   - ARR (Annual Recurring Revenue)

6. **Metadata audit** - Which subscriptions have/don't have userId metadata
7. **Recently canceled** - Last 5 canceled subscriptions with reasons

### Usage:

```bash
pnpm find-active-subs
```

### Example output:

```
=== Finding All Active Subscriptions ===

Total subscriptions (all statuses): 45
Active/Trialing subscriptions: 12

=== Status Breakdown ===
  active: 12
  canceled: 30
  past_due: 2
  unpaid: 1

=== Active Subscriptions ===

1. Subscription ID: sub_1Abc123
   User ID: user_2xyz789
   Status: active
   Interval: month
   Amount: 15.00 USD
   Created: 2025-01-15
   Current Period Ends: 2025-11-15
   Customer: cus_ABC123

=== Active Subscriptions by Interval ===
  month: 8
  year: 4

=== Revenue ===
  MRR (Monthly Recurring Revenue): $163.33
  ARR (Annual Recurring Revenue): $1960.00

=== Metadata Status ===
  With userId metadata: 11
  Without userId metadata: 1

  ⚠️ Subscriptions without userId:
    - sub_1Def456 (customer: cus_DEF456)

=== Recently Canceled (last 5) ===

1. sub_1Ghi789
   User ID: user_2abc123
   Canceled: 2025-10-01
   Cancellation reason: cancellation_requested
```

### When to use:

- Before running sync scripts to see what exists in Stripe
- Monthly revenue reporting
- Auditing subscription metadata
- Finding subscriptions without proper userId tracking
- Investigating cancellation patterns
- Verifying MRR/ARR calculations

### Requirements:

- `STRIPE_SECRET_KEY` environment variable
- Stripe account access
