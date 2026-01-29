'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import type { Id, Doc } from '@convex/_generated/dataModel'
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
  Settings,
  Maximize,
  Pencil,
  Mail,
  UsersRound,
  Square,
  CheckSquare,
  UserX,
  Plus,
} from 'lucide-react'
import JSZip from 'jszip'

import { generateQrCodeBlob } from '@/lib/qr-download'
import { cn } from '@/lib/utils'
import { resolveThemeColors, type ThemeColors } from '@/lib/theme-presets'
import { getThemedStyles } from '@/lib/theme-utils'
import { getTableLabel, getTableLabelPlural, getGuestLabel, getGuestLabelPlural, getDepartmentLabel } from '@/lib/terminology'
import type { DietaryInfo } from '@/lib/types'
import { useRoundTimer } from '@/hooks/use-round-timer'

import { TableCard } from '@/components/table-card'
import { GuestCard } from '@/components/guest-card'
import { GuestForm } from '@/components/guest-form'
import { BulkActionBar, type GuestStatus } from '@/components/bulk-action-bar'
import { QuickAddGuestModal } from '@/components/quick-add-guest-modal'
import { EventThemeProvider } from '@/components/event-theme-provider'
import { SeatherderLoading } from '@/components/seatherder-loading'
import { PresentationMode, RoundManagementCard } from '@/components/live'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TooltipProvider } from '@/components/ui/tooltip'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

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

  // Use React.use() for Next.js 15+ async params
  const resolvedParams = React.use(params)
  // Note: Convex validates ID format in queries - invalid IDs will cause query to return null/throw
  const eventId = resolvedParams.id as Id<'events'>

  // Round management state
  const [selectedRound, setSelectedRound] = React.useState(1)
  const [roundDuration, setRoundDuration] = React.useState<number | undefined>(undefined)

  // Guest view state
  const [searchQuery, setSearchQuery] = React.useState('')
  const [isDownloadingAll, setIsDownloadingAll] = React.useState(false)

  // Attendance filter state
  const [attendanceFilter, setAttendanceFilter] = React.useState<'all' | 'waiting' | 'checked-in'>('all')

  // Status filter state
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'present' | 'late' | 'no-show'>('all')

  // Presentation mode
  const [isPresentationMode, setIsPresentationMode] = React.useState(false)

  // Hover state for themed buttons
  const [hoveredButton, setHoveredButton] = React.useState<string | null>(null)

  // Active tab for themed tabs
  const [activeTab, setActiveTab] = React.useState('by-table')

  // Edit guest state
  const [editingGuest, setEditingGuest] = React.useState<Doc<'guests'> | null>(null)

  // Bulk check-in state
  const [isBulkCheckingIn, setIsBulkCheckingIn] = React.useState(false)
  const [showBulkCheckInDialog, setShowBulkCheckInDialog] = React.useState(false)
  const [bulkCheckInResult, setBulkCheckInResult] = React.useState<{
    total: number
    checkedIn: number
    alreadyCheckedIn: number
    emailsQueued: number
  } | null>(null)

  // Guest selection state for selective bulk operations
  const [selectedGuestIds, setSelectedGuestIds] = React.useState<Set<string>>(new Set())
  const [isBulkOperating, setIsBulkOperating] = React.useState(false)

  // Convex queries
  const event = useQuery(api.events.get, { id: eventId })
  const guests = useQuery(api.guests.getByEvent, { eventId })
  const tables = useQuery(api.tables.getByEvent, { eventId })
  const tablesByRound = useQuery(
    api.tables.getByEventAndRound,
    event?.isAssigned
      ? { eventId, roundNumber: selectedRound }
      : 'skip'
  )
  const roundAssignmentsByGuest = useQuery(
    api.guests.getAllRoundAssignmentsByEvent,
    event?.isAssigned && (event?.numberOfRounds || 1) > 1
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
  const bulkCheckIn = useMutation(api.guests.bulkCheckIn)
  const bulkCheckInSelected = useMutation(api.guests.bulkCheckInSelected)
  const bulkUncheckIn = useMutation(api.guests.bulkUncheckIn)
  const bulkUpdateStatus = useMutation(api.guests.bulkUpdateStatus)
  const createGuest = useMutation(api.guests.create)

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
    try {
      const result = await endCurrentRound({ id: eventId })
      toast.success(`Round ${result.endedRound} is complete.`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to end round')
    }
  }, [eventId, endCurrentRound])

  // Reset rounds back to start
  const handleResetRounds = React.useCallback(async () => {
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
    try {
      await pauseRound({ id: eventId })
      toast.success('Pawsed! 🐾')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to pause round')
    }
  }, [eventId, pauseRound])

  // Resume the current round
  const handleResumeRound = React.useCallback(async () => {
    try {
      await resumeRound({ id: eventId })
      toast.success('Resumed.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to resume round')
    }
  }, [eventId, resumeRound])

  // Use the round timer hook for countdown management
  const {
    timeRemaining: adminTimeRemaining,
    minutes: adminMinutes,
    seconds: adminSeconds,
    isExpired: isTimerExpired,
    isWarning: isTimerWarning,
    isPaused: isTimerPaused,
  } = useRoundTimer({
    roundStartedAt: event?.roundStartedAt,
    roundDuration: event?.roundDuration,
    currentRound: event?.currentRound,
    isPaused: event?.isPaused,
    pausedTimeRemaining: event?.pausedTimeRemaining,
  })

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

    // Apply attendance filter
    if (attendanceFilter === 'waiting') {
      filtered = filtered.filter((g) => !g.checkedIn)
    } else if (attendanceFilter === 'checked-in') {
      filtered = filtered.filter((g) => g.checkedIn)
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((g) => g.status === statusFilter)
    }

    // Sort: not checked in first, then alphabetically
    return filtered.sort((a, b) => {
      if (a.checkedIn !== b.checkedIn) {
        return a.checkedIn ? 1 : -1
      }
      return a.name.localeCompare(b.name)
    })
  }, [guests, attendanceFilter, statusFilter])

  // Status counts for filter badges
  const statusCounts = React.useMemo(() => {
    if (!guests) return { present: 0, late: 0, noShow: 0 }
    return {
      present: guests.filter((g) => g.status === 'present').length,
      late: guests.filter((g) => g.status === 'late').length,
      noShow: guests.filter((g) => g.status === 'no-show').length,
    }
  }, [guests])

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

  // Handle bulk check-in
  const handleBulkCheckIn = React.useCallback(async () => {
    setIsBulkCheckingIn(true)
    setBulkCheckInResult(null)

    try {
      const result = await bulkCheckIn({ eventId })
      setBulkCheckInResult(result)

      if (result.checkedIn > 0) {
        toast.success(`Checked in ${result.checkedIn} ${result.checkedIn === 1 ? 'guest' : 'guests'}. ${result.emailsQueued} emails queued.`)
      } else if (result.alreadyCheckedIn === result.total) {
        toast.info('Everyone is already checked in.')
      } else {
        toast.info('No guests to check in.')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to bulk check in')
    } finally {
      setIsBulkCheckingIn(false)
    }
  }, [eventId, bulkCheckIn])

  // Toggle guest selection
  const toggleGuestSelection = React.useCallback((guestId: string) => {
    setSelectedGuestIds(prev => {
      const next = new Set(prev)
      if (next.has(guestId)) {
        next.delete(guestId)
      } else {
        next.add(guestId)
      }
      return next
    })
  }, [])

  // Clear guest selection
  const clearGuestSelection = React.useCallback(() => {
    setSelectedGuestIds(new Set())
  }, [])

  // Select all visible guests
  const selectAllGuests = React.useCallback((guestIds: string[]) => {
    setSelectedGuestIds(new Set(guestIds))
  }, [])

  // Calculate selected guests stats
  const selectedGuestsStats = React.useMemo(() => {
    if (!guests) return { total: 0, checkedIn: 0 }
    const selectedGuests = guests.filter(g => selectedGuestIds.has(g._id))
    return {
      total: selectedGuests.length,
      checkedIn: selectedGuests.filter(g => g.checkedIn).length,
    }
  }, [guests, selectedGuestIds])

  // Handle selective bulk check-in
  const handleBulkCheckInSelected = React.useCallback(async () => {
    if (selectedGuestIds.size === 0) return

    setIsBulkOperating(true)
    try {
      const result = await bulkCheckInSelected({
        guestIds: Array.from(selectedGuestIds) as Id<'guests'>[],
      })
      if (result.checkedIn > 0) {
        toast.success(`Checked in ${result.checkedIn} guest${result.checkedIn !== 1 ? 's' : ''}.`)
      }
      clearGuestSelection()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to check in guests')
    } finally {
      setIsBulkOperating(false)
    }
  }, [selectedGuestIds, bulkCheckInSelected, clearGuestSelection])

  // Handle selective bulk undo check-in
  const handleBulkUncheckIn = React.useCallback(async () => {
    if (selectedGuestIds.size === 0) return

    setIsBulkOperating(true)
    try {
      const result = await bulkUncheckIn({
        guestIds: Array.from(selectedGuestIds) as Id<'guests'>[],
      })
      if (result.uncheckedIn > 0) {
        toast.success(`Undid check-in for ${result.uncheckedIn} guest${result.uncheckedIn !== 1 ? 's' : ''}.`)
      }
      clearGuestSelection()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to undo check-in')
    } finally {
      setIsBulkOperating(false)
    }
  }, [selectedGuestIds, bulkUncheckIn, clearGuestSelection])

  // Handle bulk status update
  const handleBulkUpdateStatus = React.useCallback(async (status: GuestStatus) => {
    if (selectedGuestIds.size === 0) return

    setIsBulkOperating(true)
    try {
      const result = await bulkUpdateStatus({
        guestIds: Array.from(selectedGuestIds) as Id<'guests'>[],
        status,
      })
      const statusLabels: Record<string, string> = {
        present: 'Present',
        late: 'Late Arrival',
        'no-show': 'No-Show',
      }
      if (status === null) {
        toast.success(`Cleared status for ${result.updated} guest${result.updated !== 1 ? 's' : ''}.`)
      } else {
        toast.success(`Marked ${result.updated} guest${result.updated !== 1 ? 's' : ''} as ${statusLabels[status]}.`)
      }
      clearGuestSelection()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update status')
    } finally {
      setIsBulkOperating(false)
    }
  }, [selectedGuestIds, bulkUpdateStatus, clearGuestSelection])

  // Handle quick add guest
  const handleQuickAddGuest = React.useCallback(async (guestData: {
    name: string
    email?: string
    phone?: string
    dietaryNotes?: string
  }) => {
    try {
      await createGuest({
        eventId,
        name: guestData.name,
        email: guestData.email,
        phone: guestData.phone,
        dietary: guestData.dietaryNotes ? {
          restrictions: [],
          notes: guestData.dietaryNotes,
        } : undefined,
      })
      toast.success(`Added ${guestData.name}.`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add guest')
      throw error
    }
  }, [eventId, createGuest])

  // Resolve theme colors
  const themeColors = event ? resolveThemeColors(event.themePreset, event.customColors) : undefined
  const themedStyles = React.useMemo(() => getThemedStyles(themeColors), [themeColors])

  // Loading state
  if (event === undefined) {
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
      <PresentationMode
        eventName={event.name}
        themePreset={event.themePreset}
        customColors={event.customColors}
        themeColors={themeColors}
        currentRound={event.currentRound || 0}
        numberOfRounds={event.numberOfRounds || 1}
        roundStartedAt={event.roundStartedAt}
        roundDuration={event.roundDuration}
        isPaused={isTimerPaused}
        timeRemaining={adminTimeRemaining}
        minutes={adminMinutes}
        seconds={adminSeconds}
        isExpired={isTimerExpired}
        isWarning={isTimerWarning}
        checkedIn={checkInStats.checkedIn}
        total={checkInStats.total}
        onExit={() => setIsPresentationMode(false)}
      />
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
              <RoundManagementCard
                eventId={eventId}
                currentRound={event.currentRound || 0}
                numberOfRounds={event.numberOfRounds || 1}
                roundStartedAt={event.roundStartedAt}
                roundDuration={event.roundDuration}
                isPaused={isTimerPaused}
                timeRemaining={adminTimeRemaining}
                minutes={adminMinutes}
                seconds={adminSeconds}
                isExpired={isTimerExpired}
                isWarning={isTimerWarning}
                selectedRound={selectedRound}
                onSelectedRoundChange={setSelectedRound}
                onStartNextRound={handleStartNextRound}
                onEndCurrentRound={handleEndCurrentRound}
                onPauseRound={handlePauseRound}
                onResumeRound={handleResumeRound}
                onResetRounds={handleResetRounds}
                onUpdateRoundDuration={handleUpdateRoundDuration}
                themeColors={themeColors}
                themedStyles={themedStyles}
                baseUrl={baseUrl}
              />
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

                {/* Selection controls */}
                {filteredGuests.length > 0 && (
                  <div className="flex items-center justify-between mb-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (selectedGuestIds.size === filteredGuests.length) {
                          clearGuestSelection()
                        } else {
                          selectAllGuests(filteredGuests.map(g => g._id))
                        }
                      }}
                      className="gap-2"
                      style={themedStyles?.outlineButton}
                    >
                      {selectedGuestIds.size === filteredGuests.length && filteredGuests.length > 0 ? (
                        <>
                          <CheckSquare className="size-4" />
                          Deselect All
                        </>
                      ) : (
                        <>
                          <Square className="size-4" />
                          Select All ({filteredGuests.length})
                        </>
                      )}
                    </Button>
                    {selectedGuestIds.size > 0 && (
                      <span className="text-sm" style={themedStyles?.pageTextMuted}>
                        {selectedGuestIds.size} selected
                      </span>
                    )}
                  </div>
                )}

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
                      const isSelected = selectedGuestIds.has(guest._id)

                      return (
                        <div key={guest._id} className="relative">
                          {/* Selection checkbox */}
                          <button
                            onClick={() => toggleGuestSelection(guest._id)}
                            className={cn(
                              "absolute -top-2 -left-2 z-10 size-6 rounded-md flex items-center justify-center transition-all",
                              isSelected
                                ? "bg-primary text-primary-foreground shadow-md"
                                : "bg-background border shadow-sm hover:bg-muted"
                            )}
                            style={isSelected && themedStyles ? { backgroundColor: themeColors?.primary, color: '#fff' } : undefined}
                          >
                            {isSelected && <CheckCircle2 className="size-4" />}
                          </button>
                          <div className={cn(
                            "transition-all rounded-lg",
                            isSelected && "ring-2 ring-offset-2 ring-primary"
                          )}
                          style={isSelected && themeColors ? { '--tw-ring-color': themeColors.primary } as React.CSSProperties : undefined}
                          >
                            <GuestCard
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
                          </div>
                        </div>
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

                    {/* Quick Actions */}
                    <div
                      className="mt-6 pt-4 flex flex-wrap items-center justify-center gap-3 border-t"
                      style={themedStyles?.divider}
                    >
                      <QuickAddGuestModal
                        onAdd={handleQuickAddGuest}
                        guestLabel={getGuestLabel(event)}
                        trigger={
                          <Button
                            variant="outline"
                            className="gap-2 transition-colors"
                            style={themedStyles
                              ? hoveredButton === 'quickAdd'
                                ? themedStyles.outlineButtonOnCardHover
                                : themedStyles.outlineButtonOnCard
                              : undefined
                            }
                            onMouseEnter={() => setHoveredButton('quickAdd')}
                            onMouseLeave={() => setHoveredButton(null)}
                          >
                            <Plus className="size-4" />
                            Quick Add {getGuestLabel(event)}
                          </Button>
                        }
                      />
                      <Button
                        onClick={() => setShowBulkCheckInDialog(true)}
                        disabled={isBulkCheckingIn || checkInStats.checkedIn === checkInStats.total}
                        className="gap-2 transition-colors"
                        style={themedStyles
                          ? hoveredButton === 'bulkCheckIn'
                            ? themedStyles.primaryButtonHover
                            : themedStyles.primaryButton
                          : undefined
                        }
                        onMouseEnter={() => setHoveredButton('bulkCheckIn')}
                        onMouseLeave={() => setHoveredButton(null)}
                      >
                        {isBulkCheckingIn ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <UsersRound className="size-4" />
                        )}
                        Bulk Check-in All
                      </Button>
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

                {/* Status filters - show only if there are any statuses */}
                {(statusCounts.present > 0 || statusCounts.late > 0 || statusCounts.noShow > 0) && (
                  <div className="flex gap-2 flex-wrap">
                    <span className="text-sm self-center" style={themedStyles?.pageTextMuted}>Status:</span>
                    <Button
                      variant={statusFilter === 'all' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setStatusFilter('all')}
                      className="h-7 text-xs"
                    >
                      All
                    </Button>
                    {statusCounts.present > 0 && (
                      <Button
                        variant={statusFilter === 'present' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setStatusFilter('present')}
                        className="h-7 text-xs gap-1"
                      >
                        <CheckCircle2 className="size-3 text-green-600" />
                        Present ({statusCounts.present})
                      </Button>
                    )}
                    {statusCounts.late > 0 && (
                      <Button
                        variant={statusFilter === 'late' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setStatusFilter('late')}
                        className="h-7 text-xs gap-1"
                      >
                        <Clock className="size-3 text-amber-600" />
                        Late ({statusCounts.late})
                      </Button>
                    )}
                    {statusCounts.noShow > 0 && (
                      <Button
                        variant={statusFilter === 'no-show' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setStatusFilter('no-show')}
                        className="h-7 text-xs gap-1"
                      >
                        <UserX className="size-3 text-red-600" />
                        No-Show ({statusCounts.noShow})
                      </Button>
                    )}
                  </div>
                )}

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
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium truncate" style={themedStyles?.cardText}>{guest.name}</p>
                                    {guest.status === 'present' && (
                                      <Badge variant="outline" className="shrink-0 h-5 text-xs gap-1 border-green-200 bg-green-50 text-green-700">
                                        <CheckCircle2 className="size-3" />
                                        Present
                                      </Badge>
                                    )}
                                    {guest.status === 'late' && (
                                      <Badge variant="outline" className="shrink-0 h-5 text-xs gap-1 border-amber-200 bg-amber-50 text-amber-700">
                                        <Clock className="size-3" />
                                        Late
                                      </Badge>
                                    )}
                                    {guest.status === 'no-show' && (
                                      <Badge variant="outline" className="shrink-0 h-5 text-xs gap-1 border-red-200 bg-red-50 text-red-700">
                                        <UserX className="size-3" />
                                        No-Show
                                      </Badge>
                                    )}
                                  </div>
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

        {/* Bulk Check-in Confirmation Dialog */}
        <Dialog open={showBulkCheckInDialog} onOpenChange={setShowBulkCheckInDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Bulk Check-in All {getGuestLabelPlural(event)}</DialogTitle>
              <DialogDescription>
                This will check in {checkInStats.total - checkInStats.checkedIn} {getGuestLabelPlural(event).toLowerCase()} who are still waiting and send them their table assignments via email.
              </DialogDescription>
            </DialogHeader>

            {bulkCheckInResult && (
              <div className="py-4 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-5 text-green-600" />
                  <span>{bulkCheckInResult.checkedIn} newly checked in</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="size-5 text-blue-600" />
                  <span>{bulkCheckInResult.emailsQueued} emails queued</span>
                </div>
                {bulkCheckInResult.alreadyCheckedIn > 0 && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <UserCheck className="size-5" />
                    <span>{bulkCheckInResult.alreadyCheckedIn} already checked in</span>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowBulkCheckInDialog(false)
                  setBulkCheckInResult(null)
                }}
              >
                {bulkCheckInResult ? 'Close' : 'Cancel'}
              </Button>
              {!bulkCheckInResult && (
                <Button
                  onClick={handleBulkCheckIn}
                  disabled={isBulkCheckingIn}
                  className="gap-2"
                >
                  {isBulkCheckingIn ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Checking in...
                    </>
                  ) : (
                    <>
                      <UsersRound className="size-4" />
                      Check in All
                    </>
                  )}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk Action Bar for selected guests */}
        <BulkActionBar
          selectedCount={selectedGuestsStats.total}
          selectedCheckedInCount={selectedGuestsStats.checkedIn}
          onCheckIn={handleBulkCheckInSelected}
          onUncheckIn={handleBulkUncheckIn}
          onClearSelection={clearGuestSelection}
          onUpdateStatus={handleBulkUpdateStatus}
          isLoading={isBulkOperating}
        />
      </TooltipProvider>
    </EventThemeProvider>
  )
}
