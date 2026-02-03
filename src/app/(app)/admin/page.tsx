'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { useQuery, useMutation, useAction } from 'convex/react'
import { useUser } from '@clerk/nextjs'
import { api } from '@convex/_generated/api'
import { Id } from '@convex/_generated/dataModel'
import { generateEventName } from '@/lib/event-names'
import { EVENT_TYPES, DEFAULT_EVENT_TYPE } from '@/lib/event-types'
import { removeRecentEvent } from '@/lib/recent-events'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { EventTypeSelector, EventTypeDisplay } from '@/components/event-type-selector'
import { WelcomeModal } from '@/components/welcome-modal'
import { Plus, Trash2, Table as TableIcon, Calendar, CreditCard, Sparkles } from 'lucide-react'

export default function AdminPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useUser()

  // Delete dialog state
  const [deleteDialogEvent, setDeleteDialogEvent] = useState<{ id: string; name: string } | null>(null)

  // Create event dialog state
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newEventName, setNewEventName] = useState('')
  const [newEventType, setNewEventType] = useState(DEFAULT_EVENT_TYPE)
  const [isCreating, setIsCreating] = useState(false)

  // Welcome modal state for first-time users
  const [showWelcome, setShowWelcome] = useState(false)
  const [hasSeenWelcome, setHasSeenWelcome] = useState(false)

  // Convex queries and mutations
  const events = useQuery(api.events.list)
  const createEvent = useMutation(api.events.create)
  const deleteEventMutation = useMutation(api.events.remove)
  const canCreateEventResult = useQuery(api.purchases.canCreateEvent)
  const createCheckout = useAction(api.stripe.createCheckoutSession)
  const [isPurchasing, setIsPurchasing] = useState(false)

  // Check for ?create=true URL param to auto-open create dialog
  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      handleOpenCreateDialog()
      // Clear the URL param
      router.replace('/admin')
    }
  }, [searchParams, router])

  // Show welcome modal for first-time users (no events)
  useEffect(() => {
    if (events !== undefined && events.length === 0 && !hasSeenWelcome) {
      // Check localStorage to see if they've already dismissed the welcome
      const dismissed = localStorage.getItem('seatherder_welcome_dismissed')
      if (!dismissed) {
        setShowWelcome(true)
      }
    }
  }, [events, hasSeenWelcome])

  // Handle welcome modal close
  const handleWelcomeClose = (open: boolean) => {
    setShowWelcome(open)
    if (!open) {
      setHasSeenWelcome(true)
      localStorage.setItem('seatherder_welcome_dismissed', 'true')
    }
  }

  const handleOpenCreateDialog = () => {
    setNewEventName(generateEventName())
    setNewEventType(DEFAULT_EVENT_TYPE)
    setShowCreateDialog(true)
  }

  const handleCreateNewEvent = async () => {
    if (!newEventName.trim()) {
      toast.error('I need a name for this event.')
      return
    }

    setIsCreating(true)
    try {
      const eventType = EVENT_TYPES[newEventType]
      const eventId = await createEvent({
        name: newEventName.trim(),
        tableSize: eventType.defaults.tableSize,
        numberOfRounds: eventType.defaults.numberOfRounds,
        roundDuration: eventType.defaults.roundDuration,
        eventType: newEventType,
        eventTypeSettings: eventType.settings,
      })
      toast.success('Your event is ready. I am excited.')
      setShowCreateDialog(false)
      router.push(`/event/${eventId}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      if (message === 'NO_CREDITS') {
        toast.error('You need to purchase credits to create another event.')
        setShowCreateDialog(false)
      } else {
        toast.error('Something went wrong. I could not create the event.')
      }
    } finally {
      setIsCreating(false)
    }
  }

  const handlePurchase = async (productType: string) => {
    setIsPurchasing(true)
    try {
      const baseUrl = window.location.origin
      const result = await createCheckout({
        productType,
        cancelUrl: `${baseUrl}/admin`
      })
      if (result.url) {
        window.location.href = result.url
      }
    } catch {
      toast.error('Could not start checkout. Please try again.')
    } finally {
      setIsPurchasing(false)
    }
  }

  const handleOpenEvent = (eventId: string) => {
    router.push(`/event/${eventId}`)
  }

  // Open delete confirmation dialog
  const handleDeleteClick = (eventId: string, eventName: string) => {
    setDeleteDialogEvent({ id: eventId, name: eventName })
  }

  // Execute deletion after confirmation
  const confirmDelete = async () => {
    if (!deleteDialogEvent) return
    try {
      await deleteEventMutation({ id: deleteDialogEvent.id as Id<'events'> })
      // Remove from recent events
      removeRecentEvent(deleteDialogEvent.id)
      toast.success('Event removed. I have forgotten it.')
    } catch {
      toast.error('I could not remove the event. Something is wrong.')
    } finally {
      setDeleteDialogEvent(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (events === undefined) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Fetching your events...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="text-center mb-12 animate-fade-in">
        <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          {user?.firstName ? `Welcome back, ${user.firstName}` : 'Your Events'}
        </h1>
        <p className="text-lg text-muted-foreground">
          I keep track of your events. Pick one, or start something new.
        </p>
      </div>

      {/* Credits Status */}
      {canCreateEventResult && (
        <div className="mb-8 animate-fade-in">
          <Card className="border-primary/20">
            <CardContent className="py-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <CreditCard className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    {canCreateEventResult.reason === 'unlimited' ? (
                      <p className="font-medium">Unlimited events <Badge variant="secondary">Annual</Badge></p>
                    ) : canCreateEventResult.canCreate ? (
                      <p className="font-medium">{canCreateEventResult.creditsRemaining} event{canCreateEventResult.creditsRemaining !== 1 ? 's' : ''} remaining</p>
                    ) : (
                      <p className="font-medium text-muted-foreground">No credits remaining</p>
                    )}
                  </div>
                </div>
                {(!canCreateEventResult.canCreate || canCreateEventResult.reason !== 'unlimited') && (
                  <div className="flex gap-2 flex-wrap justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePurchase('single')}
                      disabled={isPurchasing}
                    >
                      1 Event · $49
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePurchase('bundle_3')}
                      disabled={isPurchasing}
                    >
                      3 Events · $129
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handlePurchase('annual')}
                      disabled={isPurchasing}
                    >
                      <Sparkles className="h-4 w-4 mr-1" />
                      Unlimited · $249/yr
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create New Event Button */}
      <div className="flex justify-center mb-8 animate-slide-up">
        <Button
          size="lg"
          onClick={handleOpenCreateDialog}
          disabled={canCreateEventResult && !canCreateEventResult.canCreate}
          className="gap-2 shadow-lg hover:shadow-xl transition-shadow"
        >
          <Plus className="h-5 w-5" />
          Start a New Event
        </Button>
      </div>

      {/* Events List */}
      <div className="space-y-4 stagger-children">
        {events.length === 0 ? (
          <Card className="border-dashed animate-fade-in">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-muted p-4 mb-4">
                <TableIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium mb-2">No events yet. I am ready when you are.</p>
              <p className="text-sm text-muted-foreground">
                Tell me about your first event.
              </p>
            </CardContent>
          </Card>
        ) : (
          events.map((event) => (
            <Card key={event._id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-xl mb-2 truncate">
                      {event.name}
                    </CardTitle>
                    <CardDescription className="flex flex-wrap items-center gap-3">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        {formatDate(event.createdAt)}
                      </span>
                      <EventTypeDisplay typeId={event.eventType} />
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {event.isAssigned ? (
                      <Badge variant="default">Assigned</Badge>
                    ) : (
                      <Badge variant="outline">Draft</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => handleOpenEvent(event._id)}
                    className="flex-1"
                  >
                    Open Event
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDeleteClick(event._id, event.name)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogEvent !== null} onOpenChange={(open) => !open && setDeleteDialogEvent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove this event?</DialogTitle>
            <DialogDescription>
              Are you sure? I will forget everything about &quot;{deleteDialogEvent?.name}&quot;.
              All the guests, all the seating. Gone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogEvent(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Yes, remove it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Event Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Let me start a new event</DialogTitle>
            <DialogDescription>
              What kind of event is this? I will set things up for you.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="event-name">Event Name</Label>
              <Input
                id="event-name"
                value={newEventName}
                onChange={(e) => setNewEventName(e.target.value)}
                placeholder="What should I call it?"
              />
            </div>

            <div className="space-y-2">
              <Label>Event Type</Label>
              <EventTypeSelector
                value={newEventType}
                onChange={setNewEventType}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateNewEvent}
              disabled={isCreating || !newEventName.trim()}
            >
              {isCreating ? 'Setting things up...' : 'Let me start'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Welcome Modal for first-time users */}
      <WelcomeModal open={showWelcome} onOpenChange={handleWelcomeClose} />
    </div>
  )
}
