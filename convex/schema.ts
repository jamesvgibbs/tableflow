import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  events: defineTable({
    // Owner (Clerk user ID)
    userId: v.optional(v.string()),  // Optional during migration, will become required
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
    // Email settings
    emailSettings: v.optional(v.object({
      senderName: v.string(),           // Display name for sender
      replyTo: v.optional(v.string()),  // Reply-to email address
      invitationSubject: v.optional(v.string()),    // Custom subject for invitations
      confirmationSubject: v.optional(v.string()),  // Custom subject for confirmations
    })),
    // Event type and terminology
    eventType: v.optional(v.string()),   // "networking", "wedding", "conference", "speed-dating", "corporate-mixer"
    eventTypeSettings: v.optional(v.object({
      guestLabel: v.string(),            // "Guest", "Attendee", "Participant", etc.
      guestLabelPlural: v.string(),      // "Guests", "Attendees", "Participants", etc.
      tableLabel: v.string(),            // "Table", "Station", "Group", etc.
      tableLabelPlural: v.string(),      // "Tables", "Stations", "Groups", etc.
      departmentLabel: v.string(),       // "Department", "Company", "Interest", etc.
      departmentLabelPlural: v.string(), // "Departments", "Companies", "Interests", etc.
      showRoundTimer: v.boolean(),       // Whether to show timer during rounds
    })),
    // Guest self-service settings
    selfServiceDeadline: v.optional(v.string()),         // ISO datetime - after this, guests can't edit
    selfServiceNotificationsEnabled: v.optional(v.boolean()), // Notify organizer of guest changes
  })
    .index("by_user", ["userId"]),

  guests: defineTable({
    eventId: v.id("events"),
    name: v.string(),
    department: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    tableNumber: v.optional(v.number()),
    qrCodeId: v.optional(v.string()),
    checkedIn: v.boolean(),
    // Dietary requirements
    dietary: v.optional(v.object({
      restrictions: v.array(v.string()),  // ["vegetarian", "nut-allergy", etc.]
      notes: v.optional(v.string()),      // Free-text additional notes
    })),
    // Matching attributes for intelligent seating
    attributes: v.optional(v.object({
      interests: v.optional(v.array(v.string())),  // ["AI", "Marketing", "Finance", etc.]
      jobLevel: v.optional(v.string()),            // "junior", "mid", "senior", "executive"
      goals: v.optional(v.array(v.string())),      // ["find-mentor", "recruit", "learn", "network", "partner"]
      customTags: v.optional(v.array(v.string())), // Custom tags for matching
    })),
    // Event-type specific attributes for seating
    familyName: v.optional(v.string()),            // Family/last name for grouping (wedding)
    side: v.optional(v.string()),                  // "bride" | "groom" | "both" (wedding)
    company: v.optional(v.string()),               // Company name (corporate/networking)
    team: v.optional(v.string()),                  // Team name (team building)
    managementLevel: v.optional(v.string()),       // "ic" | "manager" | "director" | "exec"
    isVip: v.optional(v.boolean()),                // VIP guest flag
    // Email tracking
    invitationSentAt: v.optional(v.string()),     // ISO timestamp
    confirmationSentAt: v.optional(v.string()),   // ISO timestamp
    emailUnsubscribed: v.optional(v.boolean()),   // Opt-out flag
    // Guest self-service portal
    selfServiceToken: v.optional(v.string()),     // Unique URL-safe token for guest access
    rsvpStatus: v.optional(v.string()),           // "confirmed" | "declined" | "pending"
    lastSelfServiceUpdate: v.optional(v.string()), // ISO timestamp of last update via self-service
    // Event day status
    status: v.optional(v.string()),               // "present" | "no-show" | "late" - null means none set
  })
    .index("by_event", ["eventId"])
    .index("by_qrCodeId", ["qrCodeId"])
    .index("by_name", ["name"])
    .index("by_selfServiceToken", ["selfServiceToken"]),

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

  // Email delivery logs
  emailLogs: defineTable({
    eventId: v.id("events"),
    guestId: v.optional(v.id("guests")),  // Optional - some emails may be event-wide
    type: v.string(),                      // "invitation" | "checkin_confirmation" | "reminder"
    status: v.string(),                    // "pending" | "sent" | "delivered" | "bounced" | "failed"
    resendId: v.optional(v.string()),      // Resend message ID for tracking
    sentAt: v.optional(v.string()),        // ISO timestamp when sent
    deliveredAt: v.optional(v.string()),   // ISO timestamp when delivered
    errorMessage: v.optional(v.string()),  // Error details if failed
    recipientEmail: v.string(),            // Email address sent to
  })
    .index("by_event", ["eventId"])
    .index("by_guest", ["guestId"])
    .index("by_resend_id", ["resendId"])
    .index("by_status", ["status"]),

  // Email attachments (stored in Convex file storage)
  emailAttachments: defineTable({
    eventId: v.id("events"),
    guestId: v.optional(v.id("guests")),   // null = event-wide attachment
    filename: v.string(),                   // Original filename
    storageId: v.id("_storage"),           // Convex file storage ID
    contentType: v.string(),               // MIME type
    size: v.number(),                      // File size in bytes
    uploadedAt: v.string(),                // ISO timestamp
  })
    .index("by_event", ["eventId"])
    .index("by_guest", ["guestId"])
    .index("by_event_guest", ["eventId", "guestId"]),

  // Matching algorithm configuration per event
  matchingConfig: defineTable({
    eventId: v.id("events"),
    // Seating configuration wizard (new approach)
    seatingType: v.optional(v.string()),  // "wedding" | "corporate" | "networking" | "team" | "social" | "custom"
    answers: v.optional(v.record(v.string(), v.string())),  // Question ID -> answer mapping
    vipTables: v.optional(v.array(v.number())),  // Table numbers designated for VIPs (configurable)
    // Weight values range from -1 to 1 (derived from answers, hidden from user)
    // Positive = encourage, Negative = discourage, 0 = ignore
    weights: v.object({
      departmentMix: v.number(),        // Mix people from different departments (default: 0.8)
      interestAffinity: v.number(),     // Group people with similar interests (default: 0.3)
      jobLevelDiversity: v.number(),    // Mix different job levels (default: 0.5)
      goalCompatibility: v.number(),    // Match complementary goals (default: 0.4)
      repeatAvoidance: v.number(),      // Avoid sitting with same people (default: 0.9)
    }),
    // Cross-event novelty preference: 0-1 where 0 = ignore history, 1 = strongly prefer new connections
    noveltyPreference: v.optional(v.number()),  // Default: 0.5
    // Optional: custom interest categories for this event
    interestOptions: v.optional(v.array(v.string())),
    // Optional: custom goal options for this event
    goalOptions: v.optional(v.array(v.string())),
    updatedAt: v.string(),              // ISO timestamp
  })
    .index("by_event", ["eventId"]),

  // Seating constraints for manual control (Enterprise Tooling)
  seatingConstraints: defineTable({
    eventId: v.id("events"),
    type: v.string(),                      // "pin" | "repel" | "attract"
    guestIds: v.array(v.id("guests")),     // Guest(s) involved in constraint
    tableNumber: v.optional(v.number()),   // For "pin" constraints only
    reason: v.optional(v.string()),        // Optional explanation
    createdAt: v.string(),                 // ISO timestamp
  })
    .index("by_event", ["eventId"])
    .index("by_guest", ["guestIds"]),

  // Preview assignments for "Generate Preview" before committing
  previewAssignments: defineTable({
    eventId: v.id("events"),
    sessionId: v.string(),                 // Unique session identifier
    guestId: v.id("guests"),
    roundNumber: v.number(),
    tableNumber: v.number(),
    createdAt: v.string(),                 // ISO timestamp
  })
    .index("by_session", ["sessionId"])
    .index("by_event", ["eventId"]),

  // Email queue for rate-limited sending (2 emails/second on Resend free tier)
  emailQueue: defineTable({
    eventId: v.id("events"),
    guestId: v.id("guests"),
    type: v.string(),                      // "invitation" | "checkin_confirmation"
    priority: v.number(),                  // 1 = high (check-in), 10 = low (bulk)
    status: v.string(),                    // "pending" | "processing" | "sent" | "failed"
    attempts: v.number(),                  // Current attempt count
    maxAttempts: v.number(),               // Default 3
    nextAttemptAt: v.number(),             // Timestamp for retry backoff
    templateData: v.object({               // Data needed to send
      baseUrl: v.optional(v.string()),
    }),
    errorMessage: v.optional(v.string()),
    resendId: v.optional(v.string()),
    createdAt: v.number(),
    processedAt: v.optional(v.number()),
  })
    .index("by_status_priority", ["status", "priority", "nextAttemptAt"])
    .index("by_event", ["eventId"])
    .index("by_guest", ["guestId"]),

  // Singleton to track email processor state
  emailQueueStatus: defineTable({
    isProcessing: v.boolean(),
    lastProcessedAt: v.optional(v.number()),
  }),

  // =============================================================================
  // Breakout Rooms & Sessions
  // =============================================================================

  // Physical rooms for breakout sessions
  rooms: defineTable({
    eventId: v.id("events"),
    name: v.string(),                         // "Main Hall", "Room A", etc.
    capacity: v.optional(v.number()),         // Max people this room can hold
    location: v.optional(v.string()),         // "Building 2, Floor 3"
    description: v.optional(v.string()),      // Additional details
  })
    .index("by_event", ["eventId"]),

  // Sessions/workshops within an event
  sessions: defineTable({
    eventId: v.id("events"),
    name: v.string(),                         // "Opening Keynote", "Workshop A"
    description: v.optional(v.string()),      // What the session is about
    startTime: v.optional(v.string()),        // ISO datetime
    endTime: v.optional(v.string()),          // ISO datetime
    roomId: v.optional(v.id("rooms")),        // Which room this session is in
    hasTableSeating: v.optional(v.boolean()), // Whether to use table assignments
    maxCapacity: v.optional(v.number()),      // Optional capacity limit
  })
    .index("by_event", ["eventId"])
    .index("by_room", ["roomId"]),

  // Junction table for guest-session assignments
  sessionAssignments: defineTable({
    sessionId: v.id("sessions"),
    guestId: v.id("guests"),
    eventId: v.id("events"),                  // Denormalized for efficient queries
    createdAt: v.string(),                    // ISO timestamp
  })
    .index("by_session", ["sessionId"])
    .index("by_guest", ["guestId"])
    .index("by_event", ["eventId"]),

  // =============================================================================
  // Seating History (Cross-Event Memory)
  // =============================================================================

  // Track who sat together across events for the algorithm's "novelty" preference
  // Uses email as identifier so history persists even if guests are re-imported
  seatingHistory: defineTable({
    organizerId: v.string(),                  // Clerk user ID of the organizer
    guestEmail: v.string(),                   // Email of guest A (normalized lowercase)
    partnerEmail: v.string(),                 // Email of guest B (normalized lowercase)
    eventId: v.id("events"),                  // Which event this occurred at
    roundNumber: v.number(),                  // Which round they sat together
    timestamp: v.string(),                    // ISO timestamp when recorded
  })
    .index("by_organizer_guest", ["organizerId", "guestEmail"])
    .index("by_organizer_pair", ["organizerId", "guestEmail", "partnerEmail"])
    .index("by_event", ["eventId"]),
})
