/**
 * GuestRoundAssignment - A single round assignment for a guest
 */
export interface GuestRoundAssignment {
  id: string                  // Convex _id
  guestId: string             // Reference to guest
  eventId: string             // Reference to event
  roundNumber: number         // 1, 2, 3, etc.
  tableNumber: number         // Table assigned for this round
}

/**
 * Guest - Individual attendee at an event
 */
export interface Guest {
  id: string                  // UUID (or Convex _id)
  name: string                // Required - guest's full name
  department?: string         // Optional - department or group affiliation
  email?: string              // Optional - for future notifications
  phone?: string              // Optional - for future notifications
  tableNumber?: number        // Assigned table for Round 1 (backward compat)
  qrCodeId?: string           // Personal QR code identifier (UUID)
  checkedIn: boolean          // Whether guest has checked in
  roundAssignments?: GuestRoundAssignment[] // All round assignments (when fetched)
}

/**
 * TableAssignment - A table with assigned guests
 */
export interface TableAssignment {
  tableNumber: number         // Table identifier (1, 2, 3...)
  guests: Guest[]             // Array of guests at this table
  qrCodeId: string            // Table's QR code identifier (UUID)
}

/**
 * Event - Complete event with guests and table assignments
 */
export interface Event {
  id: string                  // UUID
  name: string                // Event display name
  tableSize: number           // Guests per table (default 8)
  guests: Guest[]             // All guests
  tables: TableAssignment[]   // Table assignments (populated after randomization)
  createdAt: string           // ISO date string
  isAssigned: boolean         // Whether assignments have been made
  // Multi-round support
  numberOfRounds?: number     // Number of table rotations (default 1)
  roundDuration?: number      // Minutes per round (optional timer)
  currentRound?: number       // 0 = not started, 1-N = active round
  roundStartedAt?: string     // ISO timestamp when current round started
}

/**
 * Utility type for creating a new guest (excludes auto-generated fields)
 */
export type NewGuest = Omit<Guest, 'id' | 'qrCodeId' | 'tableNumber' | 'checkedIn'>

/**
 * Utility type for creating a new event (excludes auto-generated fields)
 */
export type NewEvent = Omit<Event, 'id' | 'tables' | 'createdAt' | 'isAssigned'>
