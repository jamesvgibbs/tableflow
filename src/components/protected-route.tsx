"use client"

import { useAuth } from "@clerk/nextjs"
import { SeatherderLoading } from "@/components/seatherder-loading"

interface ProtectedRouteProps {
  children: React.ReactNode
}

/**
 * ProtectedRoute using Clerk authentication.
 * Shows loading state while checking auth, renders children if authenticated.
 * Unauthenticated users are handled by middleware redirect.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isLoaded, isSignedIn } = useAuth()

  if (!isLoaded) {
    return <SeatherderLoading message="I am checking your credentials..." />
  }

  // If not signed in, middleware will redirect to sign-in
  // This is a fallback in case middleware doesn't catch it
  if (!isSignedIn) {
    return <SeatherderLoading message="Redirecting to sign in..." />
  }

  return <>{children}</>
}
