import { v } from "convex/values"
import { query, mutation, QueryCtx, MutationCtx } from "./_generated/server"
import { DEFAULT_WEIGHTS } from "./matching"
import type { Id } from "./_generated/dataModel"

// =============================================================================
// Authentication Helpers
// =============================================================================

/**
 * Get the authenticated user's ID from Clerk.
 * Returns null if not authenticated.
 */
async function getAuthenticatedUserId(ctx: QueryCtx | MutationCtx): Promise<string | null> {
  const identity = await ctx.auth.getUserIdentity()
  return identity?.subject ?? null
}

/**
 * Verify the current user owns an event.
 * During migration, events without userId are accessible (backward compatibility).
 */
async function verifyEventOwnership(
  ctx: QueryCtx | MutationCtx,
  eventId: Id<"events">,
  userId: string | null
): Promise<void> {
  const event = await ctx.db.get(eventId)
  if (!event) {
    throw new Error("Event not found")
  }
  if (event.userId && event.userId !== userId) {
    throw new Error("Access denied: you do not own this event")
  }
}

/**
 * Validator for matching weights object
 */
const weightsValidator = v.object({
  departmentMix: v.number(),
  interestAffinity: v.number(),
  jobLevelDiversity: v.number(),
  goalCompatibility: v.number(),
  repeatAvoidance: v.number(),
})

/**
 * Valid seating types for the wizard
 */
const seatingTypeValidator = v.union(
  v.literal("wedding"),
  v.literal("corporate"),
  v.literal("networking"),
  v.literal("team"),
  v.literal("social"),
  v.literal("custom")
)

/**
 * Get matching config for an event (with ownership check)
 * Returns null if not configured (will use defaults)
 */
export const getByEvent = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx)
    await verifyEventOwnership(ctx, args.eventId, userId)

    const config = await ctx.db
      .query("matchingConfig")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .unique()

    return config
  },
})

/**
 * Get matching config with defaults filled in (with ownership check)
 * Always returns a complete config object
 */
export const getByEventWithDefaults = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx)
    await verifyEventOwnership(ctx, args.eventId, userId)

    const config = await ctx.db
      .query("matchingConfig")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .unique()

    if (config) {
      return {
        ...config,
        weights: {
          ...DEFAULT_WEIGHTS,
          ...config.weights,
        },
      }
    }

    // Return default config structure
    return {
      eventId: args.eventId,
      weights: DEFAULT_WEIGHTS,
      noveltyPreference: 0.5,
      interestOptions: null,
      goalOptions: null,
      updatedAt: new Date().toISOString(),
    }
  },
})

/**
 * Create or update matching config for an event (with ownership check)
 */
export const upsert = mutation({
  args: {
    eventId: v.id("events"),
    weights: weightsValidator,
    interestOptions: v.optional(v.array(v.string())),
    goalOptions: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx)
    await verifyEventOwnership(ctx, args.eventId, userId)

    // Look for existing config
    const existing = await ctx.db
      .query("matchingConfig")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .unique()

    const now = new Date().toISOString()

    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, {
        weights: args.weights,
        interestOptions: args.interestOptions,
        goalOptions: args.goalOptions,
        updatedAt: now,
      })
      return existing._id
    } else {
      // Create new
      return await ctx.db.insert("matchingConfig", {
        eventId: args.eventId,
        weights: args.weights,
        interestOptions: args.interestOptions,
        goalOptions: args.goalOptions,
        updatedAt: now,
      })
    }
  },
})

/**
 * Update just the weights for an event (with ownership check)
 */
export const updateWeights = mutation({
  args: {
    eventId: v.id("events"),
    weights: weightsValidator,
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx)
    await verifyEventOwnership(ctx, args.eventId, userId)

    // Look for existing config
    const existing = await ctx.db
      .query("matchingConfig")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .unique()

    const now = new Date().toISOString()

    if (existing) {
      await ctx.db.patch(existing._id, {
        weights: args.weights,
        updatedAt: now,
      })
      return existing._id
    } else {
      // Create new with just weights
      return await ctx.db.insert("matchingConfig", {
        eventId: args.eventId,
        weights: args.weights,
        updatedAt: now,
      })
    }
  },
})

/**
 * Update custom interest options for an event (with ownership check)
 */
export const updateInterestOptions = mutation({
  args: {
    eventId: v.id("events"),
    interestOptions: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx)
    await verifyEventOwnership(ctx, args.eventId, userId)

    const existing = await ctx.db
      .query("matchingConfig")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .unique()

    const now = new Date().toISOString()

    if (existing) {
      await ctx.db.patch(existing._id, {
        interestOptions: args.interestOptions,
        updatedAt: now,
      })
      return existing._id
    } else {
      // Create new with defaults and custom interests
      return await ctx.db.insert("matchingConfig", {
        eventId: args.eventId,
        weights: DEFAULT_WEIGHTS,
        interestOptions: args.interestOptions,
        updatedAt: now,
      })
    }
  },
})

/**
 * Update custom goal options for an event (with ownership check)
 */
export const updateGoalOptions = mutation({
  args: {
    eventId: v.id("events"),
    goalOptions: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx)
    await verifyEventOwnership(ctx, args.eventId, userId)

    const existing = await ctx.db
      .query("matchingConfig")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .unique()

    const now = new Date().toISOString()

    if (existing) {
      await ctx.db.patch(existing._id, {
        goalOptions: args.goalOptions,
        updatedAt: now,
      })
      return existing._id
    } else {
      // Create new with defaults and custom goals
      return await ctx.db.insert("matchingConfig", {
        eventId: args.eventId,
        weights: DEFAULT_WEIGHTS,
        goalOptions: args.goalOptions,
        updatedAt: now,
      })
    }
  },
})

/**
 * Delete matching config for an event (reset to defaults) (with ownership check)
 */
export const remove = mutation({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx)
    await verifyEventOwnership(ctx, args.eventId, userId)

    const existing = await ctx.db
      .query("matchingConfig")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .unique()

    if (existing) {
      await ctx.db.delete(existing._id)
    }
  },
})

/**
 * Apply a preset to an event's matching config (with ownership check)
 */
export const applyPreset = mutation({
  args: {
    eventId: v.id("events"),
    preset: v.union(
      v.literal("balanced"),
      v.literal("maxDiversity"),
      v.literal("groupSimilar"),
      v.literal("networkingOptimized")
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx)
    await verifyEventOwnership(ctx, args.eventId, userId)

    // Preset weights defined here to match frontend
    const presetWeights: Record<string, typeof DEFAULT_WEIGHTS> = {
      balanced: DEFAULT_WEIGHTS,
      maxDiversity: {
        departmentMix: 1.0,
        interestAffinity: -0.3,
        jobLevelDiversity: 1.0,
        goalCompatibility: 0.2,
        repeatAvoidance: 1.0,
      },
      groupSimilar: {
        departmentMix: 0.3,
        interestAffinity: 0.9,
        jobLevelDiversity: 0.2,
        goalCompatibility: 0.7,
        repeatAvoidance: 0.8,
      },
      networkingOptimized: {
        departmentMix: 0.7,
        interestAffinity: 0.5,
        jobLevelDiversity: 0.6,
        goalCompatibility: 0.9,
        repeatAvoidance: 0.95,
      },
    }

    const weights = presetWeights[args.preset]
    if (!weights) {
      throw new Error("Invalid preset")
    }

    const existing = await ctx.db
      .query("matchingConfig")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .unique()

    const now = new Date().toISOString()

    if (existing) {
      await ctx.db.patch(existing._id, {
        weights,
        updatedAt: now,
      })
      return existing._id
    } else {
      return await ctx.db.insert("matchingConfig", {
        eventId: args.eventId,
        weights,
        updatedAt: now,
      })
    }
  },
})

/**
 * Save seating wizard configuration (with ownership check)
 * This is the new approach - users answer questions, we derive weights
 */
export const saveSeatingConfig = mutation({
  args: {
    eventId: v.id("events"),
    seatingType: seatingTypeValidator,
    answers: v.record(v.string(), v.string()), // Question ID -> answer mapping
    weights: weightsValidator,
    numberOfRounds: v.optional(v.number()),
    vipTables: v.optional(v.array(v.number())),
    noveltyPreference: v.optional(v.number()), // 0-1 for cross-event history preference
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx)
    await verifyEventOwnership(ctx, args.eventId, userId)

    // Get event for additional operations
    const event = await ctx.db.get(args.eventId)
    if (!event) {
      throw new Error("Event not found")
    }

    // Look for existing config
    const existing = await ctx.db
      .query("matchingConfig")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .unique()

    const now = new Date().toISOString()

    // Update number of rounds on the event if specified
    if (args.numberOfRounds !== undefined && args.numberOfRounds !== event.numberOfRounds) {
      await ctx.db.patch(args.eventId, {
        numberOfRounds: args.numberOfRounds,
      })
    }

    if (existing) {
      // Update existing config
      await ctx.db.patch(existing._id, {
        seatingType: args.seatingType,
        answers: args.answers,
        weights: args.weights,
        vipTables: args.vipTables,
        noveltyPreference: args.noveltyPreference,
        updatedAt: now,
      })
      return existing._id
    } else {
      // Create new config
      return await ctx.db.insert("matchingConfig", {
        eventId: args.eventId,
        seatingType: args.seatingType,
        answers: args.answers,
        weights: args.weights,
        vipTables: args.vipTables,
        noveltyPreference: args.noveltyPreference,
        updatedAt: now,
      })
    }
  },
})

/**
 * Update novelty preference for cross-event history scoring (with ownership check)
 * Value should be 0-1 where:
 *   0 = ignore seating history from past events
 *   0.5 = balanced (default)
 *   1 = strongly prefer new connections (avoid past tablemates)
 */
export const updateNoveltyPreference = mutation({
  args: {
    eventId: v.id("events"),
    noveltyPreference: v.number(), // 0-1
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx)
    await verifyEventOwnership(ctx, args.eventId, userId)

    // Clamp to valid range
    const noveltyPreference = Math.max(0, Math.min(1, args.noveltyPreference))

    const existing = await ctx.db
      .query("matchingConfig")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .unique()

    const now = new Date().toISOString()

    if (existing) {
      await ctx.db.patch(existing._id, {
        noveltyPreference,
        updatedAt: now,
      })
      return existing._id
    } else {
      // Create new with just novelty preference and default weights
      return await ctx.db.insert("matchingConfig", {
        eventId: args.eventId,
        weights: DEFAULT_WEIGHTS,
        noveltyPreference,
        updatedAt: now,
      })
    }
  },
})

/**
 * Update VIP tables for an event (with ownership check)
 */
export const updateVipTables = mutation({
  args: {
    eventId: v.id("events"),
    vipTables: v.array(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx)
    await verifyEventOwnership(ctx, args.eventId, userId)

    const existing = await ctx.db
      .query("matchingConfig")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .unique()

    const now = new Date().toISOString()

    if (existing) {
      await ctx.db.patch(existing._id, {
        vipTables: args.vipTables,
        updatedAt: now,
      })
      return existing._id
    } else {
      // Create new with just VIP tables and default weights
      return await ctx.db.insert("matchingConfig", {
        eventId: args.eventId,
        weights: DEFAULT_WEIGHTS,
        vipTables: args.vipTables,
        updatedAt: now,
      })
    }
  },
})
