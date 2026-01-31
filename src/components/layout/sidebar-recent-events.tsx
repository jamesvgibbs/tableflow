"use client"

import { useMemo, useSyncExternalStore, useCallback } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { Calendar } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  getRecentEvents,
  updateRecentEventName,
  removeRecentEvent,
  type RecentEvent,
} from "@/lib/recent-events"

interface SidebarRecentEventsProps {
  isCollapsed: boolean
}

// Create a simple store for recent events that works with useSyncExternalStore
let listeners: Array<() => void> = []
let cachedEvents: RecentEvent[] = []

function emitChange() {
  cachedEvents = getRecentEvents()
  for (const listener of listeners) {
    listener()
  }
}

function subscribe(listener: () => void) {
  listeners = [...listeners, listener]
  return () => {
    listeners = listeners.filter((l) => l !== listener)
  }
}

function getSnapshot(): RecentEvent[] {
  if (typeof window === "undefined") return []
  if (cachedEvents.length === 0) {
    cachedEvents = getRecentEvents()
  }
  return cachedEvents
}

function getServerSnapshot(): RecentEvent[] {
  return []
}

export function SidebarRecentEvents({ isCollapsed }: SidebarRecentEventsProps) {
  const pathname = usePathname()

  // Query all events to sync names
  const allEvents = useQuery(api.events.list)

  // Use useSyncExternalStore to read from localStorage without effect setState warnings
  const storedEvents = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  // Refresh when pathname changes (triggers re-render to pick up new events)
  const refreshKey = pathname

  // Sync event names with database and compute final list
  const recentEvents = useMemo(() => {
    // Re-read when refreshKey changes
    void refreshKey

    if (!allEvents) return storedEvents

    let hasChanges = false
    const currentEvents = getRecentEvents()

    currentEvents.forEach((stored) => {
      const dbEvent = allEvents.find((e) => e._id === stored.id)
      if (dbEvent && dbEvent.name !== stored.name) {
        // Name changed in database, update localStorage
        updateRecentEventName(stored.id, dbEvent.name)
        hasChanges = true
      } else if (!dbEvent) {
        // Event was deleted, remove from recent
        removeRecentEvent(stored.id)
        hasChanges = true
      }
    })

    // If we made changes, emit to update the store
    if (hasChanges) {
      // Schedule emit for after render
      setTimeout(emitChange, 0)
      return getRecentEvents()
    }

    return currentEvents
  }, [allEvents, storedEvents, refreshKey])

  if (recentEvents.length === 0 || isCollapsed) {
    return null
  }

  return (
    <div className="space-y-2">
      <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Recent Events
      </h3>
      <nav className="flex flex-col gap-1">
        {recentEvents.map((event) => {
          const href = `/event/${event.id}`
          const isActive = pathname.startsWith(href)

          return (
            <Link
              key={event.id}
              href={href}
              className={cn(
                "flex h-9 items-center gap-3 rounded-md px-3 text-sm transition-colors truncate",
                isActive
                  ? "bg-muted text-foreground font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Calendar className="h-4 w-4 shrink-0" />
              <span className="truncate">{event.name}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
