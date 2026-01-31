import { v } from "convex/values"
import { query, QueryCtx } from "./_generated/server"
import { Id } from "./_generated/dataModel"

// =============================================================================
// Authentication Helpers
// =============================================================================

/**
 * Get the authenticated user's ID from Clerk.
 * Returns null if not authenticated.
 */
async function getAuthenticatedUserId(ctx: QueryCtx): Promise<string | null> {
  const identity = await ctx.auth.getUserIdentity()
  return identity?.subject ?? null
}

/**
 * Verify the current user owns an event.
 * During migration, events without userId are accessible (backward compatibility).
 */
async function verifyEventOwnership(
  ctx: QueryCtx,
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

// Get all tables for an event (with ownership check)
export const getByEvent = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx)
    await verifyEventOwnership(ctx, args.eventId, userId)

    const tables = await ctx.db
      .query("tables")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect()

    // Get guests for each table
    const tablesWithGuests = await Promise.all(
      tables.map(async (table) => {
        const guests = await ctx.db
          .query("guests")
          .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
          .filter((q) => q.eq(q.field("tableNumber"), table.tableNumber))
          .collect()

        return {
          ...table,
          guests,
        }
      })
    )

    // Sort by table number
    return tablesWithGuests.sort((a, b) => a.tableNumber - b.tableNumber)
  },
})

// Get a table by QR code ID (PUBLIC - used by QR scanner without auth)
export const getByQrCodeId = query({
  args: { qrCodeId: v.string() },
  handler: async (ctx, args) => {
    // NOTE: This is intentionally public for QR scanner functionality
    const table = await ctx.db
      .query("tables")
      .withIndex("by_qrCodeId", (q) => q.eq("qrCodeId", args.qrCodeId))
      .first()

    if (!table) return null

    const event = await ctx.db.get(table.eventId)
    if (!event) return null

    // Get guests at this table
    const guests = await ctx.db
      .query("guests")
      .withIndex("by_event", (q) => q.eq("eventId", table.eventId))
      .filter((q) => q.eq(q.field("tableNumber"), table.tableNumber))
      .collect()

    return {
      table: { ...table, guests },
      event,
    }
  },
})

// Get tables for an event filtered by round number (with ownership check)
export const getByEventAndRound = query({
  args: {
    eventId: v.id("events"),
    roundNumber: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx)
    await verifyEventOwnership(ctx, args.eventId, userId)

    const tables = await ctx.db
      .query("tables")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect()

    // Get round assignments for this event and round
    const roundAssignments = await ctx.db
      .query("guestRoundAssignments")
      .withIndex("by_event_round", (q) =>
        q.eq("eventId", args.eventId).eq("roundNumber", args.roundNumber)
      )
      .collect()

    // Build a map of tableNumber -> guestIds for this round
    const tableGuestMap = new Map<number, string[]>()
    for (const assignment of roundAssignments) {
      if (!tableGuestMap.has(assignment.tableNumber)) {
        tableGuestMap.set(assignment.tableNumber, [])
      }
      tableGuestMap.get(assignment.tableNumber)!.push(assignment.guestId)
    }

    // Get guest details for each table
    const tablesWithGuests = await Promise.all(
      tables.map(async (table) => {
        const guestIds = tableGuestMap.get(table.tableNumber) || []
        const guests = await Promise.all(
          guestIds.map(async (guestId) => {
            const guest = await ctx.db.get(guestId as Id<"guests">)
            return guest
          })
        )

        return {
          ...table,
          guests: guests.filter(Boolean),
        }
      })
    )

    return tablesWithGuests.sort((a, b) => a.tableNumber - b.tableNumber)
  },
})
