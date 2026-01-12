import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { Id } from "./_generated/dataModel"

// Get all guests for an event
export const getByEvent = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("guests")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect()
  },
})

// Get a guest by QR code ID (includes round assignments)
export const getByQrCodeId = query({
  args: { qrCodeId: v.string() },
  handler: async (ctx, args) => {
    const guest = await ctx.db
      .query("guests")
      .withIndex("by_qrCodeId", (q) => q.eq("qrCodeId", args.qrCodeId))
      .first()

    if (!guest) return null

    const event = await ctx.db.get(guest.eventId)

    // Get round assignments for this guest
    const roundAssignments = await ctx.db
      .query("guestRoundAssignments")
      .withIndex("by_guest", (q) => q.eq("guestId", guest._id))
      .collect()

    // Sort by round number
    roundAssignments.sort((a, b) => a.roundNumber - b.roundNumber)

    return { guest, event, roundAssignments }
  },
})

// Get round assignments for a specific guest
export const getRoundAssignments = query({
  args: { guestId: v.id("guests") },
  handler: async (ctx, args) => {
    const assignments = await ctx.db
      .query("guestRoundAssignments")
      .withIndex("by_guest", (q) => q.eq("guestId", args.guestId))
      .collect()

    return assignments.sort((a, b) => a.roundNumber - b.roundNumber)
  },
})

// Get all round assignments for an event (for admin view)
export const getAllRoundAssignmentsByEvent = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    // Get all round assignments for this event
    const assignments = await ctx.db
      .query("guestRoundAssignments")
      .withIndex("by_event_round", (q) => q.eq("eventId", args.eventId))
      .collect()

    // Group by guestId
    const byGuest: Record<string, typeof assignments> = {}
    for (const assignment of assignments) {
      const guestId = assignment.guestId
      if (!byGuest[guestId]) {
        byGuest[guestId] = []
      }
      byGuest[guestId].push(assignment)
    }

    // Sort each guest's assignments by round number
    for (const guestId of Object.keys(byGuest)) {
      byGuest[guestId].sort((a, b) => a.roundNumber - b.roundNumber)
    }

    return byGuest
  },
})

// Search guests by name across all events (includes round assignments)
export const searchByName = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    if (!args.query.trim()) return []

    const queryLower = args.query.toLowerCase()

    // Get all guests and filter by name
    const allGuests = await ctx.db.query("guests").collect()

    const matchingGuests = allGuests.filter(
      (guest) =>
        guest.name.toLowerCase().includes(queryLower) ||
        guest.department?.toLowerCase().includes(queryLower)
    )

    // Get event details and round assignments for each matching guest
    const results = await Promise.all(
      matchingGuests.map(async (guest) => {
        const event = await ctx.db.get(guest.eventId)

        // Get round assignments
        const roundAssignments = await ctx.db
          .query("guestRoundAssignments")
          .withIndex("by_guest", (q) => q.eq("guestId", guest._id))
          .collect()

        roundAssignments.sort((a, b) => a.roundNumber - b.roundNumber)

        return { guest, event, roundAssignments }
      })
    )

    // Filter out results where event is null and only include assigned guests
    return results.filter(
      (r) => r.event !== null && r.guest.tableNumber !== undefined
    )
  },
})

// Add a single guest
export const create = mutation({
  args: {
    eventId: v.id("events"),
    name: v.string(),
    department: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("guests", {
      eventId: args.eventId,
      name: args.name,
      department: args.department,
      email: args.email,
      phone: args.phone,
      checkedIn: false,
    })
  },
})

// Add multiple guests at once
export const createMany = mutation({
  args: {
    eventId: v.id("events"),
    guests: v.array(
      v.object({
        name: v.string(),
        department: v.optional(v.string()),
        email: v.optional(v.string()),
        phone: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const ids: Id<"guests">[] = []
    for (const guest of args.guests) {
      const id = await ctx.db.insert("guests", {
        eventId: args.eventId,
        name: guest.name,
        department: guest.department,
        email: guest.email,
        phone: guest.phone,
        checkedIn: false,
      })
      ids.push(id)
    }
    return ids
  },
})

// Remove a guest
export const remove = mutation({
  args: { id: v.id("guests") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id)
  },
})

// Remove all guests from an event
export const removeAllFromEvent = mutation({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const guests = await ctx.db
      .query("guests")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect()

    for (const guest of guests) {
      await ctx.db.delete(guest._id)
    }

    return guests.length
  },
})

// Check in a guest
export const checkIn = mutation({
  args: { id: v.id("guests") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { checkedIn: true })
  },
})

// Uncheck a guest (undo check-in)
export const uncheckIn = mutation({
  args: { id: v.id("guests") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { checkedIn: false })
  },
})
