const STORAGE_KEY = "seatherder_recent_events"
const MAX_RECENT_EVENTS = 5

export interface RecentEvent {
  id: string
  name: string
  accessedAt: number
}

/**
 * Get recent events from localStorage
 */
export function getRecentEvents(): RecentEvent[] {
  if (typeof window === "undefined") return []

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    return JSON.parse(stored) as RecentEvent[]
  } catch {
    return []
  }
}

/**
 * Add or update an event in the recent events list
 * Moves the event to the top and maintains max 5 events
 */
export function trackRecentEvent(id: string, name: string): void {
  if (typeof window === "undefined") return

  const events = getRecentEvents()

  // Remove existing entry if present
  const filtered = events.filter((e) => e.id !== id)

  // Add to front with current timestamp
  const updated: RecentEvent[] = [
    { id, name, accessedAt: Date.now() },
    ...filtered,
  ].slice(0, MAX_RECENT_EVENTS)

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
}

/**
 * Remove an event from recent events (e.g., when deleted)
 */
export function removeRecentEvent(id: string): void {
  if (typeof window === "undefined") return

  const events = getRecentEvents()
  const filtered = events.filter((e) => e.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
}

/**
 * Clear all recent events
 */
export function clearRecentEvents(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(STORAGE_KEY)
}

/**
 * Update the name of an event in the recent events list
 * Used to sync with database when event names change
 */
export function updateRecentEventName(id: string, name: string): void {
  if (typeof window === "undefined") return

  const events = getRecentEvents()
  const updated = events.map((e) => (e.id === id ? { ...e, name } : e))
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
}
