"use client"

import { use, useEffect, useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { Id } from "@convex/_generated/dataModel"
import { AppHeader } from "@/components/layout/app-header"
import { EventTabs } from "@/components/layout/event-tabs"
import { MobileNav } from "@/components/layout/mobile-nav"
import { trackRecentEvent } from "@/lib/recent-events"

interface EventLayoutProps {
  children: React.ReactNode
  params: Promise<{ id: string }>
}

export default function EventLayout({ children, params }: EventLayoutProps) {
  const resolvedParams = use(params)
  const eventId = resolvedParams.id as Id<"events">
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  // Fetch event for name
  const event = useQuery(api.events.get, { id: eventId })

  // Track recent event access
  useEffect(() => {
    if (event?.name) {
      trackRecentEvent(eventId, event.name)
    }
  }, [eventId, event?.name])

  return (
    <>
      {/* Mobile Navigation Sheet */}
      <MobileNav open={mobileNavOpen} onOpenChange={setMobileNavOpen} />

      {/* Header with breadcrumbs */}
      <AppHeader
        eventName={event?.name}
        onMobileMenuToggle={() => setMobileNavOpen(true)}
      />

      {/* Event tabs */}
      <EventTabs eventId={eventId} />

      {/* Page content */}
      <main>{children}</main>
    </>
  )
}
