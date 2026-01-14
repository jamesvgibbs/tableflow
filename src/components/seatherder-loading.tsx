"use client"

import { Dog } from "lucide-react"
import { cn } from "@/lib/utils"

interface SeatherderLoadingProps {
  /** Message to display - should be in Seatherder's voice (first person) */
  message?: string
  /** Additional CSS classes */
  className?: string
  /** Size variant */
  size?: "sm" | "md" | "lg"
  /** Whether to show full screen centered layout */
  fullScreen?: boolean
}

/**
 * Consistent loading component with Seatherder's personality.
 * Uses the bouncing dog icon and first-person messaging.
 */
export function SeatherderLoading({
  message = "I am thinking...",
  className,
  size = "md",
  fullScreen = true,
}: SeatherderLoadingProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  }

  const textClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  }

  const content = (
    <div className={cn("text-center space-y-4", className)}>
      <div className="animate-bounce">
        <Dog className={cn(sizeClasses[size], "text-amber-600 mx-auto")} />
      </div>
      <p className={cn(textClasses[size], "text-muted-foreground")}>
        {message}
      </p>
    </div>
  )

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        {content}
      </div>
    )
  }

  return content
}
