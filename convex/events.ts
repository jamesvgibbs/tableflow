import { v } from "convex/values"
import { mutation, query, QueryCtx, MutationCtx } from "./_generated/server"
import { Id } from "./_generated/dataModel"
import {
  calculateGuestCompatibility,
  calculateDepartmentConcentrationPenalty,
  DEFAULT_WEIGHTS,
  type MatchingWeights,
} from "./matching"

// =============================================================================
// Authentication Helpers
// =============================================================================

/**
 * Get the authenticated user's ID from Clerk.
 * Returns null if not authenticated (for backward compatibility during migration).
 */
async function getAuthenticatedUserId(ctx: QueryCtx | MutationCtx): Promise<string | null> {
  const identity = await ctx.auth.getUserIdentity()
  return identity?.subject ?? null
}

/**
 * Require authentication - throws if not authenticated.
 */
async function requireAuth(ctx: QueryCtx | MutationCtx): Promise<string> {
  const userId = await getAuthenticatedUserId(ctx)
  if (!userId) {
    throw new Error("Authentication required")
  }
  return userId
}

/**
 * Verify the current user owns an event.
 * During migration, events without userId are accessible (backward compatibility).
 * After migration, this should strictly enforce ownership.
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
  // During migration: allow access if event has no userId (legacy data)
  // After migration: remove this condition
  if (event.userId && event.userId !== userId) {
    throw new Error("Access denied: you do not own this event")
  }
}

/**
 * Validate that an event is not locked for editing.
 * Settings lock when EITHER:
 * 1. First guest checks in (any guest has checkedIn === true)
 * 2. Live timer starts (event has roundStartedAt !== undefined)
 */
async function validateEventNotLocked(
  ctx: MutationCtx,
  eventId: Id<"events">
): Promise<void> {
  const event = await ctx.db.get(eventId)
  if (!event) {
    throw new Error("Event not found")
  }

  // Check if timer has started
  if (event.roundStartedAt) {
    throw new Error("I cannot change this now. The event timer has started.")
  }

  // Check if any guest has checked in
  const guests = await ctx.db
    .query("guests")
    .withIndex("by_event", (q) => q.eq("eventId", eventId))
    .collect()

  if (guests.some((g) => g.checkedIn)) {
    throw new Error("I cannot change this now. Guests have already checked in.")
  }
}

// List all events for the current user (sorted by createdAt descending)
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthenticatedUserId(ctx)

    let events
    if (userId) {
      // Authenticated: show only user's events
      events = await ctx.db
        .query("events")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect()
    } else {
      // Not authenticated: during migration, show all events (backward compat)
      // After migration, return empty array
      events = await ctx.db.query("events").collect()
    }

    // Sort by createdAt descending
    return events.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  },
})

// Get a single event by ID (with ownership check)
export const get = query({
  args: { id: v.id("events") },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx)
    const event = await ctx.db.get(args.id)

    if (!event) return null

    // During migration: allow access if event has no userId
    // After migration: enforce strict ownership
    if (event.userId && event.userId !== userId) {
      return null // Don't reveal event exists
    }

    return event
  },
})

// Get event with all guests and tables (with ownership check)
export const getWithDetails = query({
  args: { id: v.id("events") },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx)
    const event = await ctx.db.get(args.id)

    if (!event) return null

    // During migration: allow access if event has no userId
    // After migration: enforce strict ownership
    if (event.userId && event.userId !== userId) {
      return null // Don't reveal event exists
    }

    const guests = await ctx.db
      .query("guests")
      .withIndex("by_event", (q) => q.eq("eventId", args.id))
      .collect()

    const tables = await ctx.db
      .query("tables")
      .withIndex("by_event", (q) => q.eq("eventId", args.id))
      .collect()

    return {
      ...event,
      guests,
      tables,
    }
  },
})

// Create a new event (requires authentication)
export const create = mutation({
  args: {
    name: v.string(),
    tableSize: v.number(),
    numberOfRounds: v.optional(v.number()),
    roundDuration: v.optional(v.number()),
    eventType: v.optional(v.string()),
    eventTypeSettings: v.optional(v.object({
      guestLabel: v.string(),
      guestLabelPlural: v.string(),
      tableLabel: v.string(),
      tableLabelPlural: v.string(),
      departmentLabel: v.string(),
      departmentLabelPlural: v.string(),
      showRoundTimer: v.boolean(),
    })),
  },
  handler: async (ctx, args) => {
    // Get authenticated user (optional during migration)
    const userId = await getAuthenticatedUserId(ctx)

    const eventId = await ctx.db.insert("events", {
      userId: userId ?? undefined,  // Set owner if authenticated
      name: args.name,
      tableSize: args.tableSize,
      createdAt: new Date().toISOString(),
      isAssigned: false,
      numberOfRounds: args.numberOfRounds || 1,
      roundDuration: args.roundDuration || 30,
      eventType: args.eventType,
      eventTypeSettings: args.eventTypeSettings,
    })
    return eventId
  },
})

// Update event name (with ownership check)
export const updateName = mutation({
  args: {
    id: v.id("events"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx)
    await verifyEventOwnership(ctx, args.id, userId)
    await ctx.db.patch(args.id, { name: args.name })
  },
})

// Update table size (with ownership check and lock validation)
export const updateTableSize = mutation({
  args: {
    id: v.id("events"),
    tableSize: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx)
    await verifyEventOwnership(ctx, args.id, userId)
    await validateEventNotLocked(ctx, args.id)
    await ctx.db.patch(args.id, { tableSize: args.tableSize })
  },
})

// Get edit lock status for an event (to check if settings can be modified)
export const getEditLockStatus = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId)
    if (!event) {
      return { isLocked: true, lockReason: "not_found" as const, checkedInCount: 0 }
    }

    const guests = await ctx.db
      .query("guests")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect()

    const checkedInCount = guests.filter((g) => g.checkedIn).length
    const hasTimerStarted = event.roundStartedAt !== undefined

    if (checkedInCount > 0) {
      return { isLocked: true, lockReason: "guest_checked_in" as const, checkedInCount }
    }
    if (hasTimerStarted) {
      return { isLocked: true, lockReason: "timer_started" as const, checkedInCount: 0 }
    }

    return { isLocked: false, lockReason: "none" as const, checkedInCount: 0 }
  },
})

// Update round duration (with ownership check and lock validation)
export const updateRoundDuration = mutation({
  args: {
    id: v.id("events"),
    roundDuration: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx)
    await verifyEventOwnership(ctx, args.id, userId)
    await validateEventNotLocked(ctx, args.id)
    const duration = args.roundDuration > 0 ? args.roundDuration : undefined
    await ctx.db.patch(args.id, { roundDuration: duration })
  },
})

// Update number of rounds (with ownership check, lock validation, handles regenerating assignments if event is assigned)
export const updateNumberOfRounds = mutation({
  args: {
    id: v.id("events"),
    numberOfRounds: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx)
    await verifyEventOwnership(ctx, args.id, userId)
    await validateEventNotLocked(ctx, args.id)

    const event = await ctx.db.get(args.id)
    if (!event) throw new Error("Event not found")

    const newRounds = Math.max(1, Math.min(10, args.numberOfRounds))
    const oldRounds = event.numberOfRounds || 1

    // If event is not assigned, just update the number
    if (!event.isAssigned) {
      await ctx.db.patch(args.id, { numberOfRounds: newRounds })
      return { numberOfRounds: newRounds, regenerated: false }
    }

    // Event is assigned - need to handle round assignments
    if (newRounds === oldRounds) {
      return { numberOfRounds: newRounds, regenerated: false }
    }

    if (newRounds < oldRounds) {
      // Decreasing rounds - delete excess round assignments
      for (let roundNum = newRounds + 1; roundNum <= oldRounds; roundNum++) {
        const assignmentsToDelete = await ctx.db
          .query("guestRoundAssignments")
          .withIndex("by_event_round", (q) =>
            q.eq("eventId", args.id).eq("roundNumber", roundNum)
          )
          .collect()
        for (const assignment of assignmentsToDelete) {
          await ctx.db.delete(assignment._id)
        }
      }
      await ctx.db.patch(args.id, { numberOfRounds: newRounds })
      return { numberOfRounds: newRounds, regenerated: false }
    }

    // Increasing rounds - generate new round assignments
    const guests = await ctx.db
      .query("guests")
      .withIndex("by_event", (q) => q.eq("eventId", args.id))
      .collect()

    if (guests.length === 0) {
      await ctx.db.patch(args.id, { numberOfRounds: newRounds })
      return { numberOfRounds: newRounds, regenerated: false }
    }

    // Fetch matching config for this event (use defaults if not configured)
    const matchingConfig = await ctx.db
      .query("matchingConfig")
      .withIndex("by_event", (q) => q.eq("eventId", args.id))
      .unique()

    const matchingWeights: MatchingWeights = matchingConfig?.weights
      ? { ...DEFAULT_WEIGHTS, ...matchingConfig.weights }
      : DEFAULT_WEIGHTS

    // Fetch constraints for this event
    const constraintDocs = await ctx.db
      .query("seatingConstraints")
      .withIndex("by_event", (q) => q.eq("eventId", args.id))
      .collect()

    // Process constraints into lookup structures
    const constraints: ConstraintData = {
      pins: new Map<string, number>(),
      repels: new Set<string>(),
      attracts: new Set<string>(),
    }

    for (const c of constraintDocs) {
      if (c.type === "pin" && c.tableNumber !== undefined) {
        constraints.pins.set(c.guestIds[0].toString(), c.tableNumber)
      } else if (c.type === "repel") {
        const pair = c.guestIds.map((id) => id.toString()).sort().join("-")
        constraints.repels.add(pair)
      } else if (c.type === "attract") {
        const pair = c.guestIds.map((id) => id.toString()).sort().join("-")
        constraints.attracts.add(pair)
      }
    }

    const numTables = Math.ceil(guests.length / event.tableSize)

    // Get existing round assignments to build history
    const existingAssignments = await ctx.db
      .query("guestRoundAssignments")
      .withIndex("by_event_round", (q) => q.eq("eventId", args.id))
      .collect()

    // Build history map: roundNum -> guestId -> tableNum
    const allRoundAssignments = new Map<number, Map<string, number>>()
    for (const assignment of existingAssignments) {
      if (!allRoundAssignments.has(assignment.roundNumber)) {
        allRoundAssignments.set(assignment.roundNumber, new Map())
      }
      allRoundAssignments.get(assignment.roundNumber)!.set(
        assignment.guestId,
        assignment.tableNumber
      )
    }

    // Generate new rounds
    for (let roundNum = oldRounds + 1; roundNum <= newRounds; roundNum++) {
      const roundAssignment = new Map<string, number>()
      const tables: GuestDoc[][] = Array.from({ length: numTables }, () => [])

      // Build tablemate history from previous rounds
      const tablemateHistory = buildTablemateHistory(allRoundAssignments)

      // Get previous round assignments for travel distance calculation
      const previousRoundAssignments = allRoundAssignments.get(roundNum - 1)

      // Pre-assign pinned guests first
      const pinnedGuestIds = new Set<string>()
      for (const [guestId, tableNum] of constraints.pins) {
        if (tableNum > 0 && tableNum <= numTables) {
          const guest = guests.find((g) => g._id.toString() === guestId)
          if (guest && tables[tableNum - 1].length < event.tableSize) {
            tables[tableNum - 1].push(guest)
            roundAssignment.set(guest._id, tableNum)
            pinnedGuestIds.add(guestId)
          }
        }
      }

      // Use scoring algorithm for unpinned guests with matching weights and constraints
      const unpinnedGuests = guests.filter(
        (g) => !pinnedGuestIds.has(g._id.toString())
      )
      const shuffledGuests = shuffleArray([...unpinnedGuests])

      // Note: For updateNumberOfRounds, we skip cross-event history for simplicity
      // since we're adding rounds to an already-assigned event
      const emptyGuestEmails = new Map<string, string>()
      const emptyCrossEventHistory: CrossEventHistory = new Map()

      for (const guest of shuffledGuests) {
        let bestTable = -1
        let bestScore = Infinity

        for (let tableIdx = 0; tableIdx < numTables; tableIdx++) {
          if (tables[tableIdx].length >= event.tableSize) continue

          const previousTableNum = previousRoundAssignments?.get(guest._id) ?? null

          const score = calculateAssignmentScore(
            guest,
            tableIdx + 1,
            tables[tableIdx],
            tablemateHistory,
            previousTableNum,
            matchingWeights,
            constraints,
            emptyGuestEmails,
            emptyCrossEventHistory
          )

          if (score < bestScore) {
            bestScore = score
            bestTable = tableIdx
          }
        }

        // Assign to best table (or first available if all equal)
        if (bestTable === -1) {
          bestTable = tables.findIndex((t) => t.length < event.tableSize)
        }

        if (bestTable >= 0) {
          tables[bestTable].push(guest)
          roundAssignment.set(guest._id, bestTable + 1)
        }
      }

      // Store this round's assignments
      allRoundAssignments.set(roundNum, roundAssignment)

      // Insert round assignments into database
      for (const [guestId, tableNumber] of roundAssignment) {
        await ctx.db.insert("guestRoundAssignments", {
          guestId: guestId as Id<"guests">,
          eventId: args.id,
          roundNumber: roundNum,
          tableNumber,
        })
      }
    }

    await ctx.db.patch(args.id, { numberOfRounds: newRounds })
    return { numberOfRounds: newRounds, regenerated: true, newRoundsAdded: newRounds - oldRounds }
  },
})

// Update round settings (with ownership check and lock validation) - legacy, use specific mutations instead
export const updateRoundSettings = mutation({
  args: {
    id: v.id("events"),
    numberOfRounds: v.optional(v.number()),
    roundDuration: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx)
    await verifyEventOwnership(ctx, args.id, userId)
    await validateEventNotLocked(ctx, args.id)

    const updates: { numberOfRounds?: number; roundDuration?: number } = {}
    if (args.numberOfRounds !== undefined) {
      updates.numberOfRounds = Math.max(1, Math.min(10, args.numberOfRounds))
    }
    if (args.roundDuration !== undefined) {
      updates.roundDuration = args.roundDuration > 0 ? args.roundDuration : undefined
    }
    await ctx.db.patch(args.id, updates)
  },
})

// Start the next round (with ownership check)
export const startNextRound = mutation({
  args: { id: v.id("events") },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx)
    await verifyEventOwnership(ctx, args.id, userId)

    const event = await ctx.db.get(args.id)
    if (!event) throw new Error("Event not found")
    if (!event.isAssigned) throw new Error("Tables must be assigned first")

    const maxRounds = event.numberOfRounds || 1
    const currentRound = event.currentRound || 0
    const nextRound = currentRound + 1

    if (nextRound > maxRounds) {
      throw new Error("All rounds have been completed")
    }

    await ctx.db.patch(args.id, {
      currentRound: nextRound,
      roundStartedAt: new Date().toISOString(),
    })

    return { currentRound: nextRound, maxRounds }
  },
})

// End the current round early (with ownership check)
export const endCurrentRound = mutation({
  args: { id: v.id("events") },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx)
    await verifyEventOwnership(ctx, args.id, userId)

    const event = await ctx.db.get(args.id)
    if (!event) throw new Error("Event not found")
    if (!event.currentRound || event.currentRound === 0) {
      throw new Error("No active round to end")
    }

    // Clear the round timer (keeps currentRound so we know which round just ended)
    await ctx.db.patch(args.id, {
      roundStartedAt: undefined,
      isPaused: undefined,
      pausedTimeRemaining: undefined,
    })

    return { endedRound: event.currentRound }
  },
})

// Reset rounds back to "not started" state (with ownership check)
export const resetRounds = mutation({
  args: { id: v.id("events") },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx)
    await verifyEventOwnership(ctx, args.id, userId)

    const event = await ctx.db.get(args.id)
    if (!event) throw new Error("Event not found")

    await ctx.db.patch(args.id, {
      currentRound: 0,
      roundStartedAt: undefined,
      isPaused: undefined,
      pausedTimeRemaining: undefined,
    })

    return { success: true }
  },
})

// Pause the current round timer (with ownership check)
export const pauseRound = mutation({
  args: { id: v.id("events") },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx)
    await verifyEventOwnership(ctx, args.id, userId)

    const event = await ctx.db.get(args.id)
    if (!event) throw new Error("Event not found")
    if (!event.currentRound || event.currentRound === 0) {
      throw new Error("No active round to pause")
    }
    if (!event.roundStartedAt || !event.roundDuration) {
      throw new Error("Round has no timer to pause")
    }
    if (event.isPaused) {
      throw new Error("Round is already paused")
    }

    // Calculate remaining time
    const endTime = new Date(event.roundStartedAt).getTime() + event.roundDuration * 60 * 1000
    const remaining = Math.max(0, endTime - Date.now())

    await ctx.db.patch(args.id, {
      isPaused: true,
      pausedTimeRemaining: remaining,
    })

    return { remainingMs: remaining }
  },
})

// Resume the current round timer (with ownership check)
export const resumeRound = mutation({
  args: { id: v.id("events") },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx)
    await verifyEventOwnership(ctx, args.id, userId)

    const event = await ctx.db.get(args.id)
    if (!event) throw new Error("Event not found")
    if (!event.isPaused) {
      throw new Error("Round is not paused")
    }
    if (!event.pausedTimeRemaining || event.pausedTimeRemaining <= 0) {
      throw new Error("No time remaining to resume")
    }

    // Calculate new start time so that remaining time is preserved
    // newStartTime = now - (totalDuration - pausedTimeRemaining)
    const totalDurationMs = (event.roundDuration || 0) * 60 * 1000
    const elapsedMs = totalDurationMs - event.pausedTimeRemaining
    const newStartTime = new Date(Date.now() - elapsedMs).toISOString()

    await ctx.db.patch(args.id, {
      roundStartedAt: newStartTime,
      isPaused: false,
      pausedTimeRemaining: undefined,
    })

    return { success: true }
  },
})

// Delete event and all associated guests/tables/assignments (with ownership check)
export const remove = mutation({
  args: { id: v.id("events") },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx)
    await verifyEventOwnership(ctx, args.id, userId)

    // Delete all round assignments for this event
    const assignments = await ctx.db
      .query("guestRoundAssignments")
      .withIndex("by_event_round", (q) => q.eq("eventId", args.id))
      .collect()
    for (const assignment of assignments) {
      await ctx.db.delete(assignment._id)
    }

    // Delete all guests for this event
    const guests = await ctx.db
      .query("guests")
      .withIndex("by_event", (q) => q.eq("eventId", args.id))
      .collect()
    for (const guest of guests) {
      await ctx.db.delete(guest._id)
    }

    // Delete all tables for this event
    const tables = await ctx.db
      .query("tables")
      .withIndex("by_event", (q) => q.eq("eventId", args.id))
      .collect()
    for (const table of tables) {
      await ctx.db.delete(table._id)
    }

    // Delete the event
    await ctx.db.delete(args.id)
  },
})

// Helper function to shuffle array (Fisher-Yates)
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// Types for multi-round assignment
type GuestAttributes = {
  interests?: string[]
  jobLevel?: string
  goals?: string[]
  customTags?: string[]
}

type GuestDoc = {
  _id: Id<"guests">
  name: string
  department?: string
  eventId: Id<"events">
  attributes?: GuestAttributes
}

// Constraint data structure for scoring
type ConstraintData = {
  pins: Map<string, number>  // guestId -> tableNumber
  repels: Set<string>        // "guestId1-guestId2" pairs (sorted)
  attracts: Set<string>      // "guestId1-guestId2" pairs (sorted)
}

// Cross-event history data structure
type CrossEventHistory = Map<string, number> // "email1:email2" -> count of events together

// Calculate assignment score for placing a guest at a table
// Lower score = better placement
function calculateAssignmentScore(
  guest: GuestDoc,
  tableNumber: number,
  currentTableGuests: GuestDoc[],
  tablemateHistory: Map<string, Set<string>>,
  previousTableNumber: number | null,
  matchingWeights: MatchingWeights = DEFAULT_WEIGHTS,
  constraints?: ConstraintData,
  guestEmails?: Map<string, string>, // guestId -> email
  crossEventHistory?: CrossEventHistory, // for cross-event novelty
  noveltyPreference: number = 0.5 // 0 = ignore history, 1 = strongly prefer new connections
): number {
  // Base constraints (always applied)
  const BASE_WEIGHTS = { travelDistance: 0.3 }
  let score = 0
  const guestId = guest._id.toString()

  // 0. CONSTRAINT SCORING (highest priority)
  if (constraints) {
    // Pin constraint - if guest is pinned to this table, strong bonus; if pinned elsewhere, strong penalty
    const pinnedTable = constraints.pins.get(guestId)
    if (pinnedTable !== undefined) {
      if (pinnedTable === tableNumber) {
        score -= 10000 // Very strong bonus (negative = better since we minimize)
      } else {
        score += 10000 // Very strong penalty
      }
    }

    // Repel constraint - heavy penalty for same table as repelled guest
    for (const tableGuest of currentTableGuests) {
      const pair = [guestId, tableGuest._id.toString()].sort().join("-")
      if (constraints.repels.has(pair)) {
        score += 5000 // Heavy penalty
      }
      if (constraints.attracts.has(pair)) {
        score -= 500 // Moderate bonus for attract
      }
    }
  }

  // 1. Repeat Tablemate Score - count previous tablemates at table (within-event)
  // This uses repeatAvoidance from matching config
  const guestHistory = tablemateHistory.get(guest._id) || new Set()
  let repeatCount = 0
  for (const tableGuest of currentTableGuests) {
    if (guestHistory.has(tableGuest._id)) {
      repeatCount++
    }
  }
  // Higher repeatAvoidance weight means stronger penalty for repeat tablemates
  const repeatTablemateScore = repeatCount * matchingWeights.repeatAvoidance

  // 1b. Cross-Event History Score - penalize sitting with past tablemates from other events
  // This encourages "novelty" - meeting new people across events
  // Only applies if noveltyPreference > 0
  let crossEventScore = 0
  if (crossEventHistory && guestEmails && noveltyPreference > 0) {
    const guestEmail = guestEmails.get(guest._id.toString())
    if (guestEmail) {
      for (const tableGuest of currentTableGuests) {
        const tableGuestEmail = guestEmails.get(tableGuest._id.toString())
        if (tableGuestEmail) {
          // Create canonical pair key
          const [e1, e2] = guestEmail < tableGuestEmail
            ? [guestEmail, tableGuestEmail]
            : [tableGuestEmail, guestEmail]
          const pairKey = `${e1}:${e2}`
          const pastEvents = crossEventHistory.get(pairKey) || 0

          // Apply penalty based on how many past events they sat together
          // Scale by noveltyPreference (0-1) and repeatAvoidance weight
          // The more times they've sat together, the stronger the penalty
          crossEventScore += pastEvents * matchingWeights.repeatAvoidance * noveltyPreference
        }
      }
    }
  }

  // 2. Travel Distance Score - distance from previous table (small weight)
  let travelDistanceScore = 0
  if (previousTableNumber !== null) {
    travelDistanceScore = Math.abs(tableNumber - previousTableNumber) * BASE_WEIGHTS.travelDistance
  }

  // 3. Department Concentration Penalty - non-linear scaling
  // Strongly discourages having many people from same department at one table
  const departmentConcentrationScore = calculateDepartmentConcentrationPenalty(
    guest.department,
    currentTableGuests,
    matchingWeights.departmentMix
  )

  // 4. Guest Compatibility Score - uses matching algorithm (excludes department since handled above)
  // Calculate average compatibility with current table guests
  // Higher compatibility = lower score (we're minimizing)
  let compatibilityScore = 0
  if (currentTableGuests.length > 0) {
    // Use weights without department mixing since we handle it separately with concentration penalty
    const weightsWithoutDept = { ...matchingWeights, departmentMix: 0 }
    let totalCompatibility = 0
    for (const tableGuest of currentTableGuests) {
      totalCompatibility += calculateGuestCompatibility(
        { department: guest.department, attributes: guest.attributes },
        { department: tableGuest.department, attributes: tableGuest.attributes },
        weightsWithoutDept
      )
    }
    // Average compatibility, inverted (higher compat = lower score)
    // Multiply by -1 since higher compatibility is better, but we're minimizing score
    compatibilityScore = -(totalCompatibility / currentTableGuests.length)
  }

  // Combine scores
  // repeatTablemateScore, travelDistanceScore, crossEventScore, and departmentConcentrationScore are penalties
  // compatibilityScore is inverted compatibility (lower = better compat)
  return score + repeatTablemateScore + travelDistanceScore + compatibilityScore + crossEventScore + departmentConcentrationScore
}

// Build tablemate history from previous rounds
function buildTablemateHistory(
  roundAssignments: Map<number, Map<string, number>> // roundNum -> guestId -> tableNum
): Map<string, Set<string>> {
  const history = new Map<string, Set<string>>()

  // For each round, find who sat together
  for (const [, guestTables] of roundAssignments) {
    // Group guests by table
    const tableGuests = new Map<number, string[]>()
    for (const [guestId, tableNum] of guestTables) {
      if (!tableGuests.has(tableNum)) {
        tableGuests.set(tableNum, [])
      }
      tableGuests.get(tableNum)!.push(guestId)
    }

    // Record tablemates
    for (const guestsAtTable of tableGuests.values()) {
      for (const guestId of guestsAtTable) {
        if (!history.has(guestId)) {
          history.set(guestId, new Set())
        }
        for (const otherGuestId of guestsAtTable) {
          if (otherGuestId !== guestId) {
            history.get(guestId)!.add(otherGuestId)
          }
        }
      }
    }
  }

  return history
}

// =============================================================================
// Seating History Recording (Cross-Event Memory)
// =============================================================================

/**
 * Record seating history for cross-event novelty tracking.
 * Uses guest emails as identifiers so history persists across events.
 */
async function recordSeatingHistory(
  ctx: MutationCtx,
  organizerId: string,
  eventId: Id<"events">,
  guests: GuestDoc[],
  allRoundAssignments: Map<number, Map<string, number>>
): Promise<{ recorded: number; skipped: number }> {
  // Build a quick lookup from guestId to guest with email
  const guestMap = new Map<string, { email?: string }>()
  for (const guest of guests) {
    const fullGuest = await ctx.db.get(guest._id)
    if (fullGuest?.email) {
      guestMap.set(guest._id, { email: fullGuest.email.toLowerCase().trim() })
    }
  }

  let recorded = 0
  let skipped = 0

  // For each round, find who sat together and record pairs
  for (const [roundNumber, guestTables] of allRoundAssignments) {
    // Group guests by table
    const tableGuests = new Map<number, string[]>()
    for (const [guestId, tableNum] of guestTables) {
      if (!tableGuests.has(tableNum)) {
        tableGuests.set(tableNum, [])
      }
      tableGuests.get(tableNum)!.push(guestId)
    }

    // Generate all pairs at each table
    for (const guestIdsAtTable of tableGuests.values()) {
      // Get emails for guests at this table
      const emailsAtTable: string[] = []
      for (const guestId of guestIdsAtTable) {
        const guest = guestMap.get(guestId)
        if (guest?.email) {
          emailsAtTable.push(guest.email)
        }
      }

      // Record all pairs
      for (let i = 0; i < emailsAtTable.length; i++) {
        for (let j = i + 1; j < emailsAtTable.length; j++) {
          const email1 = emailsAtTable[i]
          const email2 = emailsAtTable[j]

          // Create canonical pair (alphabetically sorted)
          const [canonical1, canonical2] = email1 < email2
            ? [email1, email2]
            : [email2, email1]

          // Check if this pair already exists for this event/round
          const existing = await ctx.db
            .query("seatingHistory")
            .withIndex("by_organizer_pair", (q) =>
              q
                .eq("organizerId", organizerId)
                .eq("guestEmail", canonical1)
                .eq("partnerEmail", canonical2)
            )
            .filter((q) =>
              q.and(
                q.eq(q.field("eventId"), eventId),
                q.eq(q.field("roundNumber"), roundNumber)
              )
            )
            .first()

          if (existing) {
            skipped++
            continue
          }

          await ctx.db.insert("seatingHistory", {
            organizerId,
            guestEmail: canonical1,
            partnerEmail: canonical2,
            eventId,
            roundNumber,
            timestamp: new Date().toISOString(),
          })
          recorded++
        }
      }
    }
  }

  return { recorded, skipped }
}

// Assign tables to guests (with ownership check, supports multiple rounds)
export const assignTables = mutation({
  args: { id: v.id("events") },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx)
    await verifyEventOwnership(ctx, args.id, userId)

    const event = await ctx.db.get(args.id)
    if (!event) throw new Error("Event not found")

    const guests = await ctx.db
      .query("guests")
      .withIndex("by_event", (q) => q.eq("eventId", args.id))
      .collect()

    if (guests.length === 0) throw new Error("No guests to assign")

    // Fetch matching config for this event (use defaults if not configured)
    const matchingConfig = await ctx.db
      .query("matchingConfig")
      .withIndex("by_event", (q) => q.eq("eventId", args.id))
      .unique()

    const matchingWeights: MatchingWeights = matchingConfig?.weights
      ? { ...DEFAULT_WEIGHTS, ...matchingConfig.weights }
      : DEFAULT_WEIGHTS

    // Get novelty preference for cross-event history scoring (0-1, default 0.5)
    const noveltyPreference = matchingConfig?.noveltyPreference ?? 0.5

    // Fetch constraints for this event
    const constraintDocs = await ctx.db
      .query("seatingConstraints")
      .withIndex("by_event", (q) => q.eq("eventId", args.id))
      .collect()

    // Process constraints into lookup structures
    const constraints: ConstraintData = {
      pins: new Map<string, number>(),
      repels: new Set<string>(),
      attracts: new Set<string>(),
    }

    for (const c of constraintDocs) {
      if (c.type === "pin" && c.tableNumber !== undefined) {
        constraints.pins.set(c.guestIds[0].toString(), c.tableNumber)
      } else if (c.type === "repel") {
        const pair = c.guestIds.map((id) => id.toString()).sort().join("-")
        constraints.repels.add(pair)
      } else if (c.type === "attract") {
        const pair = c.guestIds.map((id) => id.toString()).sort().join("-")
        constraints.attracts.add(pair)
      }
    }

    const numberOfRounds = event.numberOfRounds || 1
    const numTables = Math.ceil(guests.length / event.tableSize)

    // Build guest email lookup for cross-event history
    const guestEmails = new Map<string, string>()
    for (const guest of guests) {
      const fullGuest = await ctx.db.get(guest._id)
      if (fullGuest?.email) {
        guestEmails.set(guest._id.toString(), fullGuest.email.toLowerCase().trim())
      }
    }

    // Query cross-event seating history for novelty scoring
    // Only query if we have an authenticated user
    const crossEventHistory: CrossEventHistory = new Map()
    if (userId) {
      // Get all unique emails for this event's guests
      const uniqueEmails = [...new Set(guestEmails.values())]

      // Query history for each email (as guestEmail)
      for (const email of uniqueEmails) {
        const history = await ctx.db
          .query("seatingHistory")
          .withIndex("by_organizer_guest", (q) =>
            q.eq("organizerId", userId).eq("guestEmail", email)
          )
          .filter((q) => q.neq(q.field("eventId"), args.id)) // Exclude current event
          .collect()

        // Count unique events per pair
        for (const record of history) {
          const [e1, e2] = email < record.partnerEmail
            ? [email, record.partnerEmail]
            : [record.partnerEmail, email]
          const pairKey = `${e1}:${e2}`

          // Only count if partner is also in this event
          if (uniqueEmails.includes(record.partnerEmail)) {
            // We want to count unique events, not rounds
            // For simplicity, increment by 1 for each historical record
            // (more records = sat together more times)
            crossEventHistory.set(pairKey, (crossEventHistory.get(pairKey) || 0) + 1)
          }
        }
      }
    }

    // Delete existing tables
    const existingTables = await ctx.db
      .query("tables")
      .withIndex("by_event", (q) => q.eq("eventId", args.id))
      .collect()
    for (const table of existingTables) {
      await ctx.db.delete(table._id)
    }

    // Delete existing round assignments
    const existingAssignments = await ctx.db
      .query("guestRoundAssignments")
      .withIndex("by_event_round", (q) => q.eq("eventId", args.id))
      .collect()
    for (const assignment of existingAssignments) {
      await ctx.db.delete(assignment._id)
    }

    // Create table records
    const tableQrCodes: string[] = []
    for (let i = 0; i < numTables; i++) {
      const tableNumber = i + 1
      const qrCodeId = crypto.randomUUID()
      tableQrCodes.push(qrCodeId)

      await ctx.db.insert("tables", {
        eventId: args.id,
        tableNumber,
        qrCodeId,
      })
    }

    // Track all round assignments: roundNum -> guestId -> tableNum
    const allRoundAssignments = new Map<number, Map<string, number>>()

    // Assign each round
    for (let roundNum = 1; roundNum <= numberOfRounds; roundNum++) {
      const roundAssignment = new Map<string, number>()
      const tables: GuestDoc[][] = Array.from({ length: numTables }, () => [])

      // Build tablemate history from previous rounds
      const tablemateHistory = buildTablemateHistory(allRoundAssignments)

      // Get previous round assignments for travel distance calculation
      const previousRoundAssignments = allRoundAssignments.get(roundNum - 1)

      // Pre-assign pinned guests first (for all rounds)
      const pinnedGuestIds = new Set<string>()
      for (const [guestId, tableNum] of constraints.pins) {
        if (tableNum > 0 && tableNum <= numTables) {
          const guest = guests.find((g) => g._id.toString() === guestId)
          if (guest && tables[tableNum - 1].length < event.tableSize) {
            tables[tableNum - 1].push(guest)
            roundAssignment.set(guest._id, tableNum)
            pinnedGuestIds.add(guestId)
          }
        }
      }

      // Get remaining unpinned guests
      const unpinnedGuests = guests.filter(
        (g) => !pinnedGuestIds.has(g._id.toString())
      )

      if (roundNum === 1) {
        // Round 1: Use department-mixing algorithm for unpinned guests
        const byDepartment: Record<string, GuestDoc[]> = {}
        const noDepartment: GuestDoc[] = []

        for (const guest of unpinnedGuests) {
          if (guest.department) {
            if (!byDepartment[guest.department]) {
              byDepartment[guest.department] = []
            }
            byDepartment[guest.department].push(guest)
          } else {
            noDepartment.push(guest)
          }
        }

        // Shuffle within each department
        for (const dept of Object.keys(byDepartment)) {
          byDepartment[dept] = shuffleArray(byDepartment[dept])
        }

        // Round-robin distribution with constraint awareness
        const departments = shuffleArray(Object.keys(byDepartment))
        let tableIndex = 0

        for (const dept of departments) {
          for (const guest of byDepartment[dept]) {
            // Use scoring to pick the best table (considering constraints)
            let bestTable = -1
            let bestScore = Infinity

            for (let tableIdx = 0; tableIdx < numTables; tableIdx++) {
              if (tables[tableIdx].length >= event.tableSize) continue

              const score = calculateAssignmentScore(
                guest,
                tableIdx + 1,
                tables[tableIdx],
                tablemateHistory,
                null,
                matchingWeights,
                constraints,
                guestEmails,
                crossEventHistory,
                noveltyPreference
              )

              if (score < bestScore) {
                bestScore = score
                bestTable = tableIdx
              }
            }

            if (bestTable >= 0) {
              tables[bestTable].push(guest)
              roundAssignment.set(guest._id, bestTable + 1)
              tableIndex = (bestTable + 1) % numTables
            }
          }
        }

        // Add guests without department
        const shuffledNoDept = shuffleArray(noDepartment)
        for (const guest of shuffledNoDept) {
          let bestTable = -1
          let bestScore = Infinity

          for (let tableIdx = 0; tableIdx < numTables; tableIdx++) {
            if (tables[tableIdx].length >= event.tableSize) continue

            const score = calculateAssignmentScore(
              guest,
              tableIdx + 1,
              tables[tableIdx],
              tablemateHistory,
              null,
              matchingWeights,
              constraints,
              guestEmails,
              crossEventHistory,
              noveltyPreference
            )

            if (score < bestScore) {
              bestScore = score
              bestTable = tableIdx
            }
          }

          if (bestTable >= 0) {
            tables[bestTable].push(guest)
            roundAssignment.set(guest._id, bestTable + 1)
          }
        }
      } else {
        // Rounds 2+: Use scoring algorithm with matching weights and constraints
        const shuffledGuests = shuffleArray([...unpinnedGuests])

        for (const guest of shuffledGuests) {
          let bestTable = -1
          let bestScore = Infinity

          for (let tableIdx = 0; tableIdx < numTables; tableIdx++) {
            if (tables[tableIdx].length >= event.tableSize) continue

            const previousTableNum = previousRoundAssignments?.get(guest._id) ?? null

            const score = calculateAssignmentScore(
              guest,
              tableIdx + 1,
              tables[tableIdx],
              tablemateHistory,
              previousTableNum,
              matchingWeights,
              constraints,
              guestEmails,
              crossEventHistory,
              noveltyPreference
            )

            if (score < bestScore) {
              bestScore = score
              bestTable = tableIdx
            }
          }

          // Assign to best table (or first available if all equal)
          if (bestTable === -1) {
            // Fallback: find any table with space
            bestTable = tables.findIndex((t) => t.length < event.tableSize)
          }

          if (bestTable >= 0) {
            tables[bestTable].push(guest)
            roundAssignment.set(guest._id, bestTable + 1)
          }
        }
      }

      // Store this round's assignments
      allRoundAssignments.set(roundNum, roundAssignment)

      // Insert round assignments into database
      for (const [guestId, tableNumber] of roundAssignment) {
        await ctx.db.insert("guestRoundAssignments", {
          guestId: guestId as Id<"guests">,
          eventId: args.id,
          roundNumber: roundNum,
          tableNumber,
        })
      }
    }

    // Update guests with Round 1 assignment for backward compatibility
    const round1Assignments = allRoundAssignments.get(1)
    if (round1Assignments) {
      for (const guest of guests) {
        const tableNumber = round1Assignments.get(guest._id)
        const guestQrCodeId = guest.qrCodeId || crypto.randomUUID()
        await ctx.db.patch(guest._id, {
          tableNumber,
          qrCodeId: guestQrCodeId,
        })
      }
    }

    // Mark event as assigned, reset round state
    await ctx.db.patch(args.id, {
      isAssigned: true,
      currentRound: 0,
      roundStartedAt: undefined,
    })

    // Record seating history for cross-event novelty tracking
    // Only record if we have authenticated user (organizer)
    if (userId) {
      await recordSeatingHistory(ctx, userId, args.id, guests, allRoundAssignments)
    }

    return { numTables, numGuests: guests.length, numberOfRounds }
  },
})

// Reset all assignments (with ownership check)
export const resetAssignments = mutation({
  args: { id: v.id("events") },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx)
    await verifyEventOwnership(ctx, args.id, userId)

    // Delete all round assignments
    const assignments = await ctx.db
      .query("guestRoundAssignments")
      .withIndex("by_event_round", (q) => q.eq("eventId", args.id))
      .collect()
    for (const assignment of assignments) {
      await ctx.db.delete(assignment._id)
    }

    // Delete all tables
    const tables = await ctx.db
      .query("tables")
      .withIndex("by_event", (q) => q.eq("eventId", args.id))
      .collect()
    for (const table of tables) {
      await ctx.db.delete(table._id)
    }

    // Reset guest assignments
    const guests = await ctx.db
      .query("guests")
      .withIndex("by_event", (q) => q.eq("eventId", args.id))
      .collect()
    for (const guest of guests) {
      await ctx.db.patch(guest._id, {
        tableNumber: undefined,
        qrCodeId: undefined,
      })
    }

    // Mark event as not assigned, reset round state
    await ctx.db.patch(args.id, {
      isAssigned: false,
      currentRound: 0,
      roundStartedAt: undefined,
    })
  },
})

// Update theme preset (with ownership check)
export const updateThemePreset = mutation({
  args: {
    id: v.id("events"),
    themePreset: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx)
    await verifyEventOwnership(ctx, args.id, userId)
    await ctx.db.patch(args.id, { themePreset: args.themePreset })
  },
})

// Update custom colors (with ownership check)
export const updateCustomColors = mutation({
  args: {
    id: v.id("events"),
    customColors: v.optional(v.object({
      primary: v.string(),
      secondary: v.string(),
      accent: v.string(),
      background: v.string(),
      foreground: v.string(),
      muted: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx)
    await verifyEventOwnership(ctx, args.id, userId)
    await ctx.db.patch(args.id, { customColors: args.customColors })
  },
})

// Clear custom theme (with ownership check)
export const clearCustomTheme = mutation({
  args: { id: v.id("events") },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx)
    await verifyEventOwnership(ctx, args.id, userId)
    await ctx.db.patch(args.id, {
      themePreset: undefined,
      customColors: undefined,
    })
  },
})

// Update email settings (with ownership check)
export const updateEmailSettings = mutation({
  args: {
    id: v.id("events"),
    emailSettings: v.object({
      senderName: v.string(),
      replyTo: v.optional(v.string()),
      invitationSubject: v.optional(v.string()),
      confirmationSubject: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx)
    await verifyEventOwnership(ctx, args.id, userId)
    await ctx.db.patch(args.id, { emailSettings: args.emailSettings })
  },
})

// Clear email settings (with ownership check)
export const clearEmailSettings = mutation({
  args: { id: v.id("events") },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx)
    await verifyEventOwnership(ctx, args.id, userId)
    await ctx.db.patch(args.id, { emailSettings: undefined })
  },
})

// Update event type (with ownership check)
export const updateEventType = mutation({
  args: {
    id: v.id("events"),
    eventType: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx)
    await verifyEventOwnership(ctx, args.id, userId)
    await ctx.db.patch(args.id, { eventType: args.eventType })
  },
})

// Update event type settings (with ownership check)
export const updateEventTypeSettings = mutation({
  args: {
    id: v.id("events"),
    eventTypeSettings: v.object({
      guestLabel: v.string(),
      guestLabelPlural: v.string(),
      tableLabel: v.string(),
      tableLabelPlural: v.string(),
      departmentLabel: v.string(),
      departmentLabelPlural: v.string(),
      showRoundTimer: v.boolean(),
    }),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx)
    await verifyEventOwnership(ctx, args.id, userId)
    await ctx.db.patch(args.id, { eventTypeSettings: args.eventTypeSettings })
  },
})

// Clear event type settings (with ownership check)
export const clearEventTypeSettings = mutation({
  args: { id: v.id("events") },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx)
    await verifyEventOwnership(ctx, args.id, userId)
    await ctx.db.patch(args.id, { eventTypeSettings: undefined })
  },
})

// Update guest self-service settings (with ownership check)
export const updateSelfServiceSettings = mutation({
  args: {
    id: v.id("events"),
    selfServiceDeadline: v.optional(v.union(v.string(), v.null())),
    selfServiceNotificationsEnabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx)
    await verifyEventOwnership(ctx, args.id, userId)

    const updates: {
      selfServiceDeadline?: string | undefined
      selfServiceNotificationsEnabled?: boolean
    } = {}

    // Handle deadline - null means clear it, undefined means don't change
    if (args.selfServiceDeadline !== undefined) {
      updates.selfServiceDeadline = args.selfServiceDeadline === null
        ? undefined
        : args.selfServiceDeadline
    }

    if (args.selfServiceNotificationsEnabled !== undefined) {
      updates.selfServiceNotificationsEnabled = args.selfServiceNotificationsEnabled
    }

    await ctx.db.patch(args.id, updates)
  },
})
