"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { EVENT_TYPES, EVENT_TYPE_IDS } from "@/lib/event-types"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface EventTypeSelectorProps {
  value: string
  onChange: (typeId: string) => void
  className?: string
}

export function EventTypeSelector({
  value,
  onChange,
  className,
}: EventTypeSelectorProps) {
  return (
    <div className={cn("grid gap-3", className)}>
      {EVENT_TYPE_IDS.map((typeId) => {
        const eventType = EVENT_TYPES[typeId]
        const isSelected = value === typeId
        const Icon = eventType.icon

        return (
          <Card
            key={typeId}
            className={cn(
              "cursor-pointer transition-all hover:border-primary/50",
              isSelected && "border-primary ring-2 ring-primary/20"
            )}
            onClick={() => onChange(typeId)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    "rounded-lg p-2.5 transition-colors",
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <Icon className="size-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{eventType.name}</h3>
                    {isSelected && (
                      <Badge variant="default" className="text-xs">
                        Selected
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {eventType.description}
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="bg-muted px-2 py-0.5 rounded">
                      {eventType.defaults.tableSize} per {eventType.settings.tableLabel.toLowerCase()}
                    </span>
                    <span className="bg-muted px-2 py-0.5 rounded">
                      {eventType.defaults.numberOfRounds} round{eventType.defaults.numberOfRounds !== 1 ? "s" : ""}
                    </span>
                    {eventType.defaults.roundDuration > 0 && (
                      <span className="bg-muted px-2 py-0.5 rounded">
                        {eventType.defaults.roundDuration} min
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

/**
 * Compact version for inline selection
 */
interface EventTypeSelectorCompactProps {
  value: string
  onChange: (typeId: string) => void
  className?: string
}

export function EventTypeSelectorCompact({
  value,
  onChange,
  className,
}: EventTypeSelectorCompactProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {EVENT_TYPE_IDS.map((typeId) => {
        const eventType = EVENT_TYPES[typeId]
        const isSelected = value === typeId
        const Icon = eventType.icon

        return (
          <button
            key={typeId}
            type="button"
            onClick={() => onChange(typeId)}
            className={cn(
              "inline-flex items-center gap-2 px-3 py-2 rounded-lg border transition-all",
              "hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20",
              isSelected
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-background text-muted-foreground"
            )}
          >
            <Icon className="size-4" />
            <span className="text-sm font-medium">{eventType.name}</span>
          </button>
        )
      })}
    </div>
  )
}

/**
 * Display component showing selected event type info
 */
interface EventTypeDisplayProps {
  typeId: string | null | undefined
  className?: string
}

export function EventTypeDisplay({ typeId, className }: EventTypeDisplayProps) {
  if (!typeId) return null

  const eventType = EVENT_TYPES[typeId]
  if (!eventType) return null

  const Icon = eventType.icon

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="rounded-md p-1.5 bg-primary/10 text-primary">
        <Icon className="size-4" />
      </div>
      <span className="text-sm font-medium">{eventType.name}</span>
    </div>
  )
}
