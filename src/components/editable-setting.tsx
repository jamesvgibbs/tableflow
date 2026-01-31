"use client"

import * as React from "react"
import { Check, X, Pencil, Lock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface ThemedStyles {
  pageText?: React.CSSProperties
  pageTextMuted?: React.CSSProperties
  pageInput?: React.CSSProperties
}

interface EditableSettingProps {
  label: string
  value: number
  suffix?: string
  min?: number
  max?: number
  disabled?: boolean
  disabledReason?: string
  onChange: (value: number) => Promise<void>
  onError?: (error: Error) => void
  themedStyles?: ThemedStyles | null
  className?: string
}

export function EditableSetting({
  label,
  value,
  suffix,
  min = 1,
  max = 999,
  disabled = false,
  disabledReason,
  onChange,
  onError,
  themedStyles,
  className,
}: EditableSettingProps) {
  const [isEditing, setIsEditing] = React.useState(false)
  const [localValue, setLocalValue] = React.useState(value)
  const [isLoading, setIsLoading] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    setLocalValue(value)
  }, [value])

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleSave = async () => {
    if (localValue === value) {
      setIsEditing(false)
      return
    }

    const clampedValue = Math.min(max, Math.max(min, localValue))
    setIsLoading(true)
    try {
      await onChange(clampedValue)
      setIsEditing(false)
    } catch (error) {
      const err = error instanceof Error ? error : new Error("Failed to save")
      if (onError) {
        onError(err)
      }
      setLocalValue(value) // Reset on error
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setLocalValue(value)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleSave()
    } else if (e.key === "Escape") {
      handleCancel()
    }
  }

  // Display mode
  if (!isEditing) {
    const content = (
      <button
        onClick={() => !disabled && setIsEditing(true)}
        disabled={disabled}
        className={cn(
          "group inline-flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors text-sm",
          disabled
            ? "opacity-60 cursor-not-allowed"
            : "hover:bg-black/10 cursor-pointer",
          className
        )}
      >
        <span style={themedStyles?.pageTextMuted}>{label}:</span>
        <span className="font-medium" style={themedStyles?.pageText}>{value}</span>
        {suffix && <span style={themedStyles?.pageTextMuted}>{suffix}</span>}
        {disabled ? (
          <Lock className="size-3" style={themedStyles?.pageTextMuted} />
        ) : (
          <Pencil className="size-3 opacity-0 group-hover:opacity-100 transition-opacity" style={themedStyles?.pageTextMuted} />
        )}
      </button>
    )

    if (disabled && disabledReason) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent>
            <p>{disabledReason}</p>
          </TooltipContent>
        </Tooltip>
      )
    }

    return content
  }

  // Edit mode
  return (
    <div className={cn("inline-flex items-center gap-1.5", className)}>
      <span className="text-sm" style={themedStyles?.pageTextMuted}>{label}:</span>
      <Input
        ref={inputRef}
        type="number"
        min={min}
        max={max}
        value={localValue}
        onChange={(e) => setLocalValue(parseInt(e.target.value) || min)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          // Small delay to allow button clicks
          setTimeout(() => {
            if (isEditing && !isLoading) handleCancel()
          }, 150)
        }}
        className="w-16 h-7 text-sm"
        style={themedStyles?.pageInput}
        disabled={isLoading}
      />
      {suffix && <span className="text-sm" style={themedStyles?.pageTextMuted}>{suffix}</span>}
      <Button
        size="icon"
        variant="ghost"
        className="size-7"
        onClick={handleSave}
        disabled={isLoading}
        style={themedStyles?.pageText}
      >
        <Check className="size-4" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="size-7"
        onClick={handleCancel}
        disabled={isLoading}
        style={themedStyles?.pageText}
      >
        <X className="size-4" />
      </Button>
    </div>
  )
}
