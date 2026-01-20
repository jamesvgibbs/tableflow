/**
 * Config Mapper Service
 *
 * Translates user-friendly seating wizard answers into algorithm weights.
 * Users never see these weights - they just answer questions in plain language.
 */

import type { SeatingEventType } from "./seating-types"

// ============================================================================
// Types
// ============================================================================

export interface MatchingWeights {
  departmentMix: number // -1 to 1: positive = mix departments/groups
  interestAffinity: number // -1 to 1: positive = group similar interests
  jobLevelDiversity: number // -1 to 1: positive = mix job levels
  goalCompatibility: number // -1 to 1: positive = match complementary goals
  repeatAvoidance: number // 0 to 1: higher = avoid repeat tablemates
}

export interface SeatingConfig {
  seatingType: SeatingEventType
  answers: Record<string, string>
  weights: MatchingWeights
  numberOfRounds?: number
  vipTables?: number[]
}

// ============================================================================
// Default Weights
// ============================================================================

export const DEFAULT_WEIGHTS: MatchingWeights = {
  departmentMix: 0.5,
  interestAffinity: 0.3,
  jobLevelDiversity: 0.3,
  goalCompatibility: 0.4,
  repeatAvoidance: 0.8,
}

// ============================================================================
// Mapper Functions
// ============================================================================

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Map wedding answers to weights
 */
function mapWeddingAnswers(answers: Record<string, string>): Partial<SeatingConfig> {
  const weights: MatchingWeights = { ...DEFAULT_WEIGHTS }

  // Family grouping -> departmentMix (family = "department" in this context)
  switch (answers.family_grouping) {
    case "together":
      weights.departmentMix = -0.9 // Keep same "department" (family) together
      break
    case "mix":
      weights.departmentMix = 0.8 // Mix families
      break
    case "some":
      weights.departmentMix = 0.3 // Mild mixing
      break
  }

  // Side mixing -> slight adjustment to departmentMix
  switch (answers.side_mixing) {
    case "separate":
      // No additional mixing across sides - handled via constraint system
      break
    case "mix":
      weights.departmentMix = clamp(weights.departmentMix + 0.2, -1, 1)
      break
    case "some_mix":
      weights.departmentMix = clamp(weights.departmentMix + 0.1, -1, 1)
      break
  }

  // VIP handling is done via the vipTables config, not weights
  // Interest/goal weights less relevant for weddings
  weights.interestAffinity = 0
  weights.goalCompatibility = 0
  weights.jobLevelDiversity = 0
  weights.repeatAvoidance = 0.5

  return { weights }
}

/**
 * Map corporate conference answers to weights
 */
function mapCorporateAnswers(answers: Record<string, string>): Partial<SeatingConfig> {
  const weights: MatchingWeights = { ...DEFAULT_WEIGHTS }
  let numberOfRounds = 1

  // Company mixing -> departmentMix (company = "department" here)
  switch (answers.company_mixing) {
    case "separate":
      weights.departmentMix = 0.95 // Strongly mix companies
      break
    case "together":
      weights.departmentMix = -0.7 // Keep same company together
      break
    case "some_together":
      weights.departmentMix = 0.5 // Moderate mixing
      break
  }

  // Job level mixing
  switch (answers.job_level) {
    case "mix":
      weights.jobLevelDiversity = 0.9 // Mix all levels
      break
    case "separate":
      weights.jobLevelDiversity = -0.5 // Similar levels together
      break
    case "strategic":
      weights.jobLevelDiversity = 0.4 // Moderate mixing
      weights.goalCompatibility = 0.6 // Match for mentorship
      break
  }

  // Number of rounds
  switch (answers.rounds) {
    case "one":
      numberOfRounds = 1
      weights.repeatAvoidance = 0.7
      break
    case "two":
      numberOfRounds = 2
      weights.repeatAvoidance = 0.95
      break
    case "three":
      numberOfRounds = 3
      weights.repeatAvoidance = 1.0
      break
  }

  // Interest affinity moderate for corporate
  weights.interestAffinity = 0.3

  return { weights, numberOfRounds }
}

/**
 * Map networking event answers to weights
 */
function mapNetworkingAnswers(answers: Record<string, string>): Partial<SeatingConfig> {
  const weights: MatchingWeights = { ...DEFAULT_WEIGHTS }

  // Goal
  switch (answers.goal) {
    case "max_new":
      weights.departmentMix = 0.9
      weights.interestAffinity = -0.3 // Mix different interests
      weights.jobLevelDiversity = 0.7
      weights.goalCompatibility = 0.3
      weights.repeatAvoidance = 1.0
      break
    case "shared_interest":
      weights.departmentMix = 0.4
      weights.interestAffinity = 0.9 // Group similar interests
      weights.jobLevelDiversity = 0.3
      weights.goalCompatibility = 0.5
      weights.repeatAvoidance = 0.8
      break
    case "complementary":
      weights.departmentMix = 0.6
      weights.interestAffinity = 0.4
      weights.jobLevelDiversity = 0.5
      weights.goalCompatibility = 0.95 // Strong goal matching
      weights.repeatAvoidance = 0.9
      break
  }

  // Industry mixing
  switch (answers.industry) {
    case "mix":
      weights.departmentMix = clamp(weights.departmentMix + 0.2, -1, 1)
      break
    case "group":
      weights.departmentMix = clamp(weights.departmentMix - 0.4, -1, 1)
      break
  }

  return { weights }
}

/**
 * Map team building answers to weights
 */
function mapTeamAnswers(answers: Record<string, string>): Partial<SeatingConfig> {
  const weights: MatchingWeights = { ...DEFAULT_WEIGHTS }

  // Team mixing
  switch (answers.team_mixing) {
    case "break":
      weights.departmentMix = 0.95 // Strongly mix teams
      break
    case "keep":
      weights.departmentMix = -0.8 // Keep teams together
      break
    case "partial":
      weights.departmentMix = 0.4 // Moderate mixing
      break
  }

  // Management
  switch (answers.management) {
    case "separate":
      weights.jobLevelDiversity = 0.8 // Mix levels (separates managers from reports)
      break
    case "together":
      weights.jobLevelDiversity = -0.6 // Similar levels (keep with reports)
      break
    case "mix_levels":
      weights.jobLevelDiversity = 0.6 // Moderate level mixing
      break
  }

  // Less relevant for team building
  weights.interestAffinity = 0.2
  weights.goalCompatibility = 0.3
  weights.repeatAvoidance = 0.7

  return { weights }
}

/**
 * Map dinner party / social answers to weights
 */
function mapSocialAnswers(answers: Record<string, string>): Partial<SeatingConfig> {
  const weights: MatchingWeights = { ...DEFAULT_WEIGHTS }

  // Couples handling -> departmentMix (family name = "department")
  switch (answers.couples) {
    case "together":
      weights.departmentMix = -0.9 // Keep same last name together
      break
    case "separate":
      weights.departmentMix = 0.7 // Separate couples
      break
    case "same_table":
      weights.departmentMix = -0.3 // Same table but constraint handles adjacency
      break
  }

  // Interest grouping
  switch (answers.interests) {
    case "group":
      weights.interestAffinity = 0.9 // Group by interests
      break
    case "mix":
      weights.interestAffinity = -0.2 // Mix interests
      break
  }

  // Less relevant for social
  weights.jobLevelDiversity = 0
  weights.goalCompatibility = 0.3
  weights.repeatAvoidance = 0.6

  return { weights }
}

/**
 * Map custom event answers to weights
 */
function mapCustomAnswers(answers: Record<string, string>): Partial<SeatingConfig> {
  const weights: MatchingWeights = { ...DEFAULT_WEIGHTS }

  // Primary goal
  switch (answers.primary_goal) {
    case "mix":
      weights.departmentMix = 0.8
      weights.interestAffinity = -0.2
      weights.jobLevelDiversity = 0.6
      weights.goalCompatibility = 0.3
      weights.repeatAvoidance = 0.9
      break
    case "group":
      weights.departmentMix = -0.5
      weights.interestAffinity = 0.7
      weights.jobLevelDiversity = -0.3
      weights.goalCompatibility = 0.5
      weights.repeatAvoidance = 0.6
      break
    case "balance":
      weights.departmentMix = 0.4
      weights.interestAffinity = 0.3
      weights.jobLevelDiversity = 0.3
      weights.goalCompatibility = 0.4
      weights.repeatAvoidance = 0.8
      break
  }

  // Hierarchy
  switch (answers.hierarchy) {
    case "yes":
      weights.jobLevelDiversity = clamp(weights.jobLevelDiversity + 0.3, -1, 1)
      break
    case "no":
      weights.jobLevelDiversity = 0
      break
  }

  return { weights }
}

// ============================================================================
// Main Mapper
// ============================================================================

/**
 * Convert seating wizard answers to full configuration
 */
export function mapAnswersToConfig(
  seatingType: SeatingEventType,
  answers: Record<string, string>
): SeatingConfig {
  let partial: Partial<SeatingConfig>

  switch (seatingType) {
    case "wedding":
      partial = mapWeddingAnswers(answers)
      break
    case "corporate":
      partial = mapCorporateAnswers(answers)
      break
    case "networking":
      partial = mapNetworkingAnswers(answers)
      break
    case "team":
      partial = mapTeamAnswers(answers)
      break
    case "social":
      partial = mapSocialAnswers(answers)
      break
    case "custom":
      partial = mapCustomAnswers(answers)
      break
    default:
      partial = { weights: DEFAULT_WEIGHTS }
  }

  return {
    seatingType,
    answers,
    weights: partial.weights ?? DEFAULT_WEIGHTS,
    numberOfRounds: partial.numberOfRounds,
    vipTables: partial.vipTables,
  }
}

/**
 * Get default answers for an event type
 */
export function getDefaultAnswers(seatingType: SeatingEventType): Record<string, string> {
  switch (seatingType) {
    case "wedding":
      return {
        family_grouping: "together",
        side_mixing: "some_mix",
        vip_handling: "no",
      }
    case "corporate":
      return {
        company_mixing: "separate",
        job_level: "strategic",
        rounds: "two",
      }
    case "networking":
      return {
        goal: "max_new",
        industry: "mix",
      }
    case "team":
      return {
        team_mixing: "break",
        management: "separate",
      }
    case "social":
      return {
        couples: "same_table",
        interests: "mix",
      }
    case "custom":
      return {
        primary_goal: "balance",
        hierarchy: "no",
      }
    default:
      return {}
  }
}
