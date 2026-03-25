import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

async function findActiveSubscriptions() {
  console.log("=== Finding All Active Subscriptions ===\n");

  const activeSubscriptions: Stripe.Subscription[] = [];
  const allSubscriptions: Stripe.Subscription[] = [];

  console.log("Fetching all subscriptions from Stripe...\n");

  for await (const subscription of stripe.subscriptions.list({ 
    limit: 100,
    status: 'all'
  })) {
    allSubscriptions.push(subscription);
    
    if (['active', 'trialing'].includes(subscription.status)) {
      activeSubscriptions.push(subscription);
    }
  }

  console.log(`Total subscriptions (all statuses): ${allSubscriptions.length}`);
  console.log(`Active/Trialing subscriptions: ${activeSubscriptions.length}\n`);

  if (allSubscriptions.length === 0) {
    console.log("No subscriptions found in Stripe.\n");
    return;
  }

  // Status breakdown
  const statusCounts: Record<string, number> = {};
  allSubscriptions.forEach(sub => {
    statusCounts[sub.status] = (statusCounts[sub.status] || 0) + 1;
  });

  console.log("=== Status Breakdown ===");
  Object.entries(statusCounts)
    .sort(([, a], [, b]) => b - a)
    .forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
  console.log();

  // Active subscriptions details
  if (activeSubscriptions.length > 0) {
    console.log("=== Active Subscriptions ===\n");

    activeSubscriptions.forEach((sub, index) => {
      const interval = sub.items.data[0]?.price?.recurring?.interval || 'unknown';
      const amount = sub.items.data[0]?.price?.unit_amount || 0;
      const currency = sub.items.data[0]?.price?.currency || 'usd';
      const productId = sub.items.data[0]?.price?.product;
      const userId = sub.metadata?.userId || 'NO_USER_ID';
      const created = new Date(sub.created * 1000).toISOString().split('T')[0];
      const currentPeriodEnd = new Date(sub.current_period_end * 1000).toISOString().split('T')[0];

      console.log(`${index + 1}. Subscription ID: ${sub.id}`);
      console.log(`   User ID: ${userId}`);
      console.log(`   Status: ${sub.status}`);
      console.log(`   Interval: ${interval}`);
      console.log(`   Amount: ${(amount / 100).toFixed(2)} ${currency.toUpperCase()}`);
      console.log(`   Created: ${created}`);
      console.log(`   Current Period Ends: ${currentPeriodEnd}`);
      console.log(`   Customer: ${sub.customer}`);
      
      if (sub.metadata && Object.keys(sub.metadata).length > 0) {
        console.log(`   Metadata:`, sub.metadata);
      }
      console.log();
    });

    // Group by interval
    const intervalCounts: Record<string, number> = {};
    activeSubscriptions.forEach(sub => {
      const interval = sub.items.data[0]?.price?.recurring?.interval || 'unknown';
      intervalCounts[interval] = (intervalCounts[interval] || 0) + 1;
    });

    console.log("=== Active Subscriptions by Interval ===");
    Object.entries(intervalCounts).forEach(([interval, count]) => {
      console.log(`  ${interval}: ${count}`);
    });
    console.log();

    // Calculate MRR/ARR
    let mrr = 0;
    let arr = 0;
    activeSubscriptions.forEach(sub => {
      const amount = sub.items.data[0]?.price?.unit_amount || 0;
      const interval = sub.items.data[0]?.price?.recurring?.interval;
      
      if (interval === 'month') {
        mrr += amount / 100;
      } else if (interval === 'year') {
        arr += amount / 100;
        mrr += (amount / 100) / 12;
      }
    });

    console.log("=== Revenue ===");
    console.log(`  MRR (Monthly Recurring Revenue): $${mrr.toFixed(2)}`);
    console.log(`  ARR (Annual Recurring Revenue): $${(mrr * 12).toFixed(2)}`);
    console.log();

    // Users with metadata
    const withMetadata = activeSubscriptions.filter(sub => sub.metadata?.userId);
    const withoutMetadata = activeSubscriptions.filter(sub => !sub.metadata?.userId);

    console.log("=== Metadata Status ===");
    console.log(`  With userId metadata: ${withMetadata.length}`);
    console.log(`  Without userId metadata: ${withoutMetadata.length}`);
    
    if (withoutMetadata.length > 0) {
      console.log(`\n  ⚠️ Subscriptions without userId:`);
      withoutMetadata.forEach(sub => {
        console.log(`    - ${sub.id} (customer: ${sub.customer})`);
      });
    }
  } else {
    console.log("No active subscriptions found.\n");
  }

  // Recently canceled
  const recentlyCanceled = allSubscriptions
    .filter(sub => sub.status === 'canceled')
    .sort((a, b) => (b.canceled_at || 0) - (a.canceled_at || 0))
    .slice(0, 5);

  if (recentlyCanceled.length > 0) {
    console.log("\n=== Recently Canceled (last 5) ===\n");
    recentlyCanceled.forEach((sub, index) => {
      const canceledDate = sub.canceled_at 
        ? new Date(sub.canceled_at * 1000).toISOString().split('T')[0]
        : 'unknown';
      const userId = sub.metadata?.userId || 'NO_USER_ID';
      
      console.log(`${index + 1}. ${sub.id}`);
      console.log(`   User ID: ${userId}`);
      console.log(`   Canceled: ${canceledDate}`);
      console.log(`   Cancellation reason: ${sub.cancellation_details?.reason || 'none'}`);
      console.log();
    });
  }
}

async function main() {
  try {
    await findActiveSubscriptions();
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
