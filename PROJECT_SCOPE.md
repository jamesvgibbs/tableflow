# Seatherder - Project Scope

Working document for planned features and improvements.

**Target Market**: Conference planners (all-in on conferences)
**Pricing**: $20/year annual subscription
**Model**: One user account per company, guests don't need accounts

---

## Stack-Ranked Feature List

### Tier 1: Revenue Blockers (Must ship to charge money)

#### 1. Clerk Authentication

Replace hardcoded auth with real user accounts.

- [ ] Create Clerk application
- [ ] Install `@clerk/nextjs`
- [ ] Add environment variables
- [ ] Configure `convex/auth.config.ts`
- [ ] Replace `AuthProvider` with `ClerkProvider`
- [ ] Add `userId` to events table
- [ ] Secure all Convex functions
- [ ] Remove old auth code (`src/lib/auth.ts`, `src/app/api/auth/`)

#### 2. Clerk Billing

Annual subscription at $20/year.

- [ ] Configure Clerk Billing in dashboard
- [ ] Create pricing plan: $20/year for 10 events
- [ ] Add free tier: 1 event, 50 guests
- [ ] Implement billing portal access
- [ ] Add subscription status checks to event creation
- [ ] Handle expired/cancelled subscriptions gracefully

#### 3. Landing Page (The Fun Part - See Creative Brief Below)

- [ ] Hero section with herding theme
- [ ] Problem/solution narrative
- [ ] Feature showcase
- [ ] Pricing section
- [ ] Call-to-action

#### 4. Legal Pages

Adapt from Pathible (https://www.pathible.com/terms and /privacy).

- [ ] Terms of Service - swap financial language for event-management terms
- [ ] Privacy Policy - update data collection section for event/guest data
- [ ] Add footer links to both pages
- [ ] Cookie consent banner (if needed)

---

### Tier 2: Core UX (Ship soon after launch)

#### 5. Smart Guest Search by Event Date

Narrow search results based on when the search happens vs. event dates.

- [ ] Add event date field to schema (start date, end date)
- [ ] Update guest search to prioritize current/upcoming events
- [ ] Hide or deprioritize past events in search results
- [ ] Show "Event ended" indicator for past events

#### 6. Email Guests Their QR Codes

Let organizers send guests their seating info.

- [ ] Integrate email service (Resend - you already use it for Pathible)
- [ ] Design email template with QR code and seating details
- [ ] Bulk send functionality
- [ ] Track email delivery status

#### 7. Onboarding Flow

First-time user experience.

- [ ] Welcome screen after sign-up
- [ ] Quick-start wizard: Create first event
- [ ] Sample data option ("Try with demo guests")
- [ ] Tooltips on key features

---

### Tier 3: Polish & Trust (Builds confidence)

#### 8. Error Tracking

- [ ] Integrate Sentry or similar
- [ ] Track frontend and Convex errors
- [ ] Alert on critical failures

#### 9. Analytics

- [ ] Track key user actions (events created, guests added, assignments generated)
- [ ] Monitor conversion funnel (sign-up -> first event -> paid)
- [ ] Simple admin dashboard for you to see usage

#### 10. PDF Export

- [ ] Seating chart PDF download
- [ ] Guest list with table assignments
- [ ] QR code sheets for printing

#### 11. Event Logo/Branding Upload

- [ ] Logo upload field on events
- [ ] Display on check-in screens
- [ ] Include in QR code emails

---

### Tier 4: Growth & Differentiation (Future)

#### 12. Event Templates & Duplication

- [ ] "Duplicate event" button
- [ ] Save event as template
- [ ] Pre-built templates (Conference, Workshop, Gala)

#### 13. Remove "Powered by Seatherder" (Premium Feature?)

- [ ] White-label option for higher tier

#### 14. Custom Domains

- [ ] events.yourcompany.com support
- [ ] SSL certificate provisioning

#### 15. Calendar Integration

- [ ] Export to Google Calendar / Outlook
- [ ] Add round times to guest calendars

---

## Landing Page Creative Brief

### The Vision

Lean into the "herder" name HARD. Think: friendly border collie bringing order to chaos. Conference seating is a mess of spreadsheets and sticky notes - Seatherder rounds everyone up.

### Tone

- Playful but professional
- Clever wordplay welcome
- Confident, not corporate

### Hero Section Concepts

**Option A: "Wrangle Your Guests"**

- Headline: "Stop herding cats. Start herding seats."
- Subhead: "Seatherder automatically assigns conference seating so you can focus on what matters."
- Visual: Illustrated border collie with conference badges, guiding people to tables

**Option B: "From Chaos to Corral"**

- Headline: "Conference seating, finally corralled."
- Subhead: "Multi-round table assignments. QR code check-ins. Zero spreadsheets."
- Visual: Split screen - chaotic crowd vs. organized seating chart

**Option C: "The Roundup"**

- Headline: "Round up your attendees in rounds."
- Subhead: "Intelligent seating that mixes departments and maximizes connections."
- Visual: Animated sheep (attendees) smoothly flowing to numbered tables

### Copy Themes to Weave In

- "No more spreadsheet rodeos"
- "Your guests. Their seats. Our job."
- "Smart seating that actually mixes people up"
- "QR codes that don't look like a ransom note"
- "Themed to match your event, not our brand"

### Page Sections

1. **Hero** - Big statement, clear CTA, playful visual
2. **The Problem** - "Conference seating is broken" (spreadsheets, chaos, people sitting with their own team)
3. **How It Works** - 3 steps with icons
   - Upload your guest list
   - We assign seats (smartly)
   - Guests scan QR codes
4. **Features Grid** - Multi-round, department mixing, themes, QR check-in
5. **Pricing** - Dead simple, one plan
6. **FAQ** - Address common concerns
7. **Final CTA** - "Start your first event free"

### Visual Style Ideas

- Western typography (slab serifs) meets modern SaaS
- Warm, earthy color palette (but support the existing themes)
- Illustrated characters, not stock photos
- Subtle animations (sheep walking, collie running)
- Hand-drawn accents

---

## Pricing Strategy

### Current Thinking

- **Free**: 1 event, 100 guests (taste of the product)
- **Pro**: $20/year, 10 events, unlimited guests

### Open Questions

- Is 10 events right? Conference planners might do 2-4 big ones or 20 small ones.
- Consider: $20/year unlimited events? (Convex is cheap, simplifies everything)
- Or: $20/year for 5 events, $50/year unlimited?

### Why $20 Works

- Impulse buy territory (less than a conference lunch)
- Annual = committed users, predictable revenue
- Low enough that support burden stays low
- Can always raise prices for new users later

---

## Technical Notes

### Guest Search Date Logic

```
When searching for a guest:
1. Get current date
2. Prioritize events where: startDate <= today <= endDate (active)
3. Then show: startDate > today (upcoming)
4. Deprioritize/hide: endDate < today (past)
```

### Schema Additions Needed

```typescript
// events table additions
startDate: v.optional(v.string()),  // ISO date
endDate: v.optional(v.string()),    // ISO date
userId: v.string(),                 // Clerk user ID
subscriptionStatus: v.optional(v.string()), // 'free', 'active', 'expired'
```

---

## Questions to Resolve

- [ ] Exact event limit for paid tier (10? unlimited?)
- [ ] Do we need a "contact us" for enterprise/large conferences?
- [ ] Support channel - just email? In-app chat?
- [ ] Launch timeline target?

---
