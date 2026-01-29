'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import {
  ArrowLeft,
  Plus,
  X,
  Search,
  Users,
  Clock,
  MapPin,
  Loader2,
  UserPlus,
  CheckCircle2,
  Square,
  CheckSquare,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { SeatherderLoading } from '@/components/seatherder-loading'

interface PageProps {
  params: Promise<{ id: string; sessionId: string }>
}

// Types for when Convex types aren't regenerated yet
interface AssignedGuest {
  _id: Id<'guests'>
  name: string
  department?: string
  email?: string
  assignmentId?: Id<'sessionAssignments'>
}

interface SessionWithGuests {
  _id: Id<'sessions'>
  eventId: Id<'events'>
  name: string
  description?: string
  startTime?: string
  endTime?: string
  maxCapacity?: number
  room?: { _id: Id<'rooms'>; name: string; location?: string } | null
  assignedGuests?: AssignedGuest[]
}

export default function SessionDetailPage({ params }: PageProps) {
  const router = useRouter()
  const resolvedParams = React.use(params)
  const eventId = resolvedParams.id as Id<'events'>
  const sessionId = resolvedParams.sessionId as Id<'sessions'>

  // State
  const [isAddGuestsOpen, setIsAddGuestsOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [selectedGuestIds, setSelectedGuestIds] = React.useState<Set<string>>(new Set())
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Queries
  const event = useQuery(api.events.get, { id: eventId })
  const session = useQuery(api.sessions.get, { id: sessionId })
  const allGuests = useQuery(api.guests.getByEvent, { eventId })

  // Mutations
  const assignGuests = useMutation(api.sessions.assignGuestsBulk)
  const unassignGuest = useMutation(api.sessions.unassignGuest)

  // Cast session to typed version
  const typedSession = session as SessionWithGuests | null | undefined

  // Get assigned guest IDs for quick lookup
  const assignedGuestIds = React.useMemo(() => {
    if (!typedSession?.assignedGuests) return new Set<string>()
    return new Set(typedSession.assignedGuests.map((g) => g._id))
  }, [typedSession])

  // Filter unassigned guests for the add dialog
  const unassignedGuests = React.useMemo(() => {
    if (!allGuests) return []
    const filtered = allGuests.filter((g) => !assignedGuestIds.has(g._id))

    if (!searchQuery.trim()) return filtered

    const query = searchQuery.toLowerCase()
    return filtered.filter(
      (g) =>
        g.name.toLowerCase().includes(query) ||
        g.department?.toLowerCase().includes(query) ||
        g.email?.toLowerCase().includes(query)
    )
  }, [allGuests, assignedGuestIds, searchQuery])

  // Toggle guest selection
  const toggleGuestSelection = (guestId: string) => {
    setSelectedGuestIds((prev) => {
      const next = new Set(prev)
      if (next.has(guestId)) {
        next.delete(guestId)
      } else {
        next.add(guestId)
      }
      return next
    })
  }

  // Select all visible unassigned guests
  const selectAllGuests = () => {
    setSelectedGuestIds(new Set(unassignedGuests.map((g) => g._id)))
  }

  // Clear selection
  const clearSelection = () => {
    setSelectedGuestIds(new Set())
  }

  // Handle adding selected guests
  const handleAddGuests = async () => {
    if (selectedGuestIds.size === 0) return

    setIsSubmitting(true)
    try {
      const result = await assignGuests({
        sessionId,
        guestIds: Array.from(selectedGuestIds) as Id<'guests'>[],
      })

      if (result.assigned > 0) {
        toast.success(`Added ${result.assigned} guest${result.assigned !== 1 ? 's' : ''} to session.`)
      }
      if (result.failed > 0) {
        toast.error(`${result.failed} guest${result.failed !== 1 ? 's' : ''} could not be added.`)
      }

      setIsAddGuestsOpen(false)
      clearSelection()
      setSearchQuery('')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add guests')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle removing a guest
  const handleRemoveGuest = async (guestId: Id<'guests'>) => {
    try {
      await unassignGuest({ sessionId, guestId })
      toast.success('Guest removed from session.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to remove guest')
    }
  }

  // Format time display
  const formatTime = (isoString?: string) => {
    if (!isoString) return null
    const date = new Date(isoString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (isoString?: string) => {
    if (!isoString) return null
    const date = new Date(isoString)
    return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
  }

  // Loading state
  if (event === undefined || session === undefined) {
    return <SeatherderLoading message="I am fetching session details..." />
  }

  // Not found
  if (event === null || session === null) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>I cannot find this session</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              This session does not exist, or it wandered off.
            </p>
            <Button onClick={() => router.push(`/event/${eventId}/sessions`)} className="w-full">
              <ArrowLeft className="mr-2 size-4" />
              Back to Sessions
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const capacityInfo =
    typedSession?.maxCapacity
      ? `${typedSession?.assignedGuests?.length || 0} / ${typedSession?.maxCapacity}`
      : `${typedSession?.assignedGuests?.length || 0}`

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-4xl">
        {/* Header */}
        <div className="space-y-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/event/${eventId}/sessions`)}
            className="gap-2"
          >
            <ArrowLeft className="size-4" />
            Back to Sessions
          </Button>

          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{typedSession?.name}</h1>
            <p className="text-muted-foreground">{event.name}</p>
          </div>

          {/* Session details */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {(typedSession?.startTime || typedSession?.endTime) && (
              <div className="flex items-center gap-1">
                <Clock className="size-4" />
                {typedSession?.startTime && (
                  <>
                    {formatDate(typedSession?.startTime)} {formatTime(typedSession?.startTime)}
                  </>
                )}
                {typedSession?.startTime && typedSession?.endTime && ' - '}
                {typedSession?.endTime && formatTime(typedSession?.endTime)}
              </div>
            )}
            {typedSession?.room && (
              <div className="flex items-center gap-1">
                <MapPin className="size-4" />
                {typedSession?.room.name}
                {typedSession?.room.location && ` (${typedSession?.room.location})`}
              </div>
            )}
            <div className="flex items-center gap-1">
              <Users className="size-4" />
              {capacityInfo} assigned
            </div>
          </div>

          {typedSession?.description && (
            <p className="text-muted-foreground">{typedSession?.description}</p>
          )}
        </div>

        {/* Assigned Guests */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Assigned Guests</CardTitle>
                <CardDescription>
                  {typedSession?.assignedGuests?.length || 0} guest{typedSession?.assignedGuests?.length !== 1 ? 's' : ''} assigned
                  {typedSession?.maxCapacity && ` (max ${typedSession?.maxCapacity})`}
                </CardDescription>
              </div>
              <Button onClick={() => setIsAddGuestsOpen(true)} className="gap-2">
                <UserPlus className="size-4" />
                Add Guests
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!typedSession?.assignedGuests || typedSession?.assignedGuests.length === 0 ? (
              <div className="text-center py-12">
                <Users className="size-12 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-medium mb-2">No guests assigned</h3>
                <p className="text-muted-foreground mb-4">
                  Add guests to this session to track attendance.
                </p>
                <Button onClick={() => setIsAddGuestsOpen(true)} className="gap-2">
                  <UserPlus className="size-4" />
                  Add Guests
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                {typedSession?.assignedGuests.map((guest) => (
                  <div
                    key={guest._id}
                    className="flex items-center justify-between py-3 group"
                  >
                    <div className="min-w-0">
                      <p className="font-medium truncate">{guest.name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {guest.department && <span>{guest.department}</span>}
                        {guest.email && (
                          <>
                            {guest.department && <span>•</span>}
                            <span>{guest.email}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveGuest(guest._id)}
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Guests Dialog */}
      <Dialog
        open={isAddGuestsOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddGuestsOpen(false)
            clearSelection()
            setSearchQuery('')
          }
        }}
      >
        <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Add Guests to Session</DialogTitle>
            <DialogDescription>
              Select guests to add to &quot;{typedSession?.name}&quot;.
              {typedSession?.maxCapacity && (
                <>
                  {' '}
                  {typedSession?.maxCapacity - (typedSession?.assignedGuests?.length || 0)} spots remaining.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search guests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Selection controls */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (selectedGuestIds.size === unassignedGuests.length) {
                    clearSelection()
                  } else {
                    selectAllGuests()
                  }
                }}
                className="gap-2"
              >
                {selectedGuestIds.size === unassignedGuests.length && unassignedGuests.length > 0 ? (
                  <>
                    <CheckSquare className="size-4" />
                    Deselect All
                  </>
                ) : (
                  <>
                    <Square className="size-4" />
                    Select All ({unassignedGuests.length})
                  </>
                )}
              </Button>
              {selectedGuestIds.size > 0 && (
                <Badge variant="secondary">{selectedGuestIds.size} selected</Badge>
              )}
            </div>

            {/* Guest list */}
            <div className="flex-1 overflow-y-auto -mx-6 px-6">
              {unassignedGuests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {allGuests && allGuests.length === assignedGuestIds.size ? (
                    <p>All guests are already assigned to this session.</p>
                  ) : searchQuery ? (
                    <p>No guests match your search.</p>
                  ) : (
                    <p>No guests available to add.</p>
                  )}
                </div>
              ) : (
                <div className="divide-y">
                  {unassignedGuests.map((guest) => {
                    const isSelected = selectedGuestIds.has(guest._id)
                    return (
                      <button
                        key={guest._id}
                        onClick={() => toggleGuestSelection(guest._id)}
                        className={cn(
                          'w-full flex items-center gap-3 py-3 px-2 -mx-2 rounded-lg transition-colors text-left',
                          isSelected ? 'bg-primary/10' : 'hover:bg-muted'
                        )}
                      >
                        <div
                          className={cn(
                            'size-5 rounded flex items-center justify-center shrink-0 transition-colors',
                            isSelected
                              ? 'bg-primary text-primary-foreground'
                              : 'border-2 border-muted-foreground/30'
                          )}
                        >
                          {isSelected && <CheckCircle2 className="size-4" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{guest.name}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {guest.department && <span>{guest.department}</span>}
                            {guest.email && (
                              <>
                                {guest.department && <span>•</span>}
                                <span className="truncate">{guest.email}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddGuestsOpen(false)
                clearSelection()
                setSearchQuery('')
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddGuests}
              disabled={selectedGuestIds.size === 0 || isSubmitting}
              className="gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="size-4" />
                  Add {selectedGuestIds.size} Guest{selectedGuestIds.size !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
