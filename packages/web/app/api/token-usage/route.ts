import { NextResponse, NextRequest } from "next/server";
import { 
  db, 
  UserUsageTable, 
  checkIfUserNeedsUpgrade,
  checkTokenUsage,
  TierConfigTable
} from "@/drizzle/schema";
import { and, eq } from "drizzle-orm";
import { handleAuthorizationV2 } from "@/lib/handleAuthorization";

export async function GET(request: NextRequest) {
  try {
    // Authenticate the user
    const { userId } = await handleAuthorizationV2(request);

    // Get user's token usage
    const userUsage = await db
      .select({
        tokenUsage: UserUsageTable.tokenUsage,
        maxTokenUsage: UserUsageTable.maxTokenUsage,
        subscriptionStatus: UserUsageTable.subscriptionStatus,
        currentPlan: UserUsageTable.currentPlan,
        tier: UserUsageTable.tier,
        paymentStatus: UserUsageTable.paymentStatus,
      })
      .from(UserUsageTable)
      .where(and(eq(UserUsageTable.userId, userId)))
      .limit(1);

    // Get available tiers
    const tiers = await db
      .select()
      .from(TierConfigTable)
      .where(eq(TierConfigTable.isActive, true));

    // Check if user needs to upgrade
    const needsUpgrade = await checkIfUserNeedsUpgrade(userId);
    
    // Get token usage info
    const { remaining, usageError } = await checkTokenUsage(userId);

    if (!userUsage.length) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...userUsage[0],
      needsUpgrade,
      remainingTokens: remaining,
      usageError,
      percentUsed: Math.round((userUsage[0].tokenUsage / userUsage[0].maxTokenUsage) * 100),
      availableTiers: tiers
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "An error occurred";
    const errorStatus = error && typeof error === 'object' && 'status' in error 
      ? (error.status as number) 
      : 500;
      
    return NextResponse.json(
      { error: errorMessage },
      { status: errorStatus }
    );
  }
} 