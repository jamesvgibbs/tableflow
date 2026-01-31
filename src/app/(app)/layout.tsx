"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { useSidebar } from "@/hooks/use-sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"
import { ProtectedRoute } from "@/components/protected-route"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isCollapsed, isLoaded, toggle } = useSidebar()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        {/* Desktop Sidebar - hidden on mobile */}
        <div className="hidden lg:block">
          <AppSidebar isCollapsed={isCollapsed} onToggle={toggle} />
        </div>

        {/* Mobile Navigation Sheet */}
        <MobileNav open={mobileNavOpen} onOpenChange={setMobileNavOpen} />

        {/* Main content area */}
        <div
          className={cn(
            "min-h-screen transition-all duration-300 ease-in-out",
            // Add left margin on desktop for sidebar
            isLoaded && !isCollapsed ? "lg:ml-64" : "lg:ml-16"
          )}
        >
          {children}
        </div>
      </div>
    </ProtectedRoute>
  )
}
