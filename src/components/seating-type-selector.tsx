"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import {
  SEATING_EVENT_TYPES,
  type SeatingEventType,
} from "@/lib/seating-types"

interface SeatingTypeSelectorProps {
  value: SeatingEventType | null
  onChange: (type: SeatingEventType) => void
  disabled?: boolean
}

export function SeatingTypeSelector({
  value,
  onChange,
  disabled = false,
}: SeatingTypeSelectorProps) {
  const types = Object.values(SEATING_EVENT_TYPES)

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">What kind of event is this?</h2>
        <p className="text-sm text-muted-foreground">
          Tell me and I will figure out the rest.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {types.map((type) => {
          const Icon = type.icon
          const isSelected = value === type.id

          return (
            <button
              key={type.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(type.id)}
              className={cn(
                "relative flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-all",
                "hover:border-primary/50 hover:bg-accent/50",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "disabled:pointer-events-none disabled:opacity-50",
                isSelected
                  ? "border-primary bg-primary/5 ring-2 ring-primary ring-offset-2"
                  : "border-border bg-card"
              )}
            >
              <div className="flex items-center gap-3 w-full">
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium leading-none">{type.name}</p>
                  <p
                    className={cn(
                      "mt-1 text-sm",
                      isSelected ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    {type.tagline}
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground pl-13">
                {type.description}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
