import { v } from "convex/values"
import { mutation, query, QueryCtx, MutationCtx } from "./_generated/server"
import { Id } from "./_generated/dataModel"

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
 * Verify the current user owns the event that a constraint belongs to.
 */
async function verifyConstraintOwnership(
  ctx: QueryCtx | MutationCtx,
  constraintId: Id<"seatingConstraints">,
  userId: string | null
): Promise<void> {
  const constraint = await ctx.db.get(constraintId)
  if (!constraint) {
    throw new Error("Constraint not found")
  }
  await verifyEventOwnership(ctx, constraint.eventId, userId)
}

// Constraint types
export type ConstraintType = "pin" | "repel" | "attract"

export interface SeatingConstraint {
  _id: Id<"seatingConstraints">
  eventId: Id<"events">
  type: ConstraintType
  guestIds: Id<"guests">[]
  tableNumber?: number
  reason?: string
  createdAt: string
}

/**
 * Create a new seating constraint (with ownership check)
 */
export const create = mutation({
  args: {
    eventId: v.id("events"),
    type: v.string(),
    guestIds: v.array(v.id("guests")),
    tableNumber: v.optional(v.number()),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx)
    await verifyEventOwnership(ctx, args.eventId, userId)

    // Validate constraint type
    if (!["pin", "repel", "attract"].includes(args.type)) {
      throw new Error(`Invalid constraint type: ${args.type}`)
    }

    // Validate guest count based on type
    if (args.type === "pin" && args.guestIds.length !== 1) {
      throw new Error("Pin constraints require exactly one guest")
    }
    if ((args.type === "repel" || args.type === "attract") && args.guestIds.length !== 2) {
      throw new Error("Repel and attract constraints require exactly two guests")
    }

    // Pin constraints require a table number
    if (args.type === "pin" && args.tableNumber === undefined) {
      throw new Error("Pin constraints require a table number")
    }

    // Check for duplicate constraints
    const existingConstraints = await ctx.db
      .query("seatingConstraints")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect()

    // For pin: check if guest already pinned
    if (args.type === "pin") {
      const duplicate = existingConstraints.find(
        (c) => c.type === "pin" && c.guestIds[0] === args.guestIds[0]
      )
      if (duplicate) {
        throw new Error("This guest already has a pin constraint")
      }
    }

    // For repel/attract: check if pair already has constraint of same type
    if (args.type === "repel" || args.type === "attract") {
      const duplicate = existingConstraints.find((c) => {
        if (c.type !== args.type) return false
        const sortedExisting = [...c.guestIds].sort()
        const sortedNew = [...args.guestIds].sort()
        return sortedExisting[0] === sortedNew[0] && sortedExisting[1] === sortedNew[1]
      })
      if (duplicate) {
        throw new Error(`This pair already has a ${args.type} constraint`)
      }
    }

    const constraintId = await ctx.db.insert("seatingConstraints", {
      eventId: args.eventId,
      type: args.type,
      guestIds: args.guestIds,
      tableNumber: args.tableNumber,
      reason: args.reason,
      createdAt: new Date().toISOString(),
    })

    return constraintId
  },
})

/**
 * Update an existing constraint (with ownership check)
 */
export const update = mutation({
  args: {
    id: v.id("seatingConstraints"),
    tableNumber: v.optional(v.number()),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx)
    await verifyConstraintOwnership(ctx, args.id, userId)

    await ctx.db.patch(args.id, {
      ...(args.tableNumber !== undefined && { tableNumber: args.tableNumber }),
      ...(args.reason !== undefined && { reason: args.reason }),
    })
  },
})

/**
 * Delete a constraint (with ownership check)
 */
export const remove = mutation({
  args: {
    id: v.id("seatingConstraints"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx)
    await verifyConstraintOwnership(ctx, args.id, userId)

    await ctx.db.delete(args.id)
  },
})

/**
 * Get all constraints for an event (with ownership check)
 */
export const getByEvent = query({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx)
    await verifyEventOwnership(ctx, args.eventId, userId)

    const constraints = await ctx.db
      .query("seatingConstraints")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect()

    // Enrich with guest names for display
    const enrichedConstraints = await Promise.all(
      constraints.map(async (constraint) => {
        const guests = await Promise.all(
          constraint.guestIds.map((guestId) => ctx.db.get(guestId))
        )
        return {
          ...constraint,
          guests: guests.filter(Boolean).map((g) => ({
            _id: g!._id,
            name: g!.name,
          })),
        }
      })
    )

    return enrichedConstraints
  },
})

/**
 * Get constraints involving a specific guest (with ownership check)
 */
export const getByGuest = query({
  args: {
    guestId: v.id("guests"),
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx)
    await verifyEventOwnership(ctx, args.eventId, userId)

    // Get all constraints for the event and filter
    const constraints = await ctx.db
      .query("seatingConstraints")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect()

    return constraints.filter((c) => c.guestIds.includes(args.guestId))
  },
})

/**
 * Check for conflicting constraints (with ownership check)
 * Returns warnings for conflicts that don't prevent assignment but may cause suboptimal results
 */
export const checkConflicts = query({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx)
    await verifyEventOwnership(ctx, args.eventId, userId)

    const constraints = await ctx.db
      .query("seatingConstraints")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect()

    const conflicts: Array<{
      type: "error" | "warning"
      message: string
      constraintIds: Id<"seatingConstraints">[]
    }> = []

    // Check for repel + attract conflicts on same pair
    const repelPairs = constraints
      .filter((c) => c.type === "repel")
      .map((c) => ({
        constraint: c,
        pair: [...c.guestIds].sort().join("-"),
      }))

    const attractPairs = constraints
      .filter((c) => c.type === "attract")
      .map((c) => ({
        constraint: c,
        pair: [...c.guestIds].sort().join("-"),
      }))

    for (const repel of repelPairs) {
      const conflict = attractPairs.find((a) => a.pair === repel.pair)
      if (conflict) {
        const guests = await Promise.all(
          repel.constraint.guestIds.map((id) => ctx.db.get(id))
        )
        const names = guests.map((g) => g?.name).join(" and ")
        conflicts.push({
          type: "error",
          message: `Conflicting constraints: ${names} have both repel and attract constraints`,
          constraintIds: [repel.constraint._id, conflict.constraint._id],
        })
      }
    }

    // Check for multiple pin constraints to same table that exceed table capacity
    const event = await ctx.db.get(args.eventId)
    if (event) {
      const pinsByTable = new Map<number, Id<"seatingConstraints">[]>()
      for (const c of constraints.filter((c) => c.type === "pin")) {
        if (c.tableNumber !== undefined) {
          const existing = pinsByTable.get(c.tableNumber) || []
          existing.push(c._id)
          pinsByTable.set(c.tableNumber, existing)
        }
      }

      for (const [tableNumber, constraintIds] of pinsByTable) {
        if (constraintIds.length > event.tableSize) {
          conflicts.push({
            type: "error",
            message: `Table ${tableNumber} has ${constraintIds.length} pinned guests but only ${event.tableSize} seats`,
            constraintIds,
          })
        }
      }
    }

    return conflicts
  },
})

/**
 * Bulk create constraints (useful for CSV import) (with ownership check)
 */
export const createMany = mutation({
  args: {
    eventId: v.id("events"),
    constraints: v.array(
      v.object({
        type: v.string(),
        guestIds: v.array(v.id("guests")),
        tableNumber: v.optional(v.number()),
        reason: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx)
    await verifyEventOwnership(ctx, args.eventId, userId)

    const createdIds: Id<"seatingConstraints">[] = []

    for (const constraint of args.constraints) {
      // Validate constraint type
      if (!["pin", "repel", "attract"].includes(constraint.type)) {
        continue // Skip invalid types in bulk import
      }

      // Basic validation
      if (constraint.type === "pin" && constraint.guestIds.length !== 1) continue
      if (
        (constraint.type === "repel" || constraint.type === "attract") &&
        constraint.guestIds.length !== 2
      )
        continue
      if (constraint.type === "pin" && constraint.tableNumber === undefined) continue

      const id = await ctx.db.insert("seatingConstraints", {
        eventId: args.eventId,
        type: constraint.type,
        guestIds: constraint.guestIds,
        tableNumber: constraint.tableNumber,
        reason: constraint.reason,
        createdAt: new Date().toISOString(),
      })
      createdIds.push(id)
    }

    return createdIds
  },
})

/**
 * Clear all constraints for an event (with ownership check)
 */
export const clearAll = mutation({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx)
    await verifyEventOwnership(ctx, args.eventId, userId)

    const constraints = await ctx.db
      .query("seatingConstraints")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect()

    for (const constraint of constraints) {
      await ctx.db.delete(constraint._id)
    }

    return constraints.length
  },
})
