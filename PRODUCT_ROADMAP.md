# Seatherder Product Roadmap

*I made a plan. Short sentences. No jargon.* 🐕

---

## The Big Picture

**What I do well:** Smart seating. Multi-round mixing. Constraints that work.

**What I need:** Guest self-service. Data export. The basics event planners expect.

**What I should not do:** Become another bloated enterprise tool with confusing pricing.

---

## Phase 1: Fix the Fundamentals

*Duration: 2-4 sprints*

### 1.1 Data Export Suite
The marketing says I can export. I cannot. This needs fixing.

**Deliverables:**
- [ ] CSV export of guest list
- [ ] CSV export of seating assignments by round
- [ ] PDF seating chart (table-by-table view)
- [ ] Dietary summary report for catering
- [ ] Check-in report (who showed up, who did not)

**Voice example:**
- Button: "Give me the data"
- Success: "Here is your spreadsheet. I organized it for you."

---

### 1.2 Guest RSVP Portal
Guests need to tell me if they are coming.

**Deliverables:**
- [ ] Unique guest link (pre-event version of QR link)
- [ ] RSVP status: attending / not attending / tentative
- [ ] Dietary preference self-entry
- [ ] Plus-one management
- [ ] Real-time RSVP dashboard for planners

**Schema additions:**
```
guests: {
  rsvpStatus: "attending" | "declined" | "tentative" | null
  rsvpDate: string  // ISO timestamp
  plusOnes: [{ name, dietary }]
}
```

---

### 1.3 Production Authentication
Currently hardcoded dev credentials. This is not good.

**Deliverables:**
- [ ] Clerk integration (as noted in CLAUDE.md)
- [ ] User table in schema
- [ ] Row-level security in Convex functions
- [ ] Protected routes with real auth

---

## Phase 2: Day-of Excellence

*Duration: 2-3 sprints*

### 2.1 Offline Check-In Mode
Venues have bad wifi. This is a fact.

**Deliverables:**
- [ ] Progressive Web App (PWA) with service worker
- [ ] Local guest list caching
- [ ] Queue check-ins when offline
- [ ] Sync when connectivity returns
- [ ] Visual indicator of online/offline status

---

### 2.2 Live No-Show Handling
When someone does not show up, the table is unbalanced.

**Deliverables:**
- [ ] "Mark as no-show" button on live view
- [ ] Quick reassignment: suggest guests to move
- [ ] Live table capacity view
- [ ] Undo stack for accidental changes

---

### 2.3 QR Bulk Download UI
The code exists (`/lib/qr-download.ts`). The UI does not.

**Deliverables:**
- [ ] "Download all QR codes" button on event page
- [ ] Table tent template (PDF with table QR + number)
- [ ] Name badge template (PDF with guest QR + name)

---

## Phase 3: Prove the Value

*Duration: 2-3 sprints*

### 3.1 Analytics Dashboard
Planners want to know: did this work?

**Deliverables:**
- [ ] Check-in timeline (arrival curve)
- [ ] Department mixing score
- [ ] Table utilization metrics
- [ ] Round-by-round attendance
- [ ] Exportable stakeholder report

**Voice example:**
- Title: "How did I do?"
- Metric: "47 humans showed up. 3 did not."
- Insight: "Marketing and Engineering sat together 12 times. This is good."

---

### 3.2 Algorithm Transparency
I know why I make seating decisions. Planners should too.

**Deliverables:**
- [ ] "Why this seating?" explanation per guest
- [ ] Table quality score visualization
- [ ] Constraint satisfaction report
- [ ] Natural language reasoning (in my voice)

**Voice example:**
> "I put Sarah at Table 4 because she wants to find a mentor, and two senior engineers are there. Also, she is vegetarian and Table 4 gets vegetarian meals."

---

## Phase 4: Scale & Collaborate

*Duration: 3-4 sprints*

### 4.1 Multi-User Access
One planner per event is limiting.

**Deliverables:**
- [ ] Organization/workspace concept
- [ ] Role-based access: owner, editor, viewer
- [ ] Event sharing via link
- [ ] Activity log: who changed what

---

### 4.2 Stakeholder Approval
Corporate events need executive sign-off.

**Deliverables:**
- [ ] "Request Approval" generates shareable link
- [ ] Stakeholder can view, comment, approve/reject
- [ ] Lock seating after approval
- [ ] Approval history for audit trail

---

### 4.3 Floor Plan Builder
Right now I have a grid. Venues have shapes.

**Deliverables:**
- [ ] Upload venue image as background
- [ ] Position tables on floor plan
- [ ] Different table shapes (round, rectangular)
- [ ] Export floor plan as PDF

---

## Backlog (Not Prioritized)

These are good ideas. They are not urgent.

- **Event Templates** - Save and reuse configurations
- **SMS Notifications** - Alternative to email
- **Badge Printing Integration** - Physical materials
- **CRM Integration** - Salesforce, HubSpot sync
- **Calendar Integration** - Google Calendar events
- **Guest Photos** - Visual check-in
- **Accessibility Seating** - Wheelchair-accessible tables
- **White-Label Option** - Remove Seatherder branding

---

## What I Will Not Build

Staying focused matters. These are out of scope:

- **Budget tracking** - Use dedicated financial tools
- **Full event management** - I do seating, not everything
- **3D venue walkthrough** - Leave this to AllSeated
- **Virtual event platform** - I am for in-person events
- **Ticketing/payments** - Use Eventbrite

---

## Success Metrics

### Phase 1 Success
- Export feature used by 50%+ of events
- RSVP response rate trackable
- Zero security incidents from auth

### Phase 2 Success
- Check-in success rate in poor connectivity venues
- No-show handling reduces empty seats by 30%
- QR downloads used for 25%+ of events

### Phase 3 Success
- Analytics viewed for 60%+ of completed events
- "Why this seating?" clicked in 30%+ of previews
- Positive feedback on algorithm transparency

### Phase 4 Success
- 20% of events have multiple collaborators
- Approval workflow used for corporate events
- Floor plan builder adoption in 40% of events

---

## Competitive Positioning

**My differentiators to protect:**
1. Multi-round seating with repeat avoidance
2. Pin/repel/attract constraint system
3. Preview before commit
4. Simple $49/event pricing
5. The border collie voice

**My positioning:**
> "Smart seating, not just pretty floor plans."
> "I explain my decisions."
> "No enterprise pricing games."

---

*This roadmap is a living document. I will update it as I learn more.* 🐾

---

*Last updated: January 2026*
