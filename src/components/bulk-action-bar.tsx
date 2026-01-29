"use client"

import * as React from "react"
import { X, CheckCircle2, XCircle, Loader2, Clock, UserX, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export type GuestStatus = "present" | "no-show" | "late" | null

interface BulkActionBarProps {
  selectedCount: number
  selectedCheckedInCount: number
  onCheckIn: () => Promise<void>
  onUncheckIn: () => Promise<void>
  onClearSelection: () => void
  onUpdateStatus?: (status: GuestStatus) => Promise<void>
  isLoading?: boolean
  className?: string
  style?: React.CSSProperties
}

export function BulkActionBar({
  selectedCount,
  selectedCheckedInCount,
  onCheckIn,
  onUncheckIn,
  onClearSelection,
  onUpdateStatus,
  isLoading = false,
  className,
  style,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null

  const notCheckedInCount = selectedCount - selectedCheckedInCount
  const hasNotCheckedIn = notCheckedInCount > 0
  const hasCheckedIn = selectedCheckedInCount > 0

  return (
    <div
      className={cn(
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-50",
        "bg-background border shadow-lg rounded-lg px-4 py-3",
        "flex items-center gap-4 flex-wrap justify-center",
        "animate-in slide-in-from-bottom-4 duration-200",
        className
      )}
      style={style}
    >
      <span className="text-sm font-medium">
        {selectedCount} guest{selectedCount !== 1 ? "s" : ""} selected
      </span>

      <div className="h-4 w-px bg-border" />

      <div className="flex items-center gap-2">
        {hasNotCheckedIn && (
          <Button
            size="sm"
            variant="default"
            onClick={onCheckIn}
            disabled={isLoading}
            className="gap-1.5"
          >
            {isLoading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="size-3.5" />
            )}
            Check In ({notCheckedInCount})
          </Button>
        )}

        {hasCheckedIn && (
          <Button
            size="sm"
            variant="outline"
            onClick={onUncheckIn}
            disabled={isLoading}
            className="gap-1.5"
          >
            {isLoading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <XCircle className="size-3.5" />
            )}
            Undo Check-In ({selectedCheckedInCount})
          </Button>
        )}

        {onUpdateStatus && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                disabled={isLoading}
                className="gap-1.5"
              >
                Set Status
                <ChevronDown className="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center">
              <DropdownMenuItem onClick={() => onUpdateStatus("present")}>
                <CheckCircle2 className="size-4 mr-2 text-green-600" />
                Present
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onUpdateStatus("late")}>
                <Clock className="size-4 mr-2 text-amber-600" />
                Late Arrival
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onUpdateStatus("no-show")}>
                <UserX className="size-4 mr-2 text-red-600" />
                No-Show
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onUpdateStatus(null)}>
                <X className="size-4 mr-2 text-muted-foreground" />
                Clear Status
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="h-4 w-px bg-border" />

      <Button
        size="sm"
        variant="ghost"
        onClick={onClearSelection}
        disabled={isLoading}
        className="gap-1.5"
      >
        <X className="size-3.5" />
        Clear
      </Button>
    </div>
  )
}
