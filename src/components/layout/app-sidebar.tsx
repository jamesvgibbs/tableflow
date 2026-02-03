"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Dog, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip"
import { SidebarNav } from "./sidebar-nav"
import { SidebarRecentEvents } from "./sidebar-recent-events"
import { SidebarToggle } from "./sidebar-toggle"

interface AppSidebarProps {
  isCollapsed: boolean
  onToggle: () => void
}

export function AppSidebar({ isCollapsed, onToggle }: AppSidebarProps) {
  const router = useRouter()

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen border-r bg-background transition-all duration-300 ease-in-out",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div
            className={cn(
              "flex h-16 items-center border-b px-4",
              isCollapsed ? "justify-center" : "gap-3"
            )}
          >
            <Link
              href="/admin"
              className={cn(
                "flex items-center gap-2 font-bold transition-opacity hover:opacity-80",
                isCollapsed ? "justify-center" : ""
              )}
            >
              <Dog className="h-6 w-6 text-primary" />
              {!isCollapsed && (
                <span className="text-lg text-primary">Seatherder</span>
              )}
            </Link>
          </div>

          {/* Create Event CTA */}
          <div className={cn("p-4", isCollapsed && "px-3")}>
            {isCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    className="h-10 w-10"
                    onClick={() => router.push("/admin?create=true")}
                  >
                    <Plus className="h-5 w-5" />
                    <span className="sr-only">New Event</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">New Event</TooltipContent>
              </Tooltip>
            ) : (
              <Button
                className="w-full gap-2"
                onClick={() => router.push("/admin?create=true")}
              >
                <Plus className="h-4 w-4" />
                New Event
              </Button>
            )}
          </div>

          <Separator />

          {/* Scrollable content */}
          <ScrollArea className="flex-1 px-3 py-4">
            <div className="space-y-6">
              {/* Recent Events */}
              <SidebarRecentEvents isCollapsed={isCollapsed} />

              {/* Main Navigation */}
              <div className="space-y-2">
                {!isCollapsed && (
                  <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Navigation
                  </h3>
                )}
                <SidebarNav isCollapsed={isCollapsed} />
              </div>
            </div>
          </ScrollArea>

          {/* Footer with collapse toggle */}
          <div className="border-t p-3">
            <div className={cn("flex", isCollapsed ? "justify-center" : "justify-end")}>
              <SidebarToggle isCollapsed={isCollapsed} onToggle={onToggle} />
            </div>
          </div>
        </div>
      </aside>
    </TooltipProvider>
  )
}
