/**
 * Dietary restriction options
 */
export const DIETARY_OPTIONS = [
  'vegetarian',
  'vegan',
  'gluten-free',
  'dairy-free',
  'nut-allergy',
  'shellfish-allergy',
  'halal',
  'kosher',
] as const

export type DietaryRestriction = typeof DIETARY_OPTIONS[number]

/**
 * DietaryInfo - Guest dietary requirements
 */
export interface DietaryInfo {
  restrictions: string[]
  notes?: string
}

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
  dietary?: DietaryInfo       // Dietary requirements
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

// ============================================================================
// Matching Algorithm Types
// ============================================================================

/**
 * Job level options for matching
 */
export const JOB_LEVELS = [
  'junior',
  'mid',
  'senior',
  'executive',
] as const

export type JobLevel = typeof JOB_LEVELS[number]

export const JOB_LEVEL_LABELS: Record<JobLevel, string> = {
  junior: 'Junior / Entry Level',
  mid: 'Mid-Level',
  senior: 'Senior / Lead',
  executive: 'Executive / Director',
}

/**
 * Networking goal options
 */
export const NETWORKING_GOALS = [
  'find-mentor',
  'recruit',
  'learn',
  'network',
  'partner',
  'sell',
  'invest',
] as const

export type NetworkingGoal = typeof NETWORKING_GOALS[number]

export const NETWORKING_GOAL_LABELS: Record<NetworkingGoal, string> = {
  'find-mentor': 'Find a Mentor',
  recruit: 'Recruit Talent',
  learn: 'Learn New Skills',
  network: 'Expand Network',
  partner: 'Find Partners',
  sell: 'Find Customers',
  invest: 'Find Investment',
}

/**
 * Common interest categories (can be customized per event)
 */
export const DEFAULT_INTERESTS = [
  'AI / Machine Learning',
  'Marketing',
  'Sales',
  'Engineering',
  'Design',
  'Finance',
  'Operations',
  'Product',
  'Data Science',
  'Startups',
  'Enterprise',
  'Healthcare',
  'Education',
  'Sustainability',
] as const

/**
 * Guest matching attributes
 */
export interface GuestAttributes {
  interests?: string[]
  jobLevel?: JobLevel
  goals?: NetworkingGoal[]
  customTags?: string[]
}

/**
 * Matching algorithm weights
 */
export interface MatchingWeights {
  departmentMix: number       // -1 to 1: positive = mix departments
  interestAffinity: number    // -1 to 1: positive = group similar interests
  jobLevelDiversity: number   // -1 to 1: positive = mix job levels
  goalCompatibility: number   // -1 to 1: positive = match complementary goals
  repeatAvoidance: number     // 0 to 1: higher = stronger avoidance
}

/**
 * Default matching weights for new events
 */
export const DEFAULT_MATCHING_WEIGHTS: MatchingWeights = {
  departmentMix: 0.8,         // Strongly mix departments
  interestAffinity: 0.3,      // Slightly prefer similar interests
  jobLevelDiversity: 0.5,     // Moderate job level mixing
  goalCompatibility: 0.4,     // Moderate goal matching
  repeatAvoidance: 0.9,       // Strongly avoid repeat tablemates
}

/**
 * Matching weight presets
 */
export const MATCHING_PRESETS = {
  balanced: {
    name: 'Balanced',
    description: 'Good mix of diversity and shared interests',
    weights: DEFAULT_MATCHING_WEIGHTS,
  },
  maxDiversity: {
    name: 'Maximum Diversity',
    description: 'Mix people as much as possible',
    weights: {
      departmentMix: 1.0,
      interestAffinity: -0.3,
      jobLevelDiversity: 1.0,
      goalCompatibility: 0.2,
      repeatAvoidance: 1.0,
    },
  },
  groupSimilar: {
    name: 'Group Similar',
    description: 'Seat people with shared interests together',
    weights: {
      departmentMix: 0.3,
      interestAffinity: 0.9,
      jobLevelDiversity: 0.2,
      goalCompatibility: 0.7,
      repeatAvoidance: 0.8,
    },
  },
  networkingOptimized: {
    name: 'Networking Optimized',
    description: 'Maximize useful connections based on goals',
    weights: {
      departmentMix: 0.7,
      interestAffinity: 0.5,
      jobLevelDiversity: 0.6,
      goalCompatibility: 0.9,
      repeatAvoidance: 0.95,
    },
  },
} as const

export type MatchingPresetId = keyof typeof MATCHING_PRESETS
