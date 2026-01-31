'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import { Id } from '@convex/_generated/dataModel'
import Link from 'next/link'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Users,
} from 'lucide-react'
import QRCode from 'qrcode'
import { resolveThemeColors, ThemeColors, getDefaultTheme } from '@/lib/theme-presets'
import { DietaryBadges } from '@/components/dietary-badge'
import type { DietaryInfo } from '@/lib/types'
import { getTableLabel } from '@/lib/terminology'

// Types for search results from Convex
interface RoundAssignment {
  _id: Id<'guestRoundAssignments'>
  guestId: Id<'guests'>
  eventId: Id<'events'>
  roundNumber: number
  tableNumber: number
}

interface Guest {
  _id: Id<'guests'>
  eventId: Id<'events'>
  name: string
  department?: string
  email?: string
  phone?: string
  tableNumber?: number
  qrCodeId?: string
  checkedIn: boolean
  dietary?: DietaryInfo
}

interface Event {
  _id: Id<'events'>
  name: string
  tableSize: number
  createdAt: string
  isAssigned: boolean
  numberOfRounds?: number
  roundDuration?: number
  currentRound?: number
  roundStartedAt?: string
  isPaused?: boolean
  pausedTimeRemaining?: number
  themePreset?: string
  customColors?: {
    primary: string
    secondary: string
    accent: string
    background: string
    foreground: string
    muted: string
  }
  eventType?: string
  eventTypeSettings?: {
    guestLabel: string
    guestLabelPlural: string
    tableLabel: string
    tableLabelPlural: string
    departmentLabel: string
    departmentLabelPlural: string
    showRoundTimer: boolean
  }
}

interface SearchResult {
  guest: Guest
  event: Event | null
  roundAssignments: RoundAssignment[]
}

// WCAG 2.1 AA compliant contrast calculations
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
  const lum = getLuminance(background)
  return lum > 0.5 ? '#525252' : '#A3A3A3'
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

export default function CheckinPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [checkingInId, setCheckingInId] = useState<string | null>(null)
  const [selectedGuest, setSelectedGuest] = useState<SearchResult | null>(null)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null)
  const [isCheckInHovered, setIsCheckInHovered] = useState(false)
  const [isBackHovered, setIsBackHovered] = useState(false)

  // Search for guests by name
  const searchResults = useQuery(
    api.guests.searchByName,
    searchQuery.trim().length >= 2 ? { query: searchQuery.trim() } : 'skip'
  )

  // Check-in mutation
  const checkInMutation = useMutation(api.guests.checkIn)

  // Resolve theme colors for selected guest's event
  // Always returns valid colors - uses event theme or falls back to default
  const themeColors = useMemo<ThemeColors>(() => {
    if (!selectedGuest?.event) return getDefaultTheme()
    return resolveThemeColors(
      selectedGuest.event.themePreset,
      selectedGuest.event.customColors
    )
  }, [selectedGuest?.event])

  const handleCheckIn = async (guestId: string) => {
    setCheckingInId(guestId)
    try {
      await checkInMutation({ id: guestId as Id<'guests'> })
      toast.success('You are in. Welcome.')
      // Brief delay to show toast, then return to search screen
      setTimeout(() => {
        setSelectedGuest(null)
        setQrCodeDataUrl(null)
        setSearchQuery('')
      }, 1500)
    } catch {
      toast.error('I could not check you in.')
    } finally {
      setCheckingInId(null)
    }
  }

  const handleSelectGuest = async (result: SearchResult) => {
    setSelectedGuest(result)

    // Generate QR code for the guest
    if (result.guest.qrCodeId) {
      const baseUrl = window.location.origin
      const qrUrl = `${baseUrl}/scan/${result.guest.qrCodeId}`
      try {
        const dataUrl = await QRCode.toDataURL(qrUrl, {
          width: 200,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        })
        setQrCodeDataUrl(dataUrl)
      } catch {
        setQrCodeDataUrl(null)
      }
    }
  }

  const handleBack = () => {
    setSelectedGuest(null)
    setQrCodeDataUrl(null)
  }

  // Show selected guest detail with event theme
  if (selectedGuest) {
    const { guest, event, roundAssignments } = selectedGuest
    const hasMultipleRounds = roundAssignments && roundAssignments.length > 1
    const currentRound = event?.currentRound || 0

    // Create themed styles with WCAG-compliant colors
    // Always apply theming when viewing guest details
    const themedStyles = {
      background: { backgroundColor: themeColors.background },
      text: { color: getAccessibleTextColor(themeColors.background, themeColors.foreground) },
      textMuted: { color: getAccessibleMutedColor(themeColors.background) },
      primary: {
        backgroundColor: themeColors.primary,
        color: getAccessibleTextColor(themeColors.primary),
      },
      primaryHover: {
        backgroundColor: adjustBrightness(themeColors.primary, 0.85),
        color: getAccessibleTextColor(adjustBrightness(themeColors.primary, 0.85)),
      },
      secondary: {
        backgroundColor: themeColors.secondary,
        color: getAccessibleTextColor(themeColors.secondary),
      },
      cardText: { color: getAccessibleTextColor(themeColors.secondary) },
      cardTextMuted: { color: getAccessibleMutedColor(themeColors.secondary) },
      accent: {
        backgroundColor: themeColors.accent,
        color: getAccessibleTextColor(themeColors.accent),
      },
      muted: {
        backgroundColor: themeColors.muted,
        color: getAccessibleTextColor(themeColors.muted),
      },
      border: { borderColor: themeColors.muted },
      // Ghost button styles
      ghost: {
        color: getAccessibleTextColor(themeColors.background, themeColors.foreground),
        backgroundColor: 'transparent',
      },
      ghostHover: {
        color: getAccessibleTextColor(themeColors.background, themeColors.foreground),
        backgroundColor: `${getAccessibleTextColor(themeColors.background, themeColors.foreground)}15`,
      },
    }

    return (
      <div
        className="min-h-screen"
        style={themedStyles.background}
      >
        <div className="container mx-auto max-w-lg px-4 py-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="mb-6 gap-2 transition-colors"
            style={isBackHovered ? themedStyles.ghostHover : themedStyles.ghost}
            onMouseEnter={() => setIsBackHovered(true)}
            onMouseLeave={() => setIsBackHovered(false)}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to search
          </Button>

          <Card
            className="overflow-hidden border"
            style={{
              backgroundColor: themeColors.secondary,
              borderColor: themeColors.muted,
              color: themedStyles.cardText.color,
            }}
          >
            <CardHeader className="text-center space-y-4">
              <p
                className="text-sm"
                style={themedStyles.cardTextMuted}
              >
                {event?.name}
              </p>
              <CardTitle
                className="text-3xl"
                style={themedStyles.cardText}
              >
                {guest.name}
              </CardTitle>
              {guest.department && (
                <Badge
                  className="mx-auto"
                  style={themedStyles.accent}
                >
                  {guest.department}
                </Badge>
              )}
              {guest.dietary && (
                <div className="flex justify-center">
                  <DietaryBadges dietary={guest.dietary} compact={false} />
                </div>
              )}
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Table Assignment(s) */}
              {hasMultipleRounds ? (
                <div className="space-y-3">
                  <p
                    className="text-sm text-center uppercase tracking-wider font-medium"
                    style={themedStyles.cardTextMuted}
                  >
                    Your Seating Itinerary
                  </p>
                  <div className="space-y-2">
                    {roundAssignments.map((assignment) => {
                      const isCurrentRound = currentRound === assignment.roundNumber
                      const isPastRound = currentRound > assignment.roundNumber

                      // Calculate WCAG-compliant colors for this row
                      // Current round: light primary tint on card background
                      // Past/Future rounds: solid muted background
                      const rowBgColor = isCurrentRound
                        ? `${themeColors.primary}20`
                        : themeColors.muted

                      // Calculate text color against the ACTUAL row background
                      // Current round: calculate against card bg (since primary is semi-transparent)
                      // Other rounds: calculate against muted background (solid color)
                      const rowTextColor = isCurrentRound
                        ? getAccessibleTextColor(themeColors.secondary, themeColors.primary)
                        : getAccessibleTextColor(themeColors.muted)

                      return (
                        <div
                          key={assignment._id}
                          className="flex items-center justify-between p-3 rounded-lg border-2"
                          style={{
                            backgroundColor: rowBgColor,
                            borderColor: isCurrentRound ? themeColors.primary : themeColors.muted,
                            opacity: isPastRound ? 0.6 : 1,
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="text-sm font-medium"
                              style={{ color: rowTextColor }}
                            >
                              Round {assignment.roundNumber}
                            </span>
                            {isCurrentRound && (
                              <Badge style={themedStyles.primary}>
                                NOW
                              </Badge>
                            )}
                          </div>
                          <span
                            className="text-2xl font-bold"
                            style={{ color: rowTextColor }}
                          >
                            {getTableLabel(event)} {assignment.tableNumber}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div
                  className="py-6 px-4 rounded-lg border-2 text-center"
                  style={{
                    backgroundColor: `${themeColors.primary}10`,
                    borderColor: `${themeColors.primary}40`,
                  }}
                >
                  <p
                    className="text-sm mb-2 uppercase tracking-wider font-medium"
                    style={themedStyles.cardTextMuted}
                  >
                    Your {getTableLabel(event)}
                  </p>
                  <div
                    className="text-6xl font-bold"
                    style={{
                      color: getAccessibleTextColor(themeColors.secondary, themeColors.primary),
                    }}
                  >
                    {guest.tableNumber || '?'}
                  </div>
                </div>
              )}

              {/* QR Code */}
              {qrCodeDataUrl && (
                <div
                  className="flex flex-col items-center gap-2 p-6 rounded-lg"
                  style={themedStyles.muted}
                >
                  <p
                    className="text-sm mb-2"
                    style={{ color: getAccessibleMutedColor(themeColors.muted) }}
                  >
                    Scan this to find your seat
                  </p>
                  {/* eslint-disable-next-line @next/next/no-img-element -- QR codes are data URLs, not optimizable */}
                  <img
                    src={qrCodeDataUrl}
                    alt="QR Code"
                    className="w-56 h-56 rounded-lg bg-white p-2"
                  />
                </div>
              )}

              {/* Check-in Button/Status */}
              {guest.checkedIn ? (
                <div
                  className="flex items-center justify-center gap-2 py-4 rounded-lg"
                  style={{
                    backgroundColor: `${themeColors.primary}20`,
                    color: getAccessibleTextColor(themeColors.secondary, themeColors.primary),
                  }}
                >
                  <CheckCircle2 className="h-6 w-6" />
                  <span className="text-lg font-medium">You&apos;re Checked In</span>
                </div>
              ) : (
                <Button
                  size="lg"
                  className="w-full text-lg py-6 transition-colors"
                  onClick={() => handleCheckIn(guest._id)}
                  disabled={checkingInId === guest._id}
                  style={isCheckInHovered ? themedStyles.primaryHover : themedStyles.primary}
                  onMouseEnter={() => setIsCheckInHovered(true)}
                  onMouseLeave={() => setIsCheckInHovered(false)}
                >
                  {checkingInId === guest._id ? (
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
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto max-w-2xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1 mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>

          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">Find Your Seat</h1>
            <p className="text-muted-foreground">
              Type your name. I will show you where to sit.
            </p>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="What is your name?"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 py-6 text-lg"
            autoFocus
          />
        </div>

        {/* Search Results */}
        {searchQuery.trim().length < 2 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>Keep typing. I need at least 2 letters.</p>
          </div>
        ) : searchResults === undefined ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="mt-2 text-muted-foreground">Looking...</p>
          </div>
        ) : searchResults.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium mb-1">I cannot find you.</p>
            <p className="text-sm">Try spelling it differently, or ask the event organizer.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground mb-4">
              Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
            </p>
            {searchResults.map((result) => {
              const hasMultipleRounds = result.roundAssignments && result.roundAssignments.length > 1

              return (
                <Card
                  key={result.guest._id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleSelectGuest(result)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold truncate">{result.guest.name}</h3>
                          {result.guest.checkedIn && (
                            <Badge variant="default" className="bg-green-600 text-xs shrink-0">
                              Checked In
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{result.event?.name}</span>
                          {result.guest.department && (
                            <>
                              <span>•</span>
                              <span>{result.guest.department}</span>
                            </>
                          )}
                        </div>
                        {result.guest.dietary && (
                          <DietaryBadges dietary={result.guest.dietary} compact maxVisible={2} className="mt-1" />
                        )}
                        {/* Show table assignments */}
                        <div className="mt-2">
                          {hasMultipleRounds ? (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {result.roundAssignments.map((assignment, idx) => (
                                <span key={assignment._id} className="inline-flex items-center gap-0.5">
                                  <span className="px-1.5 py-0.5 rounded bg-primary/10 text-xs font-medium">
                                    R{assignment.roundNumber}:{assignment.tableNumber}
                                  </span>
                                  {idx < result.roundAssignments.length - 1 && (
                                    <span className="text-muted-foreground text-xs">→</span>
                                  )}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              {getTableLabel(result.event)} {result.guest.tableNumber}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
