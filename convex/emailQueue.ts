import { v } from "convex/values"
import { mutation, internalMutation, internalQuery, internalAction } from "./_generated/server"
import { internal } from "./_generated/api"
import type { Id } from "./_generated/dataModel"

// Priority levels (lower = higher priority)
export const EMAIL_PRIORITY = {
  CHECKIN_CONFIRMATION: 1,  // Guest waiting at door
  INVITATION: 10,           // Bulk sends can wait
} as const

// Queue status values
export const QUEUE_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  SENT: "sent",
  FAILED: "failed",
} as const

// Retry backoff delays in milliseconds
const RETRY_BACKOFFS = [
  60 * 1000,      // 1 minute
  5 * 60 * 1000,  // 5 minutes
  15 * 60 * 1000, // 15 minutes
]

// Processing interval (Resend rate limit: 2/sec, so 500ms between emails)
const PROCESS_INTERVAL_MS = 500

/**
 * Enqueue an email for sending
 * This is the public entry point - call this to add emails to the queue
 */
export const enqueue = mutation({
  args: {
    eventId: v.id("events"),
    guestId: v.id("guests"),
    type: v.string(),
    priority: v.number(),
    templateData: v.object({
      baseUrl: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const now = Date.now()

    // Add to queue
    await ctx.db.insert("emailQueue", {
      eventId: args.eventId,
      guestId: args.guestId,
      type: args.type,
      priority: args.priority,
      status: QUEUE_STATUS.PENDING,
      attempts: 0,
      maxAttempts: 3,
      nextAttemptAt: now,
      templateData: args.templateData,
      createdAt: now,
    })

    // Start the processor if not already running
    await ctx.scheduler.runAfter(0, internal.emailQueue.maybeStartProcessor, {})
  },
})

/**
 * Check if processor should start, and if so, start it
 */
export const maybeStartProcessor = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Get or create the status singleton
    const status = await ctx.db.query("emailQueueStatus").first()

    if (status) {
      if (status.isProcessing) {
        // Processor already running, nothing to do
        return
      }
      // Mark as processing
      await ctx.db.patch(status._id, { isProcessing: true })
    } else {
      // Create status doc
      await ctx.db.insert("emailQueueStatus", {
        isProcessing: true,
      })
    }

    // Schedule the processor to run
    await ctx.scheduler.runAfter(0, internal.emailQueue.processNextEmail, {})
  },
})

/**
 * Get the next email ready to be sent
 */
export const getNextEmail = internalQuery({
  args: {},
  handler: async (ctx) => {
    const now = Date.now()

    // Find pending emails ready to be processed, ordered by priority then creation time
    const pending = await ctx.db
      .query("emailQueue")
      .withIndex("by_status_priority", (q) =>
        q.eq("status", QUEUE_STATUS.PENDING)
      )
      .filter((q) => q.lte(q.field("nextAttemptAt"), now))
      .first()

    return pending
  },
})

/**
 * Mark an email as processing
 */
export const markProcessing = internalMutation({
  args: { emailId: v.id("emailQueue") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.emailId, {
      status: QUEUE_STATUS.PROCESSING,
    })
  },
})

/**
 * Mark an email as successfully sent and remove from queue
 * The emailLogs table has the permanent record, so we can delete the queue entry
 */
export const markSent = internalMutation({
  args: {
    emailId: v.id("emailQueue"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.emailId)
  },
})

/**
 * Mark an email as failed, with retry logic
 */
export const markFailed = internalMutation({
  args: {
    emailId: v.id("emailQueue"),
    errorMessage: v.string(),
  },
  handler: async (ctx, args) => {
    const email = await ctx.db.get(args.emailId)
    if (!email) return

    const newAttempts = email.attempts + 1
    const now = Date.now()

    if (newAttempts >= email.maxAttempts) {
      // Permanently failed after max attempts
      await ctx.db.patch(args.emailId, {
        status: QUEUE_STATUS.FAILED,
        attempts: newAttempts,
        errorMessage: args.errorMessage,
        processedAt: now,
      })
    } else {
      // Schedule retry with backoff
      const backoffIndex = Math.min(newAttempts - 1, RETRY_BACKOFFS.length - 1)
      const backoffMs = RETRY_BACKOFFS[backoffIndex]

      await ctx.db.patch(args.emailId, {
        status: QUEUE_STATUS.PENDING,
        attempts: newAttempts,
        nextAttemptAt: now + backoffMs,
        errorMessage: args.errorMessage,
      })
    }
  },
})

/**
 * Set the processor running state
 */
export const setProcessorState = internalMutation({
  args: { isProcessing: v.boolean() },
  handler: async (ctx, args) => {
    const status = await ctx.db.query("emailQueueStatus").first()
    if (status) {
      await ctx.db.patch(status._id, {
        isProcessing: args.isProcessing,
        lastProcessedAt: Date.now(),
      })
    }
  },
})

/**
 * The main processor action - sends one email and schedules the next
 */
export const processNextEmail = internalAction({
  args: {},
  handler: async (ctx) => {
    // Get the next email to process
    const email = await ctx.runQuery(internal.emailQueue.getNextEmail, {})

    if (!email) {
      // No more emails to process, stop the processor
      await ctx.runMutation(internal.emailQueue.setProcessorState, {
        isProcessing: false,
      })
      return
    }

    // Mark as processing
    await ctx.runMutation(internal.emailQueue.markProcessing, {
      emailId: email._id,
    })

    // Send the email based on type
    try {
      let result: { success: boolean; resendId?: string; error?: string }

      if (email.type === "invitation") {
        result = await ctx.runAction(internal.email.sendInvitationDirect, {
          guestId: email.guestId,
          baseUrl: email.templateData.baseUrl || "",
        })
      } else if (email.type === "checkin_confirmation") {
        result = await ctx.runAction(internal.email.sendCheckInConfirmationDirect, {
          guestId: email.guestId,
          baseUrl: email.templateData.baseUrl,
        })
      } else {
        throw new Error(`Unknown email type: ${email.type}`)
      }

      if (result.success) {
        await ctx.runMutation(internal.emailQueue.markSent, {
          emailId: email._id,
        })
      } else {
        await ctx.runMutation(internal.emailQueue.markFailed, {
          emailId: email._id,
          errorMessage: result.error || "Unknown error",
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      await ctx.runMutation(internal.emailQueue.markFailed, {
        emailId: email._id,
        errorMessage,
      })
    }

    // Schedule the next processing run after the rate limit delay
    await ctx.scheduler.runAfter(
      PROCESS_INTERVAL_MS,
      internal.emailQueue.processNextEmail,
      {}
    )
  },
})

/**
 * Reset pending emails and restart the processor
 * Use this when the queue is stuck
 */
export const resetQueue = mutation({
  args: { eventId: v.optional(v.id("events")) },
  handler: async (ctx, args) => {
    const now = Date.now()

    // Get emails to reset
    const eventId = args.eventId
    const query = eventId
      ? ctx.db.query("emailQueue").withIndex("by_event", (q) => q.eq("eventId", eventId))
      : ctx.db.query("emailQueue")

    const emails = await query.collect()

    // Reset all non-sent emails
    let resetCount = 0
    for (const email of emails) {
      if (email.status !== "sent") {
        await ctx.db.patch(email._id, {
          status: QUEUE_STATUS.PENDING,
          attempts: 0,
          nextAttemptAt: now,
          errorMessage: undefined,
        })
        resetCount++
      }
    }

    // Reset processor state
    const status = await ctx.db.query("emailQueueStatus").first()
    if (status) {
      await ctx.db.patch(status._id, { isProcessing: false })
    }

    // Restart the processor
    await ctx.scheduler.runAfter(0, internal.emailQueue.maybeStartProcessor, {})

    return { resetCount, message: "Queue reset and processor restarted" }
  },
})

/**
 * Get queue statistics for an event
 */
export const getQueueStats = internalQuery({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const emails = await ctx.db
      .query("emailQueue")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect()

    const stats = {
      pending: 0,
      processing: 0,
      sent: 0,
      failed: 0,
      total: emails.length,
    }

    for (const email of emails) {
      if (email.status in stats) {
        stats[email.status as keyof typeof stats]++
      }
    }

    return stats
  },
})
