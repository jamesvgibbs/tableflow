import { v } from "convex/values"
import { mutation, query, QueryCtx, MutationCtx } from "./_generated/server"

// =============================================================================
// Authentication Helpers
// =============================================================================

async function getAuthenticatedUserId(ctx: QueryCtx | MutationCtx): Promise<string | null> {
  const identity = await ctx.auth.getUserIdentity()
  return identity?.subject ?? null
}

// =============================================================================
// Helper Functions
// =============================================================================

// Normalize email for consistent comparison
function normalizeEmail(email: string): string {
  return email.toLowerCase().trim()
}

// Create a canonical pair key (alphabetically sorted) to avoid A-B and B-A duplicates
function getCanonicalPair(email1: string, email2: string): [string, string] {
  const normalized1 = normalizeEmail(email1)
  const normalized2 = normalizeEmail(email2)
  return normalized1 < normalized2
    ? [normalized1, normalized2]
    : [normalized2, normalized1]
}

// =============================================================================
// Queries
// =============================================================================

// Get seating history between two guests for the current organizer
export const getHistoryBetweenGuests = query({
  args: {
    guestEmail1: v.string(),
    guestEmail2: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx)
    if (!userId) return []

    const [email1, email2] = getCanonicalPair(args.guestEmail1, args.guestEmail2)

    const history = await ctx.db
      .query("seatingHistory")
      .withIndex("by_organizer_pair", (q) =>
        q.eq("organizerId", userId).eq("guestEmail", email1).eq("partnerEmail", email2)
      )
      .collect()

    return history
  },
})

// Get all past tablemates for a specific guest
export const getGuestHistory = query({
  args: {
    guestEmail: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx)
    if (!userId) return []

    const normalizedEmail = normalizeEmail(args.guestEmail)

    const history = await ctx.db
      .query("seatingHistory")
      .withIndex("by_organizer_guest", (q) =>
        q.eq("organizerId", userId).eq("guestEmail", normalizedEmail)
      )
      .collect()

    // If limit specified, return only most recent
    if (args.limit) {
      return history
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
        .slice(0, args.limit)
    }

    return history
  },
})

// Get seating history summary for an event (for debugging/display)
export const getEventHistorySummary = query({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx)
    if (!userId) return { totalPairs: 0, uniqueGuests: 0 }

    const history = await ctx.db
      .query("seatingHistory")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect()

    const uniqueGuests = new Set<string>()
    for (const record of history) {
      uniqueGuests.add(record.guestEmail)
      uniqueGuests.add(record.partnerEmail)
    }

    return {
      totalPairs: history.length,
      uniqueGuests: uniqueGuests.size,
    }
  },
})

// =============================================================================
// Mutations
// =============================================================================

// Record a single seating pair (internal use)
export const recordPair = mutation({
  args: {
    guestEmail1: v.string(),
    guestEmail2: v.string(),
    eventId: v.id("events"),
    roundNumber: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx)
    if (!userId) {
      throw new Error("Authentication required")
    }

    // Skip if either email is missing
    if (!args.guestEmail1 || !args.guestEmail2) {
      return null
    }

    // Skip self-pairs
    if (normalizeEmail(args.guestEmail1) === normalizeEmail(args.guestEmail2)) {
      return null
    }

    const [email1, email2] = getCanonicalPair(args.guestEmail1, args.guestEmail2)

    // Check if this exact pair for this event/round already exists
    const existing = await ctx.db
      .query("seatingHistory")
      .withIndex("by_organizer_pair", (q) =>
        q.eq("organizerId", userId).eq("guestEmail", email1).eq("partnerEmail", email2)
      )
      .filter((q) =>
        q.and(
          q.eq(q.field("eventId"), args.eventId),
          q.eq(q.field("roundNumber"), args.roundNumber)
        )
      )
      .first()

    if (existing) {
      // Already recorded
      return existing._id
    }

    // Record new pair
    return await ctx.db.insert("seatingHistory", {
      organizerId: userId,
      guestEmail: email1,
      partnerEmail: email2,
      eventId: args.eventId,
      roundNumber: args.roundNumber,
      timestamp: new Date().toISOString(),
    })
  },
})

// Record all tablemate pairs from table assignments
// This is the main function called when assignments are committed
export const recordTableAssignments = mutation({
  args: {
    eventId: v.id("events"),
    assignments: v.array(
      v.object({
        roundNumber: v.number(),
        tableNumber: v.number(),
        guests: v.array(
          v.object({
            email: v.optional(v.string()),
          })
        ),
      })
    ),
  },
  handler: async (ctx, args): Promise<{ recorded: number; skipped: number }> => {
    const userId = await getAuthenticatedUserId(ctx)
    if (!userId) {
      throw new Error("Authentication required")
    }

    let recorded = 0
    let skipped = 0

    for (const assignment of args.assignments) {
      // Get all guests with emails at this table
      const guestsWithEmails = assignment.guests.filter((g) => g.email)

      // Generate all pairs at this table
      for (let i = 0; i < guestsWithEmails.length; i++) {
        for (let j = i + 1; j < guestsWithEmails.length; j++) {
          const email1 = guestsWithEmails[i].email!
          const email2 = guestsWithEmails[j].email!

          const [canonical1, canonical2] = getCanonicalPair(email1, email2)

          // Check if already exists
          const existing = await ctx.db
            .query("seatingHistory")
            .withIndex("by_organizer_pair", (q) =>
              q
                .eq("organizerId", userId)
                .eq("guestEmail", canonical1)
                .eq("partnerEmail", canonical2)
            )
            .filter((q) =>
              q.and(
                q.eq(q.field("eventId"), args.eventId),
                q.eq(q.field("roundNumber"), assignment.roundNumber)
              )
            )
            .first()

          if (existing) {
            skipped++
            continue
          }

          await ctx.db.insert("seatingHistory", {
            organizerId: userId,
            guestEmail: canonical1,
            partnerEmail: canonical2,
            eventId: args.eventId,
            roundNumber: assignment.roundNumber,
            timestamp: new Date().toISOString(),
          })
          recorded++
        }
      }
    }

    return { recorded, skipped }
  },
})

// Clear seating history for a specific event (useful for re-running assignments)
export const clearEventHistory = mutation({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args): Promise<{ deleted: number }> => {
    const userId = await getAuthenticatedUserId(ctx)
    if (!userId) {
      throw new Error("Authentication required")
    }

    const history = await ctx.db
      .query("seatingHistory")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect()

    // Verify ownership through event
    if (history.length > 0) {
      const event = await ctx.db.get(args.eventId)
      if (event?.userId && event.userId !== userId) {
        throw new Error("Access denied")
      }
    }

    for (const record of history) {
      await ctx.db.delete(record._id)
    }

    return { deleted: history.length }
  },
})

// =============================================================================
// Utility Query for Matching Algorithm
// =============================================================================

// Get the number of times two guests have sat together (for use in scoring)
export const getPairSatTogetherCount = query({
  args: {
    guestEmail1: v.string(),
    guestEmail2: v.string(),
    excludeEventId: v.optional(v.id("events")), // Optionally exclude current event
    maxEvents: v.optional(v.number()), // How many past events to consider
  },
  handler: async (ctx, args): Promise<number> => {
    const userId = await getAuthenticatedUserId(ctx)
    if (!userId) return 0

    if (!args.guestEmail1 || !args.guestEmail2) return 0

    const [email1, email2] = getCanonicalPair(args.guestEmail1, args.guestEmail2)

    let history = await ctx.db
      .query("seatingHistory")
      .withIndex("by_organizer_pair", (q) =>
        q.eq("organizerId", userId).eq("guestEmail", email1).eq("partnerEmail", email2)
      )
      .collect()

    // Optionally exclude current event
    if (args.excludeEventId) {
      history = history.filter((h) => h.eventId !== args.excludeEventId)
    }

    // If maxEvents specified, get unique event IDs and filter
    if (args.maxEvents) {
      const eventIds = [...new Set(history.map((h) => h.eventId))]
      const recentEventIds = new Set(eventIds.slice(-args.maxEvents))
      history = history.filter((h) => recentEventIds.has(h.eventId))
    }

    // Count unique events (not rounds) they sat together
    const uniqueEvents = new Set(history.map((h) => h.eventId))
    return uniqueEvents.size
  },
})
