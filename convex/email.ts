import { v } from "convex/values"
import { action, internalAction, internalMutation, internalQuery, mutation, query, QueryCtx, MutationCtx } from "./_generated/server"
import { internal } from "./_generated/api"
import type { Id, Doc } from "./_generated/dataModel"
import { resolveThemeColors, getContrastColor } from "./themes"
import type { ThemeColors } from "./themes"
import { EMAIL_PRIORITY } from "./emailQueue"
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

/**
 * Type guard to validate customColors has the expected shape
 */
function isValidThemeColors(obj: unknown): obj is ThemeColors {
  if (!obj || typeof obj !== "object") return false
  const colors = obj as Record<string, unknown>
  return (
    typeof colors.primary === "string" &&
    typeof colors.secondary === "string" &&
    typeof colors.accent === "string" &&
    typeof colors.background === "string" &&
    typeof colors.foreground === "string" &&
    typeof colors.muted === "string"
  )
}

/**
 * Helper to resolve theme colors from an event document
 * Validates customColors shape at runtime for type safety
 */
function getEventThemeColors(event: Doc<"events">): ThemeColors {
  const customColors = isValidThemeColors(event.customColors)
    ? event.customColors
    : undefined
  return resolveThemeColors(event.themePreset, customColors)
}

/**
 * Escape HTML special characters to prevent XSS
 * Used for user-provided content in email templates
 */
function escapeHtml(str: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }
  return str.replace(/[&<>"']/g, (c) => htmlEntities[c] || c)
}

// Email type constants
export const EMAIL_TYPES = {
  INVITATION: "invitation",
  CHECKIN_CONFIRMATION: "checkin_confirmation",
  REMINDER: "reminder",
  GUEST_CHANGE_NOTIFICATION: "guest_change_notification",
} as const

// Email status constants
export const EMAIL_STATUS = {
  PENDING: "pending",
  SENT: "sent",
  DELIVERED: "delivered",
  BOUNCED: "bounced",
  FAILED: "failed",
} as const

/**
 * Replace template placeholders with actual values
 */
function replacePlaceholders(
  template: string,
  data: {
    guestName: string
    eventName: string
    tableNumber?: number | string
    qrCodeUrl?: string
    guestPortalUrl?: string
    roundAssignments?: { roundNumber: number; tableNumber: number }[]
    theme?: ThemeColors
  }
): string {
  let result = template

  // Get theme colors (or defaults)
  const theme = data.theme || {
    primary: "#6700D9",
    secondary: "#F0F1FF",
    accent: "#00F0D2",
    background: "#FAFAFA",
    foreground: "#1A1A2E",
    muted: "#E5E5E5",
  }
  const primaryTextColor = getContrastColor(theme.primary)
  const secondaryTextColor = getContrastColor(theme.secondary)

  // Handle conditional blocks first: {{#if qr_code_url}}...{{/if}}
  const conditionalRegex = /\{\{#if qr_code_url\}\}([\s\S]*?)\{\{\/if\}\}/g
  if (data.qrCodeUrl) {
    // Keep the content inside the conditional
    result = result.replace(conditionalRegex, "$1")
  } else {
    // Remove the entire conditional block
    result = result.replace(conditionalRegex, "")
  }

  // Handle conditional blocks for guest portal: {{#if guest_portal_url}}...{{/if}}
  const portalConditionalRegex = /\{\{#if guest_portal_url\}\}([\s\S]*?)\{\{\/if\}\}/g
  if (data.guestPortalUrl) {
    result = result.replace(portalConditionalRegex, "$1")
  } else {
    result = result.replace(portalConditionalRegex, "")
  }

  // Build replacement map for single-pass replacement (more efficient at scale)
  const replacements: Record<string, string> = {
    // User content (escaped for XSS prevention)
    "{{guest_name}}": escapeHtml(data.guestName),
    "{{event_name}}": escapeHtml(data.eventName),
    "{{table_number}}": String(data.tableNumber || "TBD"),
    "{{qr_code_url}}": data.qrCodeUrl || "",
    "{{guest_portal_url}}": data.guestPortalUrl || "",
    // Theme colors
    "{{primary_color}}": theme.primary,
    "{{secondary_color}}": theme.secondary,
    "{{accent_color}}": theme.accent,
    "{{background_color}}": theme.background,
    "{{foreground_color}}": theme.foreground,
    "{{muted_color}}": theme.muted,
    "{{primary_text_color}}": primaryTextColor,
    "{{secondary_text_color}}": secondaryTextColor,
  }

  // Single-pass replacement using pattern matching
  const placeholderPattern = /\{\{(?:guest_name|event_name|table_number|qr_code_url|guest_portal_url|primary_color|secondary_color|accent_color|background_color|foreground_color|muted_color|primary_text_color|secondary_text_color)\}\}/g
  result = result.replace(placeholderPattern, (match) => replacements[match] ?? match)

  // Handle round assignments if present (multi-round events)
  if (data.roundAssignments && data.roundAssignments.length > 1) {
    // Build a visual table for multi-round events using theme colors
    const rows = data.roundAssignments
      .map((a, index) => {
        const isFirst = index === 0
        const rowBg = isFirst ? `${theme.primary}20` : "transparent"
        const indicator = isFirst ? `<span style="color: ${theme.accent}; font-weight: 600;"> ← Start here</span>` : ""
        return `
          <tr style="background: ${rowBg};">
            <td style="padding: 12px 16px; border-bottom: 1px solid ${theme.muted}40; color: ${secondaryTextColor}; font-weight: ${isFirst ? "600" : "400"};">Round ${a.roundNumber}</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid ${theme.muted}40; text-align: center; color: ${secondaryTextColor}; font-weight: ${isFirst ? "700" : "500"}; font-size: ${isFirst ? "18px" : "16px"};">Table ${a.tableNumber}${indicator}</td>
          </tr>`
      })
      .join("")

    const assignmentsHtml = `
      <div style="margin: 24px 0; background: ${theme.secondary}; padding: 20px; border-radius: 12px;">
        <p style="color: ${secondaryTextColor}; font-weight: 600; margin: 0 0 8px 0;">This event has multiple rounds.</p>
        <p style="color: ${secondaryTextColor}; opacity: 0.8; font-size: 14px; margin: 0 0 16px 0;">You'll switch tables between rounds to meet new people. Listen for announcements.</p>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="padding: 10px 16px; text-align: left; font-size: 12px; text-transform: uppercase; color: ${secondaryTextColor}; opacity: 0.6; letter-spacing: 1px; border-bottom: 2px solid ${theme.muted}40;">Round</th>
              <th style="padding: 10px 16px; text-align: center; font-size: 12px; text-transform: uppercase; color: ${secondaryTextColor}; opacity: 0.6; letter-spacing: 1px; border-bottom: 2px solid ${theme.muted}40;">Your Table</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>`
    result = result.replace(/\{\{round_assignments\}\}/g, assignmentsHtml)
  } else {
    // Single round - no need to show schedule
    result = result.replace(/\{\{round_assignments\}\}/g, "")
  }

  return result
}

/**
 * Default email templates
 */
const DEFAULT_TEMPLATES = {
  invitation: {
    subject: "You're Invited: {{event_name}}",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: {{background_color}}; padding: 32px; border-radius: 16px;">
        <h1 style="color: {{foreground_color}}; margin-top: 0;">You're Invited!</h1>
        <p style="color: {{foreground_color}};">Hello {{guest_name}},</p>
        <p style="color: {{foreground_color}};">You're invited to <strong>{{event_name}}</strong>.</p>
        <p style="color: {{foreground_color}};">Scan the QR code below or click the link when you arrive to find your table assignment.</p>
        {{#if qr_code_url}}
        <p style="margin: 24px 0;"><a href="{{qr_code_url}}" style="display: inline-block; background: {{primary_color}}; color: {{primary_text_color}}; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Find Your Table</a></p>
        {{/if}}
        {{#if guest_portal_url}}
        <div style="margin: 24px 0; padding: 16px; background: {{secondary_color}}; border-radius: 8px;">
          <p style="margin: 0 0 12px 0; color: {{secondary_text_color}}; font-size: 14px;">Need to update your dietary requirements or RSVP status?</p>
          <a href="{{guest_portal_url}}" style="color: {{primary_color}}; text-decoration: none; font-weight: 600; font-size: 14px;">Update Your Details &rarr;</a>
        </div>
        {{/if}}
        <p style="color: {{foreground_color}}; opacity: 0.8;">We look forward to seeing you!</p>
      </div>
    `,
  },
  checkin_confirmation: {
    subject: "You're Checked In: {{event_name}}",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: {{background_color}}; padding: 32px; border-radius: 16px;">
        <h1 style="color: {{foreground_color}}; margin-top: 0;">You're Checked In!</h1>
        <p style="color: {{foreground_color}};">Hello {{guest_name}},</p>
        <p style="color: {{foreground_color}};">You've successfully checked in to <strong>{{event_name}}</strong>.</p>
        <div style="background: {{primary_color}}; padding: 24px; border-radius: 12px; text-align: center; margin: 24px 0;">
          <p style="margin: 0; color: {{primary_text_color}}; opacity: 0.8; font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">Start at Table</p>
          <p style="margin: 12px 0 0 0; font-size: 64px; font-weight: bold; color: {{primary_text_color}};">{{table_number}}</p>
        </div>
        {{round_assignments}}
        {{#if guest_portal_url}}
        <div style="margin: 24px 0; padding: 16px; background: {{secondary_color}}; border-radius: 8px;">
          <p style="margin: 0 0 12px 0; color: {{secondary_text_color}}; font-size: 14px;">Need to update your dietary requirements?</p>
          <a href="{{guest_portal_url}}" style="color: {{primary_color}}; text-decoration: none; font-weight: 600; font-size: 14px;">Update Your Details &rarr;</a>
        </div>
        {{/if}}
        <p style="color: {{foreground_color}}; opacity: 0.8; margin-top: 24px;">Enjoy the event!</p>
      </div>
    `,
  },
}

// Internal query to get guest data for email
export const getGuestForEmail = internalQuery({
  args: { guestId: v.id("guests") },
  handler: async (ctx, args) => {
    const guest = await ctx.db.get(args.guestId)
    if (!guest) return null

    const event = await ctx.db.get(guest.eventId)
    if (!event) return null

    // Get round assignments
    const roundAssignments = await ctx.db
      .query("guestRoundAssignments")
      .withIndex("by_guest", (q) => q.eq("guestId", args.guestId))
      .collect()

    // Get event-wide attachments
    const attachments = await ctx.db
      .query("emailAttachments")
      .withIndex("by_event", (q) => q.eq("eventId", guest.eventId))
      .filter((q) => q.eq(q.field("guestId"), undefined))
      .collect()

    return {
      guest,
      event,
      roundAssignments: roundAssignments.sort((a, b) => a.roundNumber - b.roundNumber),
      attachments,
    }
  },
})

// Internal query to get guests for bulk email
export const getGuestsForBulkEmail = internalQuery({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId)
    if (!event) return null

    const guests = await ctx.db
      .query("guests")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect()

    // Filter to only guests with email addresses who haven't unsubscribed
    // Type guard ensures TypeScript knows email is defined
    const eligibleGuests = guests.filter(
      (g): g is typeof g & { email: string } => !!g.email && !g.emailUnsubscribed
    )

    // Get event-wide attachments
    const attachments = await ctx.db
      .query("emailAttachments")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .filter((q) => q.eq(q.field("guestId"), undefined))
      .collect()

    return {
      event,
      guests: eligibleGuests,
      attachments,
    }
  },
})

// Internal mutation to log email
export const logEmail = internalMutation({
  args: {
    eventId: v.id("events"),
    guestId: v.optional(v.id("guests")),
    type: v.string(),
    status: v.string(),
    recipientEmail: v.string(),
    resendId: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("emailLogs", {
      eventId: args.eventId,
      guestId: args.guestId,
      type: args.type,
      status: args.status,
      recipientEmail: args.recipientEmail,
      resendId: args.resendId,
      sentAt: args.status === EMAIL_STATUS.SENT ? new Date().toISOString() : undefined,
      errorMessage: args.errorMessage,
    })
  },
})

// Internal mutation to update guest email timestamp
export const updateGuestEmailTimestamp = internalMutation({
  args: {
    guestId: v.id("guests"),
    field: v.union(v.literal("invitationSentAt"), v.literal("confirmationSentAt")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.guestId, {
      [args.field]: new Date().toISOString(),
    })
  },
})

// Internal mutation to update email log status (for webhooks)
export const updateEmailLogStatus = internalMutation({
  args: {
    resendId: v.string(),
    status: v.string(),
    errorMessage: v.optional(v.string()),
    deliveredAt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Find email log by resendId
    const emailLog = await ctx.db
      .query("emailLogs")
      .withIndex("by_resend_id", (q) => q.eq("resendId", args.resendId))
      .first()

    if (!emailLog) {
      console.warn(`Email log not found for resendId: ${args.resendId}`)
      return
    }

    // Update the status
    await ctx.db.patch(emailLog._id, {
      status: args.status,
      errorMessage: args.errorMessage,
      deliveredAt: args.deliveredAt,
    })
  },
})

/**
 * Send invitation email to a single guest (via queue) (with ownership check)
 * This enqueues the email for rate-limited sending
 */
export const sendInvitation = mutation({
  args: {
    guestId: v.id("guests"),
    baseUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx)
    await verifyGuestOwnership(ctx, args.guestId, userId)

    const guest = await ctx.db.get(args.guestId)
    if (!guest) {
      throw new Error("Guest not found")
    }

    // Check free tier limit for email campaigns
    const tier = await getEventTier(ctx, guest.eventId)
    if (tier === "free" && !FREE_LIMITS.allowEmailCampaigns) {
      throw new Error(TIER_LIMIT_ERRORS.EMAIL_CAMPAIGNS)
    }

    if (!guest.email) {
      throw new Error("Guest has no email address")
    }

    if (guest.emailUnsubscribed) {
      throw new Error("Guest has unsubscribed from emails")
    }

    // Enqueue the email
    await ctx.db.insert("emailQueue", {
      eventId: guest.eventId,
      guestId: args.guestId,
      type: EMAIL_TYPES.INVITATION,
      priority: EMAIL_PRIORITY.INVITATION,
      status: "pending",
      attempts: 0,
      maxAttempts: 3,
      nextAttemptAt: Date.now(),
      templateData: { baseUrl: args.baseUrl },
      createdAt: Date.now(),
    })

    // Start the processor if not already running
    await ctx.scheduler.runAfter(0, internal.emailQueue.maybeStartProcessor, {})

    return { queued: true }
  },
})

/**
 * Internal action to send invitation email directly (called by queue processor)
 */
export const sendInvitationDirect = internalAction({
  args: {
    guestId: v.id("guests"),
    baseUrl: v.string(),
  },
  handler: async (ctx, args): Promise<{ success: boolean; resendId?: string; error?: string }> => {
    const RESEND_API_KEY = process.env.RESEND_API_KEY
    if (!RESEND_API_KEY) {
      return { success: false, error: "RESEND_API_KEY is not configured" }
    }

    // Get guest data
    const data = await ctx.runQuery(internal.email.getGuestForEmail, {
      guestId: args.guestId,
    })
    if (!data) {
      return { success: false, error: "Guest not found" }
    }

    const { guest, event } = data

    if (!guest.email) {
      return { success: false, error: "Guest has no email address" }
    }

    if (guest.emailUnsubscribed) {
      return { success: false, error: "Guest has unsubscribed from emails" }
    }

    // Build QR code URL
    const qrCodeUrl = guest.qrCodeId
      ? `${args.baseUrl}/scan/${guest.qrCodeId}`
      : undefined

    // Build guest portal URL (if guest has a self-service token)
    const guestPortalUrl = guest.selfServiceToken
      ? `${args.baseUrl}/guest/${guest.selfServiceToken}`
      : undefined

    // Resolve theme colors
    const theme = getEventThemeColors(event)

    // Get email settings
    const senderName = event.emailSettings?.senderName || "Seatherder"
    const senderEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev"
    const subject = replacePlaceholders(
      event.emailSettings?.invitationSubject || DEFAULT_TEMPLATES.invitation.subject,
      {
        guestName: guest.name,
        eventName: event.name,
        qrCodeUrl,
        guestPortalUrl,
        theme,
      }
    )
    const html = replacePlaceholders(DEFAULT_TEMPLATES.invitation.html, {
      guestName: guest.name,
      eventName: event.name,
      qrCodeUrl,
      guestPortalUrl,
      theme,
    })

    // Prepare attachments (fetch from storage and convert to base64)
    const emailAttachments: { filename: string; content: string }[] = []
    for (const attachment of data.attachments) {
      const url = await ctx.storage.getUrl(attachment.storageId)
      if (url) {
        try {
          const response = await fetch(url)
          const arrayBuffer = await response.arrayBuffer()
          const base64 = Buffer.from(arrayBuffer).toString("base64")
          emailAttachments.push({
            filename: attachment.filename,
            content: base64,
          })
        } catch (e) {
          console.error(`Failed to fetch attachment ${attachment.filename}:`, e)
        }
      }
    }

    // Send via Resend
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `${senderName} <${senderEmail}>`,
          to: guest.email,
          reply_to: event.emailSettings?.replyTo,
          subject,
          html,
          attachments: emailAttachments.length > 0 ? emailAttachments : undefined,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        // Log failure
        await ctx.runMutation(internal.email.logEmail, {
          eventId: event._id,
          guestId: guest._id,
          type: EMAIL_TYPES.INVITATION,
          status: EMAIL_STATUS.FAILED,
          recipientEmail: guest.email,
          errorMessage: result.message || "Unknown error",
        })
        return { success: false, error: result.message || "Failed to send email" }
      }

      // Log success
      await ctx.runMutation(internal.email.logEmail, {
        eventId: event._id,
        guestId: guest._id,
        type: EMAIL_TYPES.INVITATION,
        status: EMAIL_STATUS.SENT,
        recipientEmail: guest.email,
        resendId: result.id,
      })

      // Update guest timestamp
      await ctx.runMutation(internal.email.updateGuestEmailTimestamp, {
        guestId: guest._id,
        field: "invitationSentAt",
      })

      return { success: true, resendId: result.id }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"

      // Log failure
      await ctx.runMutation(internal.email.logEmail, {
        eventId: event._id,
        guestId: guest._id,
        type: EMAIL_TYPES.INVITATION,
        status: EMAIL_STATUS.FAILED,
        recipientEmail: guest.email,
        errorMessage,
      })

      return { success: false, error: errorMessage }
    }
  },
})

/**
 * Send check-in confirmation email (via queue) (PUBLIC - triggered by check-in flow)
 * This enqueues the email with high priority for rate-limited sending
 * NOTE: This is intentionally public as it's triggered by the public check-in process
 */
export const sendCheckInConfirmation = mutation({
  args: {
    guestId: v.id("guests"),
  },
  handler: async (ctx, args) => {
    // NOTE: No auth check - this is called from the public check-in flow
    const guest = await ctx.db.get(args.guestId)
    if (!guest) {
      return { queued: false, reason: "guest_not_found" }
    }

    if (!guest.email) {
      return { queued: false, reason: "no_email" }
    }

    if (guest.emailUnsubscribed) {
      return { queued: false, reason: "unsubscribed" }
    }

    // Enqueue with high priority (check-in confirmations are urgent)
    await ctx.db.insert("emailQueue", {
      eventId: guest.eventId,
      guestId: args.guestId,
      type: EMAIL_TYPES.CHECKIN_CONFIRMATION,
      priority: EMAIL_PRIORITY.CHECKIN_CONFIRMATION,
      status: "pending",
      attempts: 0,
      maxAttempts: 3,
      nextAttemptAt: Date.now(),
      templateData: {},
      createdAt: Date.now(),
    })

    // Start the processor if not already running
    await ctx.scheduler.runAfter(0, internal.emailQueue.maybeStartProcessor, {})

    return { queued: true }
  },
})

/**
 * Internal action to send check-in confirmation directly (called by queue processor)
 */
export const sendCheckInConfirmationDirect = internalAction({
  args: {
    guestId: v.id("guests"),
    baseUrl: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ success: boolean; resendId?: string; error?: string }> => {
    const RESEND_API_KEY = process.env.RESEND_API_KEY
    if (!RESEND_API_KEY) {
      console.log("RESEND_API_KEY not configured, skipping confirmation email")
      return { success: false, error: "RESEND_API_KEY not configured" }
    }

    // Get guest data
    const data = await ctx.runQuery(internal.email.getGuestForEmail, {
      guestId: args.guestId,
    })
    if (!data) {
      return { success: false, error: "Guest not found" }
    }

    const { guest, event, roundAssignments } = data

    if (!guest.email) {
      return { success: false, error: "Guest has no email address" }
    }

    if (guest.emailUnsubscribed) {
      return { success: false, error: "Guest has unsubscribed" }
    }

    // Get email settings
    const senderName = event.emailSettings?.senderName || "Seatherder"
    const senderEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev"

    // Build guest portal URL (if guest has a self-service token and we have baseUrl)
    const guestPortalUrl = guest.selfServiceToken && args.baseUrl
      ? `${args.baseUrl}/guest/${guest.selfServiceToken}`
      : undefined

    // Resolve theme colors
    const theme = getEventThemeColors(event)

    // Determine table number to show
    const tableNumber = roundAssignments.length > 0
      ? roundAssignments[0].tableNumber
      : guest.tableNumber

    const subject = replacePlaceholders(
      event.emailSettings?.confirmationSubject || DEFAULT_TEMPLATES.checkin_confirmation.subject,
      {
        guestName: guest.name,
        eventName: event.name,
        tableNumber,
        guestPortalUrl,
        theme,
      }
    )
    const html = replacePlaceholders(DEFAULT_TEMPLATES.checkin_confirmation.html, {
      guestName: guest.name,
      eventName: event.name,
      tableNumber,
      guestPortalUrl,
      roundAssignments: roundAssignments.map((a) => ({
        roundNumber: a.roundNumber,
        tableNumber: a.tableNumber,
      })),
      theme,
    })

    // Send via Resend
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `${senderName} <${senderEmail}>`,
          to: guest.email,
          reply_to: event.emailSettings?.replyTo,
          subject,
          html,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        await ctx.runMutation(internal.email.logEmail, {
          eventId: event._id,
          guestId: guest._id,
          type: EMAIL_TYPES.CHECKIN_CONFIRMATION,
          status: EMAIL_STATUS.FAILED,
          recipientEmail: guest.email,
          errorMessage: result.message || "Unknown error",
        })
        return { success: false, error: result.message || "Failed to send" }
      }

      // Log success
      await ctx.runMutation(internal.email.logEmail, {
        eventId: event._id,
        guestId: guest._id,
        type: EMAIL_TYPES.CHECKIN_CONFIRMATION,
        status: EMAIL_STATUS.SENT,
        recipientEmail: guest.email,
        resendId: result.id,
      })

      // Update guest timestamp
      await ctx.runMutation(internal.email.updateGuestEmailTimestamp, {
        guestId: guest._id,
        field: "confirmationSentAt",
      })

      return { success: true, resendId: result.id }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"

      await ctx.runMutation(internal.email.logEmail, {
        eventId: event._id,
        guestId: guest._id,
        type: EMAIL_TYPES.CHECKIN_CONFIRMATION,
        status: EMAIL_STATUS.FAILED,
        recipientEmail: guest.email,
        errorMessage,
      })

      return { success: false, error: errorMessage }
    }
  },
})

/**
 * Send a test email to verify configuration
 */
export const sendTestEmail = action({
  args: {
    eventId: v.id("events"),
    toEmail: v.string(),
  },
  handler: async (ctx, args): Promise<{ success: boolean; error?: string }> => {
    // TODO: Add proper authentication when moving to production (requires Clerk integration)
    // For now, verify the event exists before proceeding

    // Validate email format with stricter RFC 5322 simplified pattern
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
    if (!emailRegex.test(args.toEmail)) {
      return { success: false, error: "Invalid email address format" }
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY
    if (!RESEND_API_KEY) {
      return { success: false, error: "RESEND_API_KEY is not configured" }
    }

    // Get event for settings (also serves as basic authorization - event must exist)
    const event = await ctx.runQuery(internal.email.getEventForTestEmail, {
      eventId: args.eventId,
    })
    if (!event) {
      return { success: false, error: "Event not found" }
    }

    // Email settings - escape user-provided values for HTML safety
    const senderName = event.emailSettings?.senderName || "Seatherder"
    const senderEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev"
    const escapedEventName = escapeHtml(event.name)
    const escapedSenderName = escapeHtml(senderName)
    const escapedReplyTo = escapeHtml(event.emailSettings?.replyTo || "(not set)")

    // Resolve theme colors
    const theme = getEventThemeColors(event)
    const primaryTextColor = getContrastColor(theme.primary)

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `${senderName} <${senderEmail}>`,
          to: args.toEmail,
          reply_to: event.emailSettings?.replyTo,
          subject: `Test Email from ${event.name}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: ${theme.foreground};">Test Email</h1>
              <p>This is a test email from <strong>${escapedEventName}</strong>.</p>
              <p>If you received this, your email configuration is working correctly.</p>
              <div style="background: ${theme.primary}; padding: 20px; border-radius: 12px; text-align: center; margin: 24px 0;">
                <p style="margin: 0; color: ${primaryTextColor}; font-size: 18px; font-weight: 600;">Your theme colors are working!</p>
              </div>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
              <p style="color: #666; font-size: 14px;">
                <strong>Settings:</strong><br />
                Sender: ${escapedSenderName}<br />
                From: ${senderEmail}<br />
                Reply-To: ${escapedReplyTo}<br />
                Theme: ${event.themePreset || "default"}
              </p>
            </div>
          `,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        return { success: false, error: result.message || "Failed to send" }
      }

      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      return { success: false, error: errorMessage }
    }
  },
})

// Internal query to get event for test email
export const getEventForTestEmail = internalQuery({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.eventId)
  },
})

/**
 * Send bulk invitation emails to all guests in an event (via queue) (with ownership check)
 * Enqueues all emails for rate-limited sending
 */
export const sendBulkInvitations = mutation({
  args: {
    eventId: v.id("events"),
    baseUrl: v.string(),
  },
  handler: async (ctx, args): Promise<{
    success: boolean
    queued: number
    skipped: number
    message?: string
  }> => {
    const userId = await getAuthenticatedUserId(ctx)
    await verifyEventOwnership(ctx, args.eventId, userId)

    // Check free tier limit for email campaigns
    const tier = await getEventTier(ctx, args.eventId)
    if (tier === "free" && !FREE_LIMITS.allowEmailCampaigns) {
      throw new Error(TIER_LIMIT_ERRORS.EMAIL_CAMPAIGNS)
    }

    const event = await ctx.db.get(args.eventId)
    if (!event) {
      return { success: false, queued: 0, skipped: 0, message: "Event not found" }
    }

    // Get all guests for this event
    const guests = await ctx.db
      .query("guests")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect()

    // Filter to guests with emails who haven't unsubscribed
    const eligibleGuests = guests.filter((g) => g.email && !g.emailUnsubscribed)

    // Filter guests who haven't received invitations yet
    const guestsToEmail = eligibleGuests.filter((g) => !g.invitationSentAt)

    if (guestsToEmail.length === 0) {
      return {
        success: true,
        queued: 0,
        skipped: eligibleGuests.length,
        message: "All eligible guests have already received invitations"
      }
    }

    const now = Date.now()

    // Enqueue all emails
    for (const guest of guestsToEmail) {
      await ctx.db.insert("emailQueue", {
        eventId: args.eventId,
        guestId: guest._id,
        type: EMAIL_TYPES.INVITATION,
        priority: EMAIL_PRIORITY.INVITATION,
        status: "pending",
        attempts: 0,
        maxAttempts: 3,
        nextAttemptAt: now,
        templateData: { baseUrl: args.baseUrl },
        createdAt: now,
      })
    }

    // Start the processor if not already running
    await ctx.scheduler.runAfter(0, internal.emailQueue.maybeStartProcessor, {})

    return {
      success: true,
      queued: guestsToEmail.length,
      skipped: eligibleGuests.length - guestsToEmail.length,
    }
  },
})

// ============================================================================
// Public Queries for Email Management UI
// ============================================================================

/**
 * Get all email logs for an event (with ownership check)
 */
export const getEmailLogsByEvent = query({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx)
    await verifyEventOwnership(ctx, args.eventId, userId)

    const logs = await ctx.db
      .query("emailLogs")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect()

    // Sort by sentAt descending (most recent first)
    return logs.sort((a, b) => {
      const aTime = a.sentAt ? new Date(a.sentAt).getTime() : 0
      const bTime = b.sentAt ? new Date(b.sentAt).getTime() : 0
      return bTime - aTime
    })
  },
})

/**
 * Get email statistics for an event (with ownership check)
 */
export const getEmailStats = query({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx)
    await verifyEventOwnership(ctx, args.eventId, userId)

    const logs = await ctx.db
      .query("emailLogs")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect()

    const guests = await ctx.db
      .query("guests")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect()

    // Count guests with emails
    const guestsWithEmail = guests.filter((g) => g.email && !g.emailUnsubscribed)
    const guestsWithInvitation = guests.filter((g) => g.invitationSentAt)
    const guestsWithConfirmation = guests.filter((g) => g.confirmationSentAt)

    // Count by status
    const byStatus = {
      pending: 0,
      sent: 0,
      delivered: 0,
      bounced: 0,
      failed: 0,
    }

    for (const log of logs) {
      if (log.status in byStatus) {
        byStatus[log.status as keyof typeof byStatus]++
      }
    }

    // Count by type
    const byType = {
      invitation: 0,
      checkin_confirmation: 0,
      reminder: 0,
    }

    for (const log of logs) {
      if (log.type in byType) {
        byType[log.type as keyof typeof byType]++
      }
    }

    return {
      totalGuests: guests.length,
      guestsWithEmail: guestsWithEmail.length,
      guestsWithoutEmail: guests.length - guestsWithEmail.length,
      invitationsSent: guestsWithInvitation.length,
      confirmationsSent: guestsWithConfirmation.length,
      byStatus,
      byType,
      totalEmails: logs.length,
    }
  },
})

/**
 * Get email logs for a specific guest (with ownership check)
 */
export const getEmailLogsByGuest = query({
  args: {
    guestId: v.id("guests"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx)
    await verifyGuestOwnership(ctx, args.guestId, userId)

    const logs = await ctx.db
      .query("emailLogs")
      .withIndex("by_guest", (q) => q.eq("guestId", args.guestId))
      .collect()

    return logs.sort((a, b) => {
      const aTime = a.sentAt ? new Date(a.sentAt).getTime() : 0
      const bTime = b.sentAt ? new Date(b.sentAt).getTime() : 0
      return bTime - aTime
    })
  },
})

// =============================================================================
// Guest Change Notifications
// =============================================================================

/**
 * Get data for guest change notification email
 */
export const getGuestChangeNotificationData = internalQuery({
  args: {
    guestId: v.id("guests"),
  },
  handler: async (ctx, args) => {
    const guest = await ctx.db.get(args.guestId)
    if (!guest) return null

    const event = await ctx.db.get(guest.eventId)
    if (!event) return null

    return {
      guest: {
        _id: guest._id,
        name: guest.name,
        email: guest.email,
        phone: guest.phone,
        rsvpStatus: guest.rsvpStatus,
        dietary: guest.dietary,
      },
      event: {
        _id: event._id,
        name: event.name,
        emailSettings: event.emailSettings,
        themePreset: event.themePreset,
        customColors: event.customColors,
      },
    }
  },
})

/**
 * Send guest change notification email to organizer
 */
export const sendGuestChangeNotificationDirect = internalAction({
  args: {
    guestId: v.id("guests"),
    changedFields: v.array(v.string()),
  },
  handler: async (ctx, args): Promise<{ success: boolean; error?: string }> => {
    const RESEND_API_KEY = process.env.RESEND_API_KEY
    if (!RESEND_API_KEY) {
      return { success: false, error: "RESEND_API_KEY is not configured" }
    }

    // Get guest and event data
    const data = await ctx.runQuery(internal.email.getGuestChangeNotificationData, {
      guestId: args.guestId,
    })
    if (!data) {
      return { success: false, error: "Guest or event not found" }
    }

    const { guest, event } = data
    const organizerEmail = event.emailSettings?.replyTo
    if (!organizerEmail) {
      return { success: false, error: "No organizer email configured" }
    }

    // Resolve theme colors
    const theme = getEventThemeColors(event as unknown as Doc<"events">)
    // Note: primaryTextColor available as getContrastColor(theme.primary) if needed

    // Build changes summary
    const changesHtml = args.changedFields
      .map((field) => `<li style="margin: 4px 0;">${escapeHtml(field)}</li>`)
      .join("")

    // Build email HTML
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: ${theme.background};">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: ${theme.secondary}; border-radius: 12px; padding: 32px; margin-bottom: 24px;">
      <h1 style="margin: 0 0 8px; font-size: 24px; color: ${getContrastColor(theme.secondary)};">Guest Update</h1>
      <p style="margin: 0; color: ${getContrastColor(theme.secondary)}; opacity: 0.8;">${escapeHtml(event.name)}</p>
    </div>

    <div style="background: white; border-radius: 12px; padding: 32px; border: 1px solid ${theme.muted};">
      <p style="margin: 0 0 16px; color: ${theme.foreground};">
        <strong>${escapeHtml(guest.name)}</strong> has updated their information:
      </p>

      <ul style="margin: 0 0 24px; padding-left: 24px; color: ${theme.foreground};">
        ${changesHtml}
      </ul>

      <div style="background: ${theme.secondary}; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <p style="margin: 0 0 8px; font-size: 14px; color: ${getContrastColor(theme.secondary)};">
          <strong>Current Details:</strong>
        </p>
        ${guest.rsvpStatus ? `<p style="margin: 4px 0; font-size: 14px; color: ${getContrastColor(theme.secondary)};">RSVP: ${guest.rsvpStatus}</p>` : ""}
        ${guest.phone ? `<p style="margin: 4px 0; font-size: 14px; color: ${getContrastColor(theme.secondary)};">Phone: ${escapeHtml(guest.phone)}</p>` : ""}
        ${guest.dietary?.restrictions?.length ? `<p style="margin: 4px 0; font-size: 14px; color: ${getContrastColor(theme.secondary)};">Dietary: ${guest.dietary.restrictions.join(", ")}</p>` : ""}
        ${guest.dietary?.notes ? `<p style="margin: 4px 0; font-size: 14px; color: ${getContrastColor(theme.secondary)};">Notes: ${escapeHtml(guest.dietary.notes)}</p>` : ""}
      </div>

      <p style="margin: 0; font-size: 12px; color: ${theme.foreground}; opacity: 0.6;">
        Updated at ${new Date().toLocaleString()}
      </p>
    </div>

    <p style="margin: 24px 0 0; text-align: center; font-size: 12px; color: ${theme.foreground}; opacity: 0.5;">
      Sent by Seatherder
    </p>
  </div>
</body>
</html>`

    // Send via Resend
    try {
      const senderEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev"
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `Seatherder <${senderEmail}>`,
          to: organizerEmail,
          subject: `Guest Update: ${guest.name} - ${event.name}`,
          html,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        // Log failure
        await ctx.runMutation(internal.email.logEmail, {
          eventId: event._id,
          guestId: guest._id,
          type: EMAIL_TYPES.GUEST_CHANGE_NOTIFICATION,
          status: EMAIL_STATUS.FAILED,
          recipientEmail: organizerEmail,
          errorMessage: result.message || "Unknown error",
        })
        return { success: false, error: result.message || "Failed to send email" }
      }

      // Log success
      await ctx.runMutation(internal.email.logEmail, {
        eventId: event._id,
        guestId: guest._id,
        type: EMAIL_TYPES.GUEST_CHANGE_NOTIFICATION,
        status: EMAIL_STATUS.SENT,
        resendId: result.id,
        recipientEmail: organizerEmail,
      })

      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error"
      await ctx.runMutation(internal.email.logEmail, {
        eventId: event._id,
        guestId: guest._id,
        type: EMAIL_TYPES.GUEST_CHANGE_NOTIFICATION,
        status: EMAIL_STATUS.FAILED,
        recipientEmail: organizerEmail,
        errorMessage: message,
      })
      return { success: false, error: message }
    }
  },
})

/**
 * Trigger guest change notification (called from selfServiceUpdate in guests.ts)
 * This is an internal mutation that schedules the notification action
 */
export const triggerGuestChangeNotification = internalMutation({
  args: {
    guestId: v.id("guests"),
    eventId: v.id("events"),
    changedFields: v.array(v.string()),
  },
  handler: async (ctx, args): Promise<{ sent: boolean; reason?: string }> => {
    // Check if notifications are enabled for this event
    const event = await ctx.db.get(args.eventId)
    if (!event) {
      return { sent: false, reason: "Event not found" }
    }
    if (!event.selfServiceNotificationsEnabled) {
      return { sent: false, reason: "Notifications disabled" }
    }
    if (!event.emailSettings?.replyTo) {
      return { sent: false, reason: "No organizer email (replyTo) configured" }
    }

    // Check for recent notification (within 1 hour) - rate limiting
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const recentLogs = await ctx.db
      .query("emailLogs")
      .withIndex("by_guest", (q) => q.eq("guestId", args.guestId))
      .filter((q) =>
        q.and(
          q.eq(q.field("type"), EMAIL_TYPES.GUEST_CHANGE_NOTIFICATION),
          q.gte(q.field("sentAt"), oneHourAgo)
        )
      )
      .collect()

    if (recentLogs.length > 0) {
      console.log(`Skipping guest change notification: Rate limited (sent within last hour)`)
      return { sent: false, reason: "Rate limited (sent within last hour)" }
    }

    // Schedule the notification action
    await ctx.scheduler.runAfter(0, internal.email.sendGuestChangeNotificationDirect, {
      guestId: args.guestId,
      changedFields: args.changedFields,
    })

    return { sent: true }
  },
})
