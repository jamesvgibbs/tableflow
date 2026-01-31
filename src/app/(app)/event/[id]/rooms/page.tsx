'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import {
  Plus,
  Pencil,
  Trash2,
  MapPin,
  Users,
  Calendar,
  Loader2,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { SeatherderLoading } from '@/components/seatherder-loading'

interface PageProps {
  params: Promise<{ id: string }>
}

interface RoomFormData {
  name: string
  capacity?: number
  location?: string
  description?: string
}

// Room type for when Convex types aren't regenerated yet
interface Room {
  _id: Id<'rooms'>
  eventId: Id<'events'>
  name: string
  capacity?: number
  location?: string
  description?: string
  sessionCount?: number
}

export default function RoomsPage({ params }: PageProps) {
  const router = useRouter()
  const resolvedParams = React.use(params)
  const eventId = resolvedParams.id as Id<'events'>

  // State
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false)
  const [editingRoom, setEditingRoom] = React.useState<{
    _id: Id<'rooms'>
    name: string
    capacity?: number
    location?: string
    description?: string
  } | null>(null)
  const [deletingRoomId, setDeletingRoomId] = React.useState<Id<'rooms'> | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Form state
  const [formData, setFormData] = React.useState<RoomFormData>({
    name: '',
    capacity: undefined,
    location: '',
    description: '',
  })

  // Queries
  const event = useQuery(api.events.get, { id: eventId })
  const rooms = useQuery(api.rooms.getByEvent, { eventId })

  // Mutations
  const createRoom = useMutation(api.rooms.create)
  const updateRoom = useMutation(api.rooms.update)
  const deleteRoom = useMutation(api.rooms.remove)

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      capacity: undefined,
      location: '',
      description: '',
    })
  }

  // Open edit dialog
  const handleEdit = (room: typeof editingRoom) => {
    if (!room) return
    setFormData({
      name: room.name,
      capacity: room.capacity,
      location: room.location || '',
      description: room.description || '',
    })
    setEditingRoom(room)
  }

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    setIsSubmitting(true)
    try {
      if (editingRoom) {
        await updateRoom({
          id: editingRoom._id,
          name: formData.name.trim(),
          capacity: formData.capacity || undefined,
          location: formData.location?.trim() || undefined,
          description: formData.description?.trim() || undefined,
        })
        toast.success(`Updated ${formData.name}.`)
        setEditingRoom(null)
      } else {
        await createRoom({
          eventId,
          name: formData.name.trim(),
          capacity: formData.capacity || undefined,
          location: formData.location?.trim() || undefined,
          description: formData.description?.trim() || undefined,
        })
        toast.success(`Added ${formData.name}.`)
        setIsAddDialogOpen(false)
      }
      resetForm()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save room')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle delete
  const handleDelete = async () => {
    if (!deletingRoomId) return

    setIsSubmitting(true)
    try {
      await deleteRoom({ id: deletingRoomId })
      toast.success('Room deleted.')
      setDeletingRoomId(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete room')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Loading state
  if (event === undefined) {
    return <SeatherderLoading message="I am fetching rooms..." />
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
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="bg-background">
      <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-4xl">
        {/* Header */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Rooms</h1>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
              <Plus className="size-4" />
              Add Room
            </Button>
          </div>
        </div>

        {/* Rooms List */}
        {rooms === undefined ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-5 bg-muted rounded w-32" />
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-muted rounded w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MapPin className="size-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-medium mb-2">No rooms yet</h3>
              <p className="text-muted-foreground mb-4">
                Add rooms to organize your breakout sessions and workshops.
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
                <Plus className="size-4" />
                Add First Room
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {(rooms as Room[]).map((room) => (
              <Card key={room._id} className="group">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{room.name}</CardTitle>
                      {room.location && (
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <MapPin className="size-3" />
                          {room.location}
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => handleEdit(room)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:text-destructive"
                        onClick={() => setDeletingRoomId(room._id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {room.capacity && (
                      <div className="flex items-center gap-1">
                        <Users className="size-4" />
                        {room.capacity} capacity
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="size-4" />
                      {room.sessionCount} session{room.sessionCount !== 1 ? 's' : ''}
                    </div>
                  </div>
                  {room.description && (
                    <p className="text-sm text-muted-foreground mt-2">{room.description}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Room Dialog */}
      <Dialog
        open={isAddDialogOpen || editingRoom !== null}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddDialogOpen(false)
            setEditingRoom(null)
            resetForm()
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingRoom ? 'Edit Room' : 'Add Room'}</DialogTitle>
              <DialogDescription>
                {editingRoom
                  ? 'Update the room details.'
                  : 'Add a new room for breakout sessions.'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Main Hall, Room A, etc."
                  autoFocus
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  min={1}
                  value={formData.capacity || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      capacity: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  placeholder="Maximum number of people"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Building 2, Floor 3"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Additional details about this room..."
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false)
                  setEditingRoom(null)
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
                ) : editingRoom ? (
                  'Save Changes'
                ) : (
                  'Add Room'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deletingRoomId !== null} onOpenChange={(open) => !open && setDeletingRoomId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Room?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the room from all assigned sessions. Sessions will not be deleted,
              but they will no longer have a room assignment.
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
