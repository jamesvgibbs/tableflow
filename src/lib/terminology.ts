import { DEFAULT_SETTINGS, getEventTypeSettings, type EventTypeSettings } from "./event-types"

/**
 * Event object type for terminology functions
 */
interface EventForTerminology {
  eventType?: string | null
  eventTypeSettings?: EventTypeSettings | null
}

/**
 * Get the resolved settings for an event
 * Priority: custom eventTypeSettings > eventType preset > defaults
 */
export function getTerminology(event: EventForTerminology | null | undefined): EventTypeSettings {
  // Return defaults if no event
  if (!event) {
    return DEFAULT_SETTINGS
  }

  // Use custom settings if defined
  if (event.eventTypeSettings) {
    return event.eventTypeSettings
  }

  // Use event type preset if defined
  if (event.eventType) {
    const presetSettings = getEventTypeSettings(event.eventType)
    if (presetSettings) {
      return presetSettings
    }
  }

  // Fall back to defaults
  return DEFAULT_SETTINGS
}

/**
 * Get the guest label (singular)
 */
export function getGuestLabel(event: EventForTerminology | null | undefined): string {
  return getTerminology(event).guestLabel
}

/**
 * Get the guest label (plural)
 */
export function getGuestLabelPlural(event: EventForTerminology | null | undefined): string {
  return getTerminology(event).guestLabelPlural
}

/**
 * Get the table label (singular)
 */
export function getTableLabel(event: EventForTerminology | null | undefined): string {
  return getTerminology(event).tableLabel
}

/**
 * Get the table label (plural)
 */
export function getTableLabelPlural(event: EventForTerminology | null | undefined): string {
  return getTerminology(event).tableLabelPlural
}

/**
 * Get the department/group label (singular)
 */
export function getDepartmentLabel(event: EventForTerminology | null | undefined): string {
  return getTerminology(event).departmentLabel
}

/**
 * Get the department/group label (plural)
 */
export function getDepartmentLabelPlural(event: EventForTerminology | null | undefined): string {
  return getTerminology(event).departmentLabelPlural
}

/**
 * Check if round timer should be shown
 */
export function shouldShowRoundTimer(event: EventForTerminology | null | undefined): boolean {
  return getTerminology(event).showRoundTimer
}

/**
 * Get a count label like "3 Guests" or "1 Attendee"
 */
export function getCountLabel(
  event: EventForTerminology | null | undefined,
  count: number,
  type: "guest" | "table" | "department"
): string {
  const terminology = getTerminology(event)

  switch (type) {
    case "guest":
      return `${count} ${count === 1 ? terminology.guestLabel : terminology.guestLabelPlural}`
    case "table":
      return `${count} ${count === 1 ? terminology.tableLabel : terminology.tableLabelPlural}`
    case "department":
      return `${count} ${count === 1 ? terminology.departmentLabel : terminology.departmentLabelPlural}`
  }
}

/**
 * Smart pluralize - picks singular or plural based on count
 */
export function pluralize(
  event: EventForTerminology | null | undefined,
  count: number,
  type: "guest" | "table" | "department"
): string {
  const terminology = getTerminology(event)

  switch (type) {
    case "guest":
      return count === 1 ? terminology.guestLabel : terminology.guestLabelPlural
    case "table":
      return count === 1 ? terminology.tableLabel : terminology.tableLabelPlural
    case "department":
      return count === 1 ? terminology.departmentLabel : terminology.departmentLabelPlural
  }
}
