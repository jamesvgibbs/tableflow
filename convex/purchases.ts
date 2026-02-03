import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";

// Product configuration (must match stripe.ts)
const PRODUCTS = {
  single: { credits: 1 },
  bundle_3: { credits: 3 },
  annual: { credits: -1 },
  free_trial: { credits: 1 },
} as const;

type ProductType = keyof typeof PRODUCTS;

// Internal mutation to record a purchase (called from webhook)
export const recordPurchase = internalMutation({
  args: {
    userId: v.string(),
    productType: v.string(),
    stripeCheckoutSessionId: v.string(),
    stripeCustomerId: v.optional(v.string()),
    stripePaymentIntentId: v.optional(v.string()),
    amount: v.number(),
    currency: v.string(),
  },
  handler: async (ctx, args) => {
    const product = PRODUCTS[args.productType as ProductType];
    if (!product) {
      console.error(`Invalid product type: ${args.productType}`);
      return;
    }

    const now = new Date().toISOString();

    // Check if this purchase already exists (idempotency)
    const existing = await ctx.db
      .query("purchases")
      .withIndex("by_stripe_session", (q) =>
        q.eq("stripeCheckoutSessionId", args.stripeCheckoutSessionId)
      )
      .first();

    if (existing) {
      console.log("Purchase already recorded:", args.stripeCheckoutSessionId);
      return existing._id;
    }

    // Calculate expiration for annual plans
    let expiresAt: string | undefined;
    if (args.productType === "annual") {
      const expiry = new Date();
      expiry.setFullYear(expiry.getFullYear() + 1);
      expiresAt = expiry.toISOString();
    }

    const purchaseId = await ctx.db.insert("purchases", {
      userId: args.userId,
      stripeCustomerId: args.stripeCustomerId,
      stripeCheckoutSessionId: args.stripeCheckoutSessionId,
      stripePaymentIntentId: args.stripePaymentIntentId,
      productType: args.productType,
      eventCredits: product.credits,
      eventsUsed: 0,
      amount: args.amount,
      currency: args.currency,
      status: "active",
      expiresAt,
      createdAt: now,
      updatedAt: now,
    });

    console.log("Purchase recorded:", purchaseId);
    return purchaseId;
  },
});

// Get user's available credits
export const getCredits = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { credits: 0, hasUnlimited: false, freeEventUsed: false };
    }

    const userId = identity.subject;

    // Get all active purchases for this user
    const purchases = await ctx.db
      .query("purchases")
      .withIndex("by_status", (q) => q.eq("userId", userId).eq("status", "active"))
      .collect();

    // Check for unlimited (annual) subscription
    const hasUnlimited = purchases.some(
      (p) =>
        p.eventCredits === -1 &&
        (!p.expiresAt || new Date(p.expiresAt) > new Date())
    );

    if (hasUnlimited) {
      return { credits: -1, hasUnlimited: true, freeEventUsed: true };
    }

    // Sum up remaining credits
    const totalCredits = purchases.reduce((sum, p) => {
      const remaining = p.eventCredits - p.eventsUsed;
      return sum + Math.max(0, remaining);
    }, 0);

    // Check if user has used their free event
    const allPurchases = await ctx.db
      .query("purchases")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const freeEventUsed = allPurchases.some((p) => p.productType === "free_trial");

    return { credits: totalCredits, hasUnlimited: false, freeEventUsed };
  },
});

// Check if user can create an event
export const canCreateEvent = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { canCreate: false, reason: "not_authenticated" };
    }

    const userId = identity.subject;

    // Get user's purchases
    const purchases = await ctx.db
      .query("purchases")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Check for unlimited subscription
    const activePurchases = purchases.filter((p) => p.status === "active");
    const hasUnlimited = activePurchases.some(
      (p) =>
        p.eventCredits === -1 &&
        (!p.expiresAt || new Date(p.expiresAt) > new Date())
    );

    if (hasUnlimited) {
      return { canCreate: true, reason: "unlimited", creditsRemaining: -1 };
    }

    // Check remaining credits
    const totalCredits = activePurchases.reduce((sum, p) => {
      if (p.eventCredits === -1) return sum; // Skip unlimited in this count
      const remaining = p.eventCredits - p.eventsUsed;
      return sum + Math.max(0, remaining);
    }, 0);

    if (totalCredits > 0) {
      return { canCreate: true, reason: "credits", creditsRemaining: totalCredits };
    }

    return { canCreate: false, reason: "no_credits", creditsRemaining: 0 };
  },
});

// Record a free trial event
export const recordFreeTrial = internalMutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, { userId }) => {
    const now = new Date().toISOString();

    // Check if already used free trial
    const existingFreeTrial = await ctx.db
      .query("purchases")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("productType"), "free_trial"))
      .first();

    if (existingFreeTrial) {
      return existingFreeTrial._id;
    }

    // Create free trial record
    return await ctx.db.insert("purchases", {
      userId,
      stripeCheckoutSessionId: `free_trial_${userId}_${Date.now()}`,
      productType: "free_trial",
      eventCredits: 1,
      eventsUsed: 1, // Immediately mark as used
      amount: 0,
      currency: "usd",
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Use a credit when creating an event
export const useCredit = internalMutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, { userId }) => {
    // Find a purchase with available credits
    const activePurchases = await ctx.db
      .query("purchases")
      .withIndex("by_status", (q) => q.eq("userId", userId).eq("status", "active"))
      .collect();

    // First check for unlimited
    const unlimited = activePurchases.find(
      (p) =>
        p.eventCredits === -1 &&
        (!p.expiresAt || new Date(p.expiresAt) > new Date())
    );

    if (unlimited) {
      // No need to decrement for unlimited
      return { success: true, purchaseId: unlimited._id };
    }

    // Find purchase with remaining credits (oldest first)
    const purchaseWithCredits = activePurchases
      .filter((p) => p.eventCredits > 0 && p.eventsUsed < p.eventCredits)
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )[0];

    if (!purchaseWithCredits) {
      throw new Error("No credits available");
    }

    // Decrement credit
    await ctx.db.patch(purchaseWithCredits._id, {
      eventsUsed: purchaseWithCredits.eventsUsed + 1,
      updatedAt: new Date().toISOString(),
    });

    return { success: true, purchaseId: purchaseWithCredits._id };
  },
});

// Get user's purchase history
export const getPurchaseHistory = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const userId = identity.subject;

    return await ctx.db
      .query("purchases")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});
