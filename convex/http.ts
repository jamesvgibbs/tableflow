import { httpRouter } from "convex/server"
import { httpAction } from "./_generated/server"
import { internal } from "./_generated/api"
import Stripe from "stripe"

const http = httpRouter()

/**
 * Stripe webhook handler for payment events
 *
 * To set up:
 * 1. Go to Stripe Dashboard > Developers > Webhooks
 * 2. Add endpoint: https://<your-convex-site-url>/stripe/webhook
 * 3. Select event: checkout.session.completed
 * 4. Copy the signing secret to STRIPE_WEBHOOK_SECRET env var in Convex dashboard
 */
http.route({
  path: "/stripe/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      // @ts-expect-error - Stripe types may be ahead of package version
      apiVersion: "2025-01-27.acacia",
    })

    const signature = request.headers.get("stripe-signature")
    if (!signature) {
      return new Response("Missing stripe-signature header", { status: 400 })
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET not configured")
      return new Response("Webhook secret not configured", { status: 500 })
    }

    let event: Stripe.Event
    try {
      const body = await request.text()
      // Must use async version in Convex environment
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)
    } catch (err) {
      console.error("Webhook signature verification failed:", err)
      return new Response("Webhook signature verification failed", { status: 400 })
    }

    // Handle the event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session
      const metadata = session.metadata

      if (metadata?.userId && metadata?.productType) {
        await ctx.runMutation(internal.purchases.recordPurchase, {
          userId: metadata.userId,
          productType: metadata.productType,
          stripeCheckoutSessionId: session.id,
          stripeCustomerId: typeof session.customer === "string" ? session.customer : undefined,
          stripePaymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : undefined,
          amount: session.amount_total || 0,
          currency: session.currency || "usd",
        })
        console.log(`Purchase recorded for user ${metadata.userId}`)
      } else {
        console.error("Missing metadata in checkout session:", session.id)
      }

      // Mark checkout intent as completed (for analytics)
      await ctx.runMutation(internal.checkoutRecovery.markCheckoutCompleted, {
        stripeSessionId: session.id,
      })
    }

    // Handle expired checkout sessions (abandoned carts)
    if (event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session
      await ctx.runMutation(internal.checkoutRecovery.markCheckoutExpired, {
        stripeSessionId: session.id,
      })
      console.log(`Checkout session expired: ${session.id}`)
    }

    return new Response("OK", { status: 200 })
  }),
})

/**
 * Webhook handler for Resend email delivery events
 *
 * Resend sends webhooks for: email.sent, email.delivered, email.bounced,
 * email.complained, email.delivery_delayed
 *
 * To set up:
 * 1. Go to Resend dashboard > Webhooks
 * 2. Add endpoint: https://<your-convex-url>/api/resend-webhook
 * 3. Select events: email.delivered, email.bounced, email.complained
 * 4. Copy the signing secret to RESEND_WEBHOOK_SECRET env var
 */
http.route({
  path: "/api/resend-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // Get the webhook secret for verification
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET

    // Parse the request body
    let payload: {
      type: string
      created_at: string
      data: {
        email_id: string
        from: string
        to: string[]
        subject: string
        created_at: string
        bounce?: {
          message: string
          type: string
        }
      }
    }

    try {
      payload = await request.json()
    } catch {
      return new Response("Invalid JSON", { status: 400 })
    }

    // Verify webhook signature if secret is configured
    if (webhookSecret) {
      const signature = request.headers.get("svix-signature")
      const timestamp = request.headers.get("svix-timestamp")
      const id = request.headers.get("svix-id")

      if (!signature || !timestamp || !id) {
        console.warn("Missing webhook signature headers")
        // In production, you might want to reject unsigned requests
        // For now, we'll log a warning but continue
      }
      // TODO: Implement full HMAC verification if needed
      // For production, use the svix library for proper verification
    }

    const { type, data } = payload
    const resendId = data.email_id

    console.log(`Resend webhook received: ${type} for email ${resendId}`)

    // Map Resend event types to our status
    let newStatus: string | null = null
    let errorMessage: string | undefined

    switch (type) {
      case "email.delivered":
        newStatus = "delivered"
        break
      case "email.bounced":
        newStatus = "bounced"
        errorMessage = data.bounce?.message || "Email bounced"
        break
      case "email.complained":
        newStatus = "bounced"
        errorMessage = "Recipient marked as spam"
        break
      case "email.delivery_delayed":
        // Don't update status for delays, just log
        console.log(`Email ${resendId} delivery delayed`)
        break
      default:
        // Ignore other event types
        console.log(`Ignoring Resend event type: ${type}`)
    }

    if (newStatus && resendId) {
      // Update email log status
      await ctx.runMutation(internal.email.updateEmailLogStatus, {
        resendId,
        status: newStatus,
        errorMessage,
        deliveredAt: newStatus === "delivered" ? new Date().toISOString() : undefined,
      })
    }

    return new Response("OK", { status: 200 })
  }),
})

export default http
