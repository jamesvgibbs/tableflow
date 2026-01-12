import { Event, Guest, TableAssignment } from '@/lib/types'

const STORAGE_KEY = 'seatherder-events'

/**
 * Check if localStorage is available (SSR safety)
 */
function isLocalStorageAvailable(): boolean {
  try {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
  } catch {
    return false
  }
}

/**
 * Get all events from localStorage
 */
export function getEvents(): Event[] {
  if (!isLocalStorageAvailable()) {
    return []
  }

  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) {
      return []
    }
    const events = JSON.parse(data)
    return Array.isArray(events) ? events : []
  } catch (error) {
    console.error('Error parsing events from localStorage:', error)
    return []
  }
}

/**
 * Get a single event by ID
 */
export function getEvent(id: string): Event | null {
  if (!isLocalStorageAvailable()) {
    return null
  }

  try {
    const events = getEvents()
    return events.find((event) => event.id === id) || null
  } catch (error) {
    console.error('Error getting event from localStorage:', error)
    return null
  }
}

/**
 * Save or update an event
 */
export function saveEvent(event: Event): void {
  if (!isLocalStorageAvailable()) {
    console.warn('localStorage is not available')
    return
  }

  try {
    const events = getEvents()
    const existingIndex = events.findIndex((e) => e.id === event.id)

    if (existingIndex >= 0) {
      events[existingIndex] = event
    } else {
      events.push(event)
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(events))
  } catch (error) {
    console.error('Error saving event to localStorage:', error)
  }
}

/**
 * Delete an event by ID
 */
export function deleteEvent(id: string): void {
  if (!isLocalStorageAvailable()) {
    console.warn('localStorage is not available')
    return
  }

  try {
    const events = getEvents()
    const filteredEvents = events.filter((event) => event.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredEvents))
  } catch (error) {
    console.error('Error deleting event from localStorage:', error)
  }
}

/**
 * Find event, guest, and table by QR code ID
 * Used for the scan page to look up what a QR code refers to
 */
export function findByQrCodeId(qrCodeId: string): {
  event: Event
  guest?: Guest
  table?: TableAssignment
} | null {
  if (!isLocalStorageAvailable()) {
    return null
  }

  try {
    const events = getEvents()

    for (const event of events) {
      // Check if QR code belongs to a guest
      const guest = event.guests.find((g) => g.qrCodeId === qrCodeId)
      if (guest) {
        return { event, guest }
      }

      // Check if QR code belongs to a table
      const table = event.tables.find((t) => t.qrCodeId === qrCodeId)
      if (table) {
        return { event, table }
      }
    }

    return null
  } catch (error) {
    console.error('Error finding by QR code ID:', error)
    return null
  }
}
