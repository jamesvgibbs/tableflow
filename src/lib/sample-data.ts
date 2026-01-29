/**
 * Sample guest data generator for demo purposes.
 * Generates realistic guest data with variety in departments,
 * interests, dietary restrictions, and other attributes.
 */

const FIRST_NAMES = [
  'Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Quinn', 'Avery',
  'Skyler', 'Dakota', 'Cameron', 'Reese', 'Finley', 'Emerson', 'Parker', 'Sage',
  'Blake', 'Jamie', 'Drew', 'Hayden', 'Rowan', 'Phoenix', 'River', 'Charlie',
  'Addison', 'Bailey', 'Ellis', 'Kendall', 'Sydney', 'Peyton'
]

const LAST_NAMES = [
  'Chen', 'Williams', 'Patel', 'Garcia', 'Kim', 'Johnson', 'Brown', 'Singh',
  'Anderson', 'Martinez', 'Thompson', 'Lee', 'Wilson', 'Moore', 'Taylor', 'Thomas',
  'Jackson', 'White', 'Harris', 'Clark', 'Lewis', 'Robinson', 'Walker', 'Hall',
  'Young', 'Allen', 'King', 'Wright', 'Scott', 'Green'
]

const DEPARTMENTS = [
  'Engineering', 'Design', 'Marketing', 'Sales', 'Product', 'Operations',
  'HR', 'Finance', 'Legal', 'Customer Success'
]

const INTERESTS = [
  'AI/ML', 'Web Development', 'Mobile Apps', 'Cloud Infrastructure', 'DevOps',
  'UX Design', 'Data Science', 'Cybersecurity', 'Blockchain', 'Gaming',
  'Photography', 'Travel', 'Cooking', 'Fitness', 'Music', 'Reading',
  'Hiking', 'Art', 'Podcasts', 'Sustainability'
]

const GOALS = [
  'Learn new skills', 'Meet industry peers', 'Find mentors', 'Explore new roles',
  'Build network', 'Share knowledge', 'Discover opportunities', 'Collaborate on projects'
]

const JOB_LEVELS = ['junior', 'mid', 'senior', 'lead', 'manager', 'director', 'executive'] as const

const DIETARY_RESTRICTIONS = ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free', 'halal', 'kosher'] as const

const DIETARY_NOTES = [
  'Allergic to shellfish',
  'No spicy food please',
  'Lactose intolerant',
  'Prefers plant-based options',
  'No raw fish',
  'Avoids caffeine',
  null, null, null, null // More nulls to weight towards no notes
]

/**
 * Pick a random item from an array
 */
function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/**
 * Pick multiple random unique items from an array
 */
function pickRandomMultiple<T>(arr: T[], min: number, max: number): T[] {
  const count = min + Math.floor(Math.random() * (max - min + 1))
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(count, arr.length))
}

/**
 * Generate a random email from name
 */
function generateEmail(firstName: string, lastName: string): string {
  const domains = ['example.com', 'demo.test', 'sample.org']
  const formats = [
    () => `${firstName.toLowerCase()}.${lastName.toLowerCase()}`,
    () => `${firstName.toLowerCase()}${lastName.toLowerCase()}`,
    () => `${firstName.toLowerCase()[0]}${lastName.toLowerCase()}`,
  ]
  return `${pickRandom(formats)()}@${pickRandom(domains)}`
}

/**
 * Generate a random phone number (US format)
 */
function generatePhone(): string | undefined {
  // ~70% have phone numbers
  if (Math.random() > 0.7) return undefined
  const areaCode = 200 + Math.floor(Math.random() * 800)
  const prefix = 200 + Math.floor(Math.random() * 800)
  const line = 1000 + Math.floor(Math.random() * 9000)
  return `(${areaCode}) ${prefix}-${line}`
}

export interface SampleGuest {
  name: string
  email: string
  phone?: string
  department: string
  dietary: {
    restrictions: string[]
    notes: string | null
  }
  attributes: {
    interests: string[]
    jobLevel: string
    goals: string[]
    customTags: string[]
  }
  isDemo: boolean
}

/**
 * Generate a single sample guest
 */
export function generateSampleGuest(): SampleGuest {
  const firstName = pickRandom(FIRST_NAMES)
  const lastName = pickRandom(LAST_NAMES)

  // ~20% have dietary restrictions
  const hasDietary = Math.random() < 0.2
  const restrictions = hasDietary
    ? pickRandomMultiple([...DIETARY_RESTRICTIONS], 1, 2)
    : []

  return {
    name: `${firstName} ${lastName}`,
    email: generateEmail(firstName, lastName),
    phone: generatePhone(),
    department: pickRandom(DEPARTMENTS),
    dietary: {
      restrictions,
      notes: hasDietary ? pickRandom(DIETARY_NOTES) : null,
    },
    attributes: {
      interests: pickRandomMultiple(INTERESTS, 1, 4),
      jobLevel: pickRandom([...JOB_LEVELS]),
      goals: pickRandomMultiple(GOALS, 1, 3),
      customTags: ['demo'],
    },
    isDemo: true,
  }
}

/**
 * Generate multiple unique sample guests
 */
export function generateSampleGuests(count: number = 24): SampleGuest[] {
  const guests: SampleGuest[] = []
  const usedEmails = new Set<string>()
  const usedNames = new Set<string>()

  // Ensure good department distribution
  const departmentCounts = new Map<string, number>()
  DEPARTMENTS.forEach(d => departmentCounts.set(d, 0))

  while (guests.length < count) {
    const guest = generateSampleGuest()

    // Ensure unique email and name
    if (usedEmails.has(guest.email) || usedNames.has(guest.name)) {
      continue
    }

    // Balance department distribution (max 4 per department for 24 guests)
    const deptCount = departmentCounts.get(guest.department) || 0
    if (deptCount >= Math.ceil(count / DEPARTMENTS.length) + 1) {
      guest.department = DEPARTMENTS.find(d =>
        (departmentCounts.get(d) || 0) < Math.ceil(count / DEPARTMENTS.length)
      ) || guest.department
    }

    usedEmails.add(guest.email)
    usedNames.add(guest.name)
    departmentCounts.set(guest.department, (departmentCounts.get(guest.department) || 0) + 1)
    guests.push(guest)
  }

  return guests
}

/**
 * Default count for sample guests
 */
export const DEFAULT_SAMPLE_GUEST_COUNT = 24
