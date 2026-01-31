"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, Home } from "lucide-react"
import { cn } from "@/lib/utils"

interface BreadcrumbsProps {
  eventName?: string
}

export function Breadcrumbs({ eventName }: BreadcrumbsProps) {
  const pathname = usePathname()

  // Build breadcrumb items based on pathname
  const items: { label: string; href?: string }[] = []

  // Dashboard is always first
  items.push({ label: "Dashboard", href: "/admin" })

  // Parse event routes
  const eventMatch = pathname.match(/^\/event\/([^/]+)/)
  if (eventMatch) {
    const eventId = eventMatch[1]
    const eventPath = `/event/${eventId}`

    // Add event name as second crumb
    if (eventName) {
      items.push({ label: eventName, href: eventPath })
    }

    // Check for sub-pages
    const subPageMatch = pathname.match(/^\/event\/[^/]+\/(.+)/)
    if (subPageMatch) {
      const subPage = subPageMatch[1]
      const subPageLabels: Record<string, string> = {
        seating: "How to Seat",
        "seating-editor": "Seating Editor",
        matching: "How to Seat",
        live: "Live Event",
        emails: "Emails",
        rooms: "Rooms",
        sessions: "Sessions",
      }

      // Handle nested sessions route
      if (subPage.startsWith("sessions/")) {
        items.push({ label: "Sessions", href: `${eventPath}/sessions` })
        // The session name would need to be passed as a prop if needed
      } else if (subPageLabels[subPage]) {
        items.push({ label: subPageLabels[subPage] })
      }
    }
  }

  // If just on /admin
  if (pathname === "/admin") {
    return (
      <nav className="flex items-center text-sm text-muted-foreground">
        <span className="font-medium text-foreground">Dashboard</span>
      </nav>
    )
  }

  return (
    <nav className="flex items-center text-sm text-muted-foreground">
      {items.map((item, index) => {
        const isLast = index === items.length - 1

        return (
          <div key={index} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground/50" />
            )}
            {isLast ? (
              <span className="font-medium text-foreground">{item.label}</span>
            ) : item.href ? (
              <Link
                href={item.href}
                className="hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span>{item.label}</span>
            )}
          </div>
        )
      })}
    </nav>
  )
}
