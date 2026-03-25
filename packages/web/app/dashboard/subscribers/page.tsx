import { SubscribersDashboardClient } from "./client-component";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserSubscriptionStatus } from "@/lib/subscription";

export default async function SubscribersDashboard() {
  if (process.env.ENABLE_USER_MANAGEMENT !== "true") {
    return (
      <div className="p-6 border border-stone-300 rounded-lg shadow-sm text-center text-xl bg-white">
        User management is disabled
      </div>
    );
  }
  
  // Server-side authentication check
  const { userId } = await auth();
  
  // If no user is logged in, redirect to login
  if (!userId) {
    redirect("/signin");
  }
  
  // Get user subscription status
  const subscription = await getUserSubscriptionStatus(userId);
  
  // Check if user has an active subscription
  if (!subscription.active) {
    return (
      <div className="p-6 border border-stone-300 rounded-lg shadow-sm text-center text-xl bg-white">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Subscription Required</h2>
        <p className="text-slate-600 mb-6">You need an active subscription to access API Keys.</p>
        <a href="/dashboard/pricing" className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-md">
          View Pricing
        </a>
      </div>
    );
  }
  
  return <SubscribersDashboardClient />;
}
