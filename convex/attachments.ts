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
 * Verify the current user owns the event that an attachment belongs to.
 */
async function verifyAttachmentOwnership(
  ctx: QueryCtx | MutationCtx,
  attachmentId: Id<"emailAttachments">,
  userId: string | null
): Promise<void> {
  const attachment = await ctx.db.get(attachmentId)
  if (!attachment) {
    throw new Error("Attachment not found")
  }
  await verifyEventOwnership(ctx, attachment.eventId, userId)
}

/**
 * Generate a signed upload URL for Convex file storage (requires auth)
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    // Require authentication to upload files
    await requireAuth(ctx)
    return await ctx.storage.generateUploadUrl()
  },
})

/**
 * Save attachment metadata after file upload (with ownership check)
 */
export const saveAttachment = mutation({
  args: {
    eventId: v.id("events"),
    guestId: v.optional(v.id("guests")),
    filename: v.string(),
    storageId: v.id("_storage"),
    contentType: v.string(),
    size: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx)
    await verifyEventOwnership(ctx, args.eventId, userId)

    // If guestId provided, verify guest exists and belongs to event
    if (args.guestId) {
      const guest = await ctx.db.get(args.guestId)
      if (!guest || guest.eventId !== args.eventId) {
        throw new Error("Guest not found or does not belong to this event")
      }
    }

    return await ctx.db.insert("emailAttachments", {
      eventId: args.eventId,
      guestId: args.guestId,
      filename: args.filename,
      storageId: args.storageId,
      contentType: args.contentType,
      size: args.size,
      uploadedAt: new Date().toISOString(),
    })
  },
})

/**
 * Delete an attachment and its file from storage (with ownership check)
 */
export const deleteAttachment = mutation({
  args: {
    id: v.id("emailAttachments"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx)
    await verifyAttachmentOwnership(ctx, args.id, userId)

    const attachment = await ctx.db.get(args.id)
    if (!attachment) {
      throw new Error("Attachment not found")
    }

    // Delete file from storage
    await ctx.storage.delete(attachment.storageId)

    // Delete metadata record
    await ctx.db.delete(args.id)
  },
})

/**
 * Get all event-wide attachments for an event (with ownership check)
 */
export const getByEvent = query({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx)
    await verifyEventOwnership(ctx, args.eventId, userId)

    const attachments = await ctx.db
      .query("emailAttachments")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .filter((q) => q.eq(q.field("guestId"), undefined))
      .collect()

    // Get download URLs for each attachment
    const attachmentsWithUrls = await Promise.all(
      attachments.map(async (attachment) => {
        const url = await ctx.storage.getUrl(attachment.storageId)
        return {
          ...attachment,
          url,
        }
      })
    )

    return attachmentsWithUrls
  },
})

/**
 * Get all attachments for a specific guest (with ownership check)
 */
export const getByGuest = query({
  args: {
    guestId: v.id("guests"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx)
    await verifyGuestOwnership(ctx, args.guestId, userId)

    const attachments = await ctx.db
      .query("emailAttachments")
      .withIndex("by_guest", (q) => q.eq("guestId", args.guestId))
      .collect()

    // Get download URLs for each attachment
    const attachmentsWithUrls = await Promise.all(
      attachments.map(async (attachment) => {
        const url = await ctx.storage.getUrl(attachment.storageId)
        return {
          ...attachment,
          url,
        }
      })
    )

    return attachmentsWithUrls
  },
})

/**
 * Get all attachments for an event (both event-wide and guest-specific) (with ownership check)
 */
export const getAllForEvent = query({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx)
    await verifyEventOwnership(ctx, args.eventId, userId)

    const attachments = await ctx.db
      .query("emailAttachments")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect()

    // Get download URLs for each attachment
    const attachmentsWithUrls = await Promise.all(
      attachments.map(async (attachment) => {
        const url = await ctx.storage.getUrl(attachment.storageId)
        return {
          ...attachment,
          url,
        }
      })
    )

    return attachmentsWithUrls
  },
})

/**
 * Get a single attachment with its download URL (with ownership check)
 */
export const get = query({
  args: {
    id: v.id("emailAttachments"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx)

    const attachment = await ctx.db.get(args.id)
    if (!attachment) {
      return null
    }

    // Verify ownership before returning
    await verifyEventOwnership(ctx, attachment.eventId, userId)

    const url = await ctx.storage.getUrl(attachment.storageId)
    return {
      ...attachment,
      url,
    }
  },
})

/**
 * Internal helper to get attachment data for sending emails
 * Returns base64 encoded content for Resend API
 */
export const getAttachmentDataForEmail = async (
  ctx: { storage: { getUrl: (id: Id<"_storage">) => Promise<string | null> } },
  storageId: Id<"_storage">
): Promise<{ content: string } | null> => {
  const url = await ctx.storage.getUrl(storageId)
  if (!url) return null

  try {
    const response = await fetch(url)
    const arrayBuffer = await response.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString("base64")
    return { content: base64 }
  } catch {
    return null
  }
}
