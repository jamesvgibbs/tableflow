"use client"

import { useMemo } from "react"
import { useParams } from "next/navigation"
import { useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { SeatherderLoading } from "@/components/seatherder-loading"
import { GuestPortalForm } from "./guest-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Calendar, CheckCircle2, XCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function GuestPortalPage() {
  const params = useParams()
  const token = params.token as string

  const data = useQuery(api.guests.getBySelfServiceToken, { token })

  // Memoize current time to avoid Date.now() during render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const now = useMemo(() => Date.now(), [])

  // Loading state
  if (data === undefined) {
    return <SeatherderLoading message="Finding your information..." />
  }

  // Invalid token
  if (data === null) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Link Not Found</CardTitle>
            <CardDescription>
              This link is invalid or has expired. Please contact the event organizer for a new link.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const { guest, event } = data

  // Check if deadline has passed
  const isDeadlinePassed = event.selfServiceDeadline
    ? now > new Date(event.selfServiceDeadline).getTime()
    : false

  // Check if deadline is approaching (within 24 hours)
  const isDeadlineApproaching = event.selfServiceDeadline
    ? !isDeadlinePassed && new Date(event.selfServiceDeadline).getTime() - now < 24 * 60 * 60 * 1000
    : false

  // Format deadline for display
  const formatDeadline = (deadline: string) => {
    return new Date(deadline).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }

  // Get RSVP badge
  const getRsvpBadge = () => {
    switch (guest.rsvpStatus) {
      case "confirmed":
        return (
          <Badge variant="default" className="gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Confirmed
          </Badge>
        )
      case "declined":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Declined
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary" className="gap-1">
            <Calendar className="h-3 w-3" />
            Pending
          </Badge>
        )
    }
  }

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto max-w-2xl py-8">
        {/* Event Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">{event.name}</h1>
          <p className="text-muted-foreground">
            Hello, {guest.name}. Update your details below.
          </p>
        </div>

        {/* Deadline Warning */}
        {isDeadlinePassed && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Changes Locked</AlertTitle>
            <AlertDescription>
              The deadline for changes has passed. Your information is now locked.
              Contact the organizer if you need to make changes.
            </AlertDescription>
          </Alert>
        )}

        {isDeadlineApproaching && !isDeadlinePassed && event.selfServiceDeadline && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Deadline Approaching</AlertTitle>
            <AlertDescription>
              Please make any changes before {formatDeadline(event.selfServiceDeadline)}.
            </AlertDescription>
          </Alert>
        )}

        {/* Guest Info Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Your Information</CardTitle>
              {getRsvpBadge()}
            </div>
            <CardDescription>
              Review and update your details for this event.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Read-only fields */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Name</label>
                <p className="text-lg">{guest.name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Contact the organizer to change your name.
                </p>
              </div>

              {guest.email && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-lg">{guest.email}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Contact the organizer to change your email.
                  </p>
                </div>
              )}

              {guest.tableNumber && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Table Assignment</label>
                  <p className="text-lg">Table {guest.tableNumber}</p>
                </div>
              )}

              {guest.checkedIn && (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="font-medium">Checked In</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Editable Form */}
        <GuestPortalForm
          token={token}
          initialPhone={guest.phone || ""}
          initialDietary={guest.dietary || { restrictions: [], notes: "" }}
          initialRsvpStatus={guest.rsvpStatus || "pending"}
          isReadOnly={isDeadlinePassed}
        />
      </div>
    </div>
  )
}
