import {
  Users,
  Heart,
  Building2,
  Sparkles,
  Briefcase,
  type LucideIcon,
} from "lucide-react"

/**
 * Event type settings that control terminology and behavior
 */
export interface EventTypeSettings {
  guestLabel: string
  guestLabelPlural: string
  tableLabel: string
  tableLabelPlural: string
  departmentLabel: string
  departmentLabelPlural: string
  showRoundTimer: boolean
}

/**
 * Full event type definition including defaults and metadata
 */
export interface EventTypeDefinition {
  id: string
  name: string
  description: string
  icon: LucideIcon
  settings: EventTypeSettings
  defaults: {
    tableSize: number
    numberOfRounds: number
    roundDuration: number // in minutes
  }
}

/**
 * Available event types with their configurations
 */
export const EVENT_TYPES: Record<string, EventTypeDefinition> = {
  networking: {
    id: "networking",
    name: "Networking Event",
    description: "Professional networking with rotating table assignments to maximize connections",
    icon: Users,
    settings: {
      guestLabel: "Attendee",
      guestLabelPlural: "Attendees",
      tableLabel: "Table",
      tableLabelPlural: "Tables",
      departmentLabel: "Company",
      departmentLabelPlural: "Companies",
      showRoundTimer: true,
    },
    defaults: {
      tableSize: 8,
      numberOfRounds: 3,
      roundDuration: 30,
    },
  },
  wedding: {
    id: "wedding",
    name: "Wedding Reception",
    description: "Traditional seating with family and friend groups at assigned tables",
    icon: Heart,
    settings: {
      guestLabel: "Guest",
      guestLabelPlural: "Guests",
      tableLabel: "Table",
      tableLabelPlural: "Tables",
      departmentLabel: "Group",
      departmentLabelPlural: "Groups",
      showRoundTimer: false,
    },
    defaults: {
      tableSize: 10,
      numberOfRounds: 1,
      roundDuration: 0,
    },
  },
  conference: {
    id: "conference",
    name: "Conference",
    description: "Multi-session event with breakout tables for discussions and workshops",
    icon: Building2,
    settings: {
      guestLabel: "Attendee",
      guestLabelPlural: "Attendees",
      tableLabel: "Table",
      tableLabelPlural: "Tables",
      departmentLabel: "Organization",
      departmentLabelPlural: "Organizations",
      showRoundTimer: true,
    },
    defaults: {
      tableSize: 6,
      numberOfRounds: 2,
      roundDuration: 45,
    },
  },
  "speed-dating": {
    id: "speed-dating",
    name: "Speed Dating",
    description: "Quick rotations at small stations to meet many people in one evening",
    icon: Sparkles,
    settings: {
      guestLabel: "Participant",
      guestLabelPlural: "Participants",
      tableLabel: "Station",
      tableLabelPlural: "Stations",
      departmentLabel: "Interest",
      departmentLabelPlural: "Interests",
      showRoundTimer: true,
    },
    defaults: {
      tableSize: 2,
      numberOfRounds: 8,
      roundDuration: 5,
    },
  },
  "corporate-mixer": {
    id: "corporate-mixer",
    name: "Corporate Mixer",
    description: "Internal company event mixing employees across departments",
    icon: Briefcase,
    settings: {
      guestLabel: "Employee",
      guestLabelPlural: "Employees",
      tableLabel: "Table",
      tableLabelPlural: "Tables",
      departmentLabel: "Department",
      departmentLabelPlural: "Departments",
      showRoundTimer: true,
    },
    defaults: {
      tableSize: 8,
      numberOfRounds: 2,
      roundDuration: 30,
    },
  },
}

/**
 * Get event type definition by ID
 */
export function getEventType(typeId: string): EventTypeDefinition | null {
  return EVENT_TYPES[typeId] || null
}

/**
 * Get default settings for an event type
 */
export function getEventTypeDefaults(typeId: string): EventTypeDefinition["defaults"] | null {
  const eventType = EVENT_TYPES[typeId]
  return eventType ? eventType.defaults : null
}

/**
 * Get settings (terminology) for an event type
 */
export function getEventTypeSettings(typeId: string): EventTypeSettings | null {
  const eventType = EVENT_TYPES[typeId]
  return eventType ? eventType.settings : null
}

/**
 * List of all event type IDs
 */
export const EVENT_TYPE_IDS = Object.keys(EVENT_TYPES)

/**
 * Default event type for new events and backward compatibility
 */
export const DEFAULT_EVENT_TYPE = "networking"

/**
 * Default settings when no event type is specified
 */
export const DEFAULT_SETTINGS: EventTypeSettings = EVENT_TYPES.networking.settings
