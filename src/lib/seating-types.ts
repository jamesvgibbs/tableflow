import {
  Heart,
  Building2,
  Users,
  PartyPopper,
  UtensilsCrossed,
  Sparkles,
  type LucideIcon,
} from "lucide-react"

// ============================================================================
// Seating Event Types
// ============================================================================

export type SeatingEventType =
  | "wedding"
  | "corporate"
  | "networking"
  | "team"
  | "social"
  | "custom"

export interface SeatingEventTypeConfig {
  id: SeatingEventType
  name: string
  tagline: string
  description: string
  icon: LucideIcon
}

export const SEATING_EVENT_TYPES: Record<SeatingEventType, SeatingEventTypeConfig> = {
  wedding: {
    id: "wedding",
    name: "Wedding",
    tagline: "I understand weddings.",
    description: "I will keep families together. Or not. You tell me.",
    icon: Heart,
  },
  corporate: {
    id: "corporate",
    name: "Corporate Conference",
    tagline: "I will help them network.",
    description: "Same company? Different company? I can mix or match.",
    icon: Building2,
  },
  networking: {
    id: "networking",
    name: "Networking Event",
    tagline: "Maximum connections.",
    description: "I will make sure they meet new people. That is the point.",
    icon: Users,
  },
  team: {
    id: "team",
    name: "Team Building",
    tagline: "Break down the silos.",
    description: "Engineering meets marketing. Walls come down.",
    icon: PartyPopper,
  },
  social: {
    id: "social",
    name: "Dinner Party",
    tagline: "I know dinner parties.",
    description: "Couples together? Apart? I will make it work.",
    icon: UtensilsCrossed,
  },
  custom: {
    id: "custom",
    name: "Something Else",
    tagline: "I can figure it out.",
    description: "Tell me what matters. I will do the math.",
    icon: Sparkles,
  },
}

// ============================================================================
// Question Definitions
// ============================================================================

export interface QuestionOption {
  id: string
  label: string
  description: string
}

export interface Question {
  id: string
  question: string
  options: QuestionOption[]
  default: string
}

// Wedding Questions
export const WEDDING_QUESTIONS: Question[] = [
  {
    id: "family_grouping",
    question: "Same last name, same table?",
    options: [
      {
        id: "together",
        label: "Keep families together",
        description: "The Johnsons sit with the Johnsons. Less chaos.",
      },
      {
        id: "mix",
        label: "Mix them up",
        description: "Uncle Bob meets Aunt Sue's coworker. More interesting.",
      },
      {
        id: "some",
        label: "Keep immediate family only",
        description: "Parents with their kids. Cousins can roam.",
      },
    ],
    default: "together",
  },
  {
    id: "side_mixing",
    question: "Bride's side meets groom's side?",
    options: [
      {
        id: "separate",
        label: "Keep sides separate",
        description: "Traditional. Each side with their own.",
      },
      {
        id: "mix",
        label: "Mix the sides",
        description: "They are one family now. I will introduce them.",
      },
      {
        id: "some_mix",
        label: "Mix a little",
        description: "Some shared tables, some separate. Balance.",
      },
    ],
    default: "some_mix",
  },
  {
    id: "vip_handling",
    question: "VIP tables?",
    options: [
      {
        id: "yes",
        label: "Yes, I have VIPs",
        description: "Tell me who. I will seat them at special tables.",
      },
      {
        id: "no",
        label: "No VIPs",
        description: "Everyone is equal. I like this.",
      },
    ],
    default: "no",
  },
]

// Corporate Conference Questions
export const CORPORATE_QUESTIONS: Question[] = [
  {
    id: "company_mixing",
    question: "Same company, same table?",
    options: [
      {
        id: "separate",
        label: "No. Mix the companies.",
        description: "They came to network. I will make them.",
      },
      {
        id: "together",
        label: "Keep colleagues together",
        description: "They prefer the familiar. I understand.",
      },
      {
        id: "some_together",
        label: "One colleague max per table",
        description: "A safety buddy. But still networking.",
      },
    ],
    default: "separate",
  },
  {
    id: "job_level",
    question: "Mix executives with everyone?",
    options: [
      {
        id: "mix",
        label: "Mix all levels",
        description: "The intern meets the CEO. Exciting.",
      },
      {
        id: "separate",
        label: "Similar levels together",
        description: "Peers with peers. Less intimidating.",
      },
      {
        id: "strategic",
        label: "Strategic mixing",
        description: "Juniors with seniors. Mentorship happens.",
      },
    ],
    default: "strategic",
  },
  {
    id: "rounds",
    question: "Multiple rounds?",
    options: [
      {
        id: "one",
        label: "One round",
        description: "They sit. They stay. Simple.",
      },
      {
        id: "two",
        label: "Two rounds",
        description: "Twice the connections. I will not repeat tablemates.",
      },
      {
        id: "three",
        label: "Three rounds",
        description: "Maximum networking. I will keep it fresh.",
      },
    ],
    default: "two",
  },
]

// Networking Event Questions
export const NETWORKING_QUESTIONS: Question[] = [
  {
    id: "goal",
    question: "What is the goal?",
    options: [
      {
        id: "max_new",
        label: "Maximum new connections",
        description: "They meet as many new people as possible.",
      },
      {
        id: "shared_interest",
        label: "Shared interests",
        description: "AI people with AI people. Common ground.",
      },
      {
        id: "complementary",
        label: "Complementary goals",
        description: "Mentors with mentees. Investors with founders.",
      },
    ],
    default: "max_new",
  },
  {
    id: "industry",
    question: "Mix industries?",
    options: [
      {
        id: "mix",
        label: "Mix them all",
        description: "Healthcare meets fintech. Fresh perspectives.",
      },
      {
        id: "group",
        label: "Group by industry",
        description: "They speak the same language.",
      },
    ],
    default: "mix",
  },
]

// Team Building Questions
export const TEAM_QUESTIONS: Question[] = [
  {
    id: "team_mixing",
    question: "Break up existing teams?",
    options: [
      {
        id: "break",
        label: "Break them up",
        description: "Engineering meets marketing. Walls come down.",
      },
      {
        id: "keep",
        label: "Keep teams together",
        description: "Strengthen existing bonds.",
      },
      {
        id: "partial",
        label: "Mix some, keep some",
        description: "One teammate for comfort. New friends too.",
      },
    ],
    default: "break",
  },
  {
    id: "management",
    question: "Managers with their reports?",
    options: [
      {
        id: "separate",
        label: "Separate them",
        description: "People speak more freely without the boss.",
      },
      {
        id: "together",
        label: "Keep them together",
        description: "Leadership visibility matters.",
      },
      {
        id: "mix_levels",
        label: "Mix management levels",
        description: "Skip-levels meet. Ideas flow.",
      },
    ],
    default: "separate",
  },
]

// Dinner Party / Social Questions
export const SOCIAL_QUESTIONS: Question[] = [
  {
    id: "couples",
    question: "Couples sit together?",
    options: [
      {
        id: "together",
        label: "Keep couples together",
        description: "Partners side by side. Traditional.",
      },
      {
        id: "separate",
        label: "Separate couples",
        description: "They can talk at home. Meet new people.",
      },
      {
        id: "same_table",
        label: "Same table, not adjacent",
        description: "They can see each other. But mingle.",
      },
    ],
    default: "same_table",
  },
  {
    id: "interests",
    question: "Group by interests?",
    options: [
      {
        id: "group",
        label: "Similar interests together",
        description: "Book club at one table. Sports fans at another.",
      },
      {
        id: "mix",
        label: "Mix interests",
        description: "Diverse conversations. New discoveries.",
      },
    ],
    default: "mix",
  },
]

// Custom / Something Else Questions
export const CUSTOM_QUESTIONS: Question[] = [
  {
    id: "primary_goal",
    question: "What matters most?",
    options: [
      {
        id: "mix",
        label: "Meet new people",
        description: "Maximum mingling. I will shuffle them.",
      },
      {
        id: "group",
        label: "Stay with familiar faces",
        description: "Comfort over novelty. I get it.",
      },
      {
        id: "balance",
        label: "Balance of both",
        description: "Some new, some known. I can do that.",
      },
    ],
    default: "balance",
  },
  {
    id: "hierarchy",
    question: "Does seniority matter?",
    options: [
      {
        id: "yes",
        label: "Yes, consider it",
        description: "I will be thoughtful about levels.",
      },
      {
        id: "no",
        label: "No, ignore it",
        description: "Everyone is equal here.",
      },
    ],
    default: "no",
  },
]

// Question lookup by event type
export const QUESTIONS_BY_TYPE: Record<SeatingEventType, Question[]> = {
  wedding: WEDDING_QUESTIONS,
  corporate: CORPORATE_QUESTIONS,
  networking: NETWORKING_QUESTIONS,
  team: TEAM_QUESTIONS,
  social: SOCIAL_QUESTIONS,
  custom: CUSTOM_QUESTIONS,
}

// ============================================================================
// Answer Types
// ============================================================================

export interface WeddingAnswers {
  family_grouping: "together" | "mix" | "some"
  side_mixing: "separate" | "mix" | "some_mix"
  vip_handling: "yes" | "no"
}

export interface CorporateAnswers {
  company_mixing: "separate" | "together" | "some_together"
  job_level: "mix" | "separate" | "strategic"
  rounds: "one" | "two" | "three"
}

export interface NetworkingAnswers {
  goal: "max_new" | "shared_interest" | "complementary"
  industry: "mix" | "group"
}

export interface TeamAnswers {
  team_mixing: "break" | "keep" | "partial"
  management: "separate" | "together" | "mix_levels"
}

export interface SocialAnswers {
  couples: "together" | "separate" | "same_table"
  interests: "group" | "mix"
}

export interface CustomAnswers {
  primary_goal: "mix" | "group" | "balance"
  hierarchy: "yes" | "no"
}

export type SeatingAnswers =
  | WeddingAnswers
  | CorporateAnswers
  | NetworkingAnswers
  | TeamAnswers
  | SocialAnswers
  | CustomAnswers

// ============================================================================
// Confirmation Message Generation
// ============================================================================

export interface ConfirmationMessage {
  headline: string
  behaviors: string[]
  cta: string
}

export function generateConfirmationMessage(
  type: SeatingEventType,
  answers: Record<string, string>
): ConfirmationMessage {
  const behaviors: string[] = []

  switch (type) {
    case "wedding": {
      // Family grouping
      if (answers.family_grouping === "together") {
        behaviors.push("I will keep families together. The Johnsons stay with the Johnsons.")
      } else if (answers.family_grouping === "mix") {
        behaviors.push("I will mix families up. New connections at every table.")
      } else {
        behaviors.push("I will keep immediate family together. Extended family gets to mingle.")
      }

      // Side mixing
      if (answers.side_mixing === "separate") {
        behaviors.push("Bride's side and groom's side will stay separate.")
      } else if (answers.side_mixing === "mix") {
        behaviors.push("I will mix bride's side with groom's side. One family now.")
      } else {
        behaviors.push("Some tables will mix both sides. Some will stay separate.")
      }

      // VIP handling
      if (answers.vip_handling === "yes") {
        behaviors.push("VIPs will get special tables. Mark them and I will handle it.")
      } else {
        behaviors.push("No VIP tables. Everyone gets equal treatment.")
      }
      break
    }

    case "corporate": {
      // Company mixing
      if (answers.company_mixing === "separate") {
        behaviors.push("I will separate colleagues from the same company.")
      } else if (answers.company_mixing === "together") {
        behaviors.push("Colleagues will sit together. Familiar faces.")
      } else {
        behaviors.push("One colleague per table max. A safety buddy.")
      }

      // Job level
      if (answers.job_level === "mix") {
        behaviors.push("I will mix all job levels. The intern meets the CEO.")
      } else if (answers.job_level === "separate") {
        behaviors.push("Similar levels will sit together. Peers with peers.")
      } else {
        behaviors.push("Juniors with seniors. Mentorship happens.")
      }

      // Rounds
      if (answers.rounds === "one") {
        behaviors.push("One round. They sit, they stay.")
      } else if (answers.rounds === "two") {
        behaviors.push("Two rounds. Different tablemates each time.")
      } else {
        behaviors.push("Three rounds. Maximum networking. I will not repeat tablemates.")
      }
      break
    }

    case "networking": {
      // Goal
      if (answers.goal === "max_new") {
        behaviors.push("Maximum new connections. Everyone meets everyone.")
      } else if (answers.goal === "shared_interest") {
        behaviors.push("I will group by shared interests. Common ground.")
      } else {
        behaviors.push("Complementary goals. Mentors with mentees. Investors with founders.")
      }

      // Industry
      if (answers.industry === "mix") {
        behaviors.push("I will mix industries. Fresh perspectives.")
      } else {
        behaviors.push("Same industry together. They speak the same language.")
      }
      break
    }

    case "team": {
      // Team mixing
      if (answers.team_mixing === "break") {
        behaviors.push("I will break up existing teams. Cross-pollination.")
      } else if (answers.team_mixing === "keep") {
        behaviors.push("Teams stay together. Strengthen existing bonds.")
      } else {
        behaviors.push("One teammate for comfort. New friends too.")
      }

      // Management
      if (answers.management === "separate") {
        behaviors.push("Managers separated from their reports. People speak freely.")
      } else if (answers.management === "together") {
        behaviors.push("Managers with their teams. Leadership visibility.")
      } else {
        behaviors.push("Mix management levels. Skip-levels meet. Ideas flow.")
      }
      break
    }

    case "social": {
      // Couples
      if (answers.couples === "together") {
        behaviors.push("Couples sit side by side. Traditional.")
      } else if (answers.couples === "separate") {
        behaviors.push("Couples separated. They can talk at home.")
      } else {
        behaviors.push("Couples at same table but not adjacent. They can mingle.")
      }

      // Interests
      if (answers.interests === "group") {
        behaviors.push("I will group by interests. Book club together.")
      } else {
        behaviors.push("I will mix interests. Diverse conversations.")
      }
      break
    }

    case "custom": {
      // Primary goal
      if (answers.primary_goal === "mix") {
        behaviors.push("Maximum mingling. I will shuffle everyone.")
      } else if (answers.primary_goal === "group") {
        behaviors.push("Familiar faces together. Comfort over novelty.")
      } else {
        behaviors.push("Balance of new and known. Best of both.")
      }

      // Hierarchy
      if (answers.hierarchy === "yes") {
        behaviors.push("I will consider seniority. Thoughtful mixing.")
      } else {
        behaviors.push("Everyone is equal. Seniority ignored.")
      }
      break
    }
  }

  return {
    headline: `I understand. Here is the plan.`,
    behaviors,
    cta: "Let me work",
  }
}

// ============================================================================
// Guest Field Requirements by Event Type
// ============================================================================

export interface GuestFieldConfig {
  field: string
  label: string
  required: boolean
  placeholder: string
  helpText: string
}

export const GUEST_FIELDS_BY_TYPE: Record<SeatingEventType, GuestFieldConfig[]> = {
  wedding: [
    {
      field: "familyName",
      label: "Family Name",
      required: true,
      placeholder: "Johnson",
      helpText: "I need this to group families correctly.",
    },
    {
      field: "side",
      label: "Side",
      required: false,
      placeholder: "Bride or Groom",
      helpText: "Whose side are they on? Bride, Groom, or Both.",
    },
  ],
  corporate: [
    {
      field: "company",
      label: "Company",
      required: true,
      placeholder: "Acme Corp",
      helpText: "I need this to mix or match companies.",
    },
    {
      field: "attributes.jobLevel",
      label: "Job Level",
      required: false,
      placeholder: "Junior, Mid, Senior, Executive",
      helpText: "For strategic level mixing.",
    },
  ],
  networking: [
    {
      field: "company",
      label: "Company",
      required: false,
      placeholder: "Acme Corp",
      helpText: "Optional. I can use this for mixing.",
    },
    {
      field: "attributes.interests",
      label: "Interests",
      required: false,
      placeholder: "AI, Marketing, Finance",
      helpText: "What are they interested in?",
    },
  ],
  team: [
    {
      field: "team",
      label: "Team",
      required: true,
      placeholder: "Engineering",
      helpText: "I need this to break up or keep teams.",
    },
    {
      field: "managementLevel",
      label: "Management Level",
      required: false,
      placeholder: "IC, Manager, Director, Exec",
      helpText: "Are they a manager?",
    },
  ],
  social: [
    {
      field: "familyName",
      label: "Last Name",
      required: false,
      placeholder: "Smith",
      helpText: "I use this to identify couples.",
    },
    {
      field: "attributes.interests",
      label: "Interests",
      required: false,
      placeholder: "Books, Sports, Cooking",
      helpText: "For grouping by interest.",
    },
  ],
  custom: [
    {
      field: "department",
      label: "Group",
      required: false,
      placeholder: "Department or group name",
      helpText: "Optional grouping field.",
    },
  ],
}
