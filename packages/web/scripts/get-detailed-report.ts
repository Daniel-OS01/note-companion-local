import Stripe from "stripe";
import { db, UserUsageTable } from "../drizzle/schema";
import { eq, or, sql } from "drizzle-orm";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

async function getDetailedReport() {
  console.log("=== COMPREHENSIVE STRIPE & DATABASE REPORT ===\n");
  console.log(`Generated: ${new Date().toISOString()}\n`);

  // Stripe Account Info
  const account = await stripe.accounts.retrieve();
  console.log("=== STRIPE ACCOUNT ===");
  console.log(`Account ID: ${account.id}`);
  console.log(`Type: ${account.type}`);
  console.log(`Charges Enabled: ${account.charges_enabled}`);
  console.log(`Email: ${account.email || 'not set'}\n`);

  // Customers
  const customers = await stripe.customers.list({ limit: 100 });
  console.log("=== CUSTOMERS ===");
  console.log(`Total customers (first 100): ${customers.data.length}`);
  console.log(`Has more: ${customers.has_more}\n`);

  // Payment Intents
  const paymentIntents = await stripe.paymentIntents.list({ limit: 100 });
  const successfulPayments = paymentIntents.data.filter(pi => pi.status === 'succeeded');
  const totalRevenue = successfulPayments.reduce((sum, pi) => sum + (pi.amount || 0), 0) / 100;
  
  console.log("=== PAYMENT INTENTS ===");
  console.log(`Total payment intents (first 100): ${paymentIntents.data.length}`);
  console.log(`Successful payments: ${successfulPayments.length}`);
  console.log(`Total revenue from successful payments: $${totalRevenue.toFixed(2)}`);
  
  const paymentStatuses: Record<string, number> = {};
  paymentIntents.data.forEach(pi => {
    paymentStatuses[pi.status] = (paymentStatuses[pi.status] || 0) + 1;
  });
  console.log("\nPayment status breakdown:");
  Object.entries(paymentStatuses).forEach(([status, count]) => {
    console.log(`  ${status}: ${count}`);
  });
  console.log();

  // Products
  const products = await stripe.products.list({ limit: 100 });
  console.log("=== PRODUCTS ===");
  console.log(`Total products: ${products.data.length}\n`);
  products.data.forEach(product => {
    console.log(`- ${product.name} (${product.id})`);
    console.log(`  Active: ${product.active}`);
    if (product.metadata && Object.keys(product.metadata).length > 0) {
      console.log(`  Metadata:`, product.metadata);
    }
  });
  console.log();

  // Prices
  const prices = await stripe.prices.list({ limit: 100 });
  console.log("=== PRICES ===");
  console.log(`Total prices: ${prices.data.length}\n`);
  
  const activePrices = prices.data.filter(p => p.active);
  console.log(`Active prices: ${activePrices.length}\n`);
  
  activePrices.forEach(price => {
    const amount = (price.unit_amount || 0) / 100;
    const interval = price.recurring?.interval || 'one-time';
    console.log(`- ${price.id}`);
    console.log(`  Amount: $${amount} ${price.currency.toUpperCase()}`);
    console.log(`  Type: ${interval}`);
    console.log(`  Product: ${price.product}`);
    if (price.metadata && Object.keys(price.metadata).length > 0) {
      console.log(`  Metadata:`, price.metadata);
    }
    console.log();
  });

  // Subscriptions
  const allSubs: Stripe.Subscription[] = [];
  for await (const sub of stripe.subscriptions.list({ limit: 100, status: 'all' })) {
    allSubs.push(sub);
  }

  console.log("=== SUBSCRIPTIONS ===");
  console.log(`Total subscriptions: ${allSubs.length}`);
  
  const subStatuses: Record<string, number> = {};
  allSubs.forEach(sub => {
    subStatuses[sub.status] = (subStatuses[sub.status] || 0) + 1;
  });
  
  if (Object.keys(subStatuses).length > 0) {
    console.log("\nSubscription status breakdown:");
    Object.entries(subStatuses).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
  }
  console.log();

  // Database Stats
  console.log("=== DATABASE STATISTICS ===\n");
  
  const totalUsers = await db.select({ count: sql<number>`count(*)` }).from(UserUsageTable);
  console.log(`Total users: ${totalUsers[0].count}\n`);

  const billingCycles = await db
    .select({
      billingCycle: UserUsageTable.billingCycle,
      count: sql<number>`count(*)`,
    })
    .from(UserUsageTable)
    .groupBy(UserUsageTable.billingCycle)
    .orderBy(sql`count(*) DESC`);

  console.log("Billing cycle distribution:");
  billingCycles.forEach(({ billingCycle, count }) => {
    console.log(`  ${billingCycle || '(empty)'}: ${count}`);
  });
  console.log();

  const statuses = await db
    .select({
      status: UserUsageTable.subscriptionStatus,
      count: sql<number>`count(*)`,
    })
    .from(UserUsageTable)
    .groupBy(UserUsageTable.subscriptionStatus)
    .orderBy(sql`count(*) DESC`);

  console.log("Subscription status distribution:");
  statuses.forEach(({ status, count }) => {
    console.log(`  ${status}: ${count}`);
  });
  console.log();

  const tiers = await db
    .select({
      tier: UserUsageTable.tier,
      count: sql<number>`count(*)`,
    })
    .from(UserUsageTable)
    .groupBy(UserUsageTable.tier)
    .orderBy(sql`count(*) DESC`);

  console.log("Tier distribution:");
  tiers.forEach(({ tier, count }) => {
    console.log(`  ${tier}: ${count}`);
  });
  console.log();

  const activeUsers = await db
    .select({ count: sql<number>`count(*)` })
    .from(UserUsageTable)
    .where(eq(UserUsageTable.subscriptionStatus, 'active'));

  console.log(`Active users: ${activeUsers[0].count}`);

  const usersWithTokens = await db
    .select({ count: sql<number>`count(*)` })
    .from(UserUsageTable)
    .where(sql`${UserUsageTable.maxTokenUsage} > 0`);

  console.log(`Users with token limits > 0: ${usersWithTokens[0].count}`);

  const totalTokensAllocated = await db
    .select({ total: sql<number>`sum(${UserUsageTable.maxTokenUsage})` })
    .from(UserUsageTable);

  console.log(`Total tokens allocated: ${(totalTokensAllocated[0].total || 0).toLocaleString()}\n`);

  // Active users breakdown
  const activeByBilling = await db
    .select({
      billingCycle: UserUsageTable.billingCycle,
      count: sql<number>`count(*)`,
      totalTokens: sql<number>`sum(${UserUsageTable.maxTokenUsage})`,
    })
    .from(UserUsageTable)
    .where(eq(UserUsageTable.subscriptionStatus, 'active'))
    .groupBy(UserUsageTable.billingCycle)
    .orderBy(sql`count(*) DESC`);

  console.log("Active users by billing cycle:");
  activeByBilling.forEach(({ billingCycle, count, totalTokens }) => {
    console.log(`  ${billingCycle || '(empty)'}: ${count} users, ${(totalTokens || 0).toLocaleString()} tokens`);
  });
  console.log();

  // Data quality issues
  console.log("=== DATA QUALITY CHECKS ===\n");

  const noUserId = await db
    .select({ count: sql<number>`count(*)` })
    .from(UserUsageTable)
    .where(sql`${UserUsageTable.userId} IS NULL OR ${UserUsageTable.userId} = ''`);

  console.log(`Users without userId: ${noUserId[0].count}`);

  const activeNoTokens = await db
    .select({ count: sql<number>`count(*)` })
    .from(UserUsageTable)
    .where(
      sql`${UserUsageTable.subscriptionStatus} = 'active' 
          AND ${UserUsageTable.billingCycle} IN ('monthly', 'yearly', 'subscription')
          AND ${UserUsageTable.maxTokenUsage} = 0`
    );

  console.log(`Active subscription users with 0 tokens: ${activeNoTokens[0].count}`);

  const recurringActive = await db
    .select({ count: sql<number>`count(*)` })
    .from(UserUsageTable)
    .where(
      sql`${UserUsageTable.billingCycle} IN ('monthly', 'yearly', 'subscription')
          AND ${UserUsageTable.subscriptionStatus} = 'active'`
    );

  console.log(`Active recurring subscription users in DB: ${recurringActive[0].count}`);
  console.log(`Active subscriptions in Stripe: ${allSubs.filter(s => ['active', 'trialing'].includes(s.status)).length}`);
  
  if (recurringActive[0].count > 0 && allSubs.length === 0) {
    console.log(`\n⚠️  WARNING: ${recurringActive[0].count} users marked as active recurring in DB but 0 subscriptions in Stripe!`);
  }

  console.log("\n=== REPORT COMPLETE ===\n");
}

getDetailedReport().catch(console.error);
