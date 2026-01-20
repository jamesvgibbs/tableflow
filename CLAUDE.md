# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Seatherder** is an event seating management application for automating table assignments and guest check-ins. The product persona is a confident, slightly sarcastic border collie who is software. See `VOICE_AND_TONE.md` for all user-facing copy guidelines.

**Core Features:**
- Multi-round seating with smart mixing algorithm
- QR code check-in (guest and table)
- Real-time round timer with pause/resume
- Event theming with 8 presets + custom colors
- Email campaigns (invitations, confirmations)
- Seating constraints (pin, repel, attract)
- Drag-and-drop seating editor with canvas pan/zoom
- Custom terminology per event type

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
│   │   │   └── emails/         # Email campaign management
│   │   ├── checkin/            # Guest name search check-in
│   │   ├── scan/[qrCodeId]/    # QR code scanner (guest or table)
│   │   ├── timer/[eventId]/    # Full-screen round timer
│   │   └── login/              # Admin login
│   ├── (marketing)/            # Public landing page
│   └── api/auth/               # Auth API routes
├── components/
│   ├── ui/                     # shadcn/ui components (24+)
│   └── landing/                # Marketing page sections (12)
│   # Feature components at root: GuestForm, CsvUpload, ThemeCustomizer, etc.
├── lib/
│   ├── utils.ts                # cn() helper, getDepartmentColors()
│   ├── types.ts                # Shared TypeScript types
│   ├── terminology.ts          # Custom label helpers
│   ├── theme-presets.ts        # 8 theme definitions
│   ├── config-mapper.ts        # Wizard answers → matching weights
│   └── auth.ts                 # Auth utilities (dev only)
└── providers/                  # Context providers (Auth, Convex, Theme)

convex/
├── schema.ts                   # Database schema (11 tables)
├── events.ts                   # Event queries/mutations (~700 lines)
├── guests.ts                   # Guest queries/mutations (~330 lines)
├── tables.ts                   # Table queries
├── matching.ts                 # Compatibility scoring algorithm
├── matchingConfig.ts           # Per-event algorithm config
├── constraints.ts              # Pin/repel/attract constraints
├── preview.ts                  # Preview assignments system
├── email.ts                    # Email sending actions
├── attachments.ts              # File storage for emails
└── http.ts                     # HTTP helpers
```

### Path Aliases
- `@/*` maps to `./src/*`

## Convex Backend

### Schema (convex/schema.ts)

**11 tables with 21 indexes:**

**events** - Event configuration
- Core: `name`, `tableSize`, `createdAt`, `isAssigned`
- Multi-round: `numberOfRounds`, `roundDuration`, `currentRound`, `roundStartedAt`, `isPaused`, `pausedTimeRemaining`
- Theme: `themePreset`, `customColors` (6 OKLCH colors)
- Email: `emailSettings` (sender name, reply-to, custom subjects)
- Terminology: `eventType`, `eventTypeSettings` (custom labels)

**guests** - Event attendees (rich attributes)
- Core: `eventId`, `name`, `department`, `email`, `phone`
- Seating: `tableNumber` (Round 1 compat), `qrCodeId`, `checkedIn`
- Dietary: `dietary.restrictions[]`, `dietary.notes`
- Matching: `attributes.interests[]`, `attributes.jobLevel`, `attributes.goals[]`, `attributes.customTags[]`
- Event-specific: `familyName`, `side` (wedding), `company`, `team`, `managementLevel`, `isVip`
- Email tracking: `invitationSentAt`, `confirmationSentAt`, `emailUnsubscribed`
- Indexes: `by_event`, `by_qrCodeId`, `by_name`

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
- `eventId`, `guestId`, `type`, `status`, `resendId`, `sentAt`, `deliveredAt`, `errorMessage`
- Indexes: `by_event`, `by_guest`, `by_resend_id`, `by_status`

**emailAttachments** - File storage
- `eventId`, `guestId`, `filename`, `storageId`, `contentType`, `size`
- Indexes: `by_event`, `by_guest`

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
- `searchByName()` - Cross-event name search for check-in
- `create()`, `createMany()`, `update()`, `remove()`
- `checkIn()`, `uncheckIn()` - Triggers confirmation email

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

**email.ts** - Email campaigns
- `sendCheckInConfirmation()` - Triggered on check-in
- `sendInvitations()`, `sendReminders()` - Bulk campaigns
- Template placeholders: `{{guest_name}}`, `{{event_name}}`, `{{table_number}}`

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

## Authentication (Development Only)

**WARNING**: Current auth is hardcoded for development.
- Username: `admin`, Password: `seatherder123`
- Cookie: `seatherder_session` (HTTP-only)
- Protected routes use `ProtectedRoute` wrapper

**Production requires:**
1. Clerk or similar auth provider (Convex has first-party support)
2. Environment variables for secrets
3. Proper session management
4. Row-level security in Convex functions

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
| `/checkin` | Guest name search | Public |
| `/scan/[qrCodeId]` | QR lookup (guest/table) | Public |
| `/timer/[eventId]` | Full-screen round timer | Public |
| `/login` | Admin authentication | Public |

## Multi-Tenant Considerations

Current: Single-tenant with shared admin access.

For multi-tenant:
1. Add organization/user tables to Convex schema
2. Integrate Clerk for auth
3. Add `organizationId` to events table
4. Implement row-level security in Convex functions
5. Update all queries to filter by authenticated user's org
