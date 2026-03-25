import Stripe from "stripe";
import { db, UserUsageTable } from "../drizzle/schema";
import { eq, or, and } from "drizzle-orm";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

const MONTHLY_TOKEN_LIMIT = 5000 * 1000; // 5M tokens

function getBillingCycle(subscription: Stripe.Subscription): "monthly" | "yearly" {
  const interval = subscription.items.data[0]?.price?.recurring?.interval;
  return interval === 'year' ? 'yearly' : 'monthly';
}

async function getSubscriptionProduct(subscription: Stripe.Subscription): Promise<string> {
  const productId = subscription.items.data[0]?.price?.product as string;
  const product = await stripe.products.retrieve(productId);
  return product.metadata?.srm_product_key || 'default';
}

function getSubscriptionPlan(subscription: Stripe.Subscription): string {
  return subscription.items.data[0]?.price?.metadata?.srm_price_key || 'default';
}

async function syncUserSubscription(userId: string, subscription: Stripe.Subscription) {
  const billingCycle = getBillingCycle(subscription);
  const product = await getSubscriptionProduct(subscription);
  const plan = getSubscriptionPlan(subscription);

  const isActive = ['active', 'trialing'].includes(subscription.status);
  const subscriptionStatus = isActive ? 'active' : subscription.status;
  const paymentStatus = isActive ? 'paid' : subscription.status;

  await db
    .update(UserUsageTable)
    .set({
      subscriptionStatus,
      paymentStatus,
      billingCycle,
      maxTokenUsage: isActive ? MONTHLY_TOKEN_LIMIT : 0,
      currentProduct: product,
      currentPlan: plan,
      lastPayment: new Date(subscription.current_period_start * 1000),
      tier: isActive ? 'paid' : 'free',
      hasCatalystAccess: isActive,
    })
    .where(eq(UserUsageTable.userId, userId));

  console.log(`✓ Synced ${userId}: ${subscriptionStatus} (${billingCycle})`);
}

async function syncAllSubscriptions() {
  console.log("Starting subscription sync...\n");

  const users = await db
    .select()
    .from(UserUsageTable)
    .where(
      and(
        or(
          eq(UserUsageTable.billingCycle, "monthly"),
          eq(UserUsageTable.billingCycle, "yearly"),
          eq(UserUsageTable.billingCycle, "subscription")
        ),
        or(
          eq(UserUsageTable.subscriptionStatus, "active"),
          eq(UserUsageTable.subscriptionStatus, "trialing")
        )
      )
    );

  console.log(`Found ${users.length} subscription users to sync\n`);

  let synced = 0;
  let errors = 0;
  let notFound = 0;

  for (const user of users) {
    try {
      let userSubscription: Stripe.Subscription | undefined;

      for await (const subscription of stripe.subscriptions.list({ limit: 100 })) {
        if (subscription.metadata?.userId === user.userId) {
          userSubscription = subscription;
          break;
        }
      }

      if (userSubscription) {
        await syncUserSubscription(user.userId, userSubscription);
        synced++;
      } else {
        console.log(`⚠ No Stripe subscription found for user ${user.userId}`);
        notFound++;
      }
    } catch (error) {
      console.error(`✗ Error syncing ${user.userId}:`, error.message);
      errors++;
    }
  }

  console.log(`\n=== Sync Complete ===`);
  console.log(`✓ Synced: ${synced}`);
  console.log(`⚠ Not found in Stripe: ${notFound}`);
  console.log(`✗ Errors: ${errors}`);
  console.log(`Total: ${users.length}`);
}

async function fixBillingCycles() {
  console.log("\n=== Fixing billing cycles for 'subscription' users ===\n");

  const subscriptionUsers = await db
    .select()
    .from(UserUsageTable)
    .where(eq(UserUsageTable.billingCycle, "subscription"));

  console.log(`Found ${subscriptionUsers.length} users with billingCycle = 'subscription'\n`);

  let fixed = 0;
  let errors = 0;

  for (const user of subscriptionUsers) {
    try {
      let userSubscription: Stripe.Subscription | undefined;

      for await (const subscription of stripe.subscriptions.list({ limit: 100 })) {
        if (subscription.metadata?.userId === user.userId) {
          userSubscription = subscription;
          break;
        }
      }

      if (userSubscription) {
        const billingCycle = getBillingCycle(userSubscription);
        
        await db
          .update(UserUsageTable)
          .set({ billingCycle })
          .where(eq(UserUsageTable.userId, user.userId));

        console.log(`✓ Fixed ${user.userId}: 'subscription' → '${billingCycle}'`);
        fixed++;
      } else {
        console.log(`⚠ No Stripe subscription found for ${user.userId}`);
      }
    } catch (error) {
      console.error(`✗ Error fixing ${user.userId}:`, error.message);
      errors++;
    }
  }

  console.log(`\n=== Billing Cycle Fix Complete ===`);
  console.log(`✓ Fixed: ${fixed}`);
  console.log(`✗ Errors: ${errors}`);
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'all';

  try {
    switch (command) {
      case 'sync':
        await syncAllSubscriptions();
        break;
      case 'fix-billing':
        await fixBillingCycles();
        break;
      case 'all':
        await syncAllSubscriptions();
        await fixBillingCycles();
        break;
      default:
        console.log('Usage:');
        console.log('  npm run sync-subscriptions       # Run full sync + fix');
        console.log('  npm run sync-subscriptions sync  # Only sync subscriptions');
        console.log('  npm run sync-subscriptions fix-billing  # Only fix billing cycles');
        break;
    }
  } catch (error) {
    console.error("Script failed:", error);
    process.exit(1);
  }
}

main();
