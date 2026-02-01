"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import Stripe from "stripe";

// Product configuration (shared)
export const PRODUCTS = {
  single: {
    name: "Single Event",
    credits: 1,
    price: 4900, // cents
    description: "One event, all features included",
  },
  bundle_3: {
    name: "3-Event Bundle",
    credits: 3,
    price: 12900, // cents
    description: "Save $18 with a 3-event bundle",
  },
  annual: {
    name: "Annual Unlimited",
    credits: -1, // -1 = unlimited
    price: 24900, // cents
    description: "Unlimited events for one year",
  },
} as const;

export type ProductType = keyof typeof PRODUCTS;

// Initialize Stripe client
const getStripe = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(secretKey, {
    // @ts-expect-error - Stripe types may be ahead of package version
    apiVersion: "2025-01-27.acacia",
  });
};

// Create a checkout session
export const createCheckoutSession = action({
  args: {
    productType: v.string(),
    cancelUrl: v.optional(v.string()),
  },
  handler: async (ctx, { productType, cancelUrl }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const product = PRODUCTS[productType as ProductType];
    if (!product) {
      throw new Error(`Invalid product type: ${productType}`);
    }

    const stripe = getStripe();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Seatherder - ${product.name}`,
              description: product.description,
            },
            unit_amount: product.price,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${baseUrl}/#pricing`,
      metadata: {
        userId: identity.subject,
        productType,
      },
      allow_promotion_codes: true,
    });

    return { url: session.url, sessionId: session.id };
  },
});
