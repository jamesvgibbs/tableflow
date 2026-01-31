# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Seatherder** is an event seating management application for automating table assignments and guest check-ins. The product persona is a confident, slightly sarcastic border collie who is software. See `VOICE_AND_TONE.md` for all user-facing copy guidelines.

**Core Features:**
- Multi-round seating with smart mixing algorithm
- QR code check-in (guest and table)
- Real-time round timer with pause/resume
- Event theming with 8 presets + custom colors
- Email campaigns (invitations, confirmations) with rate-limited queue
- Seating constraints (pin, repel, attract)
- Drag-and-drop seating editor with canvas pan/zoom
- Custom terminology per event type
- Breakout rooms and sessions management
- Guest self-service portal for RSVP and dietary updates
- Cross-event seating history for novelty preference

## Development Commands

```bash
npm run dev           # Start both frontend (Next.js) and backend (Convex)
npm run dev:frontend  # Next.js only at localhost:3000
npm run dev:backend   # Convex dev server only
npm run build         # Production build (runs convex codegen first)
npm run lint          # Run ESLint
npm run kill          # Kill all dev processes
```

## Architecture

Next.js 16 App Router with React 19, using Convex as the serverless backend.

### Tech Stack
- **Framework**: Next.js 16 with App Router (React Server Components)
- **Backend**: Convex 1.31+ (real-time database, serverless functions)
- **Authentication**: Clerk (with Convex integration via `ConvexProviderWithClerk`)
- **Styling**: Tailwind CSS v4 with CSS variables (OKLCH color space)
- **UI Components**: shadcn/ui (new-york style) with Radix UI primitives
- **Icons**: Lucide React
- **Animations**: Framer Motion, tw-animate-css
- **Drag & Drop**: @dnd-kit/core (guest reordering), @use-gesture/react (canvas pan/zoom)
- **Data Import**: PapaParse (CSV), XLSX (Excel)
- **State**: Convex React hooks for real-time data

### Project Structure
```
src/
├── app/
│   ├── (app)/                  # Protected application routes
│   │   ├── admin/              # Events dashboard
│   │   ├── event/[id]/         # Event hub
│   │   │   ├── seating/        # View tables & guests
│   │   │   ├── seating-editor/ # Visual drag-and-drop editor
│   │   │   ├── live/           # Real-time event mode with timer
│   │   │   ├── matching/       # Seating configuration wizard
│   │   │   ├── emails/         # Email campaign management
│   │   │   ├── rooms/          # Breakout rooms management
│   │   │   └── sessions/       # Sessions/workshops management
│   │   ├── checkin/            # Guest name search check-in
│   │   ├── scan/[qrCodeId]/    # QR code scanner (guest or table)
│   │   └── timer/[eventId]/    # Full-screen round timer
│   ├── (marketing)/            # Public landing page
│   │   ├── privacy/            # Privacy policy
│   │   └── terms/              # Terms of service
│   ├── (public)/               # Public routes (no auth required)
│   │   └── guest/[token]/      # Guest self-service portal
│   ├── sign-in/[[...sign-in]]/ # Clerk sign-in
│   └── sign-up/[[...sign-up]]/ # Clerk sign-up
├── components/
│   ├── ui/                     # shadcn/ui components (24+)
│   ├── landing/                # Marketing page sections
│   └── *.tsx                   # Feature components (GuestForm, CsvUpload, etc.)
├── lib/
│   ├── utils.ts                # cn() helper, getDepartmentColors()
│   ├── types.ts                # Shared TypeScript types
│   ├── terminology.ts          # Custom label helpers
│   ├── theme-presets.ts        # 8 theme definitions
│   ├── theme-utils.ts          # Theme color utilities
│   ├── config-mapper.ts        # Wizard answers → matching weights
│   ├── event-types.ts          # Event type definitions
│   ├── seating-types.ts        # Seating type definitions
│   ├── qr-download.ts          # QR code export utilities
│   ├── storage.ts              # Browser storage helpers
│   └── sample-data.ts          # Demo/sample data
└── providers/                  # Context providers (Convex with Clerk)

convex/
├── schema.ts                   # Database schema (16 tables)
├── auth.config.ts              # Clerk JWT configuration
├── events.ts                   # Event queries/mutations
├── guests.ts                   # Guest queries/mutations
├── tables.ts                   # Table queries
├── matching.ts                 # Compatibility scoring algorithm
├── matchingConfig.ts           # Per-event algorithm config
├── constraints.ts              # Pin/repel/attract constraints
├── preview.ts                  # Preview assignments system
├── email.ts                    # Email sending actions
├── emailQueue.ts               # Rate-limited email queue processor
├── attachments.ts              # File storage for emails
├── rooms.ts                    # Breakout rooms CRUD
├── sessions.ts                 # Sessions/workshops CRUD
├── seatingHistory.ts           # Cross-event seating history
├── themes.ts                   # Theme management
└── http.ts                     # HTTP helpers
```

### Path Aliases
- `@/*` maps to `./src/*`
- `@convex/*` maps to `./convex/*`

## Convex Backend

### Schema (convex/schema.ts)

**16 tables:**

**events** - Event configuration
- Core: `name`, `tableSize`, `createdAt`, `isAssigned`
- Owner: `userId` (Clerk user ID)
- Multi-round: `numberOfRounds`, `roundDuration`, `currentRound`, `roundStartedAt`, `isPaused`, `pausedTimeRemaining`
- Theme: `themePreset`, `customColors` (6 OKLCH colors)
- Email: `emailSettings` (sender name, reply-to, custom subjects)
- Terminology: `eventType`, `eventTypeSettings` (custom labels)
- Self-service: `selfServiceDeadline`, `selfServiceNotificationsEnabled`
- Index: `by_user`

**guests** - Event attendees (rich attributes)
- Core: `eventId`, `name`, `department`, `email`, `phone`
- Seating: `tableNumber` (Round 1 compat), `qrCodeId`, `checkedIn`
- Dietary: `dietary.restrictions[]`, `dietary.notes`
- Matching: `attributes.interests[]`, `attributes.jobLevel`, `attributes.goals[]`, `attributes.customTags[]`
- Event-specific: `familyName`, `side` (wedding), `company`, `team`, `managementLevel`, `isVip`
- Email tracking: `invitationSentAt`, `confirmationSentAt`, `emailUnsubscribed`
- Self-service: `selfServiceToken`, `rsvpStatus` (confirmed|declined|pending), `lastSelfServiceUpdate`
- Event day: `status` (present|no-show|late)
- Indexes: `by_event`, `by_qrCodeId`, `by_name`, `by_selfServiceToken`

**tables** - Physical tables
- `eventId`, `tableNumber`, `qrCodeId`
- Indexes: `by_event`, `by_qrCodeId`

**guestRoundAssignments** - Multi-round seating junction
- `guestId`, `eventId`, `roundNumber`, `tableNumber`
- Indexes: `by_guest`, `by_event_round`, `by_event_guest`

**matchingConfig** - Algorithm settings per event
- `eventId`, `seatingType` (wedding|corporate|networking|team|social|custom)
- `answers` (wizard Q&A stored as JSON)
- `weights` (5 numeric: departmentMix, interestAffinity, jobLevelDiversity, goalCompatibility, repeatAvoidance)
- `noveltyPreference` (0-1, cross-event novelty preference)
- `vipTables[]`, `interestOptions[]`, `goalOptions[]`
- Index: `by_event`

**seatingConstraints** - Manual seating control
- `eventId`, `type` (pin|repel|attract)
- `guestIds[]` (1 for pin, 2 for repel/attract)
- `tableNumber` (pin only), `reason`, `createdAt`
- Indexes: `by_event`, `by_guest`

**previewAssignments** - Ephemeral preview sessions
- `eventId`, `sessionId`, `guestId`, `roundNumber`, `tableNumber`, `createdAt`
- Indexes: `by_session`, `by_event`

**emailLogs** - Delivery tracking
- `eventId`, `guestId`, `type`, `status`, `resendId`, `sentAt`, `deliveredAt`, `errorMessage`, `recipientEmail`
- Indexes: `by_event`, `by_guest`, `by_resend_id`, `by_status`

**emailAttachments** - File storage
- `eventId`, `guestId`, `filename`, `storageId`, `contentType`, `size`, `uploadedAt`
- Indexes: `by_event`, `by_guest`, `by_event_guest`

**emailQueue** - Rate-limited email sending
- `eventId`, `guestId`, `type`, `priority`, `status`, `attempts`, `maxAttempts`, `nextAttemptAt`
- `templateData`, `errorMessage`, `resendId`, `createdAt`, `processedAt`
- Indexes: `by_status_priority`, `by_event`, `by_guest`

**emailQueueStatus** - Singleton for processor state
- `isProcessing`, `lastProcessedAt`

**rooms** - Physical breakout rooms
- `eventId`, `name`, `capacity`, `location`, `description`
- Index: `by_event`

**sessions** - Sessions/workshops within an event
- `eventId`, `name`, `description`, `startTime`, `endTime`
- `roomId`, `hasTableSeating`, `maxCapacity`
- Indexes: `by_event`, `by_room`

**sessionAssignments** - Guest-session assignments
- `sessionId`, `guestId`, `eventId`, `createdAt`
- Indexes: `by_session`, `by_guest`, `by_event`

**seatingHistory** - Cross-event memory
- `organizerId` (Clerk user ID), `guestEmail`, `partnerEmail`
- `eventId`, `roundNumber`, `timestamp`
- Indexes: `by_organizer_guest`, `by_organizer_pair`, `by_event`

### Key Convex Functions

**events.ts** - Event management
- `list()`, `get(id)`, `getWithDetails(id)` - Queries
- `create()`, `updateName()`, `updateTableSize()`, `updateRoundDuration()`
- `updateNumberOfRounds()` - Smart regeneration of round assignments
- `assignTables()` - Core matching algorithm with constraint satisfaction
- `startNextRound()`, `pauseRound()`, `resumeRound()`, `endCurrentRound()` - Timer
- `updateThemePreset()`, `updateCustomColors()` - Theming
- `randomizeAssignments()` - Regenerate mid-event

**guests.ts** - Guest management
- `getByEvent()`, `getByQrCodeId()`, `getRoundAssignments()`
- `getBySelfServiceToken()` - Guest self-service portal
- `searchByName()` - Cross-event name search for check-in
- `create()`, `createMany()`, `update()`, `remove()`
- `checkIn()`, `uncheckIn()` - Triggers confirmation email
- `updateSelfService()` - Guest self-service updates

**preview.ts** - Preview system
- `generatePreview()` - Create temporary assignments
- `getPreview()` - Fetch with guest data enrichment
- `commitPreview()` - Finalize to real assignments
- `discardPreview()`, `cleanupExpiredPreviews()` - Cleanup
- `updatePreviewAssignment()` - Drag-and-drop updates

**constraints.ts** - Seating constraints
- `create()` - Add pin/repel/attract with validation
- `getByEvent()` - All constraints for event
- `delete()` - Remove constraint

**matching.ts** - Scoring utilities (pure functions)
- `calculateGuestCompatibility()` - 5-dimension scoring
- `DEFAULT_WEIGHTS` constant
- Goal compatibility matrix, job level distance calculation

**rooms.ts** - Breakout rooms
- `getByEvent()`, `create()`, `update()`, `remove()`

**sessions.ts** - Sessions/workshops
- `getByEvent()`, `create()`, `update()`, `remove()`
- `assignGuest()`, `unassignGuest()`, `getAssignments()`

**seatingHistory.ts** - Cross-event memory
- `recordSeating()` - Save who sat together
- `getHistory()` - Get seating history for novelty calculation

**email.ts** - Email campaigns
- `sendCheckInConfirmation()` - Triggered on check-in
- `sendInvitations()`, `sendReminders()` - Bulk campaigns
- Template placeholders: `{{guest_name}}`, `{{event_name}}`, `{{table_number}}`

**emailQueue.ts** - Rate-limited sending
- `enqueue()` - Add email to queue
- `processQueue()` - Process pending emails (2/second rate limit)

## Advanced Features

### Multi-Round Seating
- Rounds stored in `guestRoundAssignments` junction table
- `repeatAvoidance` weight (0-1) prevents same tablemates across rounds
- Round timer with pause/resume capability
- Different optimal seating calculated per round

### Preview System
Preview assignments before committing:
```tsx
await generatePreview({ eventId })        // Create preview
const preview = useQuery(api.preview.getPreview, { eventId })
await commitPreview({ eventId })          // Finalize
await discardPreview({ eventId })         // Cancel
```

### Seating Constraints
- **Pin**: Force guest to specific table (scoring: -10000 bonus, +10000 penalty elsewhere)
- **Repel**: Keep two guests apart (+5000 penalty if together)
- **Attract**: Encourage two guests together (-500 bonus if together)

### Matching Algorithm
Scoring system (lower = better):
1. Constraint satisfaction (highest priority)
2. Department mixing
3. Interest affinity
4. Job level diversity
5. Goal compatibility (matrix-based)
6. Repeat avoidance (tablemate history)
7. Cross-event novelty (seating history)

### Event Types & Wizard
6 types: wedding, corporate, networking, team, social, custom
- Wizard asks 2-3 questions per type
- Answers map to matching weights via `config-mapper.ts`
- Generates human-readable confirmation

### Terminology Customization
Per-event custom labels stored in `eventTypeSettings`:
```tsx
const guestLabel = getGuestLabel(event)           // "Guest" or "Attendee"
const tableLabel = getTableLabel(event)           // "Table" or "Pod"
const countLabel = getCountLabel(event, 5, "guest") // "5 Guests"
```

### Guest Self-Service Portal
Token-based portal for guests to update their info:
- Access via `/guest/[token]/` (public route)
- Editable: phone, dietary restrictions, RSVP status
- Read-only: name, email (contact organizer to change)
- Configurable deadline via `selfServiceDeadline`
- RSVP tracking: confirmed, declined, pending

### Breakout Rooms & Sessions
Multi-track event support:
- **Rooms**: Physical locations with capacity
- **Sessions**: Workshops/talks with time slots, room assignment
- **Session Assignments**: Which guests attend which sessions
- Sessions can optionally use table seating

### Cross-Event Seating History
Tracks who sat together across events for novelty preference:
- Uses email as identifier (persists across re-imports)
- `noveltyPreference` (0-1): 0 = ignore history, 1 = strongly prefer new connections
- Scoped to organizer (Clerk user ID)

## Styling & Theming

### Color System (OKLCH)
Root variables in `globals.css`:
- **Primary**: `oklch(0.42 0.28 295)` - Purple #6700D9
- **Secondary**: `oklch(0.96 0.02 290)` - Pale purple #F0F1FF
- **Accent**: `oklch(0.85 0.15 175)` - Teal #00F0D2

### Theme Presets
8 themes: Desert Disco, Groovy, Art Nouveau, Abstract Landscape, Desert Matisse, Woodcut, Linocut, Cyberpunk

### Department Colors
`getDepartmentColors(department)` returns consistent `{ bg, text, border }` classes:
- 10 predefined departments (engineering, design, marketing, etc.)
- Fallback system for unknown departments

### Animations
Custom classes in `globals.css`: `animate-in`, `fade-in`, `slide-up`, `scale-in`
Stagger system: `stagger-1` through `stagger-10` (50ms delays)

### Adding UI Components
```bash
npx shadcn@latest add [component-name]
```

## Voice & Tone

**All user-facing copy must follow `VOICE_AND_TONE.md`.**

Key principles:
- First person only ("I" never "we" or "Seatherder")
- Short, declarative sentences
- Confident border collie persona
- Dog/herding metaphors where natural
- No corporate jargon (leverage, synergy, optimize)

Examples:
- Button: "Let me work" (not "Submit")
- Empty state: "I do not see any guests yet. Would you like to add some?"
- Success: "Good job. The seating is complete."
- Pause button: "Paws" (dog pun)

## Key Patterns

### Real-time Data
```tsx
const events = useQuery(api.events.list)
const guests = useQuery(api.guests.getByEvent, { eventId })
```

### Mutations
```tsx
const createEvent = useMutation(api.events.create)
await createEvent({ name: "My Event", tableSize: 8 })
```

### Protected Routes
```tsx
<ProtectedRoute>
  <AdminContent />
</ProtectedRoute>
```

### Loading States
Use `<SeatherderLoading />` component for consistent branded loading.

### Theme Application
```tsx
import { EventThemeProvider } from "@/components/event-theme-provider"
// Applies customColors as CSS variables to document
```

## Authentication

**Clerk Authentication** is fully integrated:
- Sign-in: `/sign-in` (Clerk hosted UI)
- Sign-up: `/sign-up` (Clerk hosted UI)
- Protected routes use `ProtectedRoute` wrapper with `useAuth()` hook
- Middleware handles unauthenticated redirects
- Convex integration via `ConvexProviderWithClerk` and `auth.config.ts`

**Environment Variables Required:**
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `CLERK_ISSUER_URL` (for Convex JWT verification)
- `NEXT_PUBLIC_CONVEX_URL`

**Convex Auth Setup:**
1. Clerk JWT template configured with `aud: "convex"`
2. `auth.config.ts` specifies Clerk as identity provider
3. Events are scoped to `userId` (Clerk user ID)

## App Routes

| Route | Purpose | Access |
|-------|---------|--------|
| `/` | Landing page or admin redirect | Public |
| `/admin` | Events dashboard | Protected |
| `/event/[id]` | Event hub with navigation | Protected |
| `/event/[id]/seating` | View tables & assignments | Protected |
| `/event/[id]/seating-editor` | Visual drag-and-drop editor | Protected |
| `/event/[id]/live` | Real-time mode with timer | Protected |
| `/event/[id]/matching` | Seating config wizard | Protected |
| `/event/[id]/emails` | Email campaigns | Protected |
| `/event/[id]/rooms` | Breakout rooms management | Protected |
| `/event/[id]/sessions` | Sessions/workshops | Protected |
| `/event/[id]/sessions/[sessionId]` | Session attendees | Protected |
| `/checkin` | Guest name search | Public |
| `/scan/[qrCodeId]` | QR lookup (guest/table) | Public |
| `/timer/[eventId]` | Full-screen round timer | Public |
| `/guest/[token]` | Guest self-service portal | Public |
| `/sign-in` | Clerk authentication | Public |
| `/sign-up` | Clerk registration | Public |
| `/privacy` | Privacy policy | Public |
| `/terms` | Terms of service | Public |

## Multi-Tenant Architecture

Events are scoped to users via `userId` (Clerk user ID):
- Events table has `by_user` index
- Queries filter by authenticated user
- Seating history scoped to `organizerId`
- Row-level security enforced in Convex functions
