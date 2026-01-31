# Clerk Authentication Setup

This guide walks through setting up Clerk authentication for Seatherder.

## Prerequisites

- A Clerk account (sign up at [clerk.com](https://clerk.com))
- Access to your Convex dashboard

## Step 1: Create Clerk Application

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Click "Add application"
3. Name it "Seatherder" (or your preferred name)
4. Select authentication methods:
   - **Email** (recommended)
   - **Google** (optional)
   - **GitHub** (optional for developer-focused events)
5. Click "Create application"

## Step 2: Get API Keys

1. In your Clerk application, go to **API Keys**
2. Copy the following values to your `.env.local`:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
```

3. Also note your **Frontend API URL** (e.g., `https://clerk.your-app.accounts.dev`)
   - This is needed for Convex integration

## Step 3: Configure Clerk for Convex

Clerk needs to issue JWTs that Convex can verify.

### Create JWT Template

1. In Clerk Dashboard, go to **JWT Templates**
2. Click "New template"
3. Select "Convex" from the list
4. Name it "convex"
5. The template should contain:

```json
{
  "aud": "convex",
  "iat": {{iat}},
  "exp": {{exp}},
  "iss": "{{issuer}}",
  "sub": "{{user.id}}"
}
```

6. Click "Create"

### Get the Issuer URL

1. Go to **API Keys** in Clerk Dashboard
2. Find your **Issuer URL** (Frontend API URL)
3. Add to `.env.local`:

```env
CLERK_ISSUER_URL=https://your-clerk-instance.clerk.accounts.dev
```

## Step 4: Configure Convex

Create `convex/auth.config.ts`:

```typescript
export default {
  providers: [
    {
      domain: process.env.CLERK_ISSUER_URL,
      applicationID: "convex",
    },
  ],
};
```

## Step 5: Update Environment Variables

Your `.env.local` should now include:

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/admin
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/admin
CLERK_ISSUER_URL=https://your-clerk-instance.clerk.accounts.dev
```

## Step 6: Customize Appearance (Optional)

1. In Clerk Dashboard, go to **Customization** > **Branding**
2. Set colors to match Seatherder:
   - Primary: `#6700D9` (Purple)
   - Background: Match your theme
3. Upload logo if desired

## Step 7: Configure Webhooks (For Billing - Phase 9)

When implementing billing:

1. Go to **Webhooks** in Clerk Dashboard
2. Add endpoint: `https://your-domain.com/api/webhooks/clerk`
3. Select events:
   - `user.created`
   - `user.updated`
   - `user.deleted`
   - `session.created` (optional)

## Verification Checklist

After setup, verify:

- [ ] Can sign up with email
- [ ] Can sign in with existing account
- [ ] Redirects to /admin after sign in
- [ ] Protected routes redirect to /sign-in when not authenticated
- [ ] Public routes (/checkin, /scan/*) work without authentication
- [ ] Convex functions receive user identity via `ctx.auth`

## Troubleshooting

### "Invalid token" errors in Convex

- Verify `CLERK_ISSUER_URL` matches your Clerk Frontend API URL exactly
- Check JWT template is named "convex"
- Ensure Convex auth.config.ts is deployed

### Sign-in redirects loop

- Check `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` is set correctly
- Verify middleware.ts doesn't protect the sign-in page

### User not appearing in Convex

- Verify JWT template includes `sub` claim
- Check Convex function is using `ctx.auth.getUserIdentity()`

## Production Checklist

Before going live:

- [ ] Switch from test keys to production keys
- [ ] Update redirect URLs for production domain
- [ ] Configure custom domain in Clerk (optional)
- [ ] Set up production webhooks
- [ ] Enable rate limiting in Clerk
