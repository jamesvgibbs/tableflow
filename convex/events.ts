import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { Id } from "./_generated/dataModel"

// List all events (sorted by createdAt descending)
export const list = query({
  args: {},
  handler: async (ctx) => {
    const events = await ctx.db.query("events").collect()
    // Sort by createdAt descending
    return events.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  },
})

// Get a single event by ID
export const get = query({
  args: { id: v.id("events") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id)
  },
})

// Get event with all guests and tables
export const getWithDetails = query({
  args: { id: v.id("events") },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.id)
    if (!event) return null

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

// Create a new event
export const create = mutation({
  args: {
    name: v.string(),
    tableSize: v.number(),
  },
  handler: async (ctx, args) => {
    const eventId = await ctx.db.insert("events", {
      name: args.name,
      tableSize: args.tableSize,
      createdAt: new Date().toISOString(),
      isAssigned: false,
      roundDuration: 30, // Default 30 minutes
    })
    return eventId
  },
})

// Update event name
export const updateName = mutation({
  args: {
    id: v.id("events"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { name: args.name })
  },
})

// Update table size
export const updateTableSize = mutation({
  args: {
    id: v.id("events"),
    tableSize: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { tableSize: args.tableSize })
  },
})

// Update round duration (can be changed anytime)
export const updateRoundDuration = mutation({
  args: {
    id: v.id("events"),
    roundDuration: v.number(),
  },
  handler: async (ctx, args) => {
    const duration = args.roundDuration > 0 ? args.roundDuration : undefined
    await ctx.db.patch(args.id, { roundDuration: duration })
  },
})

// Update number of rounds (handles regenerating assignments if event is assigned)
export const updateNumberOfRounds = mutation({
  args: {
    id: v.id("events"),
    numberOfRounds: v.number(),
  },
  handler: async (ctx, args) => {
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

      // Use scoring algorithm for new rounds
      const shuffledGuests = shuffleArray([...guests])

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
            previousTableNum
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

// Update round settings (numberOfRounds and roundDuration) - legacy, use specific mutations instead
export const updateRoundSettings = mutation({
  args: {
    id: v.id("events"),
    numberOfRounds: v.optional(v.number()),
    roundDuration: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
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

// Start the next round
export const startNextRound = mutation({
  args: { id: v.id("events") },
  handler: async (ctx, args) => {
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

// End the current round early (mark as complete, clear timer)
export const endCurrentRound = mutation({
  args: { id: v.id("events") },
  handler: async (ctx, args) => {
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

// Reset rounds back to "not started" state (keeps table assignments)
export const resetRounds = mutation({
  args: { id: v.id("events") },
  handler: async (ctx, args) => {
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

// Pause the current round timer
export const pauseRound = mutation({
  args: { id: v.id("events") },
  handler: async (ctx, args) => {
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

// Resume the current round timer
export const resumeRound = mutation({
  args: { id: v.id("events") },
  handler: async (ctx, args) => {
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

// Delete event and all associated guests/tables/assignments
export const remove = mutation({
  args: { id: v.id("events") },
  handler: async (ctx, args) => {
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
type GuestDoc = {
  _id: Id<"guests">
  name: string
  department?: string
  eventId: Id<"events">
}

// Calculate assignment score for placing a guest at a table
function calculateAssignmentScore(
  guest: GuestDoc,
  tableNumber: number,
  currentTableGuests: GuestDoc[],
  tablemateHistory: Map<string, Set<string>>,
  previousTableNumber: number | null
): number {
  // Weight all constraints equally
  const WEIGHTS = { departmentMix: 1.0, repeatTablemate: 1.0, travelDistance: 1.0 }

  // 1. Department Mix Score - count same-department guests at table
  const sameDeptCount = currentTableGuests.filter(
    (g) => g.department && g.department === guest.department
  ).length
  const departmentMixScore = sameDeptCount

  // 2. Repeat Tablemate Score - count previous tablemates at table
  const guestHistory = tablemateHistory.get(guest._id) || new Set()
  let repeatCount = 0
  for (const tableGuest of currentTableGuests) {
    if (guestHistory.has(tableGuest._id)) {
      repeatCount++
    }
  }
  const repeatTablemateScore = repeatCount

  // 3. Travel Distance Score - distance from previous table
  let travelDistanceScore = 0
  if (previousTableNumber !== null) {
    travelDistanceScore = Math.abs(tableNumber - previousTableNumber)
  }

  return (
    departmentMixScore * WEIGHTS.departmentMix +
    repeatTablemateScore * WEIGHTS.repeatTablemate +
    travelDistanceScore * WEIGHTS.travelDistance
  )
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

// Assign tables to guests (supports multiple rounds)
export const assignTables = mutation({
  args: { id: v.id("events") },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.id)
    if (!event) throw new Error("Event not found")

    const guests = await ctx.db
      .query("guests")
      .withIndex("by_event", (q) => q.eq("eventId", args.id))
      .collect()

    if (guests.length === 0) throw new Error("No guests to assign")

    const numberOfRounds = event.numberOfRounds || 1
    const numTables = Math.ceil(guests.length / event.tableSize)

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

      if (roundNum === 1) {
        // Round 1: Use original department-mixing algorithm
        const byDepartment: Record<string, GuestDoc[]> = {}
        const noDepartment: GuestDoc[] = []

        for (const guest of guests) {
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

        // Round-robin distribution
        const departments = shuffleArray(Object.keys(byDepartment))
        let tableIndex = 0

        for (const dept of departments) {
          for (const guest of byDepartment[dept]) {
            let attempts = 0
            while (attempts < numTables) {
              const targetIdx = (tableIndex + attempts) % numTables
              const targetTable = tables[targetIdx]
              if (targetTable.length < event.tableSize) {
                const sameDeptCount = targetTable.filter(
                  (g) => g.department === guest.department
                ).length
                if (sameDeptCount < 2 || attempts === numTables - 1) {
                  targetTable.push(guest)
                  roundAssignment.set(guest._id, targetIdx + 1)
                  tableIndex = (tableIndex + 1) % numTables
                  break
                }
              }
              attempts++
            }
          }
        }

        // Add guests without department
        const shuffledNoDept = shuffleArray(noDepartment)
        for (const guest of shuffledNoDept) {
          for (let i = 0; i < numTables; i++) {
            const idx = (tableIndex + i) % numTables
            if (tables[idx].length < event.tableSize) {
              tables[idx].push(guest)
              roundAssignment.set(guest._id, idx + 1)
              tableIndex = (idx + 1) % numTables
              break
            }
          }
        }
      } else {
        // Rounds 2+: Use scoring algorithm
        const shuffledGuests = shuffleArray([...guests])

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
              previousTableNum
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

    return { numTables, numGuests: guests.length, numberOfRounds }
  },
})

// Reset all assignments
export const resetAssignments = mutation({
  args: { id: v.id("events") },
  handler: async (ctx, args) => {
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

// Update theme preset
export const updateThemePreset = mutation({
  args: {
    id: v.id("events"),
    themePreset: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { themePreset: args.themePreset })
  },
})

// Update custom colors
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
    await ctx.db.patch(args.id, { customColors: args.customColors })
  },
})

// Clear custom theme (reset to default)
export const clearCustomTheme = mutation({
  args: { id: v.id("events") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      themePreset: undefined,
      customColors: undefined,
    })
  },
})
