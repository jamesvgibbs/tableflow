# Seatherder Implementation Plan

Detailed task breakdown with acceptance criteria and e2e test requirements.

---

## Progress Summary (Updated 2026-01-29)

| Phase | Status | Notes |
|-------|--------|-------|
| **Phase 0**: Testing Infrastructure | ✅ Complete | Playwright configured, smoke tests passing |
| **Phase 1**: Documentation | ✅ Complete | PROJECT_SCOPE updated |
| **Phase 2**: Clerk Authentication | ⚠️ Partial | Code complete, requires Clerk dashboard config |
| **Phase 3**: Multi-tenancy Validation | ⚠️ Partial | Depends on Phase 2 completion |
| **Phase 4**: Guest Self-Service | ✅ Complete | Portal, deadline, notifications, email links |
| **Phase 5**: Admin Bulk Operations | ✅ Complete | Bulk check-in, quick-add, status tracking |
| **Phase 6**: Breakout Rooms/Sessions | ✅ Complete | Rooms + sessions pages, guest assignment |
| **Phase 7**: Algorithm Improvements | ✅ Complete | History tracking + dept mixing concentration penalty |
| **Phase 8**: Onboarding | ✅ Complete | Welcome modal, tooltips, sample data, quick event creation |
| **Phase 9**: Clerk Billing | 🔜 Deferred | Requires Clerk dashboard setup |
| **Phase 10**: Legal Pages | ⚠️ Partial | Footer + cookie consent done; terms/privacy pages pending |

### Remaining High-Priority Items
1. **Clerk Dashboard Setup** (Tasks 2.1, 2.3) - Manual configuration required
2. **Terms & Privacy Pages** (Tasks 10.1, 10.2) - Legal content needed *(Skipped per user)*
3. **Novelty UI** (Task 7.4 partial) - Matching wizard integration *(Skipped per user)*

---

## Phase 0: Testing Infrastructure

### Task 0.1: Set Up Playwright E2E Testing Framework

**Description**: Configure Playwright for e2e testing. Currently Playwright 1.57.0 is installed but unconfigured.

**Acceptance Criteria**:
- [x] `playwright.config.ts` created at project root
- [x] `@playwright/test` package installed
- [x] Test directory `e2e/` created with proper structure
- [x] `package.json` has `test:e2e` script
- [x] Base test utilities created (login helper, test data factories)
- [x] CI-ready configuration (headless mode, retries)
- [x] First smoke test passes (can load app, login, see admin dashboard)

**E2E Test**: `e2e/smoke.spec.ts`
- Load homepage
- Navigate to login
- Login with dev credentials (admin/seatherder123)
- Verify admin dashboard loads
- Verify events list is visible

**Files to Create/Modify**:
- Create: `playwright.config.ts`
- Create: `e2e/smoke.spec.ts`
- Create: `e2e/fixtures/auth.ts` (login helper)
- Create: `e2e/fixtures/test-data.ts` (factory functions)
- Modify: `package.json` (add scripts)

---

## Phase 1: Documentation Update

### Task 1.1: Update PROJECT_SCOPE.md

**Description**: Update the scope document with the revised roadmap reflecting current priorities.

**Acceptance Criteria**:
- [x] `docs/PROJECT_SCOPE.md` reflects revised roadmap
- [x] New ideas integrated into appropriate tiers
- [x] Pricing confirmed as $399/year unlimited
- [x] Homepage changes marked as deferred (requires separate approval)
- [x] Original document preserved as `docs/PROJECT_SCOPE_ORIGINAL.md` for reference

**E2E Test**: N/A (documentation only)

**Files to Modify**:
- `docs/PROJECT_SCOPE.md` (rewrite)
- Create: `docs/PROJECT_SCOPE_ORIGINAL.md` (backup)

---

## Phase 2: Clerk Authentication

### Task 2.1: Create Clerk Application

**Description**: Set up Clerk project and configure environment.

**Acceptance Criteria**:
- [ ] Clerk application created in Clerk dashboard *(MANUAL: See docs/CLERK_SETUP.md)*
- [ ] Application ID and keys obtained *(MANUAL: See docs/CLERK_SETUP.md)*
- [x] `.env.local` template updated with Clerk variables
- [x] Documentation added for Clerk setup

**E2E Test**: N/A (setup only)

**Files to Create/Modify**:
- Create: `.env.example` (add Clerk vars) - DONE
- Create: `docs/CLERK_SETUP.md` - DONE

---

### Task 2.2: Install and Configure Clerk SDK

**Description**: Install `@clerk/nextjs` and configure for Next.js App Router.

**Acceptance Criteria**:
- [x] `@clerk/nextjs` package installed
- [x] `ClerkProvider` wraps application in root layout
- [x] Middleware configured for protected routes
- [x] Sign-in and sign-up pages configured
- [x] Clerk theme matches Seatherder branding

**E2E Test**: `e2e/auth/clerk-setup.spec.ts`
- Verify Clerk sign-in page loads
- Verify Clerk sign-up page loads
- Verify unauthenticated users redirected from /admin
- Verify public routes remain accessible (/checkin, /scan/*)

**Files to Create/Modify**:
- Modify: `src/app/layout.tsx` (add ClerkProvider) - DONE
- Create: `src/middleware.ts` (Clerk auth middleware) - DONE
- Create: `src/app/sign-in/[[...sign-in]]/page.tsx` - DONE
- Create: `src/app/sign-up/[[...sign-up]]/page.tsx` - DONE
- Modify: `package.json` (add @clerk/nextjs) - DONE

---

### Task 2.3: Configure Convex with Clerk

**Description**: Integrate Clerk authentication with Convex backend.

**Acceptance Criteria**:
- [x] `convex/auth.config.ts` created with Clerk configuration
- [ ] Clerk JWT template configured for Convex *(MANUAL: See docs/CLERK_SETUP.md)*
- [x] `ConvexProviderWithClerk` replaces current Convex provider
- [ ] User identity available in Convex functions via `ctx.auth` *(Requires schema changes in Task 2.4+)*

**E2E Test**: `e2e/auth/convex-integration.spec.ts`
- Sign in with Clerk
- Create an event
- Verify event is created with correct userId
- Sign out, sign in as different user
- Verify cannot see first user's events

**Files to Create/Modify**:
- Create: `convex/auth.config.ts` - DONE
- Modify: `src/components/providers.tsx` (use ConvexProviderWithClerk) - DONE

---

### Task 2.4: Add userId to Events Schema

**Description**: Add user ownership to events table.

**Acceptance Criteria**:
- [x] `events` table has `userId` field (optional during migration, becomes required after cleanup)
- [x] Index `by_user` added for efficient user queries
- [x] Migration strategy documented for existing events

**Migration Strategy**:
- `userId` is optional in schema to allow backward compatibility
- Existing events without userId will be orphaned (not visible to new users)
- After migration, can run cleanup to assign orphaned events or delete them

**E2E Test**: Covered by Task 2.3 test

**Files to Modify**:
- `convex/schema.ts` (add userId field and index) - DONE

---

### Task 2.5: Secure Events Convex Functions

**Description**: Add user context validation to all event-related functions.

**Acceptance Criteria**:
- [x] `events.list()` returns only current user's events
- [x] `events.get()` validates user owns event
- [x] `events.create()` sets userId from authenticated user
- [x] All mutations validate user ownership
- [x] Unauthorized access returns appropriate error

**E2E Test**: `e2e/auth/event-isolation.spec.ts`
- User A creates event "Conference A"
- User A signs out
- User B signs in
- User B cannot see "Conference A" in list
- User B cannot access "Conference A" by direct URL
- User B creates event "Conference B"
- User B signs out
- User A signs in
- User A sees only "Conference A"

**Files to Modify**:
- `convex/events.ts` (add auth checks to all functions) - DONE

---

### Task 2.6: Secure Guests Convex Functions

**Description**: Add user context validation to all guest-related functions.

**Acceptance Criteria**:
- [x] Guest queries validate user owns parent event
- [x] Guest mutations validate user owns parent event
- [x] Cross-event guest operations blocked
- [x] Public check-in endpoints remain functional (no auth required)

**E2E Test**: `e2e/auth/guest-isolation.spec.ts`
- User A adds guest to their event
- User B cannot access that guest
- Public check-in still works for any guest

**Files to Modify**:
- `convex/guests.ts` (add auth checks) - DONE

---

### Task 2.7: Secure Remaining Convex Functions

**Description**: Add user context validation to tables, matching, constraints, preview, email functions.

**Acceptance Criteria**:
- [x] `tables.ts` functions secured (getByEvent, getByEventAndRound protected; getByQrCodeId remains public for QR scanner)
- [x] `matching.ts` - N/A (pure utility functions, no database access)
- [x] `matchingConfig.ts` functions secured (all queries and mutations)
- [x] `constraints.ts` functions secured (all queries and mutations)
- [x] `preview.ts` functions secured (all queries and mutations except cleanupExpiredPreviews which is system-level)
- [x] `email.ts` functions secured (sendCheckInConfirmation remains public for check-in flow; internal functions don't need auth)
- [x] `attachments.ts` functions secured (all queries and mutations)

**E2E Test**: `e2e/auth/full-isolation.spec.ts`
- Comprehensive test of all protected endpoints
- Verify no cross-user data leakage

**Files Modified**:
- `convex/tables.ts` - DONE
- `convex/matchingConfig.ts` - DONE
- `convex/constraints.ts` - DONE
- `convex/preview.ts` - DONE
- `convex/email.ts` - DONE
- `convex/attachments.ts` - DONE

---

### Task 2.8: Remove Legacy Auth Code

**Description**: Remove hardcoded dev authentication.

**Acceptance Criteria**:
- [x] `src/lib/auth.ts` deleted
- [x] `src/app/api/auth/` directory deleted
- [x] `src/components/auth-provider.tsx` deleted
- [x] `ProtectedRoute` component uses Clerk's auth
- [x] Old login page removed (`src/app/(app)/login/`)
- [x] No references to hardcoded credentials remain in code
- [x] `providers.tsx` updated to remove legacy AuthProvider
- [x] `admin/page.tsx` updated to use Clerk's UserButton instead of legacy logout

**E2E Test**: `e2e/auth/legacy-removed.spec.ts`
- Verify /api/auth/* routes return 404
- Verify old /login route redirects to Clerk
- Verify cannot login with admin/seatherder123

**Files Deleted**:
- `src/lib/auth.ts` - DONE
- `src/app/api/auth/` (entire directory) - DONE
- `src/app/(app)/login/` (entire directory) - DONE
- `src/components/auth-provider.tsx` - DONE

**Files Modified**:
- `src/components/protected-route.tsx` (now uses Clerk) - DONE
- `src/components/providers.tsx` (removed legacy AuthProvider) - DONE
- `src/app/(app)/admin/page.tsx` (uses Clerk UserButton) - DONE

---

## Phase 3: Multi-tenancy Validation

### Task 3.1: User Dashboard Experience

**Description**: Ensure admin dashboard properly shows user-specific content.

**Acceptance Criteria**:
- [x] Dashboard shows "Welcome, [user name]" (uses Clerk's useUser hook for firstName)
- [x] User can sign out from dashboard (Clerk UserButton implemented in Task 2.8)
- [x] Empty state shows when user has no events (already exists)
- [x] Event count reflects only user's events (enforced by Convex auth in events.list)

**E2E Test**: `e2e/dashboard/user-experience.spec.ts`
- New user sees empty state with CTA
- User creates event, sees it in list
- User signs out, different user signs in, sees empty state

**Files Modified**:
- `src/app/(app)/admin/page.tsx` (added useUser hook and personalized greeting) - DONE

---

## Phase 4: Guest Self-Service

### Task 4.1: Add Guest Self-Service Schema Fields

**Description**: Add fields to support guest self-service portal.

**Acceptance Criteria**:
- [x] `guests` table has `selfServiceToken` field (unique, optional)
- [x] `guests` table has `rsvpStatus` field (confirmed/declined/pending)
- [x] `guests` table has `lastSelfServiceUpdate` timestamp
- [x] Index on `selfServiceToken` for efficient lookups
- [x] `events` table has `selfServiceDeadline` field (for Task 4.4)
- [x] `events` table has `selfServiceNotificationsEnabled` field (for Task 4.5)

**E2E Test**: Covered by later tasks

**Files Modified**:
- `convex/schema.ts` - DONE (added guest self-service fields and index, added event deadline/notification fields)

---

### Task 4.2: Guest Token Generation

**Description**: Generate unique tokens for guest self-service access.

**Acceptance Criteria**:
- [x] Token generated when guest is created (updated `create` and `createMany` mutations)
- [x] Token is URL-safe (alphanumeric, 24 chars)
- [x] Token is unique across all guests (uses `generateUniqueSelfServiceToken` with collision checking)
- [x] Existing guests can have tokens generated via mutation (`generateToken`)
- [x] Bulk token generation for all guests in event (`generateTokensForEvent`)
- [x] Query to get guest by token (`getBySelfServiceToken` - PUBLIC for portal)

**E2E Test**: `e2e/guest-self-service/token-generation.spec.ts`
- Create guest, verify token generated
- Create multiple guests, all tokens unique

**Files Modified**:
- `convex/guests.ts` - DONE (added token generation helpers and mutations)
- Bulk generate tokens for existing guests

**Files to Modify**:
- `convex/guests.ts` (add token generation logic)

---

### Task 4.3: Guest Self-Service Portal Page

**Description**: Create public page for guests to view/edit their info.

**Acceptance Criteria**:
- [x] Route: `/guest/[token]` (public, no auth required)
- [x] Displays guest's event name and date
- [x] Shows guest's current info (name, dietary, etc.)
- [x] Edit form for: dietary restrictions, dietary notes, phone, RSVP status
- [x] Cannot edit: name, email (contact organizer to change)
- [x] Submit updates guest record
- [x] Success message after save

**E2E Test**: `e2e/guest-self-service/portal.spec.ts`
- Navigate to guest portal via token URL
- Verify guest info displayed
- Edit dietary restrictions
- Save changes
- Reload page, verify changes persisted
- Try invalid token, see error page

**Files Created**:
- `src/app/(public)/guest/[token]/page.tsx` - DONE
- `src/app/(public)/guest/[token]/guest-form.tsx` - DONE

**Files Modified**:
- `convex/guests.ts` (selfServiceUpdate mutation) - DONE

---

### Task 4.4: Guest Portal Deadline Enforcement

**Description**: Allow organizers to set deadline for guest self-service changes.

**Acceptance Criteria**:
- [x] `events` table has `selfServiceDeadline` field (optional datetime)
- [x] Event settings page shows deadline picker
- [x] Guest portal shows deadline warning if approaching
- [x] Guest portal shows read-only mode if deadline passed
- [x] Clear messaging: "Changes locked 24 hours before event"

**E2E Test**: `e2e/guest-self-service/deadline.spec.ts`
- Set deadline in future, guest can edit
- Set deadline in past, guest sees read-only
- Clear deadline, guest can edit again

**Files Modified**:
- `convex/schema.ts` (selfServiceDeadline field) - DONE
- `convex/events.ts` (updateSelfServiceSettings mutation) - DONE
- `src/app/(public)/guest/[token]/page.tsx` (deadline logic) - DONE
- `src/app/(app)/event/[id]/page.tsx` (deadline picker UI) - DONE

---

### Task 4.5: Guest Change Notifications

**Description**: Notify organizer when guest updates their info.

**Acceptance Criteria**:
- [x] Email sent to organizer when guest updates via self-service
- [x] Email includes: guest name, what changed, timestamp
- [x] Organizer can disable notifications per event
- [x] Rate limiting: max 1 email per guest per hour

**E2E Test**: `e2e/guest-self-service/notifications.spec.ts`
- Guest makes change
- Verify notification email sent (mock email service)
- Guest makes another change within hour, no duplicate email

**Files Modified**:
- `convex/email.ts` - Added EMAIL_TYPES.GUEST_CHANGE_NOTIFICATION, triggerGuestChangeNotification, sendGuestChangeNotificationDirect
- `convex/guests.ts` - Updated selfServiceUpdate to track changes and trigger notification
- `convex/schema.ts` - selfServiceNotificationsEnabled already existed from Task 4.4

---

### Task 4.6: Guest Portal Link in Emails

**Description**: Include self-service portal link in guest emails.

**Acceptance Criteria**:
- [x] Invitation emails include "Update your details" link
- [x] Link uses guest's unique token
- [x] Confirmation emails include portal link
- [x] Email template has `{{guest_portal_url}}` placeholder

**E2E Test**: `e2e/guest-self-service/email-link.spec.ts`
- Send invitation email
- Verify portal link in email content
- Click link leads to correct guest portal

**Files Modified**:
- `convex/email.ts` - Added guestPortalUrl to replacePlaceholders, updated DEFAULT_TEMPLATES
- `convex/emailQueue.ts` - Pass baseUrl to check-in confirmation emails

---

## Phase 5: Admin Bulk Operations

### Task 5.1: Bulk Check-In UI

**Description**: Allow selecting multiple guests and checking them in at once.

**Acceptance Criteria**:
- [x] Checkbox appears next to each guest row
- [x] "Select All" checkbox in header
- [x] Bulk action bar appears when guests selected
- [x] "Check In Selected" button performs bulk check-in
- [x] Count shows "X guests selected"
- [x] Clear selection after action completes

**E2E Test**: `e2e/bulk-ops/bulk-checkin.spec.ts`
- Select 3 guests
- Click "Check In Selected"
- Verify all 3 marked as checked in
- Verify bulk action bar disappears

**Files Modified**:
- `src/app/(app)/event/[id]/live/page.tsx` - Added selection UI with checkboxes
- `src/components/bulk-action-bar.tsx` - Created new component

---

### Task 5.2: Bulk Check-In Mutation

**Description**: Convex mutation for checking in multiple guests at once.

**Acceptance Criteria**:
- [x] `guests.bulkCheckInSelected(guestIds[])` mutation created
- [x] Validates all guests belong to same event
- [x] Validates user owns the event
- [x] Returns count of successfully checked-in guests
- [x] Triggers confirmation emails for each guest

**E2E Test**: Covered by Task 5.1 test

**Files Modified**:
- `convex/guests.ts` - Added bulkCheckInSelected mutation

---

### Task 5.3: Bulk Undo Check-In

**Description**: Allow reversing check-in for multiple guests.

**Acceptance Criteria**:
- [x] "Undo Check-In" action in bulk action bar
- [x] Only appears when checked-in guests selected
- [x] Reverts check-in status for selected guests

**E2E Test**: `e2e/bulk-ops/bulk-undo-checkin.spec.ts`
- Check in 3 guests
- Select all 3
- Click "Undo Check-In"
- Verify all 3 no longer checked in

**Files Modified**:
- `src/components/bulk-action-bar.tsx` - Added undo check-in action
- `convex/guests.ts` - Added bulkUncheckIn mutation

---

### Task 5.4: Quick-Add Guest (Event Day)

**Description**: Streamlined guest addition for walk-ins on event day.

**Acceptance Criteria**:
- [x] "Quick Add" button visible on live event page
- [x] Modal with minimal fields: name only (required)
- [x] Optional fields collapsed by default: email, phone, dietary
- [x] Auto-assigns to table with available space (or unassigned)
- [x] Shows success toast with table assignment

**E2E Test**: `e2e/bulk-ops/quick-add.spec.ts`
- Click "Quick Add"
- Enter name only
- Submit
- Verify guest appears in list
- Verify assigned to a table

**Files Created**:
- `src/components/quick-add-guest-modal.tsx` - DONE

**Files Modified**:
- `src/app/(app)/event/[id]/live/page.tsx` (Quick Add integrated) - DONE

---

### Task 5.5: Bulk Status Change

**Description**: Mark multiple guests as no-show or late arrival.

**Acceptance Criteria**:
- [x] `guests` table has `status` field (present/no-show/late/none)
- [x] Bulk action: "Mark as No-Show"
- [x] Bulk action: "Mark as Late"
- [x] Status badges visible in guest list
- [ ] Status filterable in guest list *(Enhancement: add filter dropdown)*

**E2E Test**: `e2e/bulk-ops/bulk-status.spec.ts`
- Select 2 guests
- Mark as no-show
- Verify status badges appear
- Filter by no-show, see only those 2

**Files Modified**:
- `convex/schema.ts` (status field) - DONE
- `convex/guests.ts` (bulkUpdateStatus mutation) - DONE
- `src/app/(app)/event/[id]/live/page.tsx` (status UI in bulk action bar) - DONE

---

## Phase 6: Breakout Rooms / Sessions

### Task 6.1: Rooms Schema

**Description**: Add rooms table for physical spaces.

**Acceptance Criteria**:
- [x] `rooms` table created with fields: eventId, name, capacity, location, description
- [x] Index `by_event` for efficient queries
- [x] Basic CRUD mutations for rooms

**E2E Test**: `e2e/breakout/rooms-crud.spec.ts`
- Create room
- Edit room name
- Delete room
- List rooms for event

**Files Modified**:
- `convex/schema.ts` (rooms table) - DONE
- `convex/rooms.ts` - DONE

---

### Task 6.2: Sessions Schema

**Description**: Add sessions table for workshop tracks.

**Acceptance Criteria**:
- [x] `sessions` table created with fields: eventId, name, startTime, endTime, roomId, hasTableSeating, description, maxCapacity
- [x] Index `by_event` for efficient queries
- [x] Index `by_room` for room lookups
- [x] Sessions can optionally be assigned to rooms
- [x] Sessions can optionally have table seating

**E2E Test**: `e2e/breakout/sessions-crud.spec.ts`
- Create session
- Assign session to room
- Edit session times
- Delete session

**Files Modified**:
- `convex/schema.ts` (sessions table) - DONE
- `convex/sessions.ts` - DONE

---

### Task 6.3: Session Assignments Schema

**Description**: Junction table for guest-session assignments.

**Acceptance Criteria**:
- [x] `sessionAssignments` table created with fields: sessionId, guestId, eventId
- [x] Indexes: by_session, by_guest, by_event
- [x] Mutations for assigning/unassigning guests to sessions

**E2E Test**: `e2e/breakout/session-assignments.spec.ts`
- Assign guest to session
- Remove guest from session
- List guests in session
- List sessions for guest

**Files Modified**:
- `convex/schema.ts` (sessionAssignments table) - DONE
- `convex/sessions.ts` (assignment mutations) - DONE

---

### Task 6.4: Rooms Management Page

**Description**: UI for managing event rooms.

**Acceptance Criteria**:
- [x] Route: `/event/[id]/rooms`
- [x] List all rooms for event
- [x] Add room form (name, capacity, location)
- [x] Edit room inline
- [x] Delete room with confirmation
- [x] Shows which sessions use each room

**E2E Test**: `e2e/breakout/rooms-page.spec.ts`
- Navigate to rooms page
- Add a room
- Edit room capacity
- Delete room
- Verify list updates

**Files Created**:
- `src/app/(app)/event/[id]/rooms/page.tsx` - DONE

---

### Task 6.5: Sessions Management Page

**Description**: UI for managing event sessions.

**Acceptance Criteria**:
- [x] Route: `/event/[id]/sessions`
- [x] List all sessions for event
- [x] Add session form (name, start/end time, room dropdown, has seating toggle)
- [x] Edit session inline
- [x] Delete session with confirmation
- [ ] Visual schedule/timeline view *(Enhancement for future)*

**E2E Test**: `e2e/breakout/sessions-page.spec.ts`
- Navigate to sessions page
- Add a session
- Assign session to room
- Edit session time
- Delete session

**Files Created**:
- `src/app/(app)/event/[id]/sessions/page.tsx` - DONE

---

### Task 6.6: Session Guest Assignment UI

**Description**: Assign guests to sessions.

**Acceptance Criteria**:
- [x] Session detail page shows assigned guests
- [x] "Add Guests" opens picker with unassigned guests
- [x] Bulk assignment (select multiple guests)
- [x] Remove guest from session
- [x] Shows capacity vs assigned count

**E2E Test**: `e2e/breakout/session-guest-assignment.spec.ts`
- Open session detail
- Assign 3 guests
- Remove 1 guest
- Verify count updates

**Files Created**:
- `src/app/(app)/event/[id]/sessions/[sessionId]/page.tsx` - DONE

---

### Task 6.7: Event Navigation Update

**Description**: Add rooms and sessions to event navigation.

**Acceptance Criteria**:
- [x] Event hub shows "Rooms" link
- [x] Event hub shows "Sessions" link
- [ ] Breadcrumb navigation works *(Not yet implemented)*
- [ ] Mobile navigation includes new sections *(Not yet verified)*

**E2E Test**: `e2e/breakout/navigation.spec.ts`
- From event hub, click Rooms
- Verify page loads
- Click Sessions
- Verify page loads
- Breadcrumbs work correctly

**Files Modified**:
- `src/app/(app)/event/[id]/page.tsx` (add nav links) - DONE

---

## Phase 7: Algorithm Improvements

### Task 7.1: Seating History Schema

**Description**: Track who sat together at previous events.

**Acceptance Criteria**:
- [x] `seatingHistory` table with: organizerId, guestEmail, partnerEmail, eventId, roundNumber, timestamp
- [x] Index: by_organizer_guest for efficient lookups
- [x] Index: by_organizer_pair for efficient pair lookups
- [x] Index: by_event for event-scoped queries
- [x] Guest email used as identifier (works across events)

**E2E Test**: Covered by later tasks

**Files Modified**:
- `convex/schema.ts` (add seatingHistory table) - DONE

---

### Task 7.2: Populate Seating History

**Description**: Record seating history when assignments are committed.

**Acceptance Criteria**:
- [x] When `commitPreview` is called, record all tablemate pairs
- [x] When `assignTables` is called, record all tablemate pairs
- [x] History includes all rounds
- [x] Deduplication: A-B same as B-A, store once (canonical pair ordering)

**E2E Test**: `e2e/algorithm/history-recording.spec.ts`
- Create event with 8 guests
- Assign tables
- Verify seating history records created
- Check both directions of pair recorded

**Files Modified**:
- `convex/events.ts` (add history recording to assignTables) - DONE
- `convex/preview.ts` (add history recording to commitPreview) - DONE
- Created: `convex/seatingHistory.ts` (helper functions) - DONE
  - `recordPair()` - Single pair recording
  - `recordTableAssignments()` - Bulk recording from table assignments
  - `getHistoryBetweenGuests()` - Query history for a pair
  - `getGuestHistory()` - Get all past tablemates for a guest
  - `clearEventHistory()` - Remove history for re-running
  - `getPairSatTogetherCount()` - For matching algorithm scoring

---

### Task 7.3: Query Seating History in Matching

**Description**: Factor past tablemates into compatibility scoring.

**Acceptance Criteria**:
- [x] Matching algorithm queries seating history for guest pair
- [x] Recently sat together = penalty in score
- [x] Configurable: how many past events to consider (`maxEvents` parameter)
- [x] Configurable: how strong the penalty (`noveltyPreference` weight)

**E2E Test**: `e2e/algorithm/history-scoring.spec.ts`
- Create first event, assign tables, commit
- Create second event with same guests
- Verify algorithm avoids previous tablemates
- Compare with/without history consideration

**Files Modified**:
- `convex/seatingHistory.ts` - DONE
  - `getPairSatTogetherCount()` with `maxEvents` parameter
- `convex/events.ts` - DONE
  - Integrated cross-event history into `calculateCompatibilityScore()`
- `convex/preview.ts` - DONE
  - Integrated cross-event history into scoring

---

### Task 7.4: Novelty Preference Weight

**Description**: Add configurable weight for preferring new connections.

**Acceptance Criteria**:
- [x] `matchingConfig` has `noveltyPreference` weight (0-1)
- [x] 0 = ignore history, 1 = strongly prefer new connections
- [x] Default value: 0.5
- [ ] Matching wizard includes novelty question *(UI integration pending)*
- [ ] Human-readable explanation in config summary *(UI integration pending)*

**E2E Test**: `e2e/algorithm/novelty-weight.spec.ts`
- Set novelty to 0, verify repeat tablemates allowed
- Set novelty to 1, verify repeat tablemates avoided

**Files Modified**:
- `convex/schema.ts` - DONE (noveltyPreference field added to matchingConfig)
- `convex/matchingConfig.ts` - DONE
  - `updateNoveltyPreference()` mutation added
  - `saveMatchingConfig()` includes noveltyPreference
- `convex/events.ts` - DONE (noveltyPreference used in scoring)
- `convex/preview.ts` - DONE (noveltyPreference used in scoring)

**Files to Modify** (UI integration):
- `src/app/(app)/event/[id]/matching/page.tsx` (add novelty question)
- `src/lib/config-mapper.ts` (map novelty answer to weight)

---

### Task 7.5: Improve Department Mixing ✅

**Description**: Review and improve department mixing algorithm.

**Analysis Findings** (2026-01-29):
- Previous implementation used binary same-department check: penalty was same whether 1 or 4 people from same department at table
- Pairwise scoring in `calculateGuestCompatibility` didn't create strong "concentration caps"
- `preview.ts` had inconsistent implementation vs `events.ts`

**Implementation**:
- Added `calculateDepartmentConcentrationPenalty()` function with non-linear scaling:
  - 0 people from same dept: 0 penalty
  - 1 person: weight × 1
  - 2 people: weight × 2.5
  - 3 people: weight × 5
  - 4+ people: weight × 10 (strong discouragement)
- Added `countDepartmentDistribution()` helper for analysis
- Added `calculateTableDepartmentMixingScore()` for evaluating table composition
- Updated both `events.ts` and `preview.ts` to use concentration penalty

**Acceptance Criteria**:
- [x] Analyze current mixing effectiveness with test data
- [x] Document findings and proposed improvements
- [x] Implement improvements (non-linear concentration penalty)
- [ ] Before/after comparison with same test data *(Manual verification recommended)*

**E2E Test**: `e2e/algorithm/department-mixing.spec.ts`
- Create event with 24 guests, 6 departments, 4 per dept
- Run assignment algorithm
- Verify no table has more than 2 from same department
- Measure mixing score

**Files Modified**:
- `convex/matching.ts` - Added concentration penalty and helper functions
- `convex/events.ts` - Integrated concentration penalty into assignment scoring
- `convex/preview.ts` - Replaced binary check with concentration penalty

---

## Phase 8: Onboarding

### Task 8.1: Welcome Screen

**Description**: First-time user welcome after sign-up.

**Acceptance Criteria**:
- [x] Detect first-time user (no events)
- [x] Show welcome modal/page with Seatherder persona
- [x] Explain what the app does in border collie voice
- [x] Clear CTA to create first event

**E2E Test**: `e2e/onboarding/welcome.spec.ts`
- New user signs up
- Welcome screen appears
- Click "Create Event" goes to event creation

**Files Created**:
- `src/components/welcome-modal.tsx` - DONE

**Files Modified**:
- `src/app/(app)/admin/page.tsx` (show welcome for new users) - DONE

---

### Task 8.2: Quick-Start Event Creation

**Description**: Streamlined event creation for new users.

**Status**: ✅ Already implemented via current event creation flow

**Acceptance Criteria**:
- [x] Simplified event creation form (single dialog with name + event type)
- [x] Only required fields: event name (auto-generated, editable)
- [x] Smart defaults for everything else (via EVENT_TYPES system)
- [x] Option to customize later (in event hub)
- [ ] Progress indicator *(Not needed for single-step form)*

**E2E Test**: `e2e/onboarding/quick-start.spec.ts`
- Start quick-start flow
- Enter event name only
- Event created with defaults
- Redirected to event hub

**Implementation Notes**:
The current event creation flow in `src/app/(app)/admin/page.tsx` already provides:
- Auto-generated creative event name
- Event type selector with smart defaults (table size, rounds, duration)
- One-click creation with redirect to event hub
- No complex wizard needed - the current approach is already quick

---

### Task 8.3: Sample Data Option

**Description**: "Try with demo guests" to explore features.

**Acceptance Criteria**:
- [x] "Add sample guests" button on empty event
- [x] Generates 20-30 realistic demo guests (24 by default)
- [x] Includes variety: departments, interests, dietary restrictions
- [x] Clear indication this is demo data (tagged with 'demo' in customTags)
- [x] Easy to clear demo data ("Clear Demo" button)

**E2E Test**: `e2e/onboarding/sample-data.spec.ts`
- Create new event
- Click "Add sample guests"
- Verify guests added
- Clear demo data
- Verify guests removed

**Files Created**:
- `src/lib/sample-data.ts` (demo guest generator) - DONE
  - `generateSampleGuests(count)` - Creates realistic demo data
  - Balanced department distribution
  - Variety of interests, dietary restrictions, job levels

**Files Modified**:
- `convex/guests.ts` - DONE
  - `addSampleGuests()` mutation
  - `removeSampleGuests()` mutation
- `src/app/(app)/event/[id]/page.tsx` - DONE (UI integration)

---

### Task 8.4: Feature Tooltips

**Description**: Contextual help for key features.

**Acceptance Criteria**:
- [x] Tooltip component created
- [x] Help icons next to complex features (HelpCircle icon)
- [x] Tooltips explain feature in border collie voice
- [x] Tooltips dismissible, remember dismissed state (localStorage)
- [x] Key features covered: matching wizard, constraints, multi-round, guest features, QR check-in

**E2E Test**: `e2e/onboarding/tooltips.spec.ts`
- Navigate to matching wizard
- Verify tooltip appears
- Dismiss tooltip
- Reload page, tooltip stays dismissed

**Files Created**:
- `src/components/feature-tooltip.tsx` - DONE
  - `FeatureTooltip` component with 15+ feature definitions
  - `InlineHelp` component for inline text with tooltip
  - `useFeatureTooltip` hook for managing dismissed state
  - `resetAllFeatureTooltips()` utility for testing
- `src/components/ui/popover.tsx` - DONE (shadcn/ui dependency)

---

## Phase 9: Clerk Billing

### Task 9.1: Configure Billing Plans

**Description**: Set up subscription plans in Clerk.

**Acceptance Criteria**:
- [ ] Free tier: 1 event, 50 guests
- [ ] Pro tier: $399/year, unlimited events
- [ ] Single event: $49/event
- [ ] Plans configured in Clerk dashboard
- [ ] Documented in setup guide

**E2E Test**: N/A (Clerk dashboard configuration)

**Files to Modify**:
- `docs/CLERK_SETUP.md` (add billing config)

---

### Task 9.2: Subscription Status in Schema

**Description**: Track user subscription status.

**Acceptance Criteria**:
- [ ] `users` table or use Clerk metadata
- [ ] Track: subscription tier, event limit, guest limit
- [ ] Sync from Clerk webhooks

**E2E Test**: `e2e/billing/subscription-sync.spec.ts`
- Simulate Clerk webhook for subscription
- Verify status updated in app

**Files to Create**:
- `src/app/api/webhooks/clerk/route.ts` (webhook handler)
- Create: `convex/users.ts` (if using separate table)

---

### Task 9.3: Event Creation Limits

**Description**: Enforce subscription limits on event creation.

**Acceptance Criteria**:
- [ ] Free users blocked after 1 event
- [ ] Show upgrade prompt when limit reached
- [ ] Pro users can create unlimited events
- [ ] Clear messaging about current plan

**E2E Test**: `e2e/billing/event-limits.spec.ts`
- Free user creates event
- Try to create second event
- Verify blocked with upgrade prompt
- Upgrade to Pro (simulated)
- Verify can create more events

**Files to Modify**:
- `convex/events.ts` (add limit check to create)
- `src/app/(app)/admin/page.tsx` (show limit status)

---

### Task 9.4: Guest Limits

**Description**: Enforce guest limits per plan.

**Acceptance Criteria**:
- [ ] Free: 50 guests per event
- [ ] Pro: no limit (soft cap at 500 for performance)
- [ ] Warning at 80% of limit
- [ ] Block at limit with upgrade prompt

**E2E Test**: `e2e/billing/guest-limits.spec.ts`
- Free user adds 45 guests
- Warning appears
- Try to add 6 more
- Blocked at 50

**Files to Modify**:
- `convex/guests.ts` (add limit check)
- `src/app/(app)/event/[id]/seating/page.tsx` (show limit warning)

---

### Task 9.5: Billing Portal Link

**Description**: Allow users to manage their subscription.

**Acceptance Criteria**:
- [ ] "Manage Subscription" link in account menu
- [ ] Links to Clerk billing portal
- [ ] Users can upgrade/downgrade/cancel
- [ ] Webhook handles plan changes

**E2E Test**: `e2e/billing/portal-link.spec.ts`
- Click "Manage Subscription"
- Verify redirect to Clerk portal

**Files to Modify**:
- `src/components/user-menu.tsx` (add billing link)

---

## Phase 10: Legal Pages

### Task 10.1: Terms of Service

**Description**: Create Terms of Service page.

**Status**: ⚠️ NOT STARTED - Page needs to be created

**Acceptance Criteria**:
- [ ] Route: `/terms`
- [ ] Content adapted from Pathible template
- [ ] Event-management specific terms
- [ ] Last updated date
- [ ] Accessible from footer (footer link exists, page missing)

**E2E Test**: `e2e/legal/terms.spec.ts`
- Navigate to /terms
- Verify page loads
- Verify footer link works

**Files to Create**:
- `src/app/(public)/terms/page.tsx` *(NOT YET CREATED)*

---

### Task 10.2: Privacy Policy

**Description**: Create Privacy Policy page.

**Status**: ⚠️ NOT STARTED - Page needs to be created

**Acceptance Criteria**:
- [ ] Route: `/privacy`
- [ ] Content adapted from Pathible template
- [ ] Guest data handling section
- [ ] Cookie usage section
- [ ] Last updated date

**E2E Test**: `e2e/legal/privacy.spec.ts`
- Navigate to /privacy
- Verify page loads
- Verify footer link works

**Files to Create**:
- `src/app/(public)/privacy/page.tsx` *(NOT YET CREATED)*

---

### Task 10.3: Footer Links

**Description**: Add legal links to site footer.

**Acceptance Criteria**:
- [x] Footer component exists or created
- [x] Links to /terms and /privacy
- [x] Visible on marketing pages
- [x] Mobile-friendly layout

**E2E Test**: `e2e/legal/footer.spec.ts`
- Load any page
- Verify footer visible
- Click Terms link
- Click Privacy link

**Files Created/Modified**:
- Created: `src/components/footer.tsx` - DONE
- Modified: `src/app/(marketing)/layout.tsx` - DONE (includes Footer)

---

### Task 10.4: Cookie Consent Banner

**Description**: GDPR-compliant cookie consent.

**Acceptance Criteria**:
- [x] Banner appears for new visitors (after 1s delay)
- [x] Clear explanation of cookie usage
- [x] Accept/Decline buttons
- [x] Preference saved in localStorage (`seatherder_cookie_consent`)
- [x] Banner doesn't appear after choice made

**E2E Test**: `e2e/legal/cookie-consent.spec.ts`
- New visitor sees banner
- Accept cookies
- Reload, banner gone
- Clear storage, banner reappears

**Files Created**:
- `src/components/cookie-consent.tsx` - DONE
  - `CookieConsent` component with GDPR-compliant UI
  - `useCookieConsent` hook for checking consent status elsewhere

**Files Modified**:
- `src/app/layout.tsx` - DONE (includes CookieConsent component)

---

## Deferred: Homepage Changes

**Note**: All homepage/landing page changes require separate approval before implementation. This includes:
- Problem/solution narrative section
- Feature showcase updates
- Pricing section
- FAQ section
- Visual updates

Create separate plan when ready to address homepage.

---

## Test Directory Structure

```
e2e/
├── fixtures/
│   ├── auth.ts           # Login helpers
│   └── test-data.ts      # Factory functions
├── smoke.spec.ts         # Basic smoke test
├── auth/
│   ├── clerk-setup.spec.ts
│   ├── convex-integration.spec.ts
│   ├── event-isolation.spec.ts
│   ├── guest-isolation.spec.ts
│   ├── full-isolation.spec.ts
│   └── legacy-removed.spec.ts
├── dashboard/
│   └── user-experience.spec.ts
├── guest-self-service/
│   ├── token-generation.spec.ts
│   ├── portal.spec.ts
│   ├── deadline.spec.ts
│   ├── notifications.spec.ts
│   └── email-link.spec.ts
├── bulk-ops/
│   ├── bulk-checkin.spec.ts
│   ├── bulk-undo-checkin.spec.ts
│   ├── quick-add.spec.ts
│   └── bulk-status.spec.ts
├── breakout/
│   ├── rooms-crud.spec.ts
│   ├── sessions-crud.spec.ts
│   ├── session-assignments.spec.ts
│   ├── rooms-page.spec.ts
│   ├── sessions-page.spec.ts
│   ├── session-guest-assignment.spec.ts
│   └── navigation.spec.ts
├── algorithm/
│   ├── history-recording.spec.ts
│   ├── history-scoring.spec.ts
│   ├── novelty-weight.spec.ts
│   └── department-mixing.spec.ts
├── onboarding/
│   ├── welcome.spec.ts
│   ├── quick-start.spec.ts
│   ├── sample-data.spec.ts
│   └── tooltips.spec.ts
├── billing/
│   ├── subscription-sync.spec.ts
│   ├── event-limits.spec.ts
│   ├── guest-limits.spec.ts
│   └── portal-link.spec.ts
└── legal/
    ├── terms.spec.ts
    ├── privacy.spec.ts
    ├── footer.spec.ts
    └── cookie-consent.spec.ts
```

---

## Verification Strategy

Each phase has e2e tests. After completing each phase:

1. Run `npm run test:e2e` to execute all tests
2. All tests for completed phases must pass
3. Manual verification of key user flows
4. Code review before merging
