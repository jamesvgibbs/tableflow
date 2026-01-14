import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { Id } from "./_generated/dataModel"
import {
  calculateGuestCompatibility,
  DEFAULT_WEIGHTS,
  type MatchingWeights,
} from "./matching"

/**
 * Generate a unique session ID for preview assignments
 */
function generateSessionId(): string {
  return `preview_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

// Extended GuestDoc type for algorithm
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

/**
 * Calculate assignment score respecting constraints
 */
function calculateAssignmentScore(
  guest: GuestDoc,
  tableNumber: number,
  currentTableGuests: GuestDoc[],
  tablemateHistory: Map<string, Set<string>>,
  previousTableNumber: number | null,
  matchingWeights: MatchingWeights,
  constraints: {
    pins: Map<string, number>
    repels: Set<string>
    attracts: Set<string>
  }
): number {
  let score = 0
  const guestId = guest._id.toString()

  // CONSTRAINT SCORING (highest priority)

  // Pin constraint - if guest is pinned to this table, give strong bonus; if pinned elsewhere, strong penalty
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

  // STANDARD SCORING

  // Prefer to stay at same table (slight preference)
  if (previousTableNumber === tableNumber) {
    score -= 0.1
  }

  // Calculate compatibility with current table guests
  if (currentTableGuests.length > 0) {
    // Department mixing
    const hasSameDepartment = currentTableGuests.some(
      (tg) => tg.department && tg.department === guest.department
    )
    if (hasSameDepartment) {
      score += matchingWeights.departmentMix
    }

    // Interest/attribute matching
    const compatibilitySum = currentTableGuests.reduce((sum, tableGuest) => {
      return sum + calculateGuestCompatibility(guest, tableGuest, matchingWeights)
    }, 0)
    // Invert: higher compatibility = lower score (better)
    score -= (compatibilitySum / currentTableGuests.length) * 2
  }

  // Penalize sitting with previous tablemates (for rounds > 1)
  const previousTablemates = tablemateHistory.get(guestId) || new Set()
  for (const tableGuest of currentTableGuests) {
    if (previousTablemates.has(tableGuest._id.toString())) {
      score += matchingWeights.repeatAvoidance * 3
    }
  }

  return score
}

/**
 * Generate preview assignments without committing
 */
export const generatePreview = mutation({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId)
    if (!event) throw new Error("Event not found")

    // Get all guests
    const guests = await ctx.db
      .query("guests")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect()

    if (guests.length === 0) {
      throw new Error("No guests to assign")
    }

    // Get matching config
    const matchingConfig = await ctx.db
      .query("matchingConfig")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .unique()

    const matchingWeights: MatchingWeights = matchingConfig?.weights
      ? { ...DEFAULT_WEIGHTS, ...matchingConfig.weights }
      : DEFAULT_WEIGHTS

    // Get constraints
    const constraintDocs = await ctx.db
      .query("seatingConstraints")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect()

    // Process constraints into lookup structures
    const constraints = {
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

    // Generate session ID
    const sessionId = generateSessionId()
    const createdAt = new Date().toISOString()
    const numberOfRounds = event.numberOfRounds || 1
    const tableSize = event.tableSize
    const numTables = Math.ceil(guests.length / tableSize)

    // Track assignments and history
    const assignments: Array<{
      guestId: Id<"guests">
      roundNumber: number
      tableNumber: number
    }> = []
    const tablemateHistory = new Map<string, Set<string>>()

    // Initialize tablemate history
    guests.forEach((g) => tablemateHistory.set(g._id.toString(), new Set()))

    // Generate assignments for each round
    for (let round = 1; round <= numberOfRounds; round++) {
      const tables = new Map<number, GuestDoc[]>()
      for (let t = 1; t <= numTables; t++) {
        tables.set(t, [])
      }

      // Pre-assign pinned guests first
      const pinnedGuests = new Set<string>()
      for (const [guestId, tableNum] of constraints.pins) {
        const guest = guests.find((g) => g._id.toString() === guestId)
        if (guest && tableNum <= numTables) {
          const tableGuests = tables.get(tableNum)!
          if (tableGuests.length < tableSize) {
            tableGuests.push(guest as GuestDoc)
            pinnedGuests.add(guestId)
            assignments.push({
              guestId: guest._id,
              roundNumber: round,
              tableNumber: tableNum,
            })
          }
        }
      }

      // Assign remaining guests
      const unassignedGuests = guests.filter(
        (g) => !pinnedGuests.has(g._id.toString())
      )

      // Shuffle for randomness
      const shuffled = [...unassignedGuests].sort(() => Math.random() - 0.5)

      for (const guest of shuffled) {
        // Get previous table for this guest
        const prevAssignment = assignments.find(
          (a) => a.guestId === guest._id && a.roundNumber === round - 1
        )
        const previousTableNumber = prevAssignment?.tableNumber ?? null

        // Find best table
        let bestTable = 1
        let bestScore = Infinity

        for (let t = 1; t <= numTables; t++) {
          const tableGuests = tables.get(t)!
          if (tableGuests.length >= tableSize) continue // Table full

          const score = calculateAssignmentScore(
            guest as GuestDoc,
            t,
            tableGuests,
            tablemateHistory,
            previousTableNumber,
            matchingWeights,
            constraints
          )

          if (score < bestScore) {
            bestScore = score
            bestTable = t
          }
        }

        // Assign to best table
        tables.get(bestTable)!.push(guest as GuestDoc)
        assignments.push({
          guestId: guest._id,
          roundNumber: round,
          tableNumber: bestTable,
        })
      }

      // Update tablemate history
      for (const [_, tableGuests] of tables) {
        for (const guest of tableGuests) {
          const guestHistory = tablemateHistory.get(guest._id.toString())!
          for (const mate of tableGuests) {
            if (mate._id !== guest._id) {
              guestHistory.add(mate._id.toString())
            }
          }
        }
      }
    }

    // Clear existing previews for this event
    const existingPreviews = await ctx.db
      .query("previewAssignments")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect()

    for (const preview of existingPreviews) {
      await ctx.db.delete(preview._id)
    }

    // Save preview assignments
    for (const assignment of assignments) {
      await ctx.db.insert("previewAssignments", {
        eventId: args.eventId,
        sessionId,
        guestId: assignment.guestId,
        roundNumber: assignment.roundNumber,
        tableNumber: assignment.tableNumber,
        createdAt,
      })
    }

    // Calculate quality metrics
    const constraintViolations = calculateConstraintViolations(
      assignments,
      constraints
    )

    return {
      sessionId,
      totalAssignments: assignments.length,
      rounds: numberOfRounds,
      constraintViolations,
    }
  },
})

/**
 * Calculate constraint violations in assignments
 */
function calculateConstraintViolations(
  assignments: Array<{
    guestId: Id<"guests">
    roundNumber: number
    tableNumber: number
  }>,
  constraints: {
    pins: Map<string, number>
    repels: Set<string>
    attracts: Set<string>
  }
): Array<{
  type: "pin" | "repel" | "attract"
  round: number
  description: string
}> {
  const violations: Array<{
    type: "pin" | "repel" | "attract"
    round: number
    description: string
  }> = []

  // Group assignments by round and table
  const byRoundAndTable = new Map<string, Set<string>>()
  for (const a of assignments) {
    const key = `${a.roundNumber}-${a.tableNumber}`
    if (!byRoundAndTable.has(key)) {
      byRoundAndTable.set(key, new Set())
    }
    byRoundAndTable.get(key)!.add(a.guestId.toString())
  }

  // Check pin violations
  for (const [guestId, pinnedTable] of constraints.pins) {
    for (const a of assignments.filter((a) => a.guestId.toString() === guestId)) {
      if (a.tableNumber !== pinnedTable) {
        violations.push({
          type: "pin",
          round: a.roundNumber,
          description: `Guest pinned to table ${pinnedTable} but assigned to table ${a.tableNumber}`,
        })
      }
    }
  }

  // Check repel violations
  for (const pair of constraints.repels) {
    const [guest1, guest2] = pair.split("-")
    for (const [key, guests] of byRoundAndTable) {
      if (guests.has(guest1) && guests.has(guest2)) {
        const round = parseInt(key.split("-")[0])
        violations.push({
          type: "repel",
          round,
          description: `Repelled guests seated together at table ${key.split("-")[1]}`,
        })
      }
    }
  }

  // Check attract violations (not being together in any round)
  for (const pair of constraints.attracts) {
    const [guest1, guest2] = pair.split("-")
    let togetherOnce = false
    for (const [_, guests] of byRoundAndTable) {
      if (guests.has(guest1) && guests.has(guest2)) {
        togetherOnce = true
        break
      }
    }
    if (!togetherOnce) {
      violations.push({
        type: "attract",
        round: 0,
        description: `Attracted guests never seated together in any round`,
      })
    }
  }

  return violations
}

/**
 * Get preview assignments for an event
 */
export const getPreview = query({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    const previews = await ctx.db
      .query("previewAssignments")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect()

    if (previews.length === 0) {
      return null
    }

    // Enrich with guest data
    const enriched = await Promise.all(
      previews.map(async (p) => {
        const guest = await ctx.db.get(p.guestId)
        return {
          ...p,
          guestName: guest?.name ?? "Unknown",
          guestDepartment: guest?.department,
        }
      })
    )

    // Group by round
    const byRound = new Map<number, typeof enriched>()
    for (const assignment of enriched) {
      if (!byRound.has(assignment.roundNumber)) {
        byRound.set(assignment.roundNumber, [])
      }
      byRound.get(assignment.roundNumber)!.push(assignment)
    }

    return {
      sessionId: previews[0].sessionId,
      createdAt: previews[0].createdAt,
      byRound: Object.fromEntries(byRound),
    }
  },
})

/**
 * Commit preview to actual assignments
 */
export const commitPreview = mutation({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId)
    if (!event) throw new Error("Event not found")

    // Get preview assignments
    const previews = await ctx.db
      .query("previewAssignments")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect()

    if (previews.length === 0) {
      throw new Error("No preview to commit")
    }

    // Clear existing real assignments
    const existingAssignments = await ctx.db
      .query("guestRoundAssignments")
      .withIndex("by_event_round", (q) => q.eq("eventId", args.eventId))
      .collect()

    for (const assignment of existingAssignments) {
      await ctx.db.delete(assignment._id)
    }

    // Copy preview to real assignments
    for (const preview of previews) {
      await ctx.db.insert("guestRoundAssignments", {
        eventId: args.eventId,
        guestId: preview.guestId,
        roundNumber: preview.roundNumber,
        tableNumber: preview.tableNumber,
      })

      // Update guest's primary table number (for backward compat)
      if (preview.roundNumber === 1) {
        await ctx.db.patch(preview.guestId, {
          tableNumber: preview.tableNumber,
        })
      }
    }

    // Mark event as assigned
    await ctx.db.patch(args.eventId, {
      isAssigned: true,
      currentRound: 0,
    })

    // Clear preview
    for (const preview of previews) {
      await ctx.db.delete(preview._id)
    }

    return { assignedCount: previews.length }
  },
})

/**
 * Discard preview without committing
 */
export const discardPreview = mutation({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    const previews = await ctx.db
      .query("previewAssignments")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect()

    for (const preview of previews) {
      await ctx.db.delete(preview._id)
    }

    return { deletedCount: previews.length }
  },
})

/**
 * Clean up expired previews (older than 30 minutes)
 */
export const cleanupExpiredPreviews = mutation({
  args: {},
  handler: async (ctx) => {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()

    // Get all previews - we'll filter by date
    const allPreviews = await ctx.db.query("previewAssignments").collect()

    const expiredPreviews = allPreviews.filter(
      (p) => p.createdAt < thirtyMinutesAgo
    )

    for (const preview of expiredPreviews) {
      await ctx.db.delete(preview._id)
    }

    return { deletedCount: expiredPreviews.length }
  },
})

/**
 * Update a single preview assignment (for drag-and-drop)
 */
export const updatePreviewAssignment = mutation({
  args: {
    eventId: v.id("events"),
    guestId: v.id("guests"),
    roundNumber: v.number(),
    newTableNumber: v.number(),
  },
  handler: async (ctx, args) => {
    // Find the preview assignment
    const previews = await ctx.db
      .query("previewAssignments")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect()

    const assignment = previews.find(
      (p) =>
        p.guestId === args.guestId && p.roundNumber === args.roundNumber
    )

    if (!assignment) {
      throw new Error("Preview assignment not found")
    }

    await ctx.db.patch(assignment._id, {
      tableNumber: args.newTableNumber,
    })
  },
})
