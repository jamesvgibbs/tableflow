# Seatherder - Project Scope

Working document for planned features and improvements.

**Target Market**: Conference planners (all-in on conferences)
**Pricing**: $399/year unlimited events, $49/single event, Free tier (1 event, 50 guests)
**Model**: One user account per company, guests don't need accounts

---

## Pricing Strategy (Confirmed)

| Tier | Price | Events | Guests |
|------|-------|--------|--------|
| Free | $0 | 1 event | 50 guests |
| Single Event | $49/event | 1 event | Unlimited |
| Pro | $399/year | Unlimited | Unlimited (soft cap 500/event) |

**Rationale**:
- $49 single event: Impulse buy, less than conference lunch
- $399/year: Competitive annual rate, unlimited simplifies everything
- Convex costs ~$25/month even at scale, margins stay healthy

---

## Stack-Ranked Feature List

### Tier 1: Revenue Blockers (Must ship to charge money)

#### 1. Clerk Authentication *(Phase 2 in Implementation Plan)*

Replace hardcoded auth with real user accounts.

- [ ] Create Clerk application
- [ ] Install `@clerk/nextjs`
- [ ] Configure Convex with Clerk
- [ ] Add `userId` to events table
- [ ] Secure all Convex functions (events, guests, tables, etc.)
- [ ] Remove legacy auth code

#### 2. Clerk Billing *(Phase 9 in Implementation Plan)*

Subscription management via Clerk.

- [ ] Configure billing plans in Clerk dashboard
- [ ] Track subscription status in schema
- [ ] Enforce event creation limits
- [ ] Enforce guest limits per plan
- [ ] Add billing portal link

#### 3. Legal Pages *(Phase 10 in Implementation Plan)*

Adapt from Pathible templates.

- [ ] Terms of Service
- [ ] Privacy Policy
- [ ] Footer links
- [ ] Cookie consent banner

#### 4. Landing Page *(DEFERRED - Requires Separate Approval)*

**Note**: Homepage/landing page changes require separate approval before implementation. Current landing page is functional. Creative brief preserved below for future reference.

---

### Tier 2: Core UX (Ship soon after launch)

#### 5. Guest Self-Service Portal *(Phase 4 in Implementation Plan)*

Allow guests to update their own info via secure link.

- [ ] Add selfServiceToken to guests
- [ ] Guest portal page (`/guest/[token]`)
- [ ] Edit dietary, phone, RSVP status
- [ ] Deadline enforcement
- [ ] Change notifications to organizer
- [ ] Portal link in emails

#### 6. Admin Bulk Operations *(Phase 5 in Implementation Plan)*

Streamlined event-day operations.

- [ ] Bulk check-in UI
- [ ] Bulk undo check-in
- [ ] Quick-add guest modal
- [ ] Bulk status change (no-show, late)

#### 7. Onboarding Flow *(Phase 8 in Implementation Plan)*

First-time user experience.

- [ ] Welcome screen after sign-up
- [ ] Quick-start event creation
- [ ] Sample data option ("Try with demo guests")
- [ ] Feature tooltips

---

### Tier 3: Power Features

#### 8. Breakout Rooms & Sessions *(Phase 6 in Implementation Plan)*

Support for multi-track conferences with workshops.

- [ ] Rooms table (name, capacity, location)
- [ ] Sessions table (name, time, room, has seating)
- [ ] Session assignments (guest to session)
- [ ] Rooms management page
- [ ] Sessions management page
- [ ] Session guest assignment UI

#### 9. Algorithm Improvements *(Phase 7 in Implementation Plan)*

Smarter seating across events.

- [ ] Seating history tracking (who sat with whom)
- [ ] Cross-event repeat avoidance
- [ ] Novelty preference weight
- [ ] Improved department mixing

---

### Tier 4: Polish & Trust

#### 10. Error Tracking

- [ ] Integrate Sentry or similar
- [ ] Track frontend and Convex errors
- [ ] Alert on critical failures

#### 11. Analytics

- [ ] Track key user actions
- [ ] Monitor conversion funnel
- [ ] Admin usage dashboard

#### 12. PDF Export

- [ ] Seating chart PDF download
- [ ] Guest list with assignments
- [ ] QR code sheets for printing

#### 13. Event Logo/Branding Upload

- [ ] Logo upload field on events
- [ ] Display on check-in screens
- [ ] Include in emails

---

### Tier 5: Growth & Differentiation (Future)

#### 14. Event Templates & Duplication

- [ ] "Duplicate event" button
- [ ] Save event as template
- [ ] Pre-built templates

#### 15. White-Label Option

- [ ] Remove "Powered by Seatherder"
- [ ] Custom domains (events.yourcompany.com)

#### 16. Calendar Integration

- [ ] Export to Google Calendar / Outlook
- [ ] Add round times to guest calendars

#### 17. Smart Guest Search by Event Date

- [ ] Add event date fields to schema
- [ ] Prioritize current/upcoming events in search
- [ ] Hide past events in results

---

## Schema Additions Summary

```typescript
// Phase 2: Authentication
events.userId: v.string()  // Clerk user ID

// Phase 4: Guest Self-Service
guests.selfServiceToken: v.optional(v.string())
guests.rsvpStatus: v.optional(v.string())  // confirmed/declined/pending
guests.lastSelfServiceUpdate: v.optional(v.number())
events.selfServiceDeadline: v.optional(v.number())

// Phase 5: Bulk Operations
guests.status: v.optional(v.string())  // present/no-show/late/none

// Phase 6: Breakout Rooms
rooms: { eventId, name, capacity, location }
sessions: { eventId, name, startTime, endTime, roomId, hasTableSeating, description }
sessionAssignments: { sessionId, guestId }

// Phase 7: Algorithm
seatingHistory: { organizerId, guestEmail, partnerEmail, eventId, roundNumber, timestamp }
matchingConfig.noveltyPreference: v.optional(v.number())

// Phase 9: Billing
users: { clerkId, subscriptionTier, eventLimit, guestLimit }
```

---

## Deferred: Landing Page Creative Brief

**Status**: DEFERRED - Requires separate approval before implementation.

The current landing page is functional. The creative brief below is preserved for when we're ready to revisit.

### The Vision

Lean into the "herder" name HARD. Think: friendly border collie bringing order to chaos. Conference seating is a mess of spreadsheets and sticky notes - Seatherder rounds everyone up.

### Tone

- Playful but professional
- Clever wordplay welcome
- Confident, not corporate

### Page Sections (When Approved)

1. **Hero** - Big statement, clear CTA, playful visual
2. **The Problem** - "Conference seating is broken"
3. **How It Works** - 3 steps with icons
4. **Features Grid** - Multi-round, department mixing, themes, QR check-in
5. **Pricing** - Dead simple, three tiers
6. **FAQ** - Address common concerns
7. **Final CTA** - "Start your first event free"

---

## Implementation Phases

See `docs/IMPLEMENTATION_PLAN.md` for detailed task breakdown.

| Phase | Focus | Status |
|-------|-------|--------|
| 0 | Testing Infrastructure | Complete |
| 1 | Documentation Update | In Progress |
| 2 | Clerk Authentication | Not Started |
| 3 | Multi-tenancy Validation | Not Started |
| 4 | Guest Self-Service | Not Started |
| 5 | Admin Bulk Operations | Not Started |
| 6 | Breakout Rooms / Sessions | Not Started |
| 7 | Algorithm Improvements | Not Started |
| 8 | Onboarding | Not Started |
| 9 | Clerk Billing | Not Started |
| 10 | Legal Pages | Not Started |

---

## Questions Resolved

- **Event limit**: Unlimited for Pro tier ($399/year)
- **Guest limit**: Soft cap at 500/event for performance
- **Support**: Email-based initially, add in-app later
- **Enterprise**: No special tier initially; contact-us for >1000 guests

## Open Questions

- [ ] Launch timeline target?
- [ ] Beta tester recruitment strategy?
