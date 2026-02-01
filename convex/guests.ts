import { v } from "convex/values"
import { mutation, query, QueryCtx, MutationCtx } from "./_generated/server"
import { api, internal } from "./_generated/api"
import type { Id } from "./_generated/dataModel"
import { getEventTier, FREE_LIMITS, TIER_LIMIT_ERRORS } from "./lib/tierLimits"

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
 * Verify the current user owns the event that a guest belongs to.
 */
async function verifyGuestOwnership(
  ctx: QueryCtx | MutationCtx,
  guestId: Id<"guests">,
  userId: string | null
): Promise<void> {
  const guest = await ctx.db.get(guestId)
  if (!guest) {
    throw new Error("Guest not found")
  }
  await verifyEventOwnership(ctx, guest.eventId, userId)
}

// =============================================================================
// Self-Service Token Helpers
// =============================================================================

/**
 * Generate a URL-safe self-service token (24 characters, alphanumeric).
 * Uses crypto-safe random bytes for security.
 */
function generateSelfServiceToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''
  for (let i = 0; i < 24; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token
}

/**
 * Generate a unique token by checking against existing tokens.
 * Retry up to 10 times if collision detected (extremely unlikely).
 */
async function generateUniqueSelfServiceToken(ctx: MutationCtx): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const token = generateSelfServiceToken()
    const existing = await ctx.db
      .query("guests")
      .withIndex("by_selfServiceToken", (q) => q.eq("selfServiceToken", token))
      .first()
    if (!existing) {
      return token
    }
  }
  throw new Error("Failed to generate unique token after 10 attempts")
}

// Get all guests for an event (with ownership check)
export const getByEvent = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx)
    await verifyEventOwnership(ctx, args.eventId, userId)

    return await ctx.db
      .query("guests")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect()
  },
})

// Get a guest by QR code ID (PUBLIC - used by QR scanner without auth)
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

// Get round assignments for a specific guest (with ownership check)
export const getRoundAssignments = query({
  args: { guestId: v.id("guests") },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx)
    await verifyGuestOwnership(ctx, args.guestId, userId)

    const assignments = await ctx.db
      .query("guestRoundAssignments")
      .withIndex("by_guest", (q) => q.eq("guestId", args.guestId))
      .collect()

    return assignments.sort((a, b) => a.roundNumber - b.roundNumber)
  },
})

// Get all round assignments for an event (with ownership check, for admin view)
export const getAllRoundAssignmentsByEvent = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx)
    await verifyEventOwnership(ctx, args.eventId, userId)

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

// Search guests by name (PUBLIC - used by check-in kiosk without auth)
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

// Add a single guest (with ownership check)
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
    const userId = await getAuthenticatedUserId(ctx)
    await verifyEventOwnership(ctx, args.eventId, userId)

    // Check free tier guest limit
    const tier = await getEventTier(ctx, args.eventId)
    if (tier === "free") {
      const existingGuests = await ctx.db
        .query("guests")
        .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
        .collect()
      if (existingGuests.length >= FREE_LIMITS.maxGuests) {
        throw new Error(TIER_LIMIT_ERRORS.GUESTS)
      }
    }

    // Generate unique self-service token
    const selfServiceToken = await generateUniqueSelfServiceToken(ctx)

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
      selfServiceToken,
      rsvpStatus: "pending",
    })
  },
})

// Add multiple guests at once (with ownership check)
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
    const userId = await getAuthenticatedUserId(ctx)
    await verifyEventOwnership(ctx, args.eventId, userId)

    // Check free tier guest limit
    const tier = await getEventTier(ctx, args.eventId)
    if (tier === "free") {
      const existingGuests = await ctx.db
        .query("guests")
        .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
        .collect()
      const totalAfterAdd = existingGuests.length + args.guests.length
      if (totalAfterAdd > FREE_LIMITS.maxGuests) {
        throw new Error(TIER_LIMIT_ERRORS.GUESTS)
      }
    }

    const ids: Id<"guests">[] = []
    for (const guest of args.guests) {
      // Generate unique self-service token for each guest
      const selfServiceToken = await generateUniqueSelfServiceToken(ctx)

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
        selfServiceToken,
        rsvpStatus: "pending",
      })
      ids.push(id)
    }
    return ids
  },
})

// Remove a guest (with ownership check)
export const remove = mutation({
  args: { id: v.id("guests") },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx)
    await verifyGuestOwnership(ctx, args.id, userId)

    await ctx.db.delete(args.id)
  },
})

// Remove all guests from an event (with ownership check)
export const removeAllFromEvent = mutation({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx)
    await verifyEventOwnership(ctx, args.eventId, userId)

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

// Check in a guest (PUBLIC - used by check-in kiosk without auth)
export const checkIn = mutation({
  args: { id: v.id("guests") },
  handler: async (ctx, args) => {
    // NOTE: This is intentionally public for check-in kiosk functionality
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

// Uncheck a guest (undo check-in, with ownership check)
export const uncheckIn = mutation({
  args: { id: v.id("guests") },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx)
    await verifyGuestOwnership(ctx, args.id, userId)

    // Clear both check-in status and confirmation email timestamp
    // so checking in again will trigger a new email
    await ctx.db.patch(args.id, {
      checkedIn: false,
      confirmationSentAt: undefined,
    })
  },
})

// Bulk check-in all guests for an event (with ownership check)
export const bulkCheckIn = mutation({
  args: { eventId: v.id("events") },
  handler: async (ctx, args): Promise<{
    total: number
    checkedIn: number
    alreadyCheckedIn: number
    emailsQueued: number
  }> => {
    const userId = await getAuthenticatedUserId(ctx)
    await verifyEventOwnership(ctx, args.eventId, userId)

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

// Bulk check-in selected guests (with ownership check)
export const bulkCheckInSelected = mutation({
  args: {
    guestIds: v.array(v.id("guests")),
  },
  handler: async (ctx, args): Promise<{
    total: number
    checkedIn: number
    alreadyCheckedIn: number
    emailsQueued: number
  }> => {
    if (args.guestIds.length === 0) {
      return { total: 0, checkedIn: 0, alreadyCheckedIn: 0, emailsQueued: 0 }
    }

    // Get the first guest to determine event and verify ownership
    const firstGuest = await ctx.db.get(args.guestIds[0])
    if (!firstGuest) {
      throw new Error("Guest not found")
    }

    const userId = await getAuthenticatedUserId(ctx)
    await verifyEventOwnership(ctx, firstGuest.eventId, userId)

    let checkedInCount = 0
    let alreadyCheckedInCount = 0
    let emailsQueuedCount = 0

    // Process each guest
    for (const guestId of args.guestIds) {
      const guest = await ctx.db.get(guestId)
      if (!guest) continue

      // Verify guest belongs to same event
      if (guest.eventId !== firstGuest.eventId) {
        throw new Error("All guests must belong to the same event")
      }

      if (guest.checkedIn) {
        alreadyCheckedInCount++
        continue
      }

      // Check in the guest
      await ctx.db.patch(guestId, { checkedIn: true })
      checkedInCount++

      // Queue confirmation email
      if (guest.email && !guest.confirmationSentAt && !guest.emailUnsubscribed) {
        await ctx.scheduler.runAfter(0, api.email.sendCheckInConfirmation, {
          guestId,
        })
        emailsQueuedCount++
      }
    }

    return {
      total: args.guestIds.length,
      checkedIn: checkedInCount,
      alreadyCheckedIn: alreadyCheckedInCount,
      emailsQueued: emailsQueuedCount,
    }
  },
})

// Bulk undo check-in for selected guests (with ownership check)
export const bulkUncheckIn = mutation({
  args: {
    guestIds: v.array(v.id("guests")),
  },
  handler: async (ctx, args): Promise<{
    total: number
    uncheckedIn: number
    alreadyUnchecked: number
  }> => {
    if (args.guestIds.length === 0) {
      return { total: 0, uncheckedIn: 0, alreadyUnchecked: 0 }
    }

    // Get the first guest to determine event and verify ownership
    const firstGuest = await ctx.db.get(args.guestIds[0])
    if (!firstGuest) {
      throw new Error("Guest not found")
    }

    const userId = await getAuthenticatedUserId(ctx)
    await verifyEventOwnership(ctx, firstGuest.eventId, userId)

    let uncheckedInCount = 0
    let alreadyUncheckedCount = 0

    // Process each guest
    for (const guestId of args.guestIds) {
      const guest = await ctx.db.get(guestId)
      if (!guest) continue

      // Verify guest belongs to same event
      if (guest.eventId !== firstGuest.eventId) {
        throw new Error("All guests must belong to the same event")
      }

      if (!guest.checkedIn) {
        alreadyUncheckedCount++
        continue
      }

      // Undo check-in
      await ctx.db.patch(guestId, { checkedIn: false })
      uncheckedInCount++
    }

    return {
      total: args.guestIds.length,
      uncheckedIn: uncheckedInCount,
      alreadyUnchecked: alreadyUncheckedCount,
    }
  },
})

// Update a guest's information (with ownership check)
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
    const userId = await getAuthenticatedUserId(ctx)
    await verifyGuestOwnership(ctx, args.id, userId)

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

// =============================================================================
// Self-Service Token Management
// =============================================================================

// Generate a self-service token for an existing guest (with ownership check)
export const generateToken = mutation({
  args: { guestId: v.id("guests") },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx)
    await verifyGuestOwnership(ctx, args.guestId, userId)

    const guest = await ctx.db.get(args.guestId)
    if (!guest) {
      throw new Error("Guest not found")
    }

    // Generate new token even if one exists (regeneration)
    const selfServiceToken = await generateUniqueSelfServiceToken(ctx)
    await ctx.db.patch(args.guestId, { selfServiceToken })

    return { token: selfServiceToken }
  },
})

// Bulk generate tokens for all guests in an event (with ownership check)
export const generateTokensForEvent = mutation({
  args: { eventId: v.id("events") },
  handler: async (ctx, args): Promise<{
    total: number
    generated: number
    skipped: number
  }> => {
    const userId = await getAuthenticatedUserId(ctx)
    await verifyEventOwnership(ctx, args.eventId, userId)

    const guests = await ctx.db
      .query("guests")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect()

    let generated = 0
    let skipped = 0

    for (const guest of guests) {
      // Only generate if guest doesn't have a token yet
      if (!guest.selfServiceToken) {
        const selfServiceToken = await generateUniqueSelfServiceToken(ctx)
        await ctx.db.patch(guest._id, { selfServiceToken })
        generated++
      } else {
        skipped++
      }
    }

    return {
      total: guests.length,
      generated,
      skipped,
    }
  },
})

// Get a guest by their self-service token (PUBLIC - no auth required)
export const getBySelfServiceToken = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    // NOTE: This is intentionally public for guest self-service portal
    const guest = await ctx.db
      .query("guests")
      .withIndex("by_selfServiceToken", (q) => q.eq("selfServiceToken", args.token))
      .first()

    if (!guest) return null

    const event = await ctx.db.get(guest.eventId)
    if (!event) return null

    return {
      guest: {
        _id: guest._id,
        name: guest.name,
        email: guest.email,
        phone: guest.phone,
        dietary: guest.dietary,
        rsvpStatus: guest.rsvpStatus,
        tableNumber: guest.tableNumber,
        checkedIn: guest.checkedIn,
      },
      event: {
        _id: event._id,
        name: event.name,
        selfServiceDeadline: event.selfServiceDeadline,
      },
    }
  },
})

// Update guest info via self-service portal (PUBLIC - uses token for auth)
export const selfServiceUpdate = mutation({
  args: {
    token: v.string(),
    phone: v.optional(v.string()),
    dietary: v.optional(v.object({
      restrictions: v.array(v.string()),
      notes: v.optional(v.string()),
    })),
    rsvpStatus: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // NOTE: This is public but requires valid token
    const guest = await ctx.db
      .query("guests")
      .withIndex("by_selfServiceToken", (q) => q.eq("selfServiceToken", args.token))
      .first()

    if (!guest) {
      throw new Error("Invalid token")
    }

    // Check deadline
    const event = await ctx.db.get(guest.eventId)
    if (event?.selfServiceDeadline) {
      const deadline = new Date(event.selfServiceDeadline)
      if (new Date() > deadline) {
        throw new Error("The deadline for changes has passed")
      }
    }

    // Validate RSVP status if provided
    if (args.rsvpStatus && !["confirmed", "declined", "pending"].includes(args.rsvpStatus)) {
      throw new Error("Invalid RSVP status")
    }

    // Track what changed for notification
    const changedFields: string[] = []

    // Build update object
    const updates: Record<string, unknown> = {
      lastSelfServiceUpdate: new Date().toISOString(),
    }

    if (args.phone !== undefined && args.phone !== guest.phone) {
      updates.phone = args.phone
      changedFields.push(args.phone ? "Phone number updated" : "Phone number removed")
    }
    if (args.dietary !== undefined) {
      const oldRestrictions = guest.dietary?.restrictions || []
      const newRestrictions = args.dietary.restrictions || []
      const oldNotes = guest.dietary?.notes || ""
      const newNotes = args.dietary.notes || ""

      if (JSON.stringify(oldRestrictions.sort()) !== JSON.stringify(newRestrictions.sort())) {
        changedFields.push(`Dietary restrictions: ${newRestrictions.length > 0 ? newRestrictions.join(", ") : "None"}`)
      }
      if (oldNotes !== newNotes) {
        changedFields.push(newNotes ? "Dietary notes updated" : "Dietary notes removed")
      }
      updates.dietary = args.dietary
    }
    if (args.rsvpStatus !== undefined && args.rsvpStatus !== guest.rsvpStatus) {
      updates.rsvpStatus = args.rsvpStatus
      const statusLabels: Record<string, string> = {
        confirmed: "Attending",
        declined: "Not attending",
        pending: "Undecided",
      }
      changedFields.push(`RSVP: ${statusLabels[args.rsvpStatus] || args.rsvpStatus}`)
    }

    await ctx.db.patch(guest._id, updates)

    // Trigger notification if there were actual changes
    if (changedFields.length > 0 && event) {
      await ctx.scheduler.runAfter(0, internal.email.triggerGuestChangeNotification, {
        guestId: guest._id,
        eventId: event._id,
        changedFields,
      })
    }

    return { success: true }
  },
})

// =============================================================================
// Guest Status Management (present/no-show/late)
// =============================================================================

// Bulk update status for selected guests (with ownership check)
export const bulkUpdateStatus = mutation({
  args: {
    guestIds: v.array(v.id("guests")),
    status: v.union(
      v.literal("present"),
      v.literal("no-show"),
      v.literal("late"),
      v.null()  // null clears the status
    ),
  },
  handler: async (ctx, args): Promise<{
    total: number
    updated: number
  }> => {
    if (args.guestIds.length === 0) {
      return { total: 0, updated: 0 }
    }

    // Get the first guest to determine event and verify ownership
    const firstGuest = await ctx.db.get(args.guestIds[0])
    if (!firstGuest) {
      throw new Error("Guest not found")
    }

    const userId = await getAuthenticatedUserId(ctx)
    await verifyEventOwnership(ctx, firstGuest.eventId, userId)

    let updatedCount = 0

    // Process each guest
    for (const guestId of args.guestIds) {
      const guest = await ctx.db.get(guestId)
      if (!guest) continue

      // Verify guest belongs to same event
      if (guest.eventId !== firstGuest.eventId) {
        throw new Error("All guests must belong to the same event")
      }

      // Update status (null clears it by setting to undefined)
      await ctx.db.patch(guestId, {
        status: args.status === null ? undefined : args.status,
      })
      updatedCount++
    }

    return {
      total: args.guestIds.length,
      updated: updatedCount,
    }
  },
})

// =============================================================================
// Sample Data (Demo Guests)
// =============================================================================

// Sample data configuration
const SAMPLE_FIRST_NAMES = [
  'Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Quinn', 'Avery',
  'Skyler', 'Dakota', 'Cameron', 'Reese', 'Finley', 'Emerson', 'Parker', 'Sage',
  'Blake', 'Jamie', 'Drew', 'Hayden', 'Rowan', 'Phoenix', 'River', 'Charlie',
  'Addison', 'Bailey', 'Ellis', 'Kendall', 'Sydney', 'Peyton'
]

const SAMPLE_LAST_NAMES = [
  'Chen', 'Williams', 'Patel', 'Garcia', 'Kim', 'Johnson', 'Brown', 'Singh',
  'Anderson', 'Martinez', 'Thompson', 'Lee', 'Wilson', 'Moore', 'Taylor', 'Thomas',
  'Jackson', 'White', 'Harris', 'Clark', 'Lewis', 'Robinson', 'Walker', 'Hall',
  'Young', 'Allen', 'King', 'Wright', 'Scott', 'Green'
]

const SAMPLE_DEPARTMENTS = [
  'Engineering', 'Design', 'Marketing', 'Sales', 'Product', 'Operations',
  'HR', 'Finance', 'Legal', 'Customer Success'
]

const SAMPLE_INTERESTS = [
  'AI/ML', 'Web Development', 'Mobile Apps', 'Cloud Infrastructure', 'DevOps',
  'UX Design', 'Data Science', 'Cybersecurity', 'Blockchain', 'Gaming',
  'Photography', 'Travel', 'Cooking', 'Fitness', 'Music', 'Reading'
]

const SAMPLE_GOALS = [
  'Learn new skills', 'Meet industry peers', 'Find mentors', 'Explore new roles',
  'Build network', 'Share knowledge', 'Discover opportunities', 'Collaborate on projects'
]

const SAMPLE_JOB_LEVELS = ['junior', 'mid', 'senior', 'lead', 'manager', 'director', 'executive']

const SAMPLE_DIETARY_RESTRICTIONS = ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free', 'halal', 'kosher']

function samplePickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function samplePickRandomMultiple<T>(arr: T[], min: number, max: number): T[] {
  const count = min + Math.floor(Math.random() * (max - min + 1))
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(count, arr.length))
}

function generateSampleEmail(firstName: string, lastName: string): string {
  const domains = ['example.com', 'demo.test', 'sample.org']
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${samplePickRandom(domains)}`
}

// Add sample/demo guests to an event (with ownership check)
export const addSampleGuests = mutation({
  args: {
    eventId: v.id("events"),
    count: v.optional(v.number()), // Default 24
  },
  handler: async (ctx, args): Promise<{
    added: number
  }> => {
    const userId = await getAuthenticatedUserId(ctx)
    await verifyEventOwnership(ctx, args.eventId, userId)

    const count = args.count ?? 24
    const usedEmails = new Set<string>()
    const usedNames = new Set<string>()
    const departmentCounts = new Map<string, number>()

    // Initialize department counts
    SAMPLE_DEPARTMENTS.forEach(d => departmentCounts.set(d, 0))

    const guests: Array<{
      name: string
      email: string
      phone: string | undefined
      department: string
      dietary: { restrictions: string[]; notes: string | undefined }
      attributes: {
        interests: string[]
        jobLevel: string
        goals: string[]
        customTags: string[]
      }
    }> = []

    // Generate unique guests
    let attempts = 0
    while (guests.length < count && attempts < count * 3) {
      attempts++

      const firstName = samplePickRandom(SAMPLE_FIRST_NAMES)
      const lastName = samplePickRandom(SAMPLE_LAST_NAMES)
      const name = `${firstName} ${lastName}`
      const email = generateSampleEmail(firstName, lastName)

      // Ensure uniqueness
      if (usedEmails.has(email) || usedNames.has(name)) {
        continue
      }

      // Balance department distribution
      let department = samplePickRandom(SAMPLE_DEPARTMENTS)
      const deptCount = departmentCounts.get(department) || 0
      const maxPerDept = Math.ceil(count / SAMPLE_DEPARTMENTS.length) + 1

      if (deptCount >= maxPerDept) {
        const availableDept = SAMPLE_DEPARTMENTS.find(d =>
          (departmentCounts.get(d) || 0) < maxPerDept
        )
        if (availableDept) department = availableDept
      }

      // ~20% have dietary restrictions
      const hasDietary = Math.random() < 0.2
      const restrictions = hasDietary
        ? samplePickRandomMultiple(SAMPLE_DIETARY_RESTRICTIONS, 1, 2)
        : []

      // ~70% have phone numbers
      const phone = Math.random() < 0.7
        ? `(${200 + Math.floor(Math.random() * 800)}) ${200 + Math.floor(Math.random() * 800)}-${1000 + Math.floor(Math.random() * 9000)}`
        : undefined

      usedEmails.add(email)
      usedNames.add(name)
      departmentCounts.set(department, (departmentCounts.get(department) || 0) + 1)

      guests.push({
        name,
        email,
        phone,
        department,
        dietary: {
          restrictions,
          notes: hasDietary && Math.random() < 0.3 ? 'Please contact for details' : undefined,
        },
        attributes: {
          interests: samplePickRandomMultiple(SAMPLE_INTERESTS, 1, 4),
          jobLevel: samplePickRandom(SAMPLE_JOB_LEVELS),
          goals: samplePickRandomMultiple(SAMPLE_GOALS, 1, 3),
          customTags: ['demo'], // Mark as demo data
        },
      })
    }

    // Insert all guests
    for (const guest of guests) {
      const selfServiceToken = await generateUniqueSelfServiceToken(ctx)
      await ctx.db.insert("guests", {
        eventId: args.eventId,
        name: guest.name,
        email: guest.email,
        phone: guest.phone,
        department: guest.department,
        dietary: guest.dietary,
        attributes: guest.attributes,
        checkedIn: false,
        selfServiceToken,
        rsvpStatus: "pending",
      })
    }

    return { added: guests.length }
  },
})

// Remove all demo guests from an event (with ownership check)
export const removeSampleGuests = mutation({
  args: { eventId: v.id("events") },
  handler: async (ctx, args): Promise<{
    removed: number
  }> => {
    const userId = await getAuthenticatedUserId(ctx)
    await verifyEventOwnership(ctx, args.eventId, userId)

    const guests = await ctx.db
      .query("guests")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect()

    // Find guests with "demo" tag in customTags
    const demoGuests = guests.filter(g =>
      g.attributes?.customTags?.includes('demo')
    )

    // Delete all demo guests and their round assignments
    for (const guest of demoGuests) {
      // Delete round assignments first
      const assignments = await ctx.db
        .query("guestRoundAssignments")
        .withIndex("by_guest", (q) => q.eq("guestId", guest._id))
        .collect()

      for (const assignment of assignments) {
        await ctx.db.delete(assignment._id)
      }

      // Delete the guest
      await ctx.db.delete(guest._id)
    }

    return { removed: demoGuests.length }
  },
})
