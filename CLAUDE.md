# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Seatherder** is an event seating management application for automating table assignments and guest check-ins. Core features include multi-round seating, QR code check-in, and event theming.

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
- **Backend**: Convex (real-time database, serverless functions)
- **Styling**: Tailwind CSS v4 with CSS variables for theming
- **UI Components**: shadcn/ui (new-york style) with Radix UI primitives
- **Icons**: Lucide React
- **State**: Convex React hooks for real-time data

### Project Structure
```
src/
├── app/                    # Next.js pages and layouts
│   ├── admin/              # Protected admin dashboard
│   ├── event/[id]/         # Event management (guests, settings, themes, assignments)
│   ├── checkin/            # Guest name search check-in
│   ├── scan/[qrCodeId]/    # QR code scanner (guest or table lookup)
│   ├── timer/[eventId]/    # Full-screen round timer
│   ├── login/              # Admin login
│   └── api/auth/           # Auth API routes
├── components/
│   ├── ui/                 # shadcn/ui components
│   └── feature/            # Feature components (GuestForm, CsvUpload, ThemeCustomizer, etc.)
├── lib/
│   ├── utils.ts            # cn() helper for class merging
│   ├── auth.ts             # Auth utilities (currently hardcoded credentials)
│   └── types.ts            # Shared TypeScript types
└── providers/              # Context providers (Auth, Convex, Theme)

convex/
├── schema.ts               # Database schema definition
├── events.ts               # Event queries and mutations
└── guests.ts               # Guest queries and mutations
```

### Path Aliases
- `@/*` maps to `./src/*`

## Convex Backend

### Schema (convex/schema.ts)

**events** - Event configuration
- `name`, `tableSize`, `createdAt`, `isAssigned`
- Multi-round: `numberOfRounds`, `roundDuration`, `currentRound`, `roundStartedAt`
- Timer: `isPaused`, `pausedTimeRemaining`
- Theme: `themePreset`, `customColors` (object with primary, secondary, accent, background, foreground, muted)

**guests** - Event attendees
- `eventId`, `name`, `department`, `email`, `phone`
- `tableNumber` (Round 1 for backward compat), `qrCodeId`, `checkedIn`
- Indexes: `by_event`, `by_qrCodeId`, `by_name`

**tables** - Physical tables
- `eventId`, `tableNumber`, `qrCodeId`
- Indexes: `by_event`, `by_qrCodeId`

**guestRoundAssignments** - Multi-round seating junction
- `guestId`, `eventId`, `roundNumber`, `tableNumber`
- Indexes: `by_guest`, `by_event_round`, `by_event_guest`

### Key Convex Functions

**Events** (`convex/events.ts`):
- `list()` - All events sorted by date
- `create()` - New event with defaults
- `assignTables()` - Generate randomized assignments (department-mixing for R1, tablemate-avoidance for R2+)
- `updateNumberOfRounds()` - Modify rounds with smart regeneration
- `startNextRound()`, `pauseRound()`, `resumeRound()`, `endCurrentRound()` - Timer control
- `updateThemePreset()`, `updateCustomColors()` - Theme mutations

**Guests** (`convex/guests.ts`):
- `create()`, `createMany()` - Add guests
- `getByEvent()` - All guests for an event
- `searchByName()` - Cross-event name search for check-in
- `getByQrCodeId()` - Lookup by QR code with round assignments
- `checkIn()`, `uncheckIn()` - Check-in management

## Authentication (Current State)

**WARNING**: Current auth is for development only - hardcoded credentials in `src/lib/auth.ts`.
- Username: `admin`, Password: `seatherder123`
- Cookie-based sessions with HTTP-only cookie `seatherder_session`
- Protected routes use `ProtectedRoute` component wrapper

Production requires: Clerk or similar auth provider, environment variables, proper session management.

## Styling Conventions

- CSS variables in `globals.css` for theming (OKLCH color space)
- Use `cn()` from `@/lib/utils` to merge Tailwind classes
- shadcn/ui components use class-variance-authority (cva) for variants
- Event themes override CSS variables dynamically

### Adding UI Components
```bash
npx shadcn@latest add [component-name]
```

## Key Patterns

### Real-time Data
Use Convex hooks for live updates:
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

## Multi-Tenant Considerations

Current: Single-tenant with shared admin access.

For multi-tenant:
1. Add organization/user tables to Convex schema
2. Integrate Clerk for auth (Convex has first-party Clerk support)
3. Add `organizationId` to events table
4. Implement row-level security in Convex functions
5. Update all queries to filter by authenticated user's org
