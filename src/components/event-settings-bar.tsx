"use client"

import * as React from "react"
import { Lock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { EditableSetting } from "@/components/editable-setting"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface LockStatus {
  isLocked: boolean
  lockReason: "none" | "guest_checked_in" | "timer_started" | "not_found"
  checkedInCount: number
}

interface ThemedStyles {
  pageText?: React.CSSProperties
  pageTextMuted?: React.CSSProperties
  pageInput?: React.CSSProperties
  badgeOutline?: React.CSSProperties
}

interface EventSettingsBarProps {
  tableSize: number
  numberOfRounds: number
  roundDuration: number
  isAssigned: boolean
  lockStatus: LockStatus
  guestCount: number
  onTableSizeChange: (size: number) => Promise<void>
  onRoundsChange: (rounds: number) => Promise<void>
  onDurationChange: (duration: number) => Promise<void>
  onViewCheckIns?: () => void
  themedStyles?: ThemedStyles | null
  className?: string
}

export function EventSettingsBar({
  tableSize,
  numberOfRounds,
  roundDuration,
  isAssigned,
  lockStatus,
  guestCount,
  onTableSizeChange,
  onRoundsChange,
  onDurationChange,
  onViewCheckIns,
  themedStyles,
  className,
}: EventSettingsBarProps) {
  const [confirmDialog, setConfirmDialog] = React.useState<{
    type: "tableSize" | "rounds" | "duration"
    value: number
  } | null>(null)

  const [errorDialog, setErrorDialog] = React.useState<{
    title: string
    message: string
    showViewCheckIns?: boolean
  } | null>(null)

  const handleError = (error: Error, settingType: string) => {
    const message = error.message

    // Check if this is a lock-related error
    if (message.includes("checked in") || message.includes("timer has started")) {
      setErrorDialog({
        title: `Cannot change ${settingType}`,
        message: message,
        showViewCheckIns: message.includes("checked in")
      })
    } else {
      // For other errors, show dialog since they need acknowledgment
      setErrorDialog({
        title: `Could not update ${settingType}`,
        message: message,
      })
    }
  }

  const getLockReason = () => {
    if (lockStatus.lockReason === "guest_checked_in") {
      return `Locked: ${lockStatus.checkedInCount} guest${lockStatus.checkedInCount !== 1 ? "s" : ""} checked in`
    }
    if (lockStatus.lockReason === "timer_started") {
      return "Locked: event timer has started"
    }
    return undefined
  }

  const handleTableSizeChange = async (value: number) => {
    if (isAssigned) {
      setConfirmDialog({ type: "tableSize", value })
    } else {
      await onTableSizeChange(value)
    }
  }

  const handleRoundsChange = async (value: number) => {
    if (isAssigned) {
      setConfirmDialog({ type: "rounds", value })
    } else {
      await onRoundsChange(value)
    }
  }

  const handleDurationChange = async (value: number) => {
    // Duration changes do not require reassignment
    await onDurationChange(value)
  }

  const handleConfirm = async () => {
    if (!confirmDialog) return

    try {
      if (confirmDialog.type === "tableSize") {
        await onTableSizeChange(confirmDialog.value)
      } else if (confirmDialog.type === "rounds") {
        await onRoundsChange(confirmDialog.value)
      }
    } finally {
      setConfirmDialog(null)
    }
  }

  const getConfirmMessage = () => {
    if (!confirmDialog) return ""

    if (confirmDialog.type === "tableSize") {
      return `I will reassign all ${guestCount} guests to fit ${confirmDialog.value} per table. This creates new seating arrangements.`
    }
    if (confirmDialog.type === "rounds") {
      return `I will regenerate seating for ${confirmDialog.value} round${confirmDialog.value !== 1 ? "s" : ""}. Current arrangements will be updated.`
    }
    return ""
  }

  return (
    <>
      <div className={className}>
        <div className="flex flex-wrap items-center gap-2">
          <EditableSetting
            label="Per table"
            value={tableSize}
            min={2}
            max={50}
            disabled={lockStatus.isLocked}
            disabledReason={getLockReason()}
            onChange={handleTableSizeChange}
            onError={(error) => handleError(error, "table size")}
            themedStyles={themedStyles}
          />

          <EditableSetting
            label="Rounds"
            value={numberOfRounds}
            min={1}
            max={10}
            disabled={lockStatus.isLocked}
            disabledReason={getLockReason()}
            onChange={handleRoundsChange}
            onError={(error) => handleError(error, "rounds")}
            themedStyles={themedStyles}
          />

          <EditableSetting
            label="Duration"
            value={roundDuration}
            suffix="min"
            min={1}
            max={180}
            disabled={lockStatus.isLocked}
            disabledReason={getLockReason()}
            onChange={handleDurationChange}
            onError={(error) => handleError(error, "duration")}
            themedStyles={themedStyles}
          />

          {lockStatus.isLocked && (
            <Badge variant="outline" className="text-xs gap-1" style={themedStyles?.badgeOutline}>
              <Lock className="size-3" />
              {lockStatus.lockReason === "guest_checked_in"
                ? `${lockStatus.checkedInCount} checked in`
                : "Timer started"}
            </Badge>
          )}
        </div>
      </div>

      <AlertDialog open={!!confirmDialog} onOpenChange={(open) => !open && setConfirmDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog?.type === "tableSize" ? "Change table size?" : "Change rounds?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {getConfirmMessage()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
              Change & Reassign
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!errorDialog} onOpenChange={(open) => !open && setErrorDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{errorDialog?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {errorDialog?.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {errorDialog?.showViewCheckIns && onViewCheckIns && (
              <AlertDialogCancel onClick={() => {
                setErrorDialog(null)
                onViewCheckIns()
              }}>
                View Check-ins
              </AlertDialogCancel>
            )}
            <AlertDialogAction onClick={() => setErrorDialog(null)}>
              Got it
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
