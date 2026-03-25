import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserSubscriptionStatus } from "@/lib/subscription";

export async function GET(req: NextRequest) {
  try {
    // Get the authenticated user ID
    const { userId } = await auth();
    
    // If no user is logged in, return unauthorized
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get the user's subscription status using the shared function
    const subscriptionStatus = await getUserSubscriptionStatus(userId);
    
    // Return the subscription data
    return NextResponse.json(subscriptionStatus);
    
  } catch (error) {
    console.error("Error fetching subscription status:", error);
    return NextResponse.json(
      { error: "Error fetching subscription status" },
      { status: 500 }
    );
  }
}
