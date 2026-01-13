'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import { Id } from '@convex/_generated/dataModel'
import { ProtectedRoute } from '@/components/protected-route'
import { useAuth } from '@/components/auth-provider'
import { generateEventName } from '@/lib/event-names'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Plus, Trash2, Table as TableIcon, Calendar, LogOut, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

function AdminDashboard() {
  const router = useRouter()
  const { logout } = useAuth()

  // Delete dialog state
  const [deleteDialogEvent, setDeleteDialogEvent] = useState<{ id: string; name: string } | null>(null)

  // Convex queries and mutations
  const events = useQuery(api.events.list)
  const createEvent = useMutation(api.events.create)
  const deleteEventMutation = useMutation(api.events.remove)

  const handleCreateNewEvent = async () => {
    try {
      const eventId = await createEvent({
        name: generateEventName(),
        tableSize: 8,
      })
      toast.success('Event created successfully')
      router.push(`/event/${eventId}`)
    } catch {
      toast.error('Failed to create event')
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
      toast.success('Event deleted successfully')
    } catch {
      toast.error('Failed to delete event')
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <div className="container mx-auto max-w-4xl px-4 py-12">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto max-w-4xl px-4 py-12">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
          <Button variant="outline" size="sm" onClick={logout} className="gap-2">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>

        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="text-lg text-muted-foreground">
            Manage your events and table assignments
          </p>
        </div>

        {/* Create New Event Button */}
        <div className="flex justify-center mb-8 animate-slide-up">
          <Button
            size="lg"
            onClick={handleCreateNewEvent}
            className="gap-2 shadow-lg hover:shadow-xl transition-shadow"
          >
            <Plus className="h-5 w-5" />
            Create New Event
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
                <p className="text-lg font-medium mb-2">No events yet</p>
                <p className="text-sm text-muted-foreground">
                  Create your first event to get started.
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
              <DialogTitle>Delete Event?</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete &quot;{deleteDialogEvent?.name}&quot;? This action cannot be undone.
                All guests, table assignments, and event data will be permanently removed.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogEvent(null)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                Delete Event
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default function AdminPage() {
  return (
    <ProtectedRoute>
      <AdminDashboard />
    </ProtectedRoute>
  )
}
