'use client'

import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Download, QrCode, ChevronDown, ChevronUp, CheckCircle2, Pencil } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Guest, GuestRoundAssignment } from '@/lib/types'
import { downloadQrCode } from '@/lib/qr-download'
import { cn } from '@/lib/utils'
import { ThemeColors } from '@/lib/theme-presets'

// WCAG contrast calculation
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

function getAccessibleTextColor(background: string): string {
  const blackRatio = getContrastRatio(background, '#000000')
  const whiteRatio = getContrastRatio(background, '#FFFFFF')
  return blackRatio > whiteRatio ? '#000000' : '#FFFFFF'
}

function getAccessibleMutedColor(background: string): string {
  const bgLuminance = getLuminance(background)
  return bgLuminance > 0.5 ? '#666666' : '#999999'
}

export interface GuestCardProps {
  guest: Guest
  eventName: string
  baseUrl: string
  roundAssignments?: GuestRoundAssignment[]
  onDownload?: () => void
  onEdit?: () => void
  themeColors?: ThemeColors
}

export function GuestCard({
  guest,
  eventName,
  baseUrl,
  roundAssignments,
  onDownload,
  onEdit,
  themeColors
}: GuestCardProps) {
  const [showQr, setShowQr] = useState(false)
  const [isDownloadHovered, setIsDownloadHovered] = useState(false)
  const qrUrl = `${baseUrl}/scan/${guest.qrCodeId}`
  const hasMultipleRounds = roundAssignments && roundAssignments.length > 1

  // Theme-aware styles
  const cardBg = themeColors?.secondary
  const cardText = themeColors ? getAccessibleTextColor(themeColors.secondary) : undefined
  const cardTextMuted = themeColors ? getAccessibleMutedColor(themeColors.secondary) : undefined
  const accentBg = themeColors?.accent
  const primaryBg = themeColors?.primary
  const primaryText = themeColors ? getAccessibleTextColor(themeColors.primary) : undefined
  const successColor = themeColors ? themeColors.primary : '#22c55e'

  const handleDownload = async () => {
    if (!guest.qrCodeId) {
      console.error('Guest does not have a QR code ID')
      return
    }

    await downloadQrCode({
      type: 'guest',
      qrCodeId: guest.qrCodeId,
      eventName,
      guestName: guest.name,
      department: guest.department,
      baseUrl
    })

    onDownload?.()
  }

  if (!guest.qrCodeId) {
    return (
      <Card
        className="w-full max-w-md"
        style={themeColors ? {
          backgroundColor: cardBg,
          borderColor: `${themeColors.muted}60`,
        } : undefined}
      >
        <CardContent className="p-6">
          <p
            className={cn("text-sm text-center", !themeColors && "text-muted-foreground")}
            style={themeColors ? { color: cardTextMuted } : undefined}
          >
            QR code not available. Please assign tables first.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      className="w-full max-w-md overflow-hidden transition-all duration-200 hover:shadow-lg group"
      style={themeColors ? {
        backgroundColor: cardBg,
        borderColor: `${themeColors.muted}60`,
      } : undefined}
    >
      {/* Colored header bar based on theme accent */}
      <div
        className={cn("h-2", !themeColors && "bg-primary")}
        style={themeColors ? { backgroundColor: accentBg } : undefined}
      />

      <CardContent className="p-5">
        {/* Guest info and table number in a compact layout */}
        <div className="flex items-start justify-between gap-4">
          {/* Left side: Guest details */}
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <h3
                className={cn("text-lg font-semibold truncate", !themeColors && "text-foreground")}
                style={themeColors ? { color: cardText } : undefined}
              >
                {guest.name}
              </h3>
              {onEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onEdit}
                  className="size-7 shrink-0 opacity-60 hover:opacity-100 transition-opacity"
                  style={themeColors ? { color: cardText } : undefined}
                >
                  <Pencil className="size-3.5" />
                </Button>
              )}
              {guest.checkedIn && (
                <Badge
                  variant="outline"
                  className={cn("text-xs shrink-0 gap-1", !themeColors && "bg-green-600 text-white border-0")}
                  style={themeColors ? {
                    backgroundColor: successColor,
                    color: getAccessibleTextColor(successColor),
                    border: 'none',
                  } : undefined}
                >
                  <CheckCircle2 className="size-3" />
                  Checked In
                </Badge>
              )}
            </div>
            {guest.department && (
              <span
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                style={themeColors ? {
                  backgroundColor: `${accentBg}20`,
                  color: cardText,
                  border: `1px solid ${accentBg}40`,
                } : {
                  backgroundColor: 'hsl(var(--accent) / 0.2)',
                  color: 'hsl(var(--foreground))',
                  border: '1px solid hsl(var(--accent) / 0.4)',
                }}
              >
                {guest.department}
              </span>
            )}
            <p
              className={cn("text-xs truncate", !themeColors && "text-muted-foreground")}
              style={themeColors ? { color: cardTextMuted } : undefined}
            >
              {eventName}
            </p>
          </div>

          {/* Right side: Table number(s) */}
          {hasMultipleRounds ? (
            // Multi-round compact display: R1:5 → R2:12 → R3:3
            <div className="flex flex-col items-end gap-1">
              <span
                className={cn("text-[0.65rem] uppercase tracking-wider font-medium", !themeColors && "text-muted-foreground")}
                style={themeColors ? { color: cardTextMuted } : undefined}
              >
                Tables
              </span>
              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                {roundAssignments.map((assignment, idx) => (
                  <div key={assignment.id} className="flex items-center gap-1.5">
                    <div
                      className="px-2 py-1 rounded-md"
                      style={themeColors ? {
                        backgroundColor: `${primaryBg}15`,
                        border: `1px solid ${primaryBg}30`,
                      } : {
                        backgroundColor: 'hsl(var(--primary) / 0.1)',
                        border: '1px solid hsl(var(--primary) / 0.2)',
                      }}
                    >
                      <span
                        className="text-[0.65rem]"
                        style={themeColors ? { color: cardTextMuted } : { color: 'hsl(var(--muted-foreground))' }}
                      >
                        R{assignment.roundNumber}:
                      </span>
                      <span
                        className="text-sm font-bold ml-0.5"
                        style={themeColors ? { color: primaryBg } : { color: 'hsl(var(--primary))' }}
                      >
                        {assignment.tableNumber}
                      </span>
                    </div>
                    {idx < roundAssignments.length - 1 && (
                      <span
                        className="text-xs"
                        style={themeColors ? { color: cardTextMuted } : { color: 'hsl(var(--muted-foreground))' }}
                      >
                        →
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Single round: THE STAR OF THE SHOW
            <div className="flex flex-col items-center">
              <span
                className={cn("text-[0.65rem] uppercase tracking-wider font-medium", !themeColors && "text-muted-foreground")}
                style={themeColors ? { color: cardTextMuted } : undefined}
              >
                Table
              </span>
              <div className="relative">
                <div
                  className={cn(
                    "w-16 h-16 rounded-xl flex items-center justify-center shadow-md",
                    !themeColors && "bg-gradient-to-br from-primary to-primary/80"
                  )}
                  style={themeColors ? { backgroundColor: primaryBg } : undefined}
                >
                  <span
                    className={cn("text-3xl font-bold", !themeColors && "text-primary-foreground")}
                    style={themeColors ? { color: primaryText } : undefined}
                  >
                    {guest.tableNumber || '?'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Expandable QR section */}
        <div
          className="mt-4 pt-4 border-t"
          style={themeColors ? { borderColor: `${cardTextMuted}30` } : undefined}
        >
          <button
            onClick={() => setShowQr(!showQr)}
            className="w-full flex items-center justify-between text-sm transition-colors"
            style={themeColors ? { color: cardTextMuted } : undefined}
          >
            <span className="flex items-center gap-2">
              <QrCode className="size-4" />
              {showQr ? 'Hide QR Code' : 'Show QR Code'}
            </span>
            {showQr ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>

          {/* Collapsible QR code */}
          <div className={cn(
            "grid transition-all duration-300 ease-in-out",
            showQr ? "grid-rows-[1fr] opacity-100 mt-4" : "grid-rows-[0fr] opacity-0"
          )}>
            <div className="overflow-hidden">
              <div className="flex flex-col items-center gap-3">
                <div className="bg-white p-3 rounded-lg border shadow-sm">
                  <QRCodeSVG
                    value={qrUrl}
                    size={140}
                    level="H"
                    includeMargin={false}
                  />
                </div>
                <Button
                  onClick={handleDownload}
                  variant="outline"
                  size="sm"
                  className="w-full transition-colors"
                  style={themeColors ? {
                    backgroundColor: isDownloadHovered ? `${cardText}10` : 'transparent',
                    color: cardText,
                    borderColor: `${cardText}40`,
                  } : undefined}
                  onMouseEnter={() => setIsDownloadHovered(true)}
                  onMouseLeave={() => setIsDownloadHovered(false)}
                >
                  <Download className="size-3.5" />
                  Download Card
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
