"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  Sparkles,
  MousePointer2,
  Play,
  Mail,
  MapPin,
  CalendarDays,
  Settings,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

interface EventTabsProps {
  eventId: string
}

const tabs = [
  { label: "Hub", href: "", icon: Home },
  { label: "How to Seat", href: "/matching", icon: Sparkles },
  { label: "Seating", href: "/seating-editor", icon: MousePointer2 },
  { label: "Live", href: "/live", icon: Play },
  { label: "Emails", href: "/emails", icon: Mail },
  { label: "Rooms", href: "/rooms", icon: MapPin },
  { label: "Sessions", href: "/sessions", icon: CalendarDays },
  { label: "Settings", href: "/settings", icon: Settings },
]

export function EventTabs({ eventId }: EventTabsProps) {
  const pathname = usePathname()
  const basePath = `/event/${eventId}`

  // Determine active tab
  const getIsActive = (tabHref: string) => {
    const fullPath = basePath + tabHref

    // Exact match for hub (empty href)
    if (tabHref === "") {
      return pathname === basePath
    }

    // For other tabs, check if pathname starts with the tab path
    return pathname.startsWith(fullPath)
  }

  return (
    <div className="sticky top-16 z-20 border-b bg-background">
      <ScrollArea className="w-full">
        <div className="flex h-12 items-center gap-1 px-4 lg:px-6">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = getIsActive(tab.href)
            const href = basePath + tab.href

            return (
              <Link
                key={tab.href}
                href={href}
                className={cn(
                  "inline-flex h-9 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition-colors whitespace-nowrap",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </Link>
            )
          })}
        </div>
        <ScrollBar orientation="horizontal" className="invisible" />
      </ScrollArea>
    </div>
  )
}
