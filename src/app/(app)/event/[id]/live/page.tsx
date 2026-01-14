'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import { Id, Doc } from '@convex/_generated/dataModel'
import {
  ArrowLeft,
  Users,
  Search,
  X,
  Download,
  Loader2,
  CheckCircle2,
  Clock,
  UserCheck,
  Play,
  Pause,
  ChevronDown,
  ExternalLink,
  Copy,
  Timer,
  Square,
  AlertCircle,
  RotateCcw,
  Settings,
  Maximize,
  Minimize,
  Pencil,
} from 'lucide-react'
import JSZip from 'jszip'

import { generateQrCodeBlob } from '@/lib/qr-download'
import { cn } from '@/lib/utils'
import { resolveThemeColors } from '@/lib/theme-presets'
import { getTableLabel, getTableLabelPlural, getGuestLabel, getGuestLabelPlural, getDepartmentLabel } from '@/lib/terminology'
import { type DietaryInfo } from '@/lib/types'

import { TableCard } from '@/components/table-card'
import { GuestCard } from '@/components/guest-card'
import { GuestForm } from '@/components/guest-form'
import { EventThemeProvider } from '@/components/event-theme-provider'
import { SeatherderLoading } from '@/components/seatherder-loading'
import { ThemeColors } from '@/lib/theme-presets'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { TooltipProvider } from '@/components/ui/tooltip'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

// WCAG contrast calculation functions
function getLuminance(hex: string): number {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return 0
  const [r, g, b] = [1, 2, 3].map((i) => {
    const c = parseInt(result[i], 16) / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function getContrastRatio(color1: string, color2: string): number {
  const l1 = getLuminance(color1)
  const l2 = getLuminance(color2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

function getAccessibleTextColor(background: string, preferredColor?: string): string {
  if (preferredColor) {
    const ratio = getContrastRatio(background, preferredColor)
    if (ratio >= 4.5) return preferredColor
  }
  const blackRatio = getContrastRatio(background, '#000000')
  const whiteRatio = getContrastRatio(background, '#FFFFFF')
  return blackRatio > whiteRatio ? '#000000' : '#FFFFFF'
}

function getAccessibleMutedColor(background: string): string {
  const bgLuminance = getLuminance(background)
  return bgLuminance > 0.5 ? '#666666' : '#999999'
}

function adjustBrightness(hex: string, factor: number): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return hex
  const adjust = (value: number) => Math.min(255, Math.max(0, Math.round(value * factor)))
  const r = adjust(parseInt(result[1], 16)).toString(16).padStart(2, '0')
  const g = adjust(parseInt(result[2], 16)).toString(16).padStart(2, '0')
  const b = adjust(parseInt(result[3], 16)).toString(16).padStart(2, '0')
  return `#${r}${g}${b}`
}

function getThemedStyles(themeColors: ThemeColors | undefined) {
  if (!themeColors) return null

  const pageTextColor = getAccessibleTextColor(themeColors.background, themeColors.foreground)
  // Force recalculate without preference for elements that need guaranteed contrast
  const pageTextColorStrong = getAccessibleTextColor(themeColors.background)
  const pageTextMuted = getAccessibleMutedColor(themeColors.background)
  const cardTextColor = getAccessibleTextColor(themeColors.secondary)
  const cardTextMuted = getAccessibleMutedColor(themeColors.secondary)
  const primaryHoverBg = adjustBrightness(themeColors.primary, 0.85)
  // Tab colors - use muted background for tab list, calculate text colors for that background
  const tabsListBg = themeColors.muted
  const tabsTextMuted = getAccessibleMutedColor(tabsListBg)
  const tabsTextStrong = getAccessibleTextColor(tabsListBg)

  return {
    page: {
      background: themeColors.background,
      color: pageTextColor,
    },
    pageText: { color: pageTextColor },
    pageTextMuted: { color: pageTextMuted },
    card: {
      backgroundColor: themeColors.secondary,
      borderColor: `${themeColors.muted}40`,
    },
    cardText: { color: cardTextColor },
    cardTextMuted: { color: cardTextMuted },
    primaryButton: {
      backgroundColor: themeColors.primary,
      color: getAccessibleTextColor(themeColors.primary),
      border: 'none',
    },
    primaryButtonHover: {
      backgroundColor: primaryHoverBg,
      color: getAccessibleTextColor(primaryHoverBg),
      border: 'none',
    },
    outlineButton: {
      backgroundColor: 'transparent',
      color: pageTextColorStrong,
      borderColor: `${pageTextColorStrong}40`,
    },
    outlineButtonHover: {
      backgroundColor: `${pageTextColorStrong}15`,
      color: pageTextColorStrong,
      borderColor: `${pageTextColorStrong}40`,
    },
    // Outline button when placed on card background
    outlineButtonOnCard: {
      backgroundColor: 'transparent',
      color: cardTextColor,
      borderColor: `${cardTextColor}40`,
    },
    outlineButtonOnCardHover: {
      backgroundColor: `${cardTextColor}10`,
      color: cardTextColor,
      borderColor: `${cardTextColor}40`,
    },
    ghostButton: {
      backgroundColor: 'transparent',
      color: pageTextColor,
    },
    ghostButtonHover: {
      backgroundColor: `${pageTextColor}15`,
      color: pageTextColor,
    },
    badge: {
      backgroundColor: themeColors.accent,
      color: getAccessibleTextColor(themeColors.accent),
    },
    // Badge on card background
    badgeOnCard: {
      backgroundColor: themeColors.accent,
      color: getAccessibleTextColor(themeColors.accent),
    },
    badgeOutline: {
      backgroundColor: 'transparent',
      color: pageTextColor,
      borderColor: `${pageTextColor}40`,
    },
    badgeOutlineOnCard: {
      backgroundColor: 'transparent',
      color: cardTextColor,
      borderColor: `${cardTextColor}40`,
    },
    progressBar: {
      backgroundColor: `${pageTextColor}20`,
    },
    progressFill: {
      backgroundColor: themeColors.primary,
    },
    input: {
      backgroundColor: `${themeColors.secondary}80`,
      color: cardTextColor,
      borderColor: `${themeColors.muted}40`,
    },
    // Tabs - use solid muted background for consistent theming (no transparency that blends oddly)
    tabsList: {
      backgroundColor: tabsListBg,
    },
    tabTrigger: {
      color: tabsTextStrong,
      backgroundColor: 'transparent',
    },
    tabTriggerActive: {
      backgroundColor: themeColors.secondary,
      color: cardTextColor,
    },
    divider: {
      borderColor: `${pageTextColor}20`,
    },
  }
}

// Type for Convex guest data (as returned by the API)
interface ConvexGuest {
  _id: Id<'guests'>
  _creationTime: number
  eventId: Id<'events'>
  name: string
  department?: string
  email?: string
  phone?: string
  tableNumber?: number
  qrCodeId?: string
  checkedIn: boolean
}

// Type for Convex round assignment data
interface ConvexRoundAssignment {
  _id: Id<'guestRoundAssignments'>
  guestId: Id<'guests'>
  eventId: Id<'events'>
  roundNumber: number
  tableNumber: number
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default function LiveEventPage({ params }: PageProps) {
  const router = useRouter()
  const [eventId, setEventId] = React.useState<Id<'events'> | null>(null)

  // Round management state
  const [selectedRound, setSelectedRound] = React.useState(1)
  const [roundDuration, setRoundDuration] = React.useState<number | undefined>(undefined)

  // Guest view state
  const [searchQuery, setSearchQuery] = React.useState('')
  const [isDownloadingAll, setIsDownloadingAll] = React.useState(false)

  // Attendance filter state
  const [attendanceFilter, setAttendanceFilter] = React.useState<'all' | 'waiting' | 'checked-in'>('all')

  // Presentation mode
  const [isPresentationMode, setIsPresentationMode] = React.useState(false)

  // Hover state for themed buttons
  const [hoveredButton, setHoveredButton] = React.useState<string | null>(null)

  // Active tab for themed tabs
  const [activeTab, setActiveTab] = React.useState('by-table')

  // Edit guest state
  const [editingGuest, setEditingGuest] = React.useState<Doc<'guests'> | null>(null)

  // Load params on mount
  React.useEffect(() => {
    async function loadParams() {
      const resolvedParams = await params
      setEventId(resolvedParams.id as Id<'events'>)
    }
    loadParams()
  }, [params])

  // Convex queries
  const event = useQuery(api.events.get, eventId ? { id: eventId } : 'skip')
  const guests = useQuery(api.guests.getByEvent, eventId ? { eventId } : 'skip')
  const tables = useQuery(api.tables.getByEvent, eventId ? { eventId } : 'skip')
  const tablesByRound = useQuery(
    api.tables.getByEventAndRound,
    eventId && event?.isAssigned
      ? { eventId, roundNumber: selectedRound }
      : 'skip'
  )
  const roundAssignmentsByGuest = useQuery(
    api.guests.getAllRoundAssignmentsByEvent,
    eventId && event?.isAssigned && (event?.numberOfRounds || 1) > 1
      ? { eventId }
      : 'skip'
  )
  const matchingConfig = useQuery(
    api.matchingConfig.getByEvent,
    eventId ? { eventId } : 'skip'
  )

  // Convex mutations
  const updateRoundSettings = useMutation(api.events.updateRoundSettings)
  const startNextRound = useMutation(api.events.startNextRound)
  const endCurrentRound = useMutation(api.events.endCurrentRound)
  const resetRounds = useMutation(api.events.resetRounds)
  const pauseRound = useMutation(api.events.pauseRound)
  const resumeRound = useMutation(api.events.resumeRound)
  const checkInGuest = useMutation(api.guests.checkIn)
  const uncheckInGuest = useMutation(api.guests.uncheckIn)
  const updateGuest = useMutation(api.guests.update)

  // Sync event data with state when loaded
  React.useEffect(() => {
    if (event) {
      setRoundDuration(event.roundDuration)
      // Set selected round to current active round if one is active
      if (event.currentRound && event.currentRound > 0) {
        setSelectedRound(event.currentRound)
      }
    }
  }, [event])

  // Update round duration
  const handleUpdateRoundDuration = React.useCallback(
    async (newDuration: number | undefined) => {
      if (!eventId) return

      setRoundDuration(newDuration)

      try {
        await updateRoundSettings({ id: eventId, roundDuration: newDuration || 0 })
      } catch {
        toast.error('I could not update the duration.')
      }
    },
    [eventId, updateRoundSettings]
  )

  // Start next round
  const handleStartNextRound = React.useCallback(async () => {
    if (!eventId) return

    try {
      const result = await startNextRound({ id: eventId })
      setSelectedRound(result.currentRound)
      toast.success(`Round ${result.currentRound} has begun.`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to start round')
    }
  }, [eventId, startNextRound])

  // End current round
  const handleEndCurrentRound = React.useCallback(async () => {
    if (!eventId) return

    try {
      const result = await endCurrentRound({ id: eventId })
      toast.success(`Round ${result.endedRound} is complete.`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to end round')
    }
  }, [eventId, endCurrentRound])

  // Reset rounds back to start
  const handleResetRounds = React.useCallback(async () => {
    if (!eventId) return

    try {
      await resetRounds({ id: eventId })
      setSelectedRound(1)
      toast.success('Back to the beginning.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to reset rounds')
    }
  }, [eventId, resetRounds])

  // Pause the current round
  const handlePauseRound = React.useCallback(async () => {
    if (!eventId) return

    try {
      await pauseRound({ id: eventId })
      toast.success('Paused.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to pause round')
    }
  }, [eventId, pauseRound])

  // Resume the current round
  const handleResumeRound = React.useCallback(async () => {
    if (!eventId) return

    try {
      await resumeRound({ id: eventId })
      toast.success('Resumed.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to resume round')
    }
  }, [eventId, resumeRound])

  // Live countdown for admin view
  const [adminTimeRemaining, setAdminTimeRemaining] = React.useState<number>(0)

  React.useEffect(() => {
    // If paused, show the paused time
    if (event?.isPaused && event?.pausedTimeRemaining !== undefined) {
      setAdminTimeRemaining(event.pausedTimeRemaining)
      return
    }

    if (!event?.roundStartedAt || !event?.roundDuration || !event?.currentRound) {
      setAdminTimeRemaining(0)
      return
    }

    const endTime = new Date(event.roundStartedAt).getTime() + event.roundDuration * 60 * 1000

    const updateTimer = () => {
      const remaining = Math.max(0, endTime - Date.now())
      setAdminTimeRemaining(remaining)
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [event?.roundStartedAt, event?.roundDuration, event?.currentRound, event?.isPaused, event?.pausedTimeRemaining])

  // Format time for admin display
  const adminMinutes = Math.floor(adminTimeRemaining / 60000)
  const adminSeconds = Math.floor((adminTimeRemaining % 60000) / 1000)
  const isTimerExpired = adminTimeRemaining === 0 && event?.roundStartedAt && event?.roundDuration && !event?.isPaused
  const isTimerWarning = adminTimeRemaining > 0 && adminTimeRemaining < 60000 && !event?.isPaused
  const isTimerPaused = event?.isPaused === true

  // Filter guests for search
  const filteredGuests = React.useMemo(() => {
    if (!guests || !searchQuery.trim()) return guests || []

    const query = searchQuery.toLowerCase()
    return guests.filter(
      (guest) =>
        guest.name.toLowerCase().includes(query) ||
        guest.department?.toLowerCase().includes(query)
    )
  }, [guests, searchQuery])

  // Compute base URL for QR codes
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''

  // Download all guest cards as ZIP
  const handleDownloadAllCards = React.useCallback(async () => {
    if (!event || !event.isAssigned || !guests) return

    const assignedGuests = guests.filter((g) => g.tableNumber && g.qrCodeId)

    if (assignedGuests.length === 0) {
      toast.error('I have no cards to download.')
      return
    }

    setIsDownloadingAll(true)
    toast.info(`Making ${assignedGuests.length} cards...`)

    try {
      const zip = new JSZip()

      for (const guest of assignedGuests) {
        if (!guest.qrCodeId) continue

        const blob = await generateQrCodeBlob({
          type: 'guest',
          qrCodeId: guest.qrCodeId,
          eventName: event.name,
          guestName: guest.name,
          department: guest.department,
          baseUrl,
        })

        const safeName = guest.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()
        zip.file(`${safeName}.png`, blob)
      }

      const content = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(content)
      const link = document.createElement('a')
      link.href = url
      link.download = `${event.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-guest-cards.zip`
      link.click()
      URL.revokeObjectURL(url)

      toast.success(`Done. ${assignedGuests.length} cards ready.`)
    } catch (error) {
      console.error('Error generating ZIP:', error)
      toast.error('I could not make the cards.')
    } finally {
      setIsDownloadingAll(false)
    }
  }, [event, guests, baseUrl])

  // Compute check-in stats
  const checkInStats = React.useMemo(() => {
    if (!guests) return { total: 0, checkedIn: 0 }
    return {
      total: guests.length,
      checkedIn: guests.filter((g) => g.checkedIn).length,
    }
  }, [guests])

  // Filter guests for attendance tab
  const attendanceGuests = React.useMemo(() => {
    if (!guests) return []

    let filtered = [...guests]

    if (attendanceFilter === 'waiting') {
      filtered = filtered.filter((g) => !g.checkedIn)
    } else if (attendanceFilter === 'checked-in') {
      filtered = filtered.filter((g) => g.checkedIn)
    }

    // Sort: not checked in first, then alphabetically
    return filtered.sort((a, b) => {
      if (a.checkedIn !== b.checkedIn) {
        return a.checkedIn ? 1 : -1
      }
      return a.name.localeCompare(b.name)
    })
  }, [guests, attendanceFilter])

  // Handle manual check-in
  const handleManualCheckIn = React.useCallback(
    async (guestId: string) => {
      try {
        await checkInGuest({ id: guestId as Id<'guests'> })
        toast.success('Checked in.')
      } catch {
        toast.error('I could not check them in.')
      }
    },
    [checkInGuest]
  )

  // Handle undo check-in
  const handleUndoCheckIn = React.useCallback(
    async (guestId: string) => {
      try {
        await uncheckInGuest({ id: guestId as Id<'guests'> })
        toast.success('Undone.')
      } catch {
        toast.error('I could not undo that.')
      }
    },
    [uncheckInGuest]
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
        toast.error('I could not update this guest.')
      }
    },
    [editingGuest, updateGuest]
  )

  // Resolve theme colors
  const themeColors = event ? resolveThemeColors(event.themePreset, event.customColors) : undefined
  const themedStyles = React.useMemo(() => getThemedStyles(themeColors), [themeColors])

  // Loading state
  if (!eventId || event === undefined) {
    return <SeatherderLoading message="I am fetching the live event..." />
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
            <Button onClick={() => router.push('/admin')} className="w-full">
              <ArrowLeft className="mr-2 size-4" />
              Back to Admin
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Event not assigned state
  if (!event.isAssigned) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>{getTableLabelPlural(event)} Not Assigned</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {getTableLabelPlural(event)} need to be assigned before you can run the live event. Go to the event settings to add {getGuestLabelPlural(event).toLowerCase()} and randomize {getTableLabelPlural(event).toLowerCase()}.
            </p>
            <Button onClick={() => router.push(`/event/${eventId}`)} className="w-full">
              <Settings className="mr-2 size-4" />
              Go to Event Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Presentation mode view
  if (isPresentationMode) {
    return (
      <EventThemeProvider themePreset={event.themePreset} customColors={event.customColors}>
        <div
          className={cn(
            'min-h-screen flex flex-col items-center justify-center p-8 transition-colors duration-500',
            isTimerExpired ? 'bg-amber-600' : isTimerPaused ? 'bg-blue-700' : isTimerWarning ? 'bg-orange-600' : 'bg-[var(--event-background,#000)]'
          )}
          style={themeColors && !isTimerExpired && !isTimerPaused && !isTimerWarning ? { backgroundColor: themeColors.background } : undefined}
        >
          {/* Exit presentation button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsPresentationMode(false)}
            className="absolute top-4 right-4 text-white/70 hover:text-white hover:bg-white/10"
          >
            <Minimize className="size-5" />
          </Button>

          {/* Event name */}
          <div className="absolute top-4 left-4">
            <h1
              className="text-lg sm:text-xl font-medium"
              style={{ color: themeColors?.foreground || '#fff' }}
            >
              {event.name}
            </h1>
          </div>

          {/* Timer Display */}
          <div className="text-center">
            <p
              className="text-xl sm:text-2xl mb-2 uppercase tracking-widest opacity-60"
              style={{ color: themeColors?.foreground || '#fff' }}
            >
              Round {event.currentRound || 0} of {event.numberOfRounds || 1}
            </p>

            {event.currentRound && event.currentRound > 0 && (event.roundStartedAt || event.isPaused) ? (
              event.roundDuration ? (
                <div
                  className={cn(
                    'font-mono font-bold tabular-nums leading-none',
                    'text-[8rem] sm:text-[12rem] md:text-[16rem] lg:text-[20rem]',
                    isTimerExpired ? 'text-white animate-pulse' : isTimerWarning ? 'text-white animate-pulse' : ''
                  )}
                  style={{ color: isTimerExpired || isTimerWarning || isTimerPaused ? '#fff' : themeColors?.foreground || '#fff' }}
                >
                  {isTimerExpired ? "TIME'S UP" : `${adminMinutes}:${adminSeconds.toString().padStart(2, '0')}`}
                </div>
              ) : (
                <div
                  className="text-4xl font-medium opacity-60 py-4"
                  style={{ color: themeColors?.foreground || '#fff' }}
                >
                  No time limit
                </div>
              )
            ) : (
              <div
                className="text-4xl font-medium opacity-60 py-4"
                style={{ color: themeColors?.foreground || '#fff' }}
              >
                Waiting to start...
              </div>
            )}

            {isTimerPaused && (
              <div className="mt-8 text-2xl sm:text-4xl font-bold uppercase tracking-widest text-white animate-pulse">
                PAUSED
              </div>
            )}

            {/* Check-in stats */}
            <div
              className="mt-12 flex items-center justify-center gap-8"
              style={{ color: themeColors?.foreground || '#fff' }}
            >
              <div className="text-center">
                <p className="text-6xl font-bold">{checkInStats.checkedIn}</p>
                <p className="text-sm uppercase tracking-wider opacity-60">Checked In</p>
              </div>
              <div className="text-4xl opacity-30">/</div>
              <div className="text-center">
                <p className="text-6xl font-bold">{checkInStats.total}</p>
                <p className="text-sm uppercase tracking-wider opacity-60">Total</p>
              </div>
            </div>
          </div>

          {/* Round indicators at bottom */}
          <div className="absolute bottom-8 left-0 right-0 flex justify-center">
            <div className="flex items-center gap-4">
              {Array.from({ length: event.numberOfRounds || 1 }, (_, i) => (
                <div
                  key={i}
                  className={cn(
                    'w-4 h-4 rounded-full transition-colors',
                    i + 1 < (event.currentRound || 0)
                      ? 'opacity-30'
                      : i + 1 === event.currentRound
                      ? 'opacity-100'
                      : 'opacity-10'
                  )}
                  style={{ backgroundColor: themeColors?.foreground || '#fff' }}
                />
              ))}
            </div>
          </div>
        </div>
      </EventThemeProvider>
    )
  }

  return (
    <EventThemeProvider themePreset={event.themePreset} customColors={event.customColors}>
      <TooltipProvider>
        <div
          className="min-h-screen transition-colors"
          style={themedStyles ? themedStyles.page : undefined}
        >
          <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-7xl">
            {/* Header Section */}
            <div className="space-y-4 mb-8">
              {/* Navigation */}
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/event/${eventId}`)}
                  className="gap-2 transition-colors"
                  style={themedStyles
                    ? hoveredButton === 'back'
                      ? themedStyles.ghostButtonHover
                      : themedStyles.ghostButton
                    : undefined
                  }
                  onMouseEnter={() => setHoveredButton('back')}
                  onMouseLeave={() => setHoveredButton(null)}
                >
                  <ArrowLeft className="size-4" />
                  Event Settings
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPresentationMode(true)}
                  className="gap-2 transition-colors"
                  style={themedStyles
                    ? hoveredButton === 'presentation'
                      ? themedStyles.outlineButtonHover
                      : themedStyles.outlineButton
                    : undefined
                  }
                  onMouseEnter={() => setHoveredButton('presentation')}
                  onMouseLeave={() => setHoveredButton(null)}
                >
                  <Maximize className="size-4" />
                  Presentation Mode
                </Button>
              </div>

              {/* Event Title */}
              <div>
                <h1 className="text-2xl md:text-3xl font-bold" style={themedStyles?.pageText}>{event.name}</h1>
                <p style={themedStyles?.pageTextMuted}>Live Event Dashboard</p>
              </div>

              {/* Check-in Stats */}
              {guests && guests.length > 0 && (
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className="text-sm" style={themedStyles?.badgeOutline}>
                    {checkInStats.checkedIn}/{checkInStats.total} Checked In
                  </Badge>
                  <div
                    className="flex-1 max-w-xs h-2 rounded-full overflow-hidden"
                    style={themedStyles?.progressBar || { backgroundColor: 'var(--muted)' }}
                  >
                    <div
                      className="h-full transition-all duration-300"
                      style={{
                        width: `${checkInStats.total > 0 ? (checkInStats.checkedIn / checkInStats.total) * 100 : 0}%`,
                        backgroundColor: themedStyles ? themeColors?.primary : '#22c55e',
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Round Management */}
            {(event.numberOfRounds || 1) > 1 && (
              <Card
                className={cn(
                  'mb-6 transition-colors',
                  !themedStyles && isTimerExpired && 'border-amber-500 bg-amber-50 dark:bg-amber-950/30',
                  !themedStyles && isTimerWarning && 'border-orange-400 bg-orange-50 dark:bg-orange-950/30'
                )}
                style={themedStyles && !isTimerExpired && !isTimerWarning ? themedStyles.card : undefined}
              >
                <CardContent className="p-6">
                  {/* Main Timer Display */}
                  <div className="text-center mb-6">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <span
                        className="text-sm uppercase tracking-wider"
                        style={themedStyles?.cardTextMuted}
                      >
                        Round {event.currentRound || 0} of {event.numberOfRounds || 1}
                      </span>
                      {event.currentRound && event.currentRound > 0 && event.isPaused && (
                        <Badge className="bg-blue-600 text-white">Paused</Badge>
                      )}
                      {event.currentRound && event.currentRound > 0 && event.roundStartedAt && !event.isPaused && (
                        <Badge
                          variant={isTimerExpired ? 'destructive' : 'outline'}
                          className={!isTimerExpired && themedStyles ? 'border-0' : ''}
                          style={!isTimerExpired && themedStyles ? themedStyles.badgeOnCard : undefined}
                        >
                          {isTimerExpired ? "TIME'S UP" : 'Active'}
                        </Badge>
                      )}
                      {(!event.currentRound || event.currentRound === 0) && (
                        <Badge
                          variant="outline"
                          className={themedStyles ? 'border-0' : ''}
                          style={themedStyles ? { backgroundColor: `${themeColors?.muted}80`, color: themedStyles.cardText.color } : undefined}
                        >
                          Not Started
                        </Badge>
                      )}
                    </div>

                    {event.currentRound && event.currentRound > 0 && (event.roundStartedAt || event.isPaused) ? (
                      event.roundDuration ? (
                        <div className="space-y-2">
                          <div
                            className={cn(
                              'text-7xl sm:text-8xl font-mono font-bold tabular-nums leading-none py-4',
                              isTimerExpired ? 'text-amber-600' : isTimerPaused ? 'text-blue-600' : isTimerWarning ? 'text-orange-600 animate-pulse' : ''
                            )}
                            style={!isTimerExpired && !isTimerPaused && !isTimerWarning && themedStyles ? themedStyles.cardText : undefined}
                          >
                            {isTimerExpired ? (
                              <span className="flex items-center justify-center gap-3">
                                <AlertCircle className="size-12" />
                                TIME&apos;S UP
                              </span>
                            ) : (
                              `${adminMinutes}:${adminSeconds.toString().padStart(2, '0')}`
                            )}
                          </div>
                          {isTimerPaused && (
                            <div className="text-lg font-bold text-blue-600 uppercase tracking-widest animate-pulse">
                              PAUSED
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-4xl font-medium py-4" style={themedStyles?.cardTextMuted}>
                          No time limit set
                        </div>
                      )
                    ) : (
                      <div className="text-4xl font-medium py-4" style={themedStyles?.cardTextMuted}>
                        Waiting to start...
                      </div>
                    )}

                    {/* Progress bar */}
                    {event.roundDuration && event.currentRound && event.currentRound > 0 && (event.roundStartedAt || event.isPaused) && (
                      <div
                        className="w-full max-w-md mx-auto h-2 rounded-full overflow-hidden"
                        style={themedStyles ? { backgroundColor: `${themedStyles.cardTextMuted.color}20` } : { backgroundColor: 'var(--muted)' }}
                      >
                        <div
                          className={cn(
                            'h-full transition-all duration-1000',
                            !themedStyles && (isTimerExpired ? 'bg-amber-500' : isTimerPaused ? 'bg-blue-500' : isTimerWarning ? 'bg-orange-500' : 'bg-primary')
                          )}
                          style={{
                            width: `${(adminTimeRemaining / (event.roundDuration * 60 * 1000)) * 100}%`,
                            backgroundColor: isTimerExpired ? '#f59e0b' : isTimerPaused ? '#3b82f6' : isTimerWarning ? '#f97316' : themedStyles ? themeColors?.primary : undefined,
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Duration Setting */}
                  {!event.roundStartedAt && (
                    <div className="flex items-center justify-center gap-3 mb-6">
                      <Label htmlFor="duration-input" className="text-sm" style={themedStyles?.cardTextMuted}>
                        Round Duration:
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="duration-input"
                          type="number"
                          min={1}
                          max={180}
                          value={roundDuration || ''}
                          onChange={(e) => {
                            const val = parseInt(e.target.value)
                            handleUpdateRoundDuration(val > 0 ? val : undefined)
                          }}
                          placeholder="No limit"
                          className="w-24 text-center"
                          style={themedStyles?.input}
                        />
                        <span className="text-sm" style={themedStyles?.cardTextMuted}>minutes</span>
                      </div>
                    </div>
                  )}

                  {/* Control Buttons */}
                  <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
                    {(event.currentRound || 0) < (event.numberOfRounds || 1) && (
                      <Button
                        onClick={handleStartNextRound}
                        size="lg"
                        className="gap-2 transition-colors"
                        style={themedStyles
                          ? hoveredButton === 'startRound'
                            ? themedStyles.primaryButtonHover
                            : themedStyles.primaryButton
                          : undefined
                        }
                        onMouseEnter={() => setHoveredButton('startRound')}
                        onMouseLeave={() => setHoveredButton(null)}
                      >
                        <Play className="size-5" />
                        {!event.currentRound || event.currentRound === 0
                          ? 'Start Round 1'
                          : !event.roundStartedAt
                          ? `Start Round ${(event.currentRound || 0) + 1}`
                          : `Start Round ${(event.currentRound || 0) + 1}`}
                      </Button>
                    )}

                    {event.currentRound && event.currentRound > 0 && event.roundDuration && (event.roundStartedAt || event.isPaused) && (
                      event.isPaused ? (
                        <Button
                          onClick={handleResumeRound}
                          variant="default"
                          size="lg"
                          className="gap-2 transition-colors"
                          style={themedStyles
                            ? hoveredButton === 'resume'
                              ? themedStyles.primaryButtonHover
                              : themedStyles.primaryButton
                            : undefined
                          }
                          onMouseEnter={() => setHoveredButton('resume')}
                          onMouseLeave={() => setHoveredButton(null)}
                        >
                          <Play className="size-5" />
                          Resume
                        </Button>
                      ) : (
                        <Button
                          onClick={handlePauseRound}
                          variant="outline"
                          size="lg"
                          className="gap-2 transition-colors"
                          style={themedStyles
                            ? hoveredButton === 'pause'
                              ? themedStyles.outlineButtonOnCardHover
                              : themedStyles.outlineButtonOnCard
                            : undefined
                          }
                          onMouseEnter={() => setHoveredButton('pause')}
                          onMouseLeave={() => setHoveredButton(null)}
                        >
                          <Pause className="size-5" />
                          Pause
                        </Button>
                      )
                    )}

                    {event.currentRound && event.currentRound > 0 && (event.roundStartedAt || event.isPaused) && (
                      <Button
                        onClick={handleEndCurrentRound}
                        variant="outline"
                        size="lg"
                        className="gap-2 transition-colors"
                        style={themedStyles
                          ? hoveredButton === 'endRound'
                            ? themedStyles.outlineButtonOnCardHover
                            : themedStyles.outlineButtonOnCard
                          : undefined
                        }
                        onMouseEnter={() => setHoveredButton('endRound')}
                        onMouseLeave={() => setHoveredButton(null)}
                      >
                        <Square className="size-5" />
                        End Round {event.currentRound}
                      </Button>
                    )}

                    {event.currentRound === event.numberOfRounds && !event.roundStartedAt && (
                      <Badge
                        variant="secondary"
                        className="text-base px-4 py-2"
                        style={themedStyles ? { backgroundColor: `${themeColors?.muted}60`, color: themedStyles.cardText.color } : undefined}
                      >
                        All rounds complete
                      </Badge>
                    )}
                  </div>

                  {/* Round Selector & Timer Links */}
                  <div
                    className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t"
                    style={themedStyles?.divider}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm" style={themedStyles?.cardTextMuted}>View:</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 transition-colors"
                            style={themedStyles
                              ? hoveredButton === 'roundSelect'
                                ? themedStyles.outlineButtonOnCardHover
                                : themedStyles.outlineButtonOnCard
                              : undefined
                            }
                            onMouseEnter={() => setHoveredButton('roundSelect')}
                            onMouseLeave={() => setHoveredButton(null)}
                          >
                            Round {selectedRound}
                            <ChevronDown className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          {Array.from({ length: event.numberOfRounds || 1 }, (_, i) => (
                            <DropdownMenuItem
                              key={i + 1}
                              onClick={() => setSelectedRound(i + 1)}
                              className={cn(selectedRound === i + 1 && 'bg-accent')}
                            >
                              Round {i + 1}
                              {event.currentRound === i + 1 && (
                                <Badge
                                  variant="outline"
                                  className="ml-2 text-xs border-0"
                                  style={themedStyles ? themedStyles.badgeOnCard : undefined}
                                >
                                  Active
                                </Badge>
                              )}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 transition-colors"
                        onClick={() => window.open(`${baseUrl}/timer/${eventId}`, '_blank')}
                        style={themedStyles
                          ? hoveredButton === 'openTimer'
                            ? themedStyles.outlineButtonOnCardHover
                            : themedStyles.outlineButtonOnCard
                          : undefined
                        }
                        onMouseEnter={() => setHoveredButton('openTimer')}
                        onMouseLeave={() => setHoveredButton(null)}
                      >
                        <Timer className="size-4" />
                        Open Timer
                        <ExternalLink className="size-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2 transition-colors"
                        onClick={() => {
                          navigator.clipboard.writeText(`${baseUrl}/timer/${eventId}`)
                          toast.success('Copied.')
                        }}
                        style={themedStyles?.cardTextMuted}
                      >
                        <Copy className="size-4" />
                        Copy Link
                      </Button>
                      {(event.currentRound || 0) > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-2 hover:text-destructive transition-colors"
                          onClick={handleResetRounds}
                          style={themedStyles?.cardTextMuted}
                        >
                          <RotateCcw className="size-4" />
                          Reset Rounds
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Results Tabs */}
            <Tabs defaultValue="by-table" className="w-full" value={activeTab} onValueChange={setActiveTab}>
              <TabsList
                className="grid w-full grid-cols-3"
                style={themedStyles?.tabsList}
              >
                <TabsTrigger
                  value="by-table"
                  style={themedStyles
                    ? activeTab === 'by-table'
                      ? themedStyles.tabTriggerActive
                      : themedStyles.tabTrigger
                    : undefined
                  }
                >
                  By {getTableLabel(event)}
                </TabsTrigger>
                <TabsTrigger
                  value="by-guest"
                  style={themedStyles
                    ? activeTab === 'by-guest'
                      ? themedStyles.tabTriggerActive
                      : themedStyles.tabTrigger
                    : undefined
                  }
                >
                  By {getGuestLabel(event)}
                </TabsTrigger>
                <TabsTrigger
                  value="attendance"
                  className="gap-1.5"
                  style={themedStyles
                    ? activeTab === 'attendance'
                      ? themedStyles.tabTriggerActive
                      : themedStyles.tabTrigger
                    : undefined
                  }
                >
                  <UserCheck className="size-4" />
                  Attendance
                </TabsTrigger>
              </TabsList>

              {/* By Table View */}
              <TabsContent value="by-table" className="mt-6 space-y-4">
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
                  {(tablesByRound || tables)?.map((table) => (
                    <TableCard
                      key={table._id}
                      tableNumber={table.tableNumber}
                      guests={table.guests.filter((g): g is ConvexGuest => g !== null).map((g) => ({
                        id: g._id,
                        name: g.name,
                        department: g.department,
                        email: g.email,
                        phone: g.phone,
                        tableNumber: g.tableNumber,
                        qrCodeId: g.qrCodeId,
                        checkedIn: g.checkedIn,
                      }))}
                      qrCodeId={table.qrCodeId}
                      eventName={event.name}
                      baseUrl={baseUrl}
                      themeColors={themeColors}
                    />
                  ))}
                </div>
              </TabsContent>

              {/* By Guest View */}
              <TabsContent value="by-guest" className="mt-6 space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search
                      className="absolute left-3 top-1/2 -translate-y-1/2 size-4"
                      style={themedStyles?.pageTextMuted}
                    />
                    <Input
                      placeholder="Search by name or department..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                      style={themedStyles?.input}
                    />
                    {searchQuery && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2"
                        onClick={() => setSearchQuery('')}
                        style={themedStyles?.pageText}
                      >
                        <X className="size-4" />
                      </Button>
                    )}
                  </div>
                  <Button
                    variant="secondary"
                    onClick={handleDownloadAllCards}
                    disabled={isDownloadingAll}
                    className="gap-2 shrink-0"
                    style={themedStyles ? { backgroundColor: themeColors?.secondary, color: themedStyles.cardText.color } : undefined}
                  >
                    {isDownloadingAll ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Download className="size-4" />
                    )}
                    Download All Cards
                  </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
                  {filteredGuests.length === 0 ? (
                    <div className="col-span-full text-center py-8" style={themedStyles?.pageTextMuted}>
                      <Users className="size-12 mx-auto mb-2 opacity-20" />
                      <p>I do not see any guests.</p>
                    </div>
                  ) : (
                    filteredGuests.map((guest) => {
                      const guestRoundAssignments = roundAssignmentsByGuest?.[guest._id]?.map((a: ConvexRoundAssignment) => ({
                        id: a._id,
                        guestId: a.guestId,
                        eventId: a.eventId,
                        roundNumber: a.roundNumber,
                        tableNumber: a.tableNumber,
                      }))

                      return (
                        <GuestCard
                          key={guest._id}
                          guest={{
                            id: guest._id,
                            name: guest.name,
                            department: guest.department,
                            email: guest.email,
                            phone: guest.phone,
                            tableNumber: guest.tableNumber,
                            qrCodeId: guest.qrCodeId,
                            checkedIn: guest.checkedIn,
                          }}
                          eventName={event.name}
                          baseUrl={baseUrl}
                          roundAssignments={guestRoundAssignments}
                          themeColors={themeColors}
                          onEdit={() => setEditingGuest(guest)}
                        />
                      )
                    })
                  )}
                </div>
              </TabsContent>

              {/* Attendance View */}
              <TabsContent value="attendance" className="mt-6 space-y-4">
                <Card style={themedStyles?.card}>
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-3xl font-bold" style={{ color: themedStyles ? themeColors?.primary : '#16a34a' }}>{checkInStats.checkedIn}</p>
                          <p className="text-sm" style={themedStyles?.cardTextMuted}>Checked In</p>
                        </div>
                        <div className="text-4xl" style={{ color: themedStyles ? `${themedStyles.cardTextMuted.color}50` : 'var(--muted-foreground)' }}>/</div>
                        <div className="text-center">
                          <p className="text-3xl font-bold" style={themedStyles?.cardText}>{checkInStats.total}</p>
                          <p className="text-sm" style={themedStyles?.cardTextMuted}>Total {getGuestLabelPlural(event)}</p>
                        </div>
                      </div>
                      <div className="text-center sm:text-right">
                        <p className="text-2xl font-bold" style={{ color: themedStyles ? themeColors?.accent : '#d97706' }}>
                          {checkInStats.total - checkInStats.checkedIn}
                        </p>
                        <p className="text-sm" style={themedStyles?.cardTextMuted}>Still Waiting</p>
                      </div>
                    </div>
                    <div
                      className="mt-4 h-3 rounded-full overflow-hidden"
                      style={themedStyles ? { backgroundColor: `${themedStyles.cardTextMuted.color}20` } : { backgroundColor: 'var(--muted)' }}
                    >
                      <div
                        className="h-full transition-all duration-500"
                        style={{
                          width: `${checkInStats.total > 0 ? (checkInStats.checkedIn / checkInStats.total) * 100 : 0}%`,
                          backgroundColor: themedStyles ? themeColors?.primary : '#22c55e',
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-2">
                  <Button
                    variant={attendanceFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setAttendanceFilter('all')}
                    className="gap-1.5 transition-colors"
                    style={themedStyles
                      ? attendanceFilter === 'all'
                        ? hoveredButton === 'filterAll'
                          ? themedStyles.primaryButtonHover
                          : themedStyles.primaryButton
                        : hoveredButton === 'filterAll'
                          ? themedStyles.outlineButtonHover
                          : themedStyles.outlineButton
                      : undefined
                    }
                    onMouseEnter={() => setHoveredButton('filterAll')}
                    onMouseLeave={() => setHoveredButton(null)}
                  >
                    <Users className="size-4" style={themedStyles && attendanceFilter !== 'all' ? { color: 'inherit' } : undefined} />
                    <span>All ({guests?.length || 0})</span>
                  </Button>
                  <Button
                    variant={attendanceFilter === 'waiting' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setAttendanceFilter('waiting')}
                    className="gap-1.5 transition-colors"
                    style={themedStyles
                      ? attendanceFilter === 'waiting'
                        ? hoveredButton === 'filterWaiting'
                          ? themedStyles.primaryButtonHover
                          : themedStyles.primaryButton
                        : hoveredButton === 'filterWaiting'
                          ? themedStyles.outlineButtonHover
                          : themedStyles.outlineButton
                      : undefined
                    }
                    onMouseEnter={() => setHoveredButton('filterWaiting')}
                    onMouseLeave={() => setHoveredButton(null)}
                  >
                    <Clock className="size-4" style={themedStyles && attendanceFilter !== 'waiting' ? { color: 'inherit' } : undefined} />
                    <span>Waiting ({checkInStats.total - checkInStats.checkedIn})</span>
                  </Button>
                  <Button
                    variant={attendanceFilter === 'checked-in' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setAttendanceFilter('checked-in')}
                    className="gap-1.5 transition-colors"
                    style={themedStyles
                      ? attendanceFilter === 'checked-in'
                        ? hoveredButton === 'filterCheckedIn'
                          ? themedStyles.primaryButtonHover
                          : themedStyles.primaryButton
                        : hoveredButton === 'filterCheckedIn'
                          ? themedStyles.outlineButtonHover
                          : themedStyles.outlineButton
                      : undefined
                    }
                    onMouseEnter={() => setHoveredButton('filterCheckedIn')}
                    onMouseLeave={() => setHoveredButton(null)}
                  >
                    <CheckCircle2 className="size-4" style={themedStyles && attendanceFilter !== 'checked-in' ? { color: 'inherit' } : undefined} />
                    <span>Checked In ({checkInStats.checkedIn})</span>
                  </Button>
                </div>

                <Card style={themedStyles?.card}>
                  <CardContent className="p-0">
                    {attendanceGuests.length === 0 ? (
                      <div className="text-center py-12" style={themedStyles?.cardTextMuted}>
                        <Users className="size-12 mx-auto mb-2 opacity-20" />
                        <p>No one matches this filter.</p>
                      </div>
                    ) : (
                      <div
                        className="divide-y"
                        style={themedStyles ? { borderColor: `${themedStyles.cardTextMuted.color}20` } : undefined}
                      >
                        {attendanceGuests.map((guest) => {
                          // Get all round assignments for this guest
                          const guestAssignments = roundAssignmentsByGuest?.[guest._id]
                          const hasMultipleRounds = (event.numberOfRounds || 1) > 1 && guestAssignments && guestAssignments.length > 0

                          // Build table assignments display
                          let tableDisplay: string | null = null
                          if (hasMultipleRounds) {
                            // Sort by round number and format as "R1: T1 • R2: T3 • R3: T5"
                            const sortedAssignments = [...guestAssignments].sort(
                              (a: ConvexRoundAssignment, b: ConvexRoundAssignment) => a.roundNumber - b.roundNumber
                            )
                            tableDisplay = sortedAssignments
                              .map((a: ConvexRoundAssignment) => `R${a.roundNumber}: T${a.tableNumber}`)
                              .join(' • ')
                          } else if (guest.tableNumber) {
                            tableDisplay = `${getTableLabel(event)} ${guest.tableNumber}`
                          }

                          return (
                            <div
                              key={guest._id}
                              className="flex items-center justify-between p-4 transition-colors"
                              style={themedStyles ? {
                                borderColor: `${themedStyles.cardTextMuted.color}20`,
                              } : undefined}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                {guest.checkedIn ? (
                                  <CheckCircle2 className="size-5 shrink-0" style={{ color: themedStyles ? themeColors?.primary : '#16a34a' }} />
                                ) : (
                                  <div
                                    className="size-5 rounded-full border-2 shrink-0"
                                    style={{ borderColor: themedStyles ? `${themedStyles.cardTextMuted.color}50` : 'var(--muted-foreground)' }}
                                  />
                                )}
                                <div className="min-w-0">
                                  <p className="font-medium truncate" style={themedStyles?.cardText}>{guest.name}</p>
                                  <div className="flex items-center gap-2 text-sm flex-wrap" style={themedStyles?.cardTextMuted}>
                                    {guest.department && <span>{guest.department}</span>}
                                    {tableDisplay && (
                                      <>
                                        {guest.department && <span>•</span>}
                                        <span>{tableDisplay}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0 ml-4">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setEditingGuest(guest)}
                                  className="size-8 opacity-60 hover:opacity-100 transition-opacity"
                                  style={themedStyles?.cardText}
                                >
                                  <Pencil className="size-4" />
                                </Button>
                                {guest.checkedIn ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleUndoCheckIn(guest._id)}
                                    style={themedStyles?.cardTextMuted}
                                  >
                                    Undo
                                  </Button>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleManualCheckIn(guest._id)}
                                    className="gap-1.5"
                                    style={themedStyles
                                      ? hoveredButton === `checkin-${guest._id}`
                                        ? themedStyles.outlineButtonOnCardHover
                                        : themedStyles.outlineButtonOnCard
                                      : undefined
                                    }
                                    onMouseEnter={() => setHoveredButton(`checkin-${guest._id}`)}
                                    onMouseLeave={() => setHoveredButton(null)}
                                  >
                                    <CheckCircle2 className="size-4" />
                                    Check In
                                  </Button>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

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
      </TooltipProvider>
    </EventThemeProvider>
  )
}
