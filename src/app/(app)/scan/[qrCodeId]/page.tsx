'use client'

import { useEffect, useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import { Id } from '@convex/_generated/dataModel'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, UserCircle, Users, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { DietaryBadges } from '@/components/dietary-badge'
import { getTableLabel, getGuestLabelPlural } from '@/lib/terminology'

interface ScanPageProps {
  params: Promise<{ qrCodeId: string }>
}

export default function ScanPage({ params }: ScanPageProps) {
  const [qrCodeId, setQrCodeId] = useState<string | null>(null)
  const [isCheckingIn, setIsCheckingIn] = useState(false)

  // Unwrap params promise
  useEffect(() => {
    params.then((p) => setQrCodeId(p.qrCodeId))
  }, [params])

  // Query for guest by QR code
  const guestResult = useQuery(
    api.guests.getByQrCodeId,
    qrCodeId ? { qrCodeId } : 'skip'
  )

  // Query for table by QR code
  const tableResult = useQuery(
    api.tables.getByQrCodeId,
    qrCodeId ? { qrCodeId } : 'skip'
  )

  // Check-in mutation
  const checkInMutation = useMutation(api.guests.checkIn)

  const handleCheckIn = async (guestId: string) => {
    setIsCheckingIn(true)
    try {
      await checkInMutation({ id: guestId as Id<'guests'> })
      toast.success('You are in. Welcome.')
    } catch {
      toast.error('I could not check you in.')
    } finally {
      setIsCheckingIn(false)
    }
  }

  // Loading state
  if (!qrCodeId || (guestResult === undefined && tableResult === undefined)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted/20">
        <Card className="w-full max-w-lg">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg text-muted-foreground">Let me find your seat...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Not found state
  if (guestResult === null && tableResult === null) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted/20">
        <Card className="w-full max-w-lg border-destructive/50">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <UserCircle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl">I cannot find this code</CardTitle>
            <CardDescription className="text-base mt-2">
              This code is not in my system. It may be old, or the event was removed.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Guest QR code - show their table assignment
  if (guestResult?.guest) {
    const { event, guest, roundAssignments } = guestResult
    const hasMultipleRounds = roundAssignments && roundAssignments.length > 1
    const currentRound = event?.currentRound || 0

    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted/20">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center space-y-6 pb-8">
            <div>
              <p className="text-sm text-muted-foreground mb-2">{event?.name}</p>
              <CardTitle className="text-3xl mb-3">{guest.name}</CardTitle>
              {guest.department && (
                <Badge variant="secondary" className="text-sm px-3 py-1">
                  {guest.department}
                </Badge>
              )}
              {guest.dietary && (
                <div className="flex justify-center mt-2">
                  <DietaryBadges dietary={guest.dietary} compact={false} />
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="text-center space-y-6">
            {/* Multi-round itinerary view */}
            {hasMultipleRounds ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground uppercase tracking-wider font-medium">
                  Your Seating Itinerary
                </p>
                <div className="space-y-2">
                  {roundAssignments.map((assignment) => {
                    const isCurrentRound = currentRound === assignment.roundNumber
                    const isPastRound = currentRound > assignment.roundNumber

                    return (
                      <div
                        key={assignment._id}
                        className={`relative flex items-center justify-between p-4 rounded-lg border-2 transition-colors ${
                          isCurrentRound
                            ? 'border-primary bg-primary/10'
                            : isPastRound
                            ? 'border-muted bg-muted/30 opacity-60'
                            : 'border-muted bg-muted/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`text-sm font-medium ${
                            isCurrentRound ? 'text-primary' : 'text-muted-foreground'
                          }`}>
                            Round {assignment.roundNumber}
                          </span>
                          {isCurrentRound && (
                            <Badge variant="default" className="text-xs">
                              NOW
                            </Badge>
                          )}
                        </div>
                        <div className={`text-3xl font-bold ${
                          isCurrentRound ? 'text-primary' : 'text-foreground'
                        }`}>
                          {getTableLabel(event)} {assignment.tableNumber}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              // Single round view
              <div className="py-8 px-4 bg-primary/5 rounded-lg border-2 border-primary/20">
                <p className="text-sm text-muted-foreground mb-2 uppercase tracking-wider font-medium">
                  Your Seating Assignment
                </p>
                <div className="text-[8rem] leading-none font-bold text-primary">
                  {guest.tableNumber || '?'}
                </div>
                <p className="text-lg text-muted-foreground mt-2">
                  {getTableLabel(event)} {guest.tableNumber || 'Unassigned'}
                </p>
              </div>
            )}

            {/* Check-in section */}
            {guest.checkedIn ? (
              <div className="flex items-center justify-center gap-2 text-green-600 bg-green-50 dark:bg-green-950/30 py-4 rounded-lg">
                <CheckCircle2 className="h-6 w-6" />
                <span className="text-lg font-medium">You&apos;re Checked In</span>
              </div>
            ) : (
              <Button
                size="lg"
                className="w-full text-lg py-6"
                onClick={() => handleCheckIn(guest._id)}
                disabled={isCheckingIn}
              >
                {isCheckingIn ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Checking In...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-5 w-5" />
                    Check In
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Table QR code - show guests at this table
  if (tableResult?.table) {
    const { event, table } = tableResult
    const checkedInCount = table.guests.filter(g => g.checkedIn).length

    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted/20">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center pb-6">
            <p className="text-sm text-muted-foreground mb-2">{event?.name}</p>
            <CardTitle className="text-4xl">{getTableLabel(event)} {table.tableNumber}</CardTitle>
            <CardDescription className="text-base mt-2 flex items-center justify-center gap-2">
              <Users className="h-4 w-4" />
              <span>{checkedInCount}/{table.guests.length} Checked In</span>
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
                {getGuestLabelPlural(event)} at this {getTableLabel(event).toLowerCase()}
              </p>
              <div className="space-y-2">
                {table.guests.map((guest) => (
                  <div
                    key={guest._id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {guest.checkedIn ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <UserCircle className="h-5 w-5 text-muted-foreground" />
                      )}
                      <span className="font-medium">{guest.name}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      {guest.dietary && (
                        <DietaryBadges dietary={guest.dietary} compact maxVisible={1} />
                      )}
                      {guest.department && (
                        <Badge variant="outline" className="text-xs">
                          {guest.department}
                        </Badge>
                      )}
                      {guest.checkedIn && (
                        <Badge variant="default" className="bg-green-600 text-xs">
                          Checked In
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Fallback - should never reach here
  return null
}
