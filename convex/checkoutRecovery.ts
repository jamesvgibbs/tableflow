import { v } from "convex/values";
import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { PRODUCTS, type ProductType } from "./stripe";

// =============================================================================
// Checkout Intent Tracking
// =============================================================================

/**
 * Record when a user starts checkout (called from createCheckoutSession action)
 */
export const recordCheckoutIntent = internalMutation({
  args: {
    userId: v.string(),
    email: v.string(),
    productType: v.string(),
    stripeSessionId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("checkoutIntents", {
      userId: args.userId,
      email: args.email,
      productType: args.productType,
      stripeSessionId: args.stripeSessionId,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

/**
 * Mark checkout as completed (called from webhook on checkout.session.completed)
 */
export const markCheckoutCompleted = internalMutation({
  args: {
    stripeSessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const intent = await ctx.db
      .query("checkoutIntents")
      .withIndex("by_stripe_session", (q) => q.eq("stripeSessionId", args.stripeSessionId))
      .first();

    if (intent) {
      await ctx.db.patch(intent._id, {
        status: "completed",
        convertedAt: Date.now(),
      });
    }
  },
});

/**
 * Mark checkout as expired (called from webhook on checkout.session.expired)
 */
export const markCheckoutExpired = internalMutation({
  args: {
    stripeSessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const intent = await ctx.db
      .query("checkoutIntents")
      .withIndex("by_stripe_session", (q) => q.eq("stripeSessionId", args.stripeSessionId))
      .first();

    if (intent && intent.status === "pending") {
      await ctx.db.patch(intent._id, {
        status: "expired",
      });
    }
  },
});

// =============================================================================
// Checkout Recovery (Abandoned Cart Emails)
// =============================================================================

/**
 * Get pending checkout intents that are ready for recovery email
 * (older than 2 hours, not yet sent a follow-up)
 */
export const getPendingRecoveryIntents = internalQuery({
  args: {},
  handler: async (ctx) => {
    const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;

    const intents = await ctx.db
      .query("checkoutIntents")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    // Filter to intents that are old enough and haven't received a follow-up
    return intents.filter(
      (intent) => intent.createdAt < twoHoursAgo && !intent.followUpSentAt
    );
  },
});

/**
 * Mark that we sent a follow-up email for this intent
 */
export const markFollowUpSent = internalMutation({
  args: {
    intentId: v.id("checkoutIntents"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.intentId, {
      followUpSentAt: Date.now(),
    });
  },
});

/**
 * Send a recovery email for an abandoned checkout
 */
export const sendRecoveryEmail = internalAction({
  args: {
    intentId: v.id("checkoutIntents"),
    email: v.string(),
    productType: v.string(),
  },
  handler: async (ctx, args): Promise<{ success: boolean; error?: string }> => {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
      return { success: false, error: "RESEND_API_KEY not configured" };
    }

    const product = PRODUCTS[args.productType as ProductType];
    const productName = product?.name || "Event Credits";
    const price = product ? `$${(product.price / 100).toFixed(0)}` : "$49";

    // Build checkout URL (they can start fresh)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://seatherder.com";
    const checkoutUrl = `${baseUrl}/admin#pricing`;

    const html = buildRecoveryEmailHtml(productName, price, checkoutUrl);

    try {
      const senderEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `Seatherder <${senderEmail}>`,
          to: args.email,
          subject: "I noticed you left",
          html,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("Failed to send recovery email:", result);
        return { success: false, error: result.message || "Failed to send" };
      }

      // Mark that we sent the follow-up
      await ctx.runMutation(internal.checkoutRecovery.markFollowUpSent, {
        intentId: args.intentId,
      });

      console.log(`Recovery email sent to ${args.email}`);
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("Recovery email error:", message);
      return { success: false, error: message };
    }
  },
});

/**
 * Process all pending abandoned checkouts and send recovery emails
 * This should be scheduled to run periodically (e.g., every hour)
 */
export const processAbandonedCheckouts = internalAction({
  args: {},
  handler: async (ctx): Promise<{ processed: number; sent: number; errors: number }> => {
    const intents = await ctx.runQuery(
      internal.checkoutRecovery.getPendingRecoveryIntents,
      {}
    );

    let sent = 0;
    let errors = 0;

    for (const intent of intents) {
      const result = await ctx.runAction(internal.checkoutRecovery.sendRecoveryEmail, {
        intentId: intent._id,
        email: intent.email,
        productType: intent.productType,
      });

      if (result.success) {
        sent++;
      } else {
        errors++;
      }
    }

    console.log(
      `Processed ${intents.length} abandoned checkouts: ${sent} sent, ${errors} errors`
    );

    return { processed: intents.length, sent, errors };
  },
});

// =============================================================================
// Email Template (Seatherder Voice)
// =============================================================================

function buildRecoveryEmailHtml(
  productName: string,
  price: string,
  checkoutUrl: string
): string {
  // Theme colors (default Seatherder purple)
  const primary = "#6700D9";
  const secondary = "#F0F1FF";
  const foreground = "#1A1A2E";
  const muted = "#6B7280";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #FAFAFA;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">

    <div style="background: white; border-radius: 16px; padding: 40px; border: 1px solid #E5E5E5;">

      <h1 style="margin: 0 0 24px; font-size: 28px; color: ${foreground}; font-weight: 600;">
        I noticed you left.
      </h1>

      <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: ${foreground};">
        You started checkout but did not finish. That is okay. Humans get distracted.
      </p>

      <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: ${foreground};">
        I would still like to seat your event.
      </p>

      <!-- What you get -->
      <div style="background: ${secondary}; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <p style="margin: 0 0 16px; font-size: 14px; color: ${foreground}; font-weight: 600;">
          Here is what I do:
        </p>
        <ul style="margin: 0; padding-left: 20px; color: ${foreground}; font-size: 15px; line-height: 1.8;">
          <li>Seat your guests in seconds</li>
          <li>Remember dietary restrictions</li>
          <li>Mix people from different departments</li>
          <li>Make sure everyone meets someone new</li>
        </ul>
      </div>

      <!-- Price callout -->
      <div style="text-align: center; margin-bottom: 32px;">
        <p style="margin: 0 0 8px; font-size: 14px; color: ${muted}; text-transform: uppercase; letter-spacing: 1px;">
          ${productName}
        </p>
        <p style="margin: 0; font-size: 48px; font-weight: 700; color: ${primary};">
          ${price}
        </p>
        <p style="margin: 8px 0 0; font-size: 14px; color: ${muted};">
          No subscription required.
        </p>
      </div>

      <!-- CTA Button -->
      <div style="text-align: center; margin-bottom: 32px;">
        <a href="${checkoutUrl}" style="display: inline-block; background: ${primary}; color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
          Get Started
        </a>
      </div>

      <!-- Soft close -->
      <p style="margin: 0; font-size: 14px; line-height: 1.6; color: ${muted};">
        If you changed your mind, that is okay. I will not email you again about this.
      </p>

    </div>

    <!-- Signature -->
    <div style="text-align: center; margin-top: 32px;">
      <p style="margin: 0 0 4px; font-size: 16px; color: ${foreground};">— Seatherder</p>
      <p style="margin: 0; font-size: 12px; color: ${muted}; font-style: italic;">
        (a good dog who seats events)
      </p>
    </div>

  </div>
</body>
</html>`;
}
