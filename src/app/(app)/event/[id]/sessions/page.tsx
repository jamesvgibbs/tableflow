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
  Pencil,
  Trash2,
  Clock,
  MapPin,
  Users,
  Calendar,
  Loader2,
  TableIcon,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SeatherderLoading } from '@/components/seatherder-loading'

interface PageProps {
  params: Promise<{ id: string }>
}

interface SessionFormData {
  name: string
  description?: string
  startTime?: string
  endTime?: string
  roomId?: string
  hasTableSeating?: boolean
  maxCapacity?: number
}

// Types for when Convex types aren't regenerated yet
interface Session {
  _id: Id<'sessions'>
  eventId: Id<'events'>
  name: string
  description?: string
  startTime?: string
  endTime?: string
  roomId?: Id<'rooms'>
  hasTableSeating?: boolean
  maxCapacity?: number
  room?: { _id: Id<'rooms'>; name: string } | null
  assignedCount?: number
}

interface Room {
  _id: Id<'rooms'>
  name: string
  location?: string
}

export default function SessionsPage({ params }: PageProps) {
  const router = useRouter()
  const resolvedParams = React.use(params)
  const eventId = resolvedParams.id as Id<'events'>

  // State
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false)
  const [editingSession, setEditingSession] = React.useState<{
    _id: Id<'sessions'>
    name: string
    description?: string
    startTime?: string
    endTime?: string
    roomId?: Id<'rooms'>
    hasTableSeating?: boolean
    maxCapacity?: number
  } | null>(null)
  const [deletingSessionId, setDeletingSessionId] = React.useState<Id<'sessions'> | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Form state
  const [formData, setFormData] = React.useState<SessionFormData>({
    name: '',
    description: '',
    startTime: '',
    endTime: '',
    roomId: '',
    hasTableSeating: false,
    maxCapacity: undefined,
  })

  // Queries
  const event = useQuery(api.events.get, { id: eventId })
  const sessions = useQuery(api.sessions.getByEvent, { eventId })
  const rooms = useQuery(api.rooms.getByEvent, { eventId })

  // Mutations
  const createSession = useMutation(api.sessions.create)
  const updateSession = useMutation(api.sessions.update)
  const deleteSession = useMutation(api.sessions.remove)

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      startTime: '',
      endTime: '',
      roomId: '',
      hasTableSeating: false,
      maxCapacity: undefined,
    })
  }

  // Open edit dialog
  const handleEdit = (session: typeof editingSession) => {
    if (!session) return
    setFormData({
      name: session.name,
      description: session.description || '',
      startTime: session.startTime ? session.startTime.slice(0, 16) : '',
      endTime: session.endTime ? session.endTime.slice(0, 16) : '',
      roomId: session.roomId || '',
      hasTableSeating: session.hasTableSeating || false,
      maxCapacity: session.maxCapacity,
    })
    setEditingSession(session)
  }

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    setIsSubmitting(true)
    try {
      if (editingSession) {
        await updateSession({
          id: editingSession._id,
          name: formData.name.trim(),
          description: formData.description?.trim() || undefined,
          startTime: formData.startTime ? new Date(formData.startTime).toISOString() : null,
          endTime: formData.endTime ? new Date(formData.endTime).toISOString() : null,
          roomId: formData.roomId ? (formData.roomId as Id<'rooms'>) : null,
          hasTableSeating: formData.hasTableSeating,
          maxCapacity: formData.maxCapacity || null,
        })
        toast.success(`Updated ${formData.name}.`)
        setEditingSession(null)
      } else {
        await createSession({
          eventId,
          name: formData.name.trim(),
          description: formData.description?.trim() || undefined,
          startTime: formData.startTime ? new Date(formData.startTime).toISOString() : undefined,
          endTime: formData.endTime ? new Date(formData.endTime).toISOString() : undefined,
          roomId: formData.roomId ? (formData.roomId as Id<'rooms'>) : undefined,
          hasTableSeating: formData.hasTableSeating,
          maxCapacity: formData.maxCapacity || undefined,
        })
        toast.success(`Added ${formData.name}.`)
        setIsAddDialogOpen(false)
      }
      resetForm()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save session')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle delete
  const handleDelete = async () => {
    if (!deletingSessionId) return

    setIsSubmitting(true)
    try {
      await deleteSession({ id: deletingSessionId })
      toast.success('Session deleted.')
      setDeletingSessionId(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete session')
    } finally {
      setIsSubmitting(false)
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
  if (event === undefined) {
    return <SeatherderLoading message="I am fetching sessions..." />
  }

  // Not found
  if (event === null) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>I cannot find this event</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              This event does not exist, or it wandered off.
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-4xl">
        {/* Header */}
        <div className="space-y-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/event/${eventId}`)}
            className="gap-2"
          >
            <ArrowLeft className="size-4" />
            Back to Event
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Sessions</h1>
              <p className="text-muted-foreground">{event.name}</p>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
              <Plus className="size-4" />
              Add Session
            </Button>
          </div>
        </div>

        {/* Sessions List */}
        {sessions === undefined ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-5 bg-muted rounded w-48" />
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-muted rounded w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="size-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-medium mb-2">No sessions yet</h3>
              <p className="text-muted-foreground mb-4">
                Create sessions for workshops, talks, or breakout activities.
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
                <Plus className="size-4" />
                Add First Session
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {(sessions as Session[]).map((session) => (
              <Card key={session._id} className="group">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{session.name}</CardTitle>
                        {session.hasTableSeating && (
                          <Badge variant="secondary" className="gap-1">
                            <TableIcon className="size-3" />
                            Table Seating
                          </Badge>
                        )}
                      </div>
                      {session.description && (
                        <CardDescription>{session.description}</CardDescription>
                      )}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => router.push(`/event/${eventId}/sessions/${session._id}`)}
                      >
                        <Users className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => handleEdit(session)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:text-destructive"
                        onClick={() => setDeletingSessionId(session._id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    {(session.startTime || session.endTime) && (
                      <div className="flex items-center gap-1">
                        <Clock className="size-4" />
                        {session.startTime && (
                          <>
                            {formatDate(session.startTime)} {formatTime(session.startTime)}
                          </>
                        )}
                        {session.startTime && session.endTime && ' - '}
                        {session.endTime && formatTime(session.endTime)}
                      </div>
                    )}
                    {session.room && (
                      <div className="flex items-center gap-1">
                        <MapPin className="size-4" />
                        {session.room.name}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Users className="size-4" />
                      {session.assignedCount} assigned
                      {session.maxCapacity && ` / ${session.maxCapacity} max`}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Session Dialog */}
      <Dialog
        open={isAddDialogOpen || editingSession !== null}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddDialogOpen(false)
            setEditingSession(null)
            resetForm()
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingSession ? 'Edit Session' : 'Add Session'}</DialogTitle>
              <DialogDescription>
                {editingSession
                  ? 'Update the session details.'
                  : 'Create a new session for your event.'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Opening Keynote, Workshop A, etc."
                  autoFocus
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What this session is about..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="room">Room</Label>
                <Select
                  value={formData.roomId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, roomId: value === 'none' ? '' : value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a room (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No room assigned</SelectItem>
                    {(rooms as Room[] | undefined)?.map((room) => (
                      <SelectItem key={room._id} value={room._id}>
                        {room.name}
                        {room.location && ` (${room.location})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {(!rooms || rooms.length === 0) && (
                  <p className="text-xs text-muted-foreground">
                    No rooms created yet.{' '}
                    <Button
                      variant="link"
                      className="p-0 h-auto text-xs"
                      onClick={() => router.push(`/event/${eventId}/rooms`)}
                    >
                      Add rooms first
                    </Button>
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxCapacity">Max Capacity</Label>
                <Input
                  id="maxCapacity"
                  type="number"
                  min={1}
                  value={formData.maxCapacity || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxCapacity: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  placeholder="Leave empty for no limit"
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="hasTableSeating">Table Seating</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable if this session uses assigned table seating
                  </p>
                </div>
                <Switch
                  id="hasTableSeating"
                  checked={formData.hasTableSeating}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, hasTableSeating: checked })
                  }
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false)
                  setEditingSession(null)
                  resetForm()
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!formData.name.trim() || isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : editingSession ? (
                  'Save Changes'
                ) : (
                  'Add Session'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deletingSessionId !== null} onOpenChange={(open) => !open && setDeletingSessionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Session?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all guest assignments for this session. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
