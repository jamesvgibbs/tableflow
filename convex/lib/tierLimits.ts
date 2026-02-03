import { QueryCtx, MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

/**
 * Free tier limits to control costs (email, storage).
 * Free events can still demonstrate core value (seating algorithm, QR check-in).
 */
export const FREE_LIMITS = {
  maxGuests: 50,
  allowEmailCampaigns: false,
  allowAttachments: false,
  maxRounds: 1,
} as const;

export type EventTier = "free" | "paid";

/**
 * Get the tier for an event based on whether it was created via free trial.
 */
export async function getEventTier(
  ctx: QueryCtx | MutationCtx,
  eventId: Id<"events">
): Promise<EventTier> {
  const event = await ctx.db.get(eventId);
  if (!event) {
    throw new Error("Event not found");
  }
  return event.isFreeEvent ? "free" : "paid";
}

/**
 * Check if a feature is allowed for an event's tier.
 */
export function canUseFeature(
  tier: EventTier,
  feature: keyof typeof FREE_LIMITS
): boolean {
  if (tier === "paid") return true;
  const limit = FREE_LIMITS[feature];
  // For boolean limits, return the value directly
  if (typeof limit === "boolean") return limit;
  // For numeric limits, return true (caller should check the actual count)
  return true;
}

/**
 * Get the limit value for a feature.
 */
export function getFeatureLimit<K extends keyof typeof FREE_LIMITS>(
  tier: EventTier,
  feature: K
): (typeof FREE_LIMITS)[K] | null {
  if (tier === "paid") return null; // No limit
  return FREE_LIMITS[feature];
}

/**
 * Error codes for free tier limit violations.
 */
export const TIER_LIMIT_ERRORS = {
  GUESTS: "FREE_LIMIT_GUESTS",
  EMAIL_CAMPAIGNS: "FREE_LIMIT_EMAIL_CAMPAIGNS",
  ATTACHMENTS: "FREE_LIMIT_ATTACHMENTS",
  ROUNDS: "FREE_LIMIT_ROUNDS",
} as const;
