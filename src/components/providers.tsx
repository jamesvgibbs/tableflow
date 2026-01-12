"use client"

import { ConvexProvider, ConvexReactClient } from "convex/react"
import { ReactNode } from "react"
import { AuthProvider } from "@/components/auth-provider"

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ConvexProvider client={convex}>
      <AuthProvider>{children}</AuthProvider>
    </ConvexProvider>
  )
}
