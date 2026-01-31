"use client"

import { useState } from "react"
import { AppHeader } from "@/components/layout/app-header"
import { MobileNav } from "@/components/layout/mobile-nav"

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <>
      {/* Mobile Navigation Sheet */}
      <MobileNav open={mobileNavOpen} onOpenChange={setMobileNavOpen} />

      {/* Header with breadcrumbs */}
      <AppHeader onMobileMenuToggle={() => setMobileNavOpen(true)} />

      {/* Page content */}
      <main>{children}</main>
    </>
  )
}
