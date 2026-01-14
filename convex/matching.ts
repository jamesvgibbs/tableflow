/**
 * Matching Algorithm Utilities
 *
 * Pure functions for calculating compatibility scores between guests
 * Used by the table assignment algorithm
 */

// Type for guest attributes as stored in the database
interface GuestAttributes {
  interests?: string[]
  jobLevel?: string
  goals?: string[]
  customTags?: string[]
}

// Type for matching weights configuration
export interface MatchingWeights {
  departmentMix: number
  interestAffinity: number
  jobLevelDiversity: number
  goalCompatibility: number
  repeatAvoidance: number
}

// Job level hierarchy for calculating distance
const JOB_LEVEL_ORDER: Record<string, number> = {
  junior: 0,
  mid: 1,
  senior: 2,
  executive: 3,
}

// Goal compatibility matrix - which goals work well together
// Values: 1 = highly compatible, 0 = neutral, -1 = incompatible
const GOAL_COMPATIBILITY: Record<string, Record<string, number>> = {
  'find-mentor': {
    'find-mentor': 0,     // Two mentees together - neutral
    recruit: 0.5,         // Recruiter might mentor
    learn: 0.3,           // Fellow learners
    network: 0.5,         // Networking can lead to mentorship
    partner: 0.3,
    sell: 0,
    invest: 0.7,          // Investors often mentor
  },
  recruit: {
    'find-mentor': 0.5,
    recruit: -0.3,        // Two recruiters competing - slight negative
    learn: 0.6,           // Learners are potential recruits
    network: 0.5,
    partner: 0.4,
    sell: 0.3,
    invest: 0.4,
  },
  learn: {
    'find-mentor': 0.3,
    recruit: 0.6,
    learn: 0.4,           // Learners can share knowledge
    network: 0.5,
    partner: 0.4,
    sell: 0.2,
    invest: 0.3,
  },
  network: {
    'find-mentor': 0.5,
    recruit: 0.5,
    learn: 0.5,
    network: 0.8,         // Networkers love other networkers
    partner: 0.7,
    sell: 0.5,
    invest: 0.6,
  },
  partner: {
    'find-mentor': 0.3,
    recruit: 0.4,
    learn: 0.4,
    network: 0.7,
    partner: 0.6,         // Partners can find each other
    sell: 0.5,
    invest: 0.8,          // Investors and partners align
  },
  sell: {
    'find-mentor': 0,
    recruit: 0.3,
    learn: 0.2,
    network: 0.5,
    partner: 0.5,
    sell: -0.2,           // Sellers competing - slight negative
    invest: 0.7,          // Investors are potential customers
  },
  invest: {
    'find-mentor': 0.7,
    recruit: 0.4,
    learn: 0.3,
    network: 0.6,
    partner: 0.8,
    sell: 0.7,
    invest: 0.5,          // Investors can co-invest
  },
}

/**
 * Calculate Jaccard similarity between two arrays
 * Returns 0-1 where 1 means identical sets
 */
export function calculateJaccardSimilarity(arr1: string[], arr2: string[]): number {
  if (arr1.length === 0 && arr2.length === 0) return 0
  if (arr1.length === 0 || arr2.length === 0) return 0

  const set1 = new Set(arr1.map((s) => s.toLowerCase()))
  const set2 = new Set(arr2.map((s) => s.toLowerCase()))

  const intersection = new Set([...set1].filter((x) => set2.has(x)))
  const union = new Set([...set1, ...set2])

  return intersection.size / union.size
}

/**
 * Calculate interest overlap between two guests
 * Returns 0-1 where 1 means identical interests
 */
export function calculateInterestOverlap(
  attrs1: GuestAttributes | undefined,
  attrs2: GuestAttributes | undefined
): number {
  const interests1 = attrs1?.interests || []
  const interests2 = attrs2?.interests || []

  return calculateJaccardSimilarity(interests1, interests2)
}

/**
 * Calculate job level distance between two guests
 * Returns 0-1 where 0 means same level, 1 means maximum distance (junior vs executive)
 */
export function calculateJobLevelDistance(
  attrs1: GuestAttributes | undefined,
  attrs2: GuestAttributes | undefined
): number {
  const level1 = attrs1?.jobLevel
  const level2 = attrs2?.jobLevel

  // If either is missing, return neutral (0.5)
  if (!level1 || !level2) return 0.5

  const order1 = JOB_LEVEL_ORDER[level1] ?? 1.5
  const order2 = JOB_LEVEL_ORDER[level2] ?? 1.5

  // Normalize to 0-1 range (max distance is 3: junior to executive)
  return Math.abs(order1 - order2) / 3
}

/**
 * Calculate goal compatibility between two guests
 * Returns -1 to 1 where 1 means highly compatible goals
 */
export function calculateGoalCompatibility(
  attrs1: GuestAttributes | undefined,
  attrs2: GuestAttributes | undefined
): number {
  const goals1 = attrs1?.goals || []
  const goals2 = attrs2?.goals || []

  // If either has no goals, return neutral
  if (goals1.length === 0 || goals2.length === 0) return 0

  // Calculate average compatibility across all goal pairs
  let totalScore = 0
  let pairCount = 0

  for (const g1 of goals1) {
    for (const g2 of goals2) {
      const compat = GOAL_COMPATIBILITY[g1]?.[g2] ?? 0
      totalScore += compat
      pairCount++
    }
  }

  return pairCount > 0 ? totalScore / pairCount : 0
}

/**
 * Calculate custom tag overlap
 * Returns 0-1 where 1 means identical tags
 */
export function calculateTagOverlap(
  attrs1: GuestAttributes | undefined,
  attrs2: GuestAttributes | undefined
): number {
  const tags1 = attrs1?.customTags || []
  const tags2 = attrs2?.customTags || []

  return calculateJaccardSimilarity(tags1, tags2)
}

/**
 * Calculate overall compatibility score between two guests
 * considering all attributes and weights
 *
 * Returns a score where higher = better match for sitting together
 */
export function calculateGuestCompatibility(
  guest1: {
    department?: string
    attributes?: GuestAttributes
  },
  guest2: {
    department?: string
    attributes?: GuestAttributes
  },
  weights: MatchingWeights
): number {
  let score = 0

  // Department mixing: positive weight means different departments are preferred
  const sameDepartment =
    guest1.department &&
    guest2.department &&
    guest1.department.toLowerCase() === guest2.department.toLowerCase()

  if (weights.departmentMix !== 0) {
    // If same department and positive weight, penalize (we want mixing)
    // If same department and negative weight, reward (we want grouping)
    const deptScore = sameDepartment ? -1 : 1
    score += deptScore * weights.departmentMix
  }

  // Interest affinity: positive weight means similar interests are preferred
  if (weights.interestAffinity !== 0) {
    const interestOverlap = calculateInterestOverlap(
      guest1.attributes,
      guest2.attributes
    )
    // Convert 0-1 to -1 to 1 range (0.5 is neutral)
    const interestScore = interestOverlap * 2 - 1
    score += interestScore * weights.interestAffinity
  }

  // Job level diversity: positive weight means different levels are preferred
  if (weights.jobLevelDiversity !== 0) {
    const levelDistance = calculateJobLevelDistance(
      guest1.attributes,
      guest2.attributes
    )
    // Convert 0-1 to -1 to 1 range (0.5 is neutral)
    const levelScore = levelDistance * 2 - 1
    score += levelScore * weights.jobLevelDiversity
  }

  // Goal compatibility: positive weight means compatible goals are preferred
  if (weights.goalCompatibility !== 0) {
    const goalCompat = calculateGoalCompatibility(
      guest1.attributes,
      guest2.attributes
    )
    score += goalCompat * weights.goalCompatibility
  }

  return score
}

/**
 * Calculate table quality score based on all guest pairs
 * Higher score = better table composition
 */
export function calculateTableQualityScore(
  tableGuests: Array<{
    department?: string
    attributes?: GuestAttributes
  }>,
  weights: MatchingWeights
): number {
  if (tableGuests.length < 2) return 0

  let totalScore = 0
  let pairCount = 0

  // Calculate compatibility for all unique pairs
  for (let i = 0; i < tableGuests.length; i++) {
    for (let j = i + 1; j < tableGuests.length; j++) {
      totalScore += calculateGuestCompatibility(
        tableGuests[i],
        tableGuests[j],
        weights
      )
      pairCount++
    }
  }

  // Return average pair score
  return pairCount > 0 ? totalScore / pairCount : 0
}

/**
 * Default weights for backward compatibility
 */
export const DEFAULT_WEIGHTS: MatchingWeights = {
  departmentMix: 0.8,
  interestAffinity: 0.3,
  jobLevelDiversity: 0.5,
  goalCompatibility: 0.4,
  repeatAvoidance: 0.9,
}
