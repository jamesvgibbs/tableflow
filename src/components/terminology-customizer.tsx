"use client"

import * as React from "react"
import { RotateCcw, Users, LayoutGrid, Building2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
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
  /** Called when settings are cleared (revert to preset) */
  onClearSettings: () => void
}

export function TerminologyCustomizer({
  eventType,
  eventTypeSettings,
  onSettingsChange,
  onClearSettings,
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
  const [showRoundTimer, setShowRoundTimer] = React.useState(effectiveSettings.showRoundTimer)

  // Track if there are unsaved changes
  const [hasChanges, setHasChanges] = React.useState(false)

  // Sync state when effective settings change (e.g., event type changes)
  React.useEffect(() => {
    setGuestLabel(effectiveSettings.guestLabel)
    setGuestLabelPlural(effectiveSettings.guestLabelPlural)
    setTableLabel(effectiveSettings.tableLabel)
    setTableLabelPlural(effectiveSettings.tableLabelPlural)
    setDepartmentLabel(effectiveSettings.departmentLabel)
    setDepartmentLabelPlural(effectiveSettings.departmentLabelPlural)
    setShowRoundTimer(effectiveSettings.showRoundTimer)
    setHasChanges(false)
  }, [effectiveSettings])

  // Handle field changes
  const handleChange = () => {
    setHasChanges(true)
  }

  // Save changes
  const handleSave = () => {
    onSettingsChange({
      guestLabel: guestLabel.trim() || "Guest",
      guestLabelPlural: guestLabelPlural.trim() || "Guests",
      tableLabel: tableLabel.trim() || "Table",
      tableLabelPlural: tableLabelPlural.trim() || "Tables",
      departmentLabel: departmentLabel.trim() || "Department",
      departmentLabelPlural: departmentLabelPlural.trim() || "Departments",
      showRoundTimer,
    })
    setHasChanges(false)
  }

  // Reset to preset defaults
  const handleReset = () => {
    onClearSettings()
    setHasChanges(false)
  }

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

  // Handle singular change with auto-plural suggestion
  const handleSingularChange = (
    value: string,
    setSingular: (v: string) => void,
    setPlural: (v: string) => void,
    currentPlural: string
  ) => {
    setSingular(value)
    // Only auto-update plural if it looks like a default plural of the old value
    const suggested = suggestPlural(value)
    if (value && (!currentPlural || currentPlural === suggestPlural(guestLabel) || currentPlural === suggestPlural(tableLabel) || currentPlural === suggestPlural(departmentLabel))) {
      setPlural(suggested)
    }
    handleChange()
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Terminology</h3>
        <p className="text-sm text-muted-foreground">
          I will use these words throughout your event. Make them yours.
        </p>
      </div>

      {/* Guest Label */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="size-4" />
            People
          </CardTitle>
          <CardDescription className="text-xs">
            What do you call the humans attending?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="guest-singular" className="text-xs">Singular</Label>
              <Input
                id="guest-singular"
                value={guestLabel}
                onChange={(e) => handleSingularChange(
                  e.target.value,
                  setGuestLabel,
                  setGuestLabelPlural,
                  guestLabelPlural
                )}
                placeholder="Guest"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="guest-plural" className="text-xs">Plural</Label>
              <Input
                id="guest-plural"
                value={guestLabelPlural}
                onChange={(e) => { setGuestLabelPlural(e.target.value); handleChange() }}
                placeholder="Guests"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Preview: &quot;Add {guestLabel}&quot; • &quot;{guestLabelPlural} List&quot;
          </p>
        </CardContent>
      </Card>

      {/* Table Label */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <LayoutGrid className="size-4" />
            Seating
          </CardTitle>
          <CardDescription className="text-xs">
            What do you call where they sit?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="table-singular" className="text-xs">Singular</Label>
              <Input
                id="table-singular"
                value={tableLabel}
                onChange={(e) => handleSingularChange(
                  e.target.value,
                  setTableLabel,
                  setTableLabelPlural,
                  tableLabelPlural
                )}
                placeholder="Table"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="table-plural" className="text-xs">Plural</Label>
              <Input
                id="table-plural"
                value={tableLabelPlural}
                onChange={(e) => { setTableLabelPlural(e.target.value); handleChange() }}
                placeholder="Tables"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Preview: &quot;{tableLabel} 5&quot; • &quot;12 {tableLabelPlural}&quot;
          </p>
        </CardContent>
      </Card>

      {/* Department Label */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Building2 className="size-4" />
            Groups
          </CardTitle>
          <CardDescription className="text-xs">
            How do you categorize people?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="dept-singular" className="text-xs">Singular</Label>
              <Input
                id="dept-singular"
                value={departmentLabel}
                onChange={(e) => handleSingularChange(
                  e.target.value,
                  setDepartmentLabel,
                  setDepartmentLabelPlural,
                  departmentLabelPlural
                )}
                placeholder="Department"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="dept-plural" className="text-xs">Plural</Label>
              <Input
                id="dept-plural"
                value={departmentLabelPlural}
                onChange={(e) => { setDepartmentLabelPlural(e.target.value); handleChange() }}
                placeholder="Departments"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Preview: &quot;{departmentLabel}: Engineering&quot; • &quot;5 {departmentLabelPlural}&quot;
          </p>
        </CardContent>
      </Card>

      {/* Timer Setting */}
      <div className="flex items-center justify-between py-3">
        <div className="space-y-0.5">
          <Label htmlFor="show-timer">Show Round Timer</Label>
          <p className="text-xs text-muted-foreground">
            Display countdown during live event
          </p>
        </div>
        <Switch
          id="show-timer"
          checked={showRoundTimer}
          onCheckedChange={(checked) => { setShowRoundTimer(checked); handleChange() }}
        />
      </div>

      <Separator />

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <Button
          onClick={handleSave}
          disabled={!hasChanges}
          className="flex-1"
        >
          {hasChanges ? "Save Changes" : "No Changes"}
        </Button>
        {eventTypeSettings && (
          <Button
            variant="outline"
            onClick={handleReset}
            className="gap-2"
          >
            <RotateCcw className="size-4" />
            Reset to Default
          </Button>
        )}
      </div>
    </div>
  )
}
