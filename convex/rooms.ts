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

async function verifyRoomOwnership(
  ctx: QueryCtx | MutationCtx,
  roomId: Id<"rooms">,
  userId: string | null
): Promise<void> {
  const room = await ctx.db.get(roomId)
  if (!room) {
    throw new Error("Room not found")
  }
  await verifyEventOwnership(ctx, room.eventId, userId)
}

// =============================================================================
// Queries
// =============================================================================

// Get all rooms for an event
export const getByEvent = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx)
    await verifyEventOwnership(ctx, args.eventId, userId)

    const rooms = await ctx.db
      .query("rooms")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect()

    // Get session counts for each room
    const roomsWithSessions = await Promise.all(
      rooms.map(async (room) => {
        const sessions = await ctx.db
          .query("sessions")
          .withIndex("by_room", (q) => q.eq("roomId", room._id))
          .collect()
        return {
          ...room,
          sessionCount: sessions.length,
        }
      })
    )

    return roomsWithSessions
  },
})

// Get a single room by ID
export const get = query({
  args: { id: v.id("rooms") },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx)
    await verifyRoomOwnership(ctx, args.id, userId)

    const room = await ctx.db.get(args.id)
    if (!room) return null

    // Get sessions for this room
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_room", (q) => q.eq("roomId", room._id))
      .collect()

    return {
      ...room,
      sessions,
    }
  },
})

// =============================================================================
// Mutations
// =============================================================================

// Create a new room
export const create = mutation({
  args: {
    eventId: v.id("events"),
    name: v.string(),
    capacity: v.optional(v.number()),
    location: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx)
    await verifyEventOwnership(ctx, args.eventId, userId)

    return await ctx.db.insert("rooms", {
      eventId: args.eventId,
      name: args.name,
      capacity: args.capacity,
      location: args.location,
      description: args.description,
    })
  },
})

// Update a room
export const update = mutation({
  args: {
    id: v.id("rooms"),
    name: v.optional(v.string()),
    capacity: v.optional(v.number()),
    location: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx)
    await verifyRoomOwnership(ctx, args.id, userId)

    const { id, ...updates } = args
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

// Delete a room
export const remove = mutation({
  args: { id: v.id("rooms") },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx)
    await verifyRoomOwnership(ctx, args.id, userId)

    // Check if any sessions are using this room
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_room", (q) => q.eq("roomId", args.id))
      .collect()

    if (sessions.length > 0) {
      // Unassign the room from sessions rather than blocking delete
      await Promise.all(
        sessions.map((session) =>
          ctx.db.patch(session._id, { roomId: undefined })
        )
      )
    }

    await ctx.db.delete(args.id)
  },
})
