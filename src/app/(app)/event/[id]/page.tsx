"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useQuery, useMutation } from "convex/react"
import { api } from "@convex/_generated/api"
import { Id, Doc } from "@convex/_generated/dataModel"
import {
  Users,
  Shuffle,
  RotateCcw,
  X,
  Pencil,
  Check,
  Play,
  ExternalLink,
  Plus,
  Sparkles,
} from "lucide-react"

import { NewGuest, type DietaryInfo } from "@/lib/types"
import { cn, getDepartmentColors } from "@/lib/utils"
import { resolveThemeColors } from "@/lib/theme-presets"
import {
  getGuestLabel,
  getGuestLabelPlural,
  getTableLabelPlural,
  getDepartmentLabel,
  getCountLabel,
} from "@/lib/terminology"

// Calculate relative luminance for WCAG contrast
function getLuminance(hex: string): number {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return 0
  const [r, g, b] = [
    parseInt(result[1], 16) / 255,
    parseInt(result[2], 16) / 255,
    parseInt(result[3], 16) / 255,
  ].map(c => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

// Get contrast ratio between two colors (WCAG formula)
function getContrastRatio(color1: string, color2: string): number {
  const l1 = getLuminance(color1)
  const l2 = getLuminance(color2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

// Get a text color that meets WCAG AA contrast (4.5:1) against the background
function getAccessibleTextColor(background: string, preferredColor?: string): string {
  // If preferred color has sufficient contrast, use it
  if (preferredColor && getContrastRatio(background, preferredColor) >= 4.5) {
    return preferredColor
  }
  // Otherwise, use black or white based on which has better contrast
  const blackContrast = getContrastRatio(background, '#000000')
  const whiteContrast = getContrastRatio(background, '#FFFFFF')
  return blackContrast > whiteContrast ? '#000000' : '#FFFFFF'
}

// Get a muted text color that meets WCAG AA for large text (3:1)
function getAccessibleMutedColor(background: string): string {
  const lum = getLuminance(background)
  // Return a gray that contrasts well
  return lum > 0.5 ? '#525252' : '#A3A3A3'
}

// Adjust brightness of a hex color
function adjustBrightness(hex: string, factor: number): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return hex
  const adjust = (value: number) => Math.min(255, Math.max(0, Math.round(value * factor)))
  const r = adjust(parseInt(result[1], 16)).toString(16).padStart(2, '0')
  const g = adjust(parseInt(result[2], 16)).toString(16).padStart(2, '0')
  const b = adjust(parseInt(result[3], 16)).toString(16).padStart(2, '0')
  return `#${r}${g}${b}`
}

import { GuestForm } from "@/components/guest-form"
import { BulkEntry } from "@/components/bulk-entry"
import { CsvUpload } from "@/components/csv-upload"
import { DietaryBadges } from "@/components/dietary-badge"
import { SeatherderLoading } from "@/components/seatherder-loading"
import { EventSettingsBar } from "@/components/event-settings-bar"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { TooltipProvider } from "@/components/ui/tooltip"

interface PageProps {
  params: Promise<{ id: string }>
}

export default function EventPage({ params }: PageProps) {
  const router = useRouter()
  const [eventId, setEventId] = React.useState<Id<"events"> | null>(null)

  // Header state
  const [isEditingName, setIsEditingName] = React.useState(false)
  const [eventName, setEventName] = React.useState("")

  // Dialog state
  const [showResetDialog, setShowResetDialog] = React.useState(false)
  const [showAddGuestsDialog, setShowAddGuestsDialog] = React.useState(false)
  const [editingGuest, setEditingGuest] = React.useState<Doc<"guests"> | null>(null)

  // Hover state for themed buttons
  const [hoveredButton, setHoveredButton] = React.useState<string | null>(null)

  // Sample data state
  const [isAddingSampleGuests, setIsAddingSampleGuests] = React.useState(false)

  // Load params on mount
  React.useEffect(() => {
    async function loadParams() {
      const resolvedParams = await params
      setEventId(resolvedParams.id as Id<"events">)
    }
    loadParams()
  }, [params])

  // Convex queries
  const event = useQuery(
    api.events.get,
    eventId ? { id: eventId } : "skip"
  )
  const guests = useQuery(
    api.guests.getByEvent,
    eventId ? { eventId } : "skip"
  )
  const matchingConfig = useQuery(
    api.matchingConfig.getByEvent,
    eventId ? { eventId } : "skip"
  )
  const lockStatus = useQuery(
    api.events.getEditLockStatus,
    eventId ? { eventId } : "skip"
  )

  // Convex mutations
  const updateEventName = useMutation(api.events.updateName)
  const updateEventTableSize = useMutation(api.events.updateTableSize)
  const updateNumberOfRoundsMutation = useMutation(api.events.updateNumberOfRounds)
  const updateRoundDurationMutation = useMutation(api.events.updateRoundDuration)
  const addGuest = useMutation(api.guests.create)
  const addGuests = useMutation(api.guests.createMany)
  const addSampleGuestsMutation = useMutation(api.guests.addSampleGuests)
  const removeSampleGuestsMutation = useMutation(api.guests.removeSampleGuests)
  const removeGuest = useMutation(api.guests.remove)
  const removeAllGuests = useMutation(api.guests.removeAllFromEvent)
  const updateGuest = useMutation(api.guests.update)
  const assignTablesMutation = useMutation(api.events.assignTables)
  const resetAssignmentsMutation = useMutation(api.events.resetAssignments)

  // Sync event name with state when loaded
  React.useEffect(() => {
    if (event) {
      setEventName(event.name)
    }
  }, [event])

  // Add single guest
  const handleAddGuest = React.useCallback(
    async (guestData: NewGuest & { dietary?: DietaryInfo }) => {
      if (!eventId) return

      try {
        await addGuest({
          eventId,
          name: guestData.name,
          department: guestData.department,
          email: guestData.email,
          phone: guestData.phone,
          dietary: guestData.dietary,
        })
        toast.success(`I added ${guestData.name}.`)
      } catch {
        toast.error("I could not add this guest.")
      }
    },
    [eventId, addGuest]
  )

  // Add multiple guests
  const handleAddGuests = React.useCallback(
    async (guestsData: (NewGuest & { dietary?: DietaryInfo })[]) => {
      if (!eventId) return

      try {
        await addGuests({
          eventId,
          guests: guestsData.map((g) => ({
            name: g.name,
            department: g.department,
            email: g.email,
            phone: g.phone,
            dietary: g.dietary,
          })),
        })
        toast.success(`I added ${guestsData.length} guest${guestsData.length !== 1 ? "s" : ""}.`)
        setShowAddGuestsDialog(false)
      } catch {
        toast.error("I could not add those guests.")
      }
    },
    [eventId, addGuests]
  )

  // Remove guest
  const handleRemoveGuest = React.useCallback(
    async (guestId: string) => {
      try {
        await removeGuest({ id: guestId as Id<"guests"> })
        toast.success("Removed.")
      } catch {
        toast.error("I could not remove that guest.")
      }
    },
    [removeGuest]
  )

  // Edit guest
  const handleEditGuest = React.useCallback(
    async (guestData: {
      name: string
      department?: string
      email?: string
      phone?: string
      dietary?: DietaryInfo
      attributes?: {
        interests?: string[]
        jobLevel?: string
        goals?: string[]
        customTags?: string[]
      }
      familyName?: string
      side?: string
      company?: string
      team?: string
      managementLevel?: string
      isVip?: boolean
    }) => {
      if (!editingGuest) return

      try {
        await updateGuest({
          id: editingGuest._id,
          name: guestData.name,
          department: guestData.department,
          email: guestData.email,
          phone: guestData.phone,
          dietary: guestData.dietary,
          attributes: guestData.attributes,
          familyName: guestData.familyName,
          side: guestData.side,
          company: guestData.company,
          team: guestData.team,
          managementLevel: guestData.managementLevel,
          isVip: guestData.isVip,
        })
        toast.success(`Updated ${guestData.name}.`)
        setEditingGuest(null)
      } catch {
        toast.error("I could not update this guest.")
      }
    },
    [editingGuest, updateGuest]
  )

  // Clear all guests
  const handleClearAllGuests = React.useCallback(async () => {
    if (!eventId) return

    try {
      await removeAllGuests({ eventId })
      toast.success("All cleared. Starting fresh.")
    } catch {
      toast.error("I could not clear the guests.")
    }
  }, [eventId, removeAllGuests])

  // Add sample guests for demo
  const handleAddSampleGuests = React.useCallback(async () => {
    if (!eventId) return

    setIsAddingSampleGuests(true)
    try {
      const result = await addSampleGuestsMutation({ eventId, count: 24 })
      toast.success(`I added ${result.added} demo guests. Feel free to experiment.`)
    } catch {
      toast.error("I could not add the demo guests.")
    } finally {
      setIsAddingSampleGuests(false)
    }
  }, [eventId, addSampleGuestsMutation])

  // Clear sample/demo guests
  const handleClearSampleGuests = React.useCallback(async () => {
    if (!eventId) return

    try {
      const result = await removeSampleGuestsMutation({ eventId })
      toast.success(`Removed ${result.removed} demo guests.`)
    } catch {
      toast.error("I could not remove the demo guests.")
    }
  }, [eventId, removeSampleGuestsMutation])

  // Update event name
  const handleUpdateName = React.useCallback(async () => {
    if (!eventId || !eventName.trim()) return

    try {
      await updateEventName({ id: eventId, name: eventName.trim() })
      setIsEditingName(false)
      toast.success("I will remember the new name.")
    } catch {
      toast.error("I could not change the name.")
    }
  }, [eventId, eventName, updateEventName])

  // Assign tables
  const handleAssignTables = React.useCallback(async () => {
    if (!eventId || !guests || guests.length === 0) return

    try {
      const result = await assignTablesMutation({ id: eventId })
      toast.success(`Done. ${result.numGuests} guests seated at ${result.numTables} tables.`)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to assign tables"
      )
    }
  }, [eventId, guests, assignTablesMutation])

  // Re-shuffle tables
  const handleReshuffle = React.useCallback(async () => {
    if (!eventId || !event?.isAssigned) return

    try {
      await assignTablesMutation({ id: eventId })
      toast.success("Shuffled. New seating for everyone.")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to re-shuffle tables"
      )
    }
  }, [eventId, event?.isAssigned, assignTablesMutation])

  // Reset assignments
  const handleReset = React.useCallback(async () => {
    if (!eventId) return

    try {
      await resetAssignmentsMutation({ id: eventId })
      setShowResetDialog(false)
      toast.success("Reset. Let us start again.")
    } catch {
      toast.error("I could not reset the assignments.")
    }
  }, [eventId, resetAssignmentsMutation])

  // Get unique departments
  const uniqueDepartments = React.useMemo(() => {
    if (!guests) return []
    const depts = new Set(
      guests.map((g) => g.department).filter((d): d is string => !!d)
    )
    return Array.from(depts).sort()
  }, [guests])

  // Check if there are demo guests
  const hasDemoGuests = React.useMemo(() => {
    if (!guests) return false
    return guests.some(g => g.attributes?.customTags?.includes('demo'))
  }, [guests])

  const demoGuestCount = React.useMemo(() => {
    if (!guests) return 0
    return guests.filter(g => g.attributes?.customTags?.includes('demo')).length
  }, [guests])

  // Resolve theme colors
  const themeColors = React.useMemo(() => {
    if (!event) return null
    const hasTheme = event.themePreset || event.customColors
    if (!hasTheme) return null
    return resolveThemeColors(event.themePreset, event.customColors)
  }, [event])

  // Get themed styles with WCAG AA compliant contrast
  const themedStyles = React.useMemo(() => {
    if (!themeColors) return null

    // Calculate accessible text colors for different backgrounds
    const pageTextColor = getAccessibleTextColor(themeColors.background, themeColors.foreground)
    const cardTextColor = getAccessibleTextColor(themeColors.secondary)
    const primaryTextColor = getAccessibleTextColor(themeColors.primary)
    const primaryHoverBg = adjustBrightness(themeColors.primary, 0.85)
    const primaryHoverTextColor = getAccessibleTextColor(primaryHoverBg)
    const accentTextColor = getAccessibleTextColor(themeColors.accent)
    const mutedTextColor = getAccessibleTextColor(themeColors.muted)

    return {
      // CSS custom properties for hover states
      cssVars: {
        '--theme-primary': themeColors.primary,
        '--theme-primary-hover': primaryHoverBg,
        '--theme-primary-text': primaryTextColor,
        '--theme-primary-hover-text': primaryHoverTextColor,
        '--theme-card-text': cardTextColor,
      } as React.CSSProperties,
      // Page-level (on background color)
      page: {
        backgroundColor: themeColors.background,
        color: pageTextColor,
      },
      pageText: {
        color: pageTextColor,
      },
      pageTextMuted: {
        color: getAccessibleMutedColor(themeColors.background),
      },
      pageInput: {
        backgroundColor: `${pageTextColor}15`,
        borderColor: `${pageTextColor}30`,
        color: pageTextColor,
      },
      // Card-level (on secondary color)
      card: {
        backgroundColor: themeColors.secondary,
        borderColor: themeColors.muted,
        color: cardTextColor,
      },
      cardText: {
        color: cardTextColor,
      },
      cardTextMuted: {
        color: getAccessibleMutedColor(themeColors.secondary),
      },
      // Buttons and badges
      primary: {
        backgroundColor: themeColors.primary,
        color: primaryTextColor,
      },
      primaryHover: {
        backgroundColor: primaryHoverBg,
        color: primaryHoverTextColor,
      },
      accent: {
        backgroundColor: themeColors.accent,
        color: accentTextColor,
      },
      muted: {
        backgroundColor: themeColors.muted,
        color: mutedTextColor,
      },
      // Outline button on card
      outlineOnCard: {
        borderColor: cardTextColor,
        color: cardTextColor,
        backgroundColor: 'transparent',
      },
      outlineOnCardHover: {
        borderColor: cardTextColor,
        color: cardTextColor,
        backgroundColor: `${cardTextColor}15`,
      },
      // Ghost button on page background
      ghost: {
        color: pageTextColor,
        backgroundColor: 'transparent',
      },
      ghostHover: {
        color: pageTextColor,
        backgroundColor: `${pageTextColor}15`,
      },
      // Badge outline on page background
      badgeOutline: {
        borderColor: `${pageTextColor}50`,
        color: pageTextColor,
        backgroundColor: 'transparent',
      },
    }
  }, [themeColors])

  // Loading state
  if (!eventId || event === undefined) {
    return <SeatherderLoading message="I am fetching your event..." />
  }

  // Not found state
  if (event === null) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>I cannot find this event</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              This event does not exist, or it wandered off. I am not sure which.
            </p>
            <Button onClick={() => router.push("/admin")} className="w-full">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div
        className="min-h-screen transition-colors duration-300"
        style={themedStyles?.page || undefined}
      >
        <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-4xl">
          {/* Header Section */}
          <div className="space-y-4 mb-6">
            {/* Event Name */}
            <div className="space-y-1">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleUpdateName()
                      if (e.key === "Escape") {
                        setEventName(event.name)
                        setIsEditingName(false)
                      }
                    }}
                    className="text-2xl md:text-3xl font-bold h-auto py-2"
                    style={themedStyles?.pageInput}
                    autoFocus
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleUpdateName}
                    disabled={!eventName.trim()}
                    style={themedStyles?.pageText}
                  >
                    <Check className="size-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setEventName(event.name)
                      setIsEditingName(false)
                    }}
                    style={themedStyles?.pageText}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1
                    className="text-2xl md:text-3xl font-bold"
                    style={themedStyles?.pageText}
                  >
                    {event.name}
                  </h1>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setIsEditingName(true)}
                    style={themedStyles?.pageText}
                  >
                    <Pencil className="size-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Event Settings - Inline editable */}
            <EventSettingsBar
              tableSize={event.tableSize}
              numberOfRounds={event.numberOfRounds ?? 1}
              roundDuration={event.roundDuration ?? 30}
              isAssigned={event.isAssigned ?? false}
              lockStatus={lockStatus ?? { isLocked: true, lockReason: "none", checkedInCount: 0 }}
              guestCount={guests?.length ?? 0}
              themedStyles={themedStyles}
              onViewCheckIns={() => router.push(`/event/${eventId}/live`)}
              onTableSizeChange={async (size) => {
                await updateEventTableSize({ id: eventId!, tableSize: size })
                if (event.isAssigned) {
                  await assignTablesMutation({ id: eventId! })
                  toast.success("Table size changed. Everyone has been reassigned.")
                }
              }}
              onRoundsChange={async (rounds) => {
                const result = await updateNumberOfRoundsMutation({ id: eventId!, numberOfRounds: rounds })
                if (result.regenerated) {
                  toast.success(`I added ${result.newRoundsAdded} new round${result.newRoundsAdded !== 1 ? "s" : ""} with seating.`)
                } else {
                  toast.success("Rounds updated.")
                }
              }}
              onDurationChange={async (duration) => {
                await updateRoundDurationMutation({ id: eventId!, roundDuration: duration })
              }}
            />

            {/* Go to Live View button - shown when tables are assigned */}
            {event.isAssigned && (
              <Button
                size="lg"
                onClick={() => router.push(`/event/${eventId}/live`)}
                className="gap-2 w-full sm:w-auto transition-colors"
                style={themedStyles
                  ? hoveredButton === 'goLive'
                    ? themedStyles.primaryHover
                    : themedStyles.primary
                  : undefined
                }
                onMouseEnter={() => setHoveredButton('goLive')}
                onMouseLeave={() => setHoveredButton(null)}
              >
                <Play className="size-5" />
                Go to Live Event
                <ExternalLink className="size-4" />
              </Button>
            )}

            <Separator style={themedStyles ? { backgroundColor: themedStyles.pageTextMuted.color } : undefined} />
          </div>

          {/* Main Content - Guest List */}
          <div className="space-y-6">
            {/* Before Assignment */}
            {!event.isAssigned && (
              <>
                {/* Guest List Card */}
                <Card style={themedStyles?.card}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2" style={themedStyles?.cardText}>
                        <Users className="size-5" />
                        {getGuestLabel(event)} List
                        {guests && guests.length > 0 && (
                          <Badge
                            variant="secondary"
                            className="ml-2"
                            style={themedStyles?.primary}
                          >
                            {guests.length}
                          </Badge>
                        )}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        {hasDemoGuests && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClearSampleGuests}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            Clear Demo ({demoGuestCount})
                          </Button>
                        )}
                        {guests && guests.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClearAllGuests}
                            className="text-destructive hover:text-destructive"
                          >
                            Clear All
                          </Button>
                        )}
                        <Button
                          size="sm"
                          onClick={() => setShowAddGuestsDialog(true)}
                          className="gap-1 transition-colors"
                          style={themedStyles
                            ? hoveredButton === 'addGuests1'
                              ? themedStyles.primaryHover
                              : themedStyles.primary
                            : undefined
                          }
                          onMouseEnter={() => setHoveredButton('addGuests1')}
                          onMouseLeave={() => setHoveredButton(null)}
                        >
                          <Plus className="size-4" />
                          Add {getGuestLabelPlural(event)}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {!guests || guests.length === 0 ? (
                      <div className="text-center py-12" style={themedStyles?.cardTextMuted}>
                        <Users className="size-12 mx-auto mb-3 opacity-20" />
                        <p className="font-medium mb-1" style={themedStyles?.cardText}>No {getGuestLabelPlural(event).toLowerCase()} yet. I am waiting.</p>
                        <p className="text-sm mb-4">Give me names.</p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                          <Button
                            onClick={() => setShowAddGuestsDialog(true)}
                            className="gap-2 transition-colors"
                            style={themedStyles
                              ? hoveredButton === 'addGuests2'
                                ? themedStyles.primaryHover
                                : themedStyles.primary
                              : undefined
                            }
                            onMouseEnter={() => setHoveredButton('addGuests2')}
                            onMouseLeave={() => setHoveredButton(null)}
                          >
                            <Plus className="size-4" />
                            Add {getGuestLabelPlural(event)}
                          </Button>
                          <span className="text-sm" style={themedStyles?.cardTextMuted}>or</span>
                          <Button
                            variant="outline"
                            onClick={handleAddSampleGuests}
                            disabled={isAddingSampleGuests}
                            className="gap-2 transition-colors"
                            style={themedStyles
                              ? hoveredButton === 'sampleGuests'
                                ? themedStyles.outlineOnCardHover
                                : themedStyles.outlineOnCard
                              : undefined
                            }
                            onMouseEnter={() => setHoveredButton('sampleGuests')}
                            onMouseLeave={() => setHoveredButton(null)}
                          >
                            <Sparkles className="size-4" />
                            {isAddingSampleGuests ? "Adding..." : "Try with demo guests"}
                          </Button>
                        </div>
                        <p className="text-xs mt-4" style={themedStyles?.cardTextMuted}>
                          Demo guests let you explore the app. You can clear them later.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Department badges */}
                        {uniqueDepartments.length > 0 && (
                          <div className="flex flex-wrap items-center gap-2">
                            {uniqueDepartments.map((dept) => {
                              const count = guests.filter(g => g.department === dept).length
                              // Use theme accent for badges if themed
                              if (themedStyles) {
                                return (
                                  <span
                                    key={dept}
                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                                    style={themedStyles.accent}
                                  >
                                    {dept} ({count})
                                  </span>
                                )
                              }
                              const colors = getDepartmentColors(dept)
                              return (
                                <span
                                  key={dept}
                                  className={cn(
                                    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
                                    colors.bg,
                                    colors.text,
                                    colors.border
                                  )}
                                >
                                  {dept} ({count})
                                </span>
                              )
                            })}
                          </div>
                        )}

                        {/* Guest List */}
                        <div className="space-y-1 max-h-[50vh] overflow-y-auto">
                          {guests.map((guest) => {
                            const deptColors = getDepartmentColors(guest.department)
                            return (
                              <div
                                key={guest._id}
                                className={cn(
                                  "flex items-center justify-between p-2 rounded-lg transition-colors group",
                                  !themedStyles && "border hover:bg-muted/50"
                                )}
                                style={themedStyles ? {
                                  borderWidth: 1,
                                  borderStyle: 'solid',
                                  borderColor: `${themedStyles.cardText.color}20`,
                                  backgroundColor: `${themedStyles.cardText.color}08`,
                                } : undefined}
                              >
                                <div className="flex-1 min-w-0 flex items-center gap-3">
                                  {guest.department && (
                                    <div
                                      className={cn(
                                        "w-1 h-6 rounded-full shrink-0",
                                        !themedStyles && deptColors.bg
                                      )}
                                      style={themedStyles ? { backgroundColor: themeColors?.accent } : undefined}
                                    />
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                      <p
                                        className={cn("font-medium truncate text-sm", !themedStyles && "text-foreground")}
                                        style={themedStyles?.cardText}
                                      >
                                        {guest.name}
                                      </p>
                                      {guest.dietary && (
                                        <DietaryBadges
                                          dietary={guest.dietary}
                                          compact
                                          maxVisible={2}
                                          className="shrink-0"
                                        />
                                      )}
                                    </div>
                                    {guest.department && (
                                      <p
                                        className={cn("text-xs truncate", !themedStyles && "text-muted-foreground")}
                                        style={themedStyles?.cardTextMuted}
                                      >
                                        {guest.department}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 ml-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setEditingGuest(guest)}
                                    className="size-8"
                                    style={themedStyles?.cardText}
                                  >
                                    <Pencil className="size-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRemoveGuest(guest._id)}
                                    className="size-8"
                                    style={themedStyles?.cardText}
                                  >
                                    <X className="size-3" />
                                  </Button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Assignment Button */}
                {guests && guests.length > 0 && (
                  <Button
                    onClick={handleAssignTables}
                    size="lg"
                    className="w-full transition-colors"
                    disabled={guests.length === 0}
                    style={themedStyles
                      ? hoveredButton === 'randomize'
                        ? themedStyles.primaryHover
                        : themedStyles.primary
                      : undefined
                    }
                    onMouseEnter={() => setHoveredButton('randomize')}
                    onMouseLeave={() => setHoveredButton(null)}
                  >
                    <Shuffle className="mr-2 size-5" />
                    Randomize {getTableLabelPlural(event)}
                  </Button>
                )}
              </>
            )}

            {/* After Assignment */}
            {event.isAssigned && (
              <Card style={themedStyles?.card}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2" style={themedStyles?.cardText}>
                    <Users className="size-5" />
                    Assignment Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-3">
                    <Badge variant="secondary" className="text-base" style={themedStyles?.primary}>
                      {getCountLabel(event, guests?.length || 0, "guest")}
                    </Badge>
                    <Badge variant="secondary" className="text-base" style={themedStyles?.primary}>
                      {getCountLabel(event, Math.ceil((guests?.length || 0) / event.tableSize), "table")}
                    </Badge>
                    <Badge variant="secondary" className="text-base" style={themedStyles?.primary}>
                      {event.numberOfRounds ?? 1} round{(event.numberOfRounds ?? 1) !== 1 ? "s" : ""}
                    </Badge>
                    <Badge variant="secondary" className="text-base" style={themedStyles?.primary}>
                      {event.roundDuration ?? 30} min/round
                    </Badge>
                  </div>

                  <div
                    className="flex flex-wrap gap-3 pt-4"
                    style={{ borderTop: `1px solid ${themedStyles ? `${themedStyles.cardText.color}20` : 'var(--border)'}` }}
                  >
                    <Button
                      onClick={handleReshuffle}
                      variant="outline"
                      className="gap-2 transition-colors"
                      style={themedStyles
                        ? hoveredButton === 'reshuffle'
                          ? themedStyles.outlineOnCardHover
                          : themedStyles.outlineOnCard
                        : undefined
                      }
                      onMouseEnter={() => setHoveredButton('reshuffle')}
                      onMouseLeave={() => setHoveredButton(null)}
                    >
                      <Shuffle className="size-4" />
                      Re-shuffle
                    </Button>
                    <Button
                      onClick={() => setShowResetDialog(true)}
                      variant="destructive"
                      className="gap-2"
                    >
                      <RotateCcw className="size-4" />
                      Reset
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Add Guests Dialog */}
        <Dialog open={showAddGuestsDialog} onOpenChange={setShowAddGuestsDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add {getGuestLabelPlural(event)}</DialogTitle>
              <DialogDescription>
                One at a time, many at once, or from a file. Your choice.
              </DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="single" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="single">Single</TabsTrigger>
                <TabsTrigger value="bulk">Bulk</TabsTrigger>
                <TabsTrigger value="import">Import CSV</TabsTrigger>
              </TabsList>
              <TabsContent value="single" className="mt-4">
                <GuestForm
                  onAddGuest={handleAddGuest}
                  departmentLabel={getDepartmentLabel(event)}
                  guestLabel={getGuestLabel(event)}
                />
              </TabsContent>
              <TabsContent value="bulk" className="mt-4">
                <BulkEntry onAddGuests={handleAddGuests} />
              </TabsContent>
              <TabsContent value="import" className="mt-4">
                <CsvUpload
                  onImportGuests={handleAddGuests}
                  departmentLabel={getDepartmentLabel(event)}
                  guestLabel={getGuestLabel(event).toLowerCase()}
                  guestLabelPlural={getGuestLabelPlural(event).toLowerCase()}
                />
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>

        {/* Edit Guest Dialog */}
        <Dialog open={editingGuest !== null} onOpenChange={(open) => !open && setEditingGuest(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit {getGuestLabel(event)}</DialogTitle>
              <DialogDescription>
                Update their information. Changes save immediately.
              </DialogDescription>
            </DialogHeader>
            {editingGuest && (
              <GuestForm
                mode="edit"
                initialGuest={{
                  name: editingGuest.name,
                  department: editingGuest.department ?? undefined,
                  email: editingGuest.email ?? undefined,
                  phone: editingGuest.phone ?? undefined,
                  dietary: editingGuest.dietary ?? undefined,
                  attributes: editingGuest.attributes as {
                    interests?: string[]
                    jobLevel?: 'junior' | 'mid' | 'senior' | 'executive'
                    goals?: ('find-mentor' | 'recruit' | 'learn' | 'network' | 'partner' | 'sell' | 'invest')[]
                    customTags?: string[]
                  } | undefined,
                  familyName: editingGuest.familyName ?? undefined,
                  side: editingGuest.side ?? undefined,
                  company: editingGuest.company ?? undefined,
                  team: editingGuest.team ?? undefined,
                  managementLevel: editingGuest.managementLevel ?? undefined,
                  isVip: editingGuest.isVip ?? undefined,
                }}
                onEditGuest={handleEditGuest}
                departmentLabel={getDepartmentLabel(event)}
                guestLabel={getGuestLabel(event)}
                seatingType={matchingConfig?.seatingType as 'wedding' | 'corporate' | 'networking' | 'team' | 'social' | 'custom' | null | undefined}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Reset Confirmation Dialog */}
        <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Start over?</DialogTitle>
              <DialogDescription>
                I will clear all seating. You can shuffle again after.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowResetDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleReset}>
                Reset
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}
