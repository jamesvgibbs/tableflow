# Seatherder Feature Gap Analysis

*I investigated. Here is what I found. 🐕*

**Analysis Date:** January 15, 2026
**Prepared for:** Product Planning & Prioritization

---

## Executive Summary

I reviewed every corner of the codebase, researched market trends, and analyzed competitors. Three things became clear:

1. **The core is strong.** The matching algorithm, multi-round seating, and constraint system are genuine differentiators.
2. **The marketing promises more than the product delivers.** "Export Everything" is mentioned but barely implemented.
3. **Key features expected by event planners are missing.** RSVP, analytics, and offline check-in are standard elsewhere.

---

## Part 1: Marketing vs. Reality

### What the Landing Page Promises

| Feature | Marketing Copy | Reality |
|---------|---------------|---------|
| Multi-Round Seating | "I will seat them three times. Different people each time." | **Complete** - Full implementation with repeat avoidance |
| Department Mixing | "I put Marketing with Engineering." | **Complete** - Core algorithm feature |
| Custom Themes | "Your QR codes will not look like a ransom note." | **Complete** - 8 presets + custom OKLCH colors |
| QR Check-In | "Guests scan. I know they have arrived." | **Complete** - Guest and table QR scanning |
| Dietary Tracking | "I remember who cannot eat gluten." | **Complete** - Restrictions array + notes |
| Export Everything | "You want a spreadsheet? I will give you a spreadsheet. PDF? Also fine." | **Gap** - No export functionality implemented |

### The Export Gap

The FeaturesSection.tsx promises:
> "You want a spreadsheet? I will give you a spreadsheet. You want a PDF? Also fine."

**Actual implementation:**
- No CSV export
- No PDF export
- No seating chart export
- Only feature: QR code ZIP download (exists in `/lib/qr-download.ts`)

**Recommendation:** Either implement exports or update marketing copy. The current state creates expectation mismatch.

---

## Part 2: Feature Completeness Audit

### Fully Implemented (Ship Quality)

| Feature | Status | Notes |
|---------|--------|-------|
| Event CRUD | Complete | Create, edit, delete events |
| Guest Management | Complete | Single, bulk, CSV/Excel import |
| Seating Algorithm | Complete | 5-dimension scoring system |
| Multi-Round Seating | Complete | Up to 10 rounds, repeat avoidance |
| Seating Constraints | Complete | Pin, repel, attract with reasons |
| Preview System | Complete | Generate, review, commit/discard |
| Drag-and-Drop Editor | Complete | Canvas pan/zoom, visual constraints |
| QR Check-In | Complete | Guest search + QR scan |
| Round Timer | Complete | Fullscreen, sound alerts, "Paws" branding |
| Theme System | Complete | 8 presets + custom colors, WCAG compliant |
| Email Campaigns | Complete | Invitations, confirmations, attachments |
| Terminology | Complete | Custom labels per event type |

### Partially Implemented

| Feature | What Exists | What's Missing |
|---------|-------------|----------------|
| QR Code Download | `/lib/qr-download.ts` exists | No UI to trigger bulk download |
| Email Templates | Default templates with placeholders | No UI to customize template body |
| Reminder Emails | `EMAIL_TYPES.REMINDER` defined in schema | No `sendReminder` action implemented |
| Unsubscribe | `emailUnsubscribed` field exists | No unsubscribe link in emails |
| Email Bounce UI | `emailLogs` tracks bounces | No UI to view/retry bounced emails |

### Not Implemented

| Feature | Impact | Notes |
|---------|--------|-------|
| Guest RSVP | High | No self-service attendance confirmation |
| Data Export | High | CSV, PDF, print materials |
| Analytics Dashboard | Medium | No check-in metrics, department stats |
| Offline Check-In | Medium | Requires connectivity |
| Floor Plan Builder | Medium | No venue layout awareness |
| Multi-User Access | Medium | Hardcoded dev auth only |
| Event Archival | Low | No completed/archived status |
| Duplicate Detection | Low | Can import same guest twice |

---

## Part 3: User Journey Gaps

### Event Lifecycle

```
Create → Configure → Add Guests → Assign Seating → Run Event → Post-Event
  ✓          ✓            ✓              ✓              ✓          ✗
```

**Gap: Post-Event Phase**

After the event ends, there is nothing:
- No "End Event" button
- No attendance summary
- No feedback collection
- No archival workflow
- No template creation for recurring events

### Guest Journey

```
Receive Invitation → RSVP → Update Preferences → Get Assignment → Check In
        ✓             ✗             ✗                  ✓             ✓
```

**Gap: Guest Self-Service**

Guests cannot:
- Confirm attendance (RSVP)
- Update their dietary preferences
- Add plus-ones
- View their table assignment before arrival

### Planner Journey Gaps

| Stage | Gap | Impact |
|-------|-----|--------|
| Pre-Event | No RSVP tracking | Manual attendance management |
| Pre-Event | No stakeholder approval workflow | Email seating charts manually |
| Day-Of | No offline check-in | Venue connectivity dependency |
| Day-Of | No live reassignment for no-shows | Tables remain unbalanced |
| Post-Event | No analytics | Cannot measure event success |
| Post-Event | No export | Cannot share data with catering/stakeholders |

---

## Part 4: Data Model Gaps

### Missing Schema Fields

| Table | Missing Field | Use Case |
|-------|--------------|----------|
| `events` | `status` | Track: draft / active / completed / archived |
| `events` | `startDate`, `endDate` | Event scheduling |
| `events` | `venue`, `address` | Event location |
| `guests` | `rsvpStatus` | attending / declined / tentative |
| `guests` | `rsvpDate` | When they responded |
| `guests` | `plusOnes` | Array of plus-one guests |
| `tables` | `capacity` | Per-table custom capacity |
| `tables` | `position` | X/Y for floor plan |

### Missing Tables

| Table | Purpose |
|-------|---------|
| `users` | Authentication, multi-tenant |
| `organizations` | Workspace for teams |
| `eventTemplates` | Reusable configurations |
| `feedbackResponses` | Post-event surveys |

---

## Part 5: Competitive Analysis

### What Competitors Have That I Do Not

| Feature | Social Tables | AllSeated | Seatherder |
|---------|--------------|-----------|------------|
| 3D Venue Walkthrough | Yes | Yes | No |
| Floor Plan Builder | Yes | Yes | Basic grid only |
| Badge Printing | Yes | Yes | No |
| CRM Integration | Yes | Limited | No |
| Offline Mode | Yes | Yes | No |
| RSVP Management | Yes | Yes | No |
| Guest Self-Service | Yes | Yes | No |

### What I Have That Competitors Underserve

| Feature | Social Tables | AllSeated | Seatherder |
|---------|--------------|-----------|------------|
| Multi-Round Repeat Avoidance | No | No | **Yes** |
| Pin/Repel/Attract Constraints | Basic | Basic | **Full system** |
| Preview Before Commit | No | Limited | **Yes** |
| Algorithm Transparency | No | No | **Has weights** |
| Simple Pricing | Tiers | Tiers | **$49/event** |
| Distinctive Voice | No | No | **The border collie** |

### Market Opportunity

The research revealed:
- 50% of event planners now use AI tools
- "AI seating optimization" is a top differentiator
- Planners are frustrated with complex pricing and feature bloat
- Offline check-in is "often overlooked but essential"

**Seatherder's positioning opportunity:** "Smart seating, not just pretty floor plans."

---

## Part 6: Prioritized Recommendations

### P0 - Critical (Address Before Scaling)

| # | Feature | Effort | Impact | Rationale |
|---|---------|--------|--------|-----------|
| 1 | **Data Export Suite** | Low | High | Marketing promises it. Planners need it. |
| 2 | **Guest RSVP Portal** | Medium | High | Table stakes for any event tool |
| 3 | **Production Auth** | Medium | Critical | Currently hardcoded dev credentials |

### P1 - High Priority (This Quarter)

| # | Feature | Effort | Impact | Rationale |
|---|---------|--------|--------|-----------|
| 4 | **Offline Check-In** | Medium | High | Venue connectivity is unreliable |
| 5 | **Live No-Show Handling** | Low | Medium | Tables need rebalancing day-of |
| 6 | **QR Bulk Download UI** | Low | Medium | Code exists, needs UI |
| 7 | **Email Unsubscribe Link** | Low | Medium | GDPR/CAN-SPAM compliance |

### P2 - Medium Priority (Next Quarter)

| # | Feature | Effort | Impact | Rationale |
|---|---------|--------|--------|-----------|
| 8 | **Analytics Dashboard** | Medium | Medium | Measure event success |
| 9 | **Floor Plan Builder** | High | Medium | Visual venue layout |
| 10 | **Multi-User Collaboration** | High | Medium | Team access |
| 11 | **Stakeholder Approval** | Medium | Low | Enterprise workflow |

### P3 - Lower Priority (Backlog)

| # | Feature | Effort | Impact | Rationale |
|---|---------|--------|--------|-----------|
| 12 | Event Templates | Medium | Low | Recurring events |
| 13 | SMS Notifications | Medium | Low | Alternative channel |
| 14 | Badge Printing | Medium | Low | Physical materials |
| 15 | CRM Integration | High | Low | Enterprise need |

---

## Part 7: Quick Wins (Low Effort, High Value)

Things I could implement quickly:

1. **CSV Export of Guest List** - 1 day effort, frequently requested
2. **Duplicate Event Button** - Schema supports it, needs UI
3. **"Check In All" for Pre-Registered Events** - Bulk operation
4. **Email Bounce Retry UI** - Logs exist, needs display
5. **Guest Profile Photos** - Would make check-in visual

---

## Part 8: Voice & Tone Alignment

Features should follow the VOICE_AND_TONE.md guide. Examples:

### Export Feature Copy
- Button: "Give me the data" (not "Export")
- Success: "Here is your spreadsheet. I organized it for you."
- Empty state: "I have nothing to export yet. Add some guests first."

### RSVP Feature Copy
- Invitation CTA: "Let me know if you are coming"
- Confirmation: "I will save you a seat."
- Decline: "I understand. Maybe next time."

### Analytics Feature Copy
- Dashboard title: "How did I do?"
- Check-in metric: "47 humans showed up. 3 did not."
- Department mix: "Marketing and Engineering sat together 12 times. This is good."

---

## Part 9: Technical Debt to Address

Before major features, these should be cleaned up:

1. **Authentication** - Replace hardcoded dev auth with Clerk
2. **Row-Level Security** - Add org/user filtering to Convex functions
3. **Environment Config** - Proper secrets management
4. **Compound Indexes** - Add `eventId + checkedIn` for efficient queries
5. **Error Boundaries** - No global error handling visible

---

## Conclusion

I found many good things in this codebase. The algorithm is sophisticated. The constraint system is powerful. The voice is distinctive.

But there are gaps that matter:
- **Export is promised but not delivered.** Fix this or change the marketing.
- **Guest self-service does not exist.** This is table stakes.
- **Post-event is empty.** The journey ends abruptly.

The market is moving toward AI-powered seating. I already have this. The opportunity is to surface it better, add the expected features, and keep the honest, simple positioning that differentiates me from the enterprise complexity of competitors.

*I have done my analysis. Now it is time to build.* 🐾

---

## Appendix: Files Referenced

Key files examined during this analysis:

**Schema & Backend:**
- `convex/schema.ts` - Database schema (11 tables)
- `convex/events.ts` - Event management (~1000 lines)
- `convex/guests.ts` - Guest management
- `convex/email.ts` - Email campaigns
- `convex/matching.ts` - Algorithm utilities
- `convex/constraints.ts` - Pin/repel/attract
- `convex/preview.ts` - Preview system

**Frontend:**
- `src/app/(app)/event/[id]/page.tsx` - Event hub
- `src/app/(app)/event/[id]/seating-editor/page.tsx` - Visual editor
- `src/app/(app)/event/[id]/live/page.tsx` - Live mode
- `src/app/(app)/checkin/page.tsx` - Check-in search
- `src/components/landing/FeaturesSection.tsx` - Marketing claims

**Configuration:**
- `CLAUDE.md` - Technical documentation
- `VOICE_AND_TONE.md` - Brand voice guide

---

*Analysis complete. Last updated: January 2026*
