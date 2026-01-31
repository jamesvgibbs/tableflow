"use client"

import * as React from "react"
import { Users, LayoutGrid, Building2 } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  type EventTypeSettings,
  getEventTypeSettings,
  DEFAULT_SETTINGS,
} from "@/lib/event-types"

interface TerminologyCustomizerProps {
  /** Current event type (for getting defaults) */
  eventType?: string | null
  /** Current custom terminology settings */
  eventTypeSettings?: EventTypeSettings | null
  /** Called when settings change */
  onSettingsChange: (settings: EventTypeSettings) => void
}

export function TerminologyCustomizer({
  eventType,
  eventTypeSettings,
  onSettingsChange,
}: TerminologyCustomizerProps) {
  // Get the effective settings (custom > preset > defaults)
  const effectiveSettings = React.useMemo(() => {
    if (eventTypeSettings) return eventTypeSettings
    if (eventType) {
      const preset = getEventTypeSettings(eventType)
      if (preset) return preset
    }
    return DEFAULT_SETTINGS
  }, [eventType, eventTypeSettings])

  // Local state for editing
  const [guestLabel, setGuestLabel] = React.useState(effectiveSettings.guestLabel)
  const [guestLabelPlural, setGuestLabelPlural] = React.useState(effectiveSettings.guestLabelPlural)
  const [tableLabel, setTableLabel] = React.useState(effectiveSettings.tableLabel)
  const [tableLabelPlural, setTableLabelPlural] = React.useState(effectiveSettings.tableLabelPlural)
  const [departmentLabel, setDepartmentLabel] = React.useState(effectiveSettings.departmentLabel)
  const [departmentLabelPlural, setDepartmentLabelPlural] = React.useState(effectiveSettings.departmentLabelPlural)

  // Sync state when effective settings change (e.g., event type changes)
  React.useEffect(() => {
    setGuestLabel(effectiveSettings.guestLabel)
    setGuestLabelPlural(effectiveSettings.guestLabelPlural)
    setTableLabel(effectiveSettings.tableLabel)
    setTableLabelPlural(effectiveSettings.tableLabelPlural)
    setDepartmentLabel(effectiveSettings.departmentLabel)
    setDepartmentLabelPlural(effectiveSettings.departmentLabelPlural)
  }, [effectiveSettings])

  // Auto-pluralize helper (simple English rules)
  const suggestPlural = (singular: string): string => {
    if (!singular) return ""
    const lower = singular.toLowerCase()
    if (lower.endsWith("y") && !["a", "e", "i", "o", "u"].includes(lower[lower.length - 2])) {
      return singular.slice(0, -1) + "ies"
    }
    if (lower.endsWith("s") || lower.endsWith("x") || lower.endsWith("ch") || lower.endsWith("sh")) {
      return singular + "es"
    }
    return singular + "s"
  }

  // Save changes on blur
  const saveChanges = () => {
    onSettingsChange({
      guestLabel: guestLabel.trim() || "Guest",
      guestLabelPlural: guestLabelPlural.trim() || "Guests",
      tableLabel: tableLabel.trim() || "Table",
      tableLabelPlural: tableLabelPlural.trim() || "Tables",
      departmentLabel: departmentLabel.trim() || "Department",
      departmentLabelPlural: departmentLabelPlural.trim() || "Departments",
      showRoundTimer: effectiveSettings.showRoundTimer,
    })
  }

  // Handle singular change with auto-plural suggestion
  const handleSingularChange = (
    value: string,
    setSingular: (v: string) => void,
    setPlural: (v: string) => void,
    oldSingular: string,
    currentPlural: string
  ) => {
    setSingular(value)
    // Only auto-update plural if it matches the old auto-plural
    const oldSuggested = suggestPlural(oldSingular)
    if (currentPlural === oldSuggested) {
      setPlural(suggestPlural(value))
    }
  }

  return (
    <div className="space-y-6">
      {/* People */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Users className="size-4 text-muted-foreground" />
          <Label className="text-sm font-medium">People</Label>
        </div>
        <div className="grid grid-cols-2 gap-3 pl-6">
          <Input
            value={guestLabel}
            onChange={(e) => handleSingularChange(
              e.target.value,
              setGuestLabel,
              setGuestLabelPlural,
              guestLabel,
              guestLabelPlural
            )}
            onBlur={saveChanges}
            placeholder="Guest"
            className="h-9"
          />
          <Input
            value={guestLabelPlural}
            onChange={(e) => setGuestLabelPlural(e.target.value)}
            onBlur={saveChanges}
            placeholder="Guests"
            className="h-9"
          />
        </div>
        <p className="text-xs text-muted-foreground pl-6">
          e.g. &quot;{guestLabel} list&quot; &bull; &quot;24 {guestLabelPlural}&quot;
        </p>
      </div>

      {/* Seating */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <LayoutGrid className="size-4 text-muted-foreground" />
          <Label className="text-sm font-medium">Seating</Label>
        </div>
        <div className="grid grid-cols-2 gap-3 pl-6">
          <Input
            value={tableLabel}
            onChange={(e) => handleSingularChange(
              e.target.value,
              setTableLabel,
              setTableLabelPlural,
              tableLabel,
              tableLabelPlural
            )}
            onBlur={saveChanges}
            placeholder="Table"
            className="h-9"
          />
          <Input
            value={tableLabelPlural}
            onChange={(e) => setTableLabelPlural(e.target.value)}
            onBlur={saveChanges}
            placeholder="Tables"
            className="h-9"
          />
        </div>
        <p className="text-xs text-muted-foreground pl-6">
          e.g. &quot;{tableLabel} 5&quot; &bull; &quot;3 {tableLabelPlural}&quot;
        </p>
      </div>

      {/* Groups */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Building2 className="size-4 text-muted-foreground" />
          <Label className="text-sm font-medium">Groups</Label>
        </div>
        <div className="grid grid-cols-2 gap-3 pl-6">
          <Input
            value={departmentLabel}
            onChange={(e) => handleSingularChange(
              e.target.value,
              setDepartmentLabel,
              setDepartmentLabelPlural,
              departmentLabel,
              departmentLabelPlural
            )}
            onBlur={saveChanges}
            placeholder="Department"
            className="h-9"
          />
          <Input
            value={departmentLabelPlural}
            onChange={(e) => setDepartmentLabelPlural(e.target.value)}
            onBlur={saveChanges}
            placeholder="Departments"
            className="h-9"
          />
        </div>
        <p className="text-xs text-muted-foreground pl-6">
          e.g. &quot;{departmentLabel}: Engineering&quot; &bull; &quot;5 {departmentLabelPlural}&quot;
        </p>
      </div>
    </div>
  )
}
