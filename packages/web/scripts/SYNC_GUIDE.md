# Subscription Sync Guide

## Problem Overview

Webhook failures can cause database records to be out of sync with Stripe. This affects:
- Subscription status (active users showing as inactive)
- Token limits (users having 0 tokens when they should have 5M)
- Billing cycles (users stuck with "subscription" instead of "monthly"/"yearly")

## Quick Fix

Run the sync script to fix out-of-sync users:

```bash
cd packages/web
pnpm sync-subscriptions
```

This will:
1. ✅ Sync all active subscription users from Stripe
2. ✅ Fix billing cycle inconsistencies
3. ✅ Update token limits and subscription metadata
4. ✅ Log all changes for review

## Common Issues Fixed

### Issue 1: Users with `billingCycle = "subscription"`

**Problem**: Initial checkout sets `billingCycle = metadata.type = "subscription"`, but subsequent webhook updates expect "monthly" or "yearly".

**Fix**: Script reads actual interval from Stripe and updates to correct value.

```
✓ Fixed user_123: 'subscription' → 'monthly'
✓ Fixed user_456: 'subscription' → 'yearly'
```

### Issue 2: Active users with 0 tokens

**Problem**: Webhook failed to update `maxTokenUsage` after payment.

**Fix**: Script sets `maxTokenUsage = 5000000` for all active subscribers.

```
✓ Synced user_789: active (monthly) - updated maxTokenUsage to 5000000
```

### Issue 3: Subscription status mismatch

**Problem**: User canceled in Stripe but still shows as active in DB, or vice versa.

**Fix**: Script syncs status from Stripe's authoritative data.

```
✓ Synced user_321: canceled (was: active)
```

## Script Modes

### 1. Full Sync (Recommended)
```bash
pnpm sync-subscriptions all
```
Syncs all data AND fixes billing cycles.

### 2. Sync Only
```bash
pnpm sync-subscriptions sync
```
Only syncs subscription data, doesn't fix billing cycles.

### 3. Fix Billing Cycles Only
```bash
pnpm sync-subscriptions fix-billing
```
Only fixes users with `billingCycle = "subscription"`.

## Verification

After running the sync, verify with SQL:

```sql
-- Check for remaining "subscription" billing cycles
SELECT COUNT(*) 
FROM user_usage 
WHERE billingCycle = 'subscription';
-- Should be 0

-- Check active users have correct token limits
SELECT userId, subscriptionStatus, maxTokenUsage 
FROM user_usage 
WHERE subscriptionStatus = 'active' 
  AND billingCycle IN ('monthly', 'yearly');
-- All should have maxTokenUsage = 5000000
```

## Prevention

To prevent future sync issues:

1. ✅ Monitor webhook delivery in Stripe dashboard
2. ✅ Set up webhook failure alerts
3. ✅ Use consistent billingCycle values across all webhooks
4. ✅ Run sync script periodically as maintenance
5. ✅ Fix the cron job scheduling bug (see separate issue)

## Related Issues

- **Cron Job Bug**: `.github/workflows/cron.yml` references undefined `needs.date.outputs.day`
- **Billing Cycle Inconsistency**: Different webhooks set different values for same subscription type
- **Token Reset Logic**: Monthly reset cron includes fallback for "subscription" billing cycle

See `ANALYSIS.md` for detailed technical analysis.
