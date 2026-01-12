import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  events: defineTable({
    name: v.string(),
    tableSize: v.number(),
    createdAt: v.string(),
    isAssigned: v.boolean(),
    // Multi-round support
    numberOfRounds: v.optional(v.number()),      // Default 1
    roundDuration: v.optional(v.number()),       // Minutes per round (optional timer)
    currentRound: v.optional(v.number()),        // 0 = not started, 1-N = active round
    roundStartedAt: v.optional(v.string()),      // ISO timestamp when current round started
    isPaused: v.optional(v.boolean()),           // Whether the timer is paused
    pausedTimeRemaining: v.optional(v.number()), // Milliseconds remaining when paused
    // Theme customization
    themePreset: v.optional(v.string()),         // "desert-disco", "groovy", etc.
    customColors: v.optional(v.object({
      primary: v.string(),      // Main brand color (buttons, active states)
      secondary: v.string(),    // Secondary/background accent
      accent: v.string(),       // Highlight/attention color
      background: v.string(),   // Page background
      foreground: v.string(),   // Text color
      muted: v.string(),        // Subtle backgrounds/borders
    })),
  }),

  guests: defineTable({
    eventId: v.id("events"),
    name: v.string(),
    department: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    tableNumber: v.optional(v.number()),
    qrCodeId: v.optional(v.string()),
    checkedIn: v.boolean(),
  })
    .index("by_event", ["eventId"])
    .index("by_qrCodeId", ["qrCodeId"])
    .index("by_name", ["name"]),

  tables: defineTable({
    eventId: v.id("events"),
    tableNumber: v.number(),
    qrCodeId: v.string(),
  })
    .index("by_event", ["eventId"])
    .index("by_qrCodeId", ["qrCodeId"]),

  // Junction table for multi-round table assignments
  guestRoundAssignments: defineTable({
    guestId: v.id("guests"),
    eventId: v.id("events"),
    roundNumber: v.number(),
    tableNumber: v.number(),
  })
    .index("by_guest", ["guestId"])
    .index("by_event_round", ["eventId", "roundNumber"])
    .index("by_event_guest", ["eventId", "guestId"]),
})
