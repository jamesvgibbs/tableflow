"use client"

import { useRouter } from "next/navigation"
import { Dog, Plus } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SidebarNav } from "./sidebar-nav"
import { SidebarRecentEvents } from "./sidebar-recent-events"

interface MobileNavProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MobileNav({ open, onOpenChange }: MobileNavProps) {
  const router = useRouter()

  const handleCreateEvent = () => {
    onOpenChange(false)
    router.push("/admin?create=true")
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="border-b px-4 py-4">
          <SheetTitle className="flex items-center gap-2">
            <Dog className="h-6 w-6 text-primary" />
            <span className="text-primary">Seatherder</span>
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col h-[calc(100%-65px)]">
          {/* Create Event CTA */}
          <div className="p-4">
            <Button className="w-full gap-2" onClick={handleCreateEvent}>
              <Plus className="h-4 w-4" />
              New Event
            </Button>
          </div>

          <Separator />

          {/* Scrollable content */}
          <ScrollArea className="flex-1 px-3 py-4">
            <div className="space-y-6">
              {/* Recent Events */}
              <SidebarRecentEvents isCollapsed={false} />

              {/* Main Navigation */}
              <div className="space-y-2">
                <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Navigation
                </h3>
                <SidebarNav isCollapsed={false} />
              </div>
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  )
}
