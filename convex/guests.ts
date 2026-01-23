import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { api } from "./_generated/api"
import type { Id } from "./_generated/dataModel"

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

// Search guests by name (includes round assignments)
// When eventId is provided, scopes search to that event (recommended for security)
// When not provided, searches cross-event but limits results to prevent memory issues
export const searchByName = query({
  args: {
    query: v.string(),
    eventId: v.optional(v.id("events")), // Optional - cross-event search for check-in kiosk
  },
  handler: async (ctx, args) => {
    // TODO: Add proper authentication when moving to production
    if (!args.query.trim()) return []

    const queryLower = args.query.toLowerCase()

    // Get guests - scoped by event when provided (recommended), limited otherwise
    let allGuests
    const eventId = args.eventId
    if (eventId) {
      // Scoped search - uses index for efficiency and security
      allGuests = await ctx.db
        .query("guests")
        .withIndex("by_event", (q) => q.eq("eventId", eventId))
        .collect()
    } else {
      // Cross-event search for check-in kiosk - limit to prevent memory exhaustion
      // TODO: Require authentication for cross-event search when moving to production
      allGuests = await ctx.db.query("guests").take(1000)
    }

    // Filter matching guests and limit to assigned guests only
    const matchingGuests = allGuests.filter(
      (guest) =>
        guest.tableNumber !== undefined &&
        (guest.name.toLowerCase().includes(queryLower) ||
          guest.department?.toLowerCase().includes(queryLower))
    )

    // Batch fetch events to avoid N+1 queries
    const uniqueEventIds = [...new Set(matchingGuests.map((g) => g.eventId))]
    const events = await Promise.all(uniqueEventIds.map((id) => ctx.db.get(id)))
    const eventMap = new Map(
      events.filter((e): e is NonNullable<typeof e> => e !== null).map((e) => [e._id, e])
    )

    // Batch fetch all round assignments for matching guests
    const allAssignments = await Promise.all(
      matchingGuests.map((guest) =>
        ctx.db
          .query("guestRoundAssignments")
          .withIndex("by_guest", (q) => q.eq("guestId", guest._id))
          .collect()
      )
    )

    // Build results with pre-fetched data
    const results = matchingGuests.map((guest, index) => {
      const event = eventMap.get(guest.eventId)
      const roundAssignments = allAssignments[index].sort(
        (a, b) => a.roundNumber - b.roundNumber
      )
      return { guest, event: event || null, roundAssignments }
    })

    // Filter out results where event is null
    return results.filter((r) => r.event !== null)
  },
})

// Validator for matching attributes
const attributesValidator = v.optional(v.object({
  interests: v.optional(v.array(v.string())),
  jobLevel: v.optional(v.string()),
  goals: v.optional(v.array(v.string())),
  customTags: v.optional(v.array(v.string())),
}))

// Add a single guest
export const create = mutation({
  args: {
    eventId: v.id("events"),
    name: v.string(),
    department: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    dietary: v.optional(v.object({
      restrictions: v.array(v.string()),
      notes: v.optional(v.string()),
    })),
    attributes: attributesValidator,
    // Event-type specific fields
    familyName: v.optional(v.string()),
    side: v.optional(v.string()),
    company: v.optional(v.string()),
    team: v.optional(v.string()),
    managementLevel: v.optional(v.string()),
    isVip: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("guests", {
      eventId: args.eventId,
      name: args.name,
      department: args.department,
      email: args.email,
      phone: args.phone,
      dietary: args.dietary,
      attributes: args.attributes,
      familyName: args.familyName,
      side: args.side,
      company: args.company,
      team: args.team,
      managementLevel: args.managementLevel,
      isVip: args.isVip,
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
        dietary: v.optional(v.object({
          restrictions: v.array(v.string()),
          notes: v.optional(v.string()),
        })),
        attributes: v.optional(v.object({
          interests: v.optional(v.array(v.string())),
          jobLevel: v.optional(v.string()),
          goals: v.optional(v.array(v.string())),
          customTags: v.optional(v.array(v.string())),
        })),
        // Event-type specific fields
        familyName: v.optional(v.string()),
        side: v.optional(v.string()),
        company: v.optional(v.string()),
        team: v.optional(v.string()),
        managementLevel: v.optional(v.string()),
        isVip: v.optional(v.boolean()),
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
        dietary: guest.dietary,
        attributes: guest.attributes,
        familyName: guest.familyName,
        side: guest.side,
        company: guest.company,
        team: guest.team,
        managementLevel: guest.managementLevel,
        isVip: guest.isVip,
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
    const guest = await ctx.db.get(args.id)
    if (!guest) {
      throw new Error("Guest not found")
    }
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
    // Get guest to check if they have an email and aren't already checked in
    const guest = await ctx.db.get(args.id)
    if (!guest) {
      throw new Error("Guest not found")
    }

    // Update check-in status
    await ctx.db.patch(args.id, { checkedIn: true })

    // Enqueue confirmation email if guest has email and hasn't received one yet
    // The email queue handles rate limiting and retries automatically
    if (guest.email && !guest.confirmationSentAt && !guest.emailUnsubscribed) {
      await ctx.scheduler.runAfter(0, api.email.sendCheckInConfirmation, {
        guestId: args.id,
      })
    }
  },
})

// Uncheck a guest (undo check-in)
export const uncheckIn = mutation({
  args: { id: v.id("guests") },
  handler: async (ctx, args) => {
    // Clear both check-in status and confirmation email timestamp
    // so checking in again will trigger a new email
    await ctx.db.patch(args.id, {
      checkedIn: false,
      confirmationSentAt: undefined,
    })
  },
})

// Bulk check-in all guests for an event
export const bulkCheckIn = mutation({
  args: { eventId: v.id("events") },
  handler: async (ctx, args): Promise<{
    total: number
    checkedIn: number
    alreadyCheckedIn: number
    emailsQueued: number
  }> => {
    // TODO: Add proper authentication when moving to production (requires Clerk integration)
    // Verify event exists before proceeding
    const event = await ctx.db.get(args.eventId)
    if (!event) {
      throw new Error("Event not found")
    }

    // Get all guests for this event
    const guests = await ctx.db
      .query("guests")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect()

    let checkedInCount = 0
    let alreadyCheckedInCount = 0
    let emailsQueuedCount = 0

    // Collect guests to check in
    const guestsToCheckIn: typeof guests = []

    for (const guest of guests) {
      if (guest.checkedIn) {
        alreadyCheckedInCount++
        continue
      }
      guestsToCheckIn.push(guest)
    }

    // Batch update check-in status for all guests
    await Promise.all(
      guestsToCheckIn.map(guest => ctx.db.patch(guest._id, { checkedIn: true }))
    )
    checkedInCount = guestsToCheckIn.length

    // Enqueue confirmation emails for guests who need them
    // The email queue handles rate limiting automatically
    for (const guest of guestsToCheckIn) {
      if (guest.email && !guest.confirmationSentAt && !guest.emailUnsubscribed) {
        await ctx.scheduler.runAfter(0, api.email.sendCheckInConfirmation, {
          guestId: guest._id,
        })
        emailsQueuedCount++
      }
    }

    return {
      total: guests.length,
      checkedIn: checkedInCount,
      alreadyCheckedIn: alreadyCheckedInCount,
      emailsQueued: emailsQueuedCount,
    }
  },
})

// Update a guest's information
export const update = mutation({
  args: {
    id: v.id("guests"),
    name: v.optional(v.string()),
    department: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    dietary: v.optional(v.object({
      restrictions: v.array(v.string()),
      notes: v.optional(v.string()),
    })),
    attributes: v.optional(v.object({
      interests: v.optional(v.array(v.string())),
      jobLevel: v.optional(v.string()),
      goals: v.optional(v.array(v.string())),
      customTags: v.optional(v.array(v.string())),
    })),
    // Event-type specific fields
    familyName: v.optional(v.string()),
    side: v.optional(v.string()),
    company: v.optional(v.string()),
    team: v.optional(v.string()),
    managementLevel: v.optional(v.string()),
    isVip: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args
    // Filter out undefined values to avoid overwriting with undefined
    const filteredUpdates: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        filteredUpdates[key] = value
      }
    }
    if (Object.keys(filteredUpdates).length > 0) {
      await ctx.db.patch(id, filteredUpdates)
    }
    return await ctx.db.get(id)
  },
})
