"use client"

import * as React from "react"
import { X, Users, ArrowRight, Link2Off, Trash2, CheckSquare } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export interface SelectedGuest {
  id: string
  name: string
  tableNumber?: number
}

interface BulkOperationsProps {
  /** Currently selected guests */
  selectedGuests: SelectedGuest[]
  /** Called when selection is cleared */
  onClearSelection: () => void
  /** Called when guests should be moved to a table */
  onMoveToTable?: (guestIds: string[], tableNumber: number) => void
  /** Called to create repel constraints between all selected pairs */
  onCreateRepelAll?: (guestIds: string[]) => void
  /** Called to remove selected guests */
  onRemoveGuests?: (guestIds: string[]) => void
  /** Number of tables available for selection */
  totalTables: number
  /** Whether actions are currently processing */
  isProcessing?: boolean
}

/**
 * Floating action bar for bulk guest operations
 * Appears when guests are selected, provides quick actions
 */
export function BulkOperationsBar({
  selectedGuests,
  onClearSelection,
  onMoveToTable,
  onCreateRepelAll,
  onRemoveGuests,
  totalTables,
  isProcessing = false,
}: BulkOperationsProps) {
  const [targetTable, setTargetTable] = React.useState<string>("")

  // Don't render if nothing selected
  if (selectedGuests.length === 0) return null

  const guestIds = selectedGuests.map((g) => g.id)
  const canCreateRepel = selectedGuests.length >= 2

  // Handle move to table
  const handleMove = () => {
    if (!targetTable || !onMoveToTable) return
    onMoveToTable(guestIds, parseInt(targetTable))
    setTargetTable("")
  }

  // Handle create repel for all pairs
  const handleRepelAll = () => {
    if (!onCreateRepelAll || !canCreateRepel) return
    onCreateRepelAll(guestIds)
  }

  // Handle remove
  const handleRemove = () => {
    if (!onRemoveGuests) return
    onRemoveGuests(guestIds)
  }

  // Calculate number of repel pairs that would be created
  const repelPairCount = (selectedGuests.length * (selectedGuests.length - 1)) / 2

  return (
    <TooltipProvider>
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-background border rounded-xl shadow-2xl p-3 flex items-center gap-3 animate-in slide-in-from-bottom-4 duration-200">
          {/* Selection Count */}
          <div className="flex items-center gap-2 pr-3 border-r">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <Users className="size-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">
                {selectedGuests.length} selected
              </p>
              <p className="text-xs text-muted-foreground">
                {selectedGuests.slice(0, 2).map((g) => g.name).join(", ")}
                {selectedGuests.length > 2 && ` +${selectedGuests.length - 2}`}
              </p>
            </div>
          </div>

          {/* Move to Table Action */}
          {onMoveToTable && (
            <div className="flex items-center gap-1">
              <Select value={targetTable} onValueChange={setTargetTable}>
                <SelectTrigger className="w-24 h-8">
                  <SelectValue placeholder="Table..." />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: totalTables }, (_, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>
                      Table {i + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleMove}
                    disabled={!targetTable || isProcessing}
                    className="gap-1"
                  >
                    <ArrowRight className="size-3" />
                    Move
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Move all selected to the chosen table
                </TooltipContent>
              </Tooltip>
            </div>
          )}

          {/* Create Repel Constraints */}
          {onCreateRepelAll && canCreateRepel && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRepelAll}
                  disabled={isProcessing}
                  className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Link2Off className="size-3" />
                  Separate All
                  <Badge variant="secondary" className="ml-1 text-[10px]">
                    {repelPairCount}
                  </Badge>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Create {repelPairCount} repel constraints to keep these people apart
              </TooltipContent>
            </Tooltip>
          )}

          {/* Remove Guests */}
          {onRemoveGuests && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRemove}
                  disabled={isProcessing}
                  className="gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="size-3" />
                  Remove
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Remove all selected guests from the event
              </TooltipContent>
            </Tooltip>
          )}

          {/* Clear Selection */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                onClick={onClearSelection}
                className="size-8"
              >
                <X className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Clear selection</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  )
}

/**
 * Hook for managing guest selection state
 */
export function useGuestSelection() {
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())
  const [lastSelectedId, setLastSelectedId] = React.useState<string | null>(null)

  // Toggle single selection
  const toggleSelection = React.useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
    setLastSelectedId(id)
  }, [])

  // Add to selection (for shift-click range)
  const addToSelection = React.useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.add(id)
      return next
    })
    setLastSelectedId(id)
  }, [])

  // Select range (for shift-click)
  const selectRange = React.useCallback(
    (ids: string[], fromId: string | null, toId: string) => {
      if (!fromId) {
        toggleSelection(toId)
        return
      }

      const fromIndex = ids.indexOf(fromId)
      const toIndex = ids.indexOf(toId)

      if (fromIndex === -1 || toIndex === -1) {
        toggleSelection(toId)
        return
      }

      const start = Math.min(fromIndex, toIndex)
      const end = Math.max(fromIndex, toIndex)
      const rangeIds = ids.slice(start, end + 1)

      setSelectedIds((prev) => {
        const next = new Set(prev)
        for (const id of rangeIds) {
          next.add(id)
        }
        return next
      })
      setLastSelectedId(toId)
    },
    [toggleSelection]
  )

  // Clear all selections
  const clearSelection = React.useCallback(() => {
    setSelectedIds(new Set())
    setLastSelectedId(null)
  }, [])

  // Select all
  const selectAll = React.useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids))
  }, [])

  // Check if selected
  const isSelected = React.useCallback(
    (id: string) => selectedIds.has(id),
    [selectedIds]
  )

  // Handle click with modifier keys
  const handleClick = React.useCallback(
    (id: string, allIds: string[], event: React.MouseEvent) => {
      if (event.shiftKey && lastSelectedId) {
        selectRange(allIds, lastSelectedId, id)
      } else if (event.ctrlKey || event.metaKey) {
        toggleSelection(id)
      } else {
        // Single click without modifiers - toggle or clear others and select
        if (selectedIds.size === 1 && selectedIds.has(id)) {
          clearSelection()
        } else {
          setSelectedIds(new Set([id]))
          setLastSelectedId(id)
        }
      }
    },
    [lastSelectedId, selectRange, toggleSelection, selectedIds, clearSelection]
  )

  return {
    selectedIds,
    selectedCount: selectedIds.size,
    toggleSelection,
    addToSelection,
    selectRange,
    clearSelection,
    selectAll,
    isSelected,
    handleClick,
    lastSelectedId,
  }
}

/**
 * Checkbox component for selection
 */
interface SelectionCheckboxProps {
  checked: boolean
  onChange: () => void
  className?: string
}

export function SelectionCheckbox({
  checked,
  onChange,
  className = "",
}: SelectionCheckboxProps) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onChange()
      }}
      className={`
        w-5 h-5 rounded border-2 flex items-center justify-center
        transition-colors duration-150
        ${checked
          ? "bg-primary border-primary text-primary-foreground"
          : "border-muted-foreground/40 hover:border-primary/60"
        }
        ${className}
      `}
    >
      {checked && <CheckSquare className="size-3" />}
    </button>
  )
}
