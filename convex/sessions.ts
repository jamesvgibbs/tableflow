import { v } from "convex/values"
import { mutation, query, QueryCtx, MutationCtx } from "./_generated/server"
import type { Id } from "./_generated/dataModel"

// =============================================================================
// Authentication Helpers (shared pattern from other files)
// =============================================================================

async function getAuthenticatedUserId(ctx: QueryCtx | MutationCtx): Promise<string | null> {
  const identity = await ctx.auth.getUserIdentity()
  return identity?.subject ?? null
}

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

async function verifySessionOwnership(
  ctx: QueryCtx | MutationCtx,
  sessionId: Id<"sessions">,
  userId: string | null
): Promise<void> {
  const session = await ctx.db.get(sessionId)
  if (!session) {
    throw new Error("Session not found")
  }
  await verifyEventOwnership(ctx, session.eventId, userId)
}

// =============================================================================
// Session Queries
// =============================================================================

// Get all sessions for an event
export const getByEvent = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx)
    await verifyEventOwnership(ctx, args.eventId, userId)

    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect()

    // Enrich with room info and assignment counts
    const enrichedSessions = await Promise.all(
      sessions.map(async (session) => {
        // Get room info if assigned
        let room = null
        if (session.roomId) {
          room = await ctx.db.get(session.roomId)
        }

        // Get assignment count
        const assignments = await ctx.db
          .query("sessionAssignments")
          .withIndex("by_session", (q) => q.eq("sessionId", session._id))
          .collect()

        return {
          ...session,
          room: room ? { _id: room._id, name: room.name } : null,
          assignedCount: assignments.length,
        }
      })
    )

    // Sort by start time if available
    return enrichedSessions.sort((a, b) => {
      if (!a.startTime && !b.startTime) return 0
      if (!a.startTime) return 1
      if (!b.startTime) return -1
      return a.startTime.localeCompare(b.startTime)
    })
  },
})

// Get a single session with full details
export const get = query({
  args: { id: v.id("sessions") },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx)
    await verifySessionOwnership(ctx, args.id, userId)

    const session = await ctx.db.get(args.id)
    if (!session) return null

    // Get room info
    let room = null
    if (session.roomId) {
      room = await ctx.db.get(session.roomId)
    }

    // Get assigned guests
    const assignments = await ctx.db
      .query("sessionAssignments")
      .withIndex("by_session", (q) => q.eq("sessionId", session._id))
      .collect()

    const guests = await Promise.all(
      assignments.map(async (a) => {
        const guest = await ctx.db.get(a.guestId)
        return guest ? { ...guest, assignmentId: a._id } : null
      })
    )

    return {
      ...session,
      room,
      assignedGuests: guests.filter((g) => g !== null),
    }
  },
})

// Get sessions a specific guest is assigned to
export const getByGuest = query({
  args: { guestId: v.id("guests") },
  handler: async (ctx, args) => {
    const guest = await ctx.db.get(args.guestId)
    if (!guest) {
      throw new Error("Guest not found")
    }

    const userId = await getAuthenticatedUserId(ctx)
    await verifyEventOwnership(ctx, guest.eventId, userId)

    const assignments = await ctx.db
      .query("sessionAssignments")
      .withIndex("by_guest", (q) => q.eq("guestId", args.guestId))
      .collect()

    const sessions = await Promise.all(
      assignments.map(async (a) => {
        const session = await ctx.db.get(a.sessionId)
        if (!session) return null

        let room = null
        if (session.roomId) {
          room = await ctx.db.get(session.roomId)
        }

        return {
          ...session,
          room: room ? { _id: room._id, name: room.name } : null,
          assignmentId: a._id,
        }
      })
    )

    return sessions.filter((s) => s !== null).sort((a, b) => {
      if (!a.startTime && !b.startTime) return 0
      if (!a.startTime) return 1
      if (!b.startTime) return -1
      return a.startTime.localeCompare(b.startTime)
    })
  },
})

// =============================================================================
// Session Mutations
// =============================================================================

// Create a new session
export const create = mutation({
  args: {
    eventId: v.id("events"),
    name: v.string(),
    description: v.optional(v.string()),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    roomId: v.optional(v.id("rooms")),
    hasTableSeating: v.optional(v.boolean()),
    maxCapacity: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx)
    await verifyEventOwnership(ctx, args.eventId, userId)

    // Verify room belongs to same event if provided
    if (args.roomId) {
      const room = await ctx.db.get(args.roomId)
      if (!room || room.eventId !== args.eventId) {
        throw new Error("Room not found or belongs to a different event")
      }
    }

    return await ctx.db.insert("sessions", {
      eventId: args.eventId,
      name: args.name,
      description: args.description,
      startTime: args.startTime,
      endTime: args.endTime,
      roomId: args.roomId,
      hasTableSeating: args.hasTableSeating,
      maxCapacity: args.maxCapacity,
    })
  },
})

// Update a session
export const update = mutation({
  args: {
    id: v.id("sessions"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    startTime: v.optional(v.union(v.string(), v.null())),
    endTime: v.optional(v.union(v.string(), v.null())),
    roomId: v.optional(v.union(v.id("rooms"), v.null())),
    hasTableSeating: v.optional(v.boolean()),
    maxCapacity: v.optional(v.union(v.number(), v.null())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx)
    await verifySessionOwnership(ctx, args.id, userId)

    const session = await ctx.db.get(args.id)
    if (!session) {
      throw new Error("Session not found")
    }

    // Verify room belongs to same event if provided
    if (args.roomId) {
      const room = await ctx.db.get(args.roomId)
      if (!room || room.eventId !== session.eventId) {
        throw new Error("Room not found or belongs to a different event")
      }
    }

    const { id, ...updates } = args
    const patchUpdates: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        // Convert null to undefined for optional fields
        patchUpdates[key] = value === null ? undefined : value
      }
    }

    if (Object.keys(patchUpdates).length > 0) {
      await ctx.db.patch(id, patchUpdates)
    }

    return await ctx.db.get(id)
  },
})

// Delete a session
export const remove = mutation({
  args: { id: v.id("sessions") },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx)
    await verifySessionOwnership(ctx, args.id, userId)

    // Delete all session assignments first
    const assignments = await ctx.db
      .query("sessionAssignments")
      .withIndex("by_session", (q) => q.eq("sessionId", args.id))
      .collect()

    await Promise.all(
      assignments.map((a) => ctx.db.delete(a._id))
    )

    await ctx.db.delete(args.id)
  },
})

// =============================================================================
// Session Assignment Mutations
// =============================================================================

// Assign a guest to a session
export const assignGuest = mutation({
  args: {
    sessionId: v.id("sessions"),
    guestId: v.id("guests"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx)
    await verifySessionOwnership(ctx, args.sessionId, userId)

    const session = await ctx.db.get(args.sessionId)
    if (!session) {
      throw new Error("Session not found")
    }

    // Verify guest belongs to same event
    const guest = await ctx.db.get(args.guestId)
    if (!guest || guest.eventId !== session.eventId) {
      throw new Error("Guest not found or belongs to a different event")
    }

    // Check if already assigned
    const existing = await ctx.db
      .query("sessionAssignments")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .filter((q) => q.eq(q.field("guestId"), args.guestId))
      .first()

    if (existing) {
      throw new Error("Guest is already assigned to this session")
    }

    // Check capacity if set
    if (session.maxCapacity) {
      const currentCount = await ctx.db
        .query("sessionAssignments")
        .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
        .collect()

      if (currentCount.length >= session.maxCapacity) {
        throw new Error("Session is at capacity")
      }
    }

    return await ctx.db.insert("sessionAssignments", {
      sessionId: args.sessionId,
      guestId: args.guestId,
      eventId: session.eventId,
      createdAt: new Date().toISOString(),
    })
  },
})

// Bulk assign guests to a session
export const assignGuestsBulk = mutation({
  args: {
    sessionId: v.id("sessions"),
    guestIds: v.array(v.id("guests")),
  },
  handler: async (ctx, args): Promise<{
    total: number
    assigned: number
    alreadyAssigned: number
    failed: number
  }> => {
    const userId = await getAuthenticatedUserId(ctx)
    await verifySessionOwnership(ctx, args.sessionId, userId)

    const session = await ctx.db.get(args.sessionId)
    if (!session) {
      throw new Error("Session not found")
    }

    // Get current assignments
    const currentAssignments = await ctx.db
      .query("sessionAssignments")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect()

    const currentGuestIds = new Set(currentAssignments.map((a) => a.guestId))

    // Check capacity
    const remainingCapacity = session.maxCapacity
      ? session.maxCapacity - currentAssignments.length
      : Infinity

    let assigned = 0
    let alreadyAssigned = 0
    let failed = 0

    for (const guestId of args.guestIds) {
      // Skip if already assigned
      if (currentGuestIds.has(guestId)) {
        alreadyAssigned++
        continue
      }

      // Check capacity
      if (assigned >= remainingCapacity) {
        failed++
        continue
      }

      // Verify guest belongs to same event
      const guest = await ctx.db.get(guestId)
      if (!guest || guest.eventId !== session.eventId) {
        failed++
        continue
      }

      await ctx.db.insert("sessionAssignments", {
        sessionId: args.sessionId,
        guestId,
        eventId: session.eventId,
        createdAt: new Date().toISOString(),
      })
      assigned++
    }

    return {
      total: args.guestIds.length,
      assigned,
      alreadyAssigned,
      failed,
    }
  },
})

// Remove a guest from a session
export const unassignGuest = mutation({
  args: {
    sessionId: v.id("sessions"),
    guestId: v.id("guests"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx)
    await verifySessionOwnership(ctx, args.sessionId, userId)

    const assignment = await ctx.db
      .query("sessionAssignments")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .filter((q) => q.eq(q.field("guestId"), args.guestId))
      .first()

    if (!assignment) {
      throw new Error("Guest is not assigned to this session")
    }

    await ctx.db.delete(assignment._id)
  },
})

// Remove multiple guests from a session
export const unassignGuestsBulk = mutation({
  args: {
    sessionId: v.id("sessions"),
    guestIds: v.array(v.id("guests")),
  },
  handler: async (ctx, args): Promise<{
    total: number
    removed: number
  }> => {
    const userId = await getAuthenticatedUserId(ctx)
    await verifySessionOwnership(ctx, args.sessionId, userId)

    let removed = 0

    for (const guestId of args.guestIds) {
      const assignment = await ctx.db
        .query("sessionAssignments")
        .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
        .filter((q) => q.eq(q.field("guestId"), guestId))
        .first()

      if (assignment) {
        await ctx.db.delete(assignment._id)
        removed++
      }
    }

    return {
      total: args.guestIds.length,
      removed,
    }
  },
})
