'use client'

import * as React from 'react'
import { toast } from 'sonner'
import {
  Play,
  Pause,
  Square,
  ChevronDown,
  ExternalLink,
  Copy,
  Timer,
  AlertCircle,
  RotateCcw,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import type { ThemeColors } from '@/lib/theme-presets'
import type { ThemedStyles } from '@/lib/theme-utils'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface RoundManagementCardProps {
  eventId: string
  currentRound: number
  numberOfRounds: number
  roundStartedAt?: string | null
  roundDuration?: number | null
  isPaused: boolean
  timeRemaining: number
  minutes: number
  seconds: number
  isExpired: boolean
  isWarning: boolean
  selectedRound: number
  onSelectedRoundChange: (round: number) => void
  onStartNextRound: () => Promise<void>
  onEndCurrentRound: () => Promise<void>
  onPauseRound: () => Promise<void>
  onResumeRound: () => Promise<void>
  onResetRounds: () => Promise<void>
  onUpdateRoundDuration: (duration: number | undefined) => Promise<void>
  themeColors?: ThemeColors
  themedStyles?: ThemedStyles | null
  baseUrl: string
}

export function RoundManagementCard({
  eventId,
  currentRound,
  numberOfRounds,
  roundStartedAt,
  roundDuration,
  isPaused,
  timeRemaining,
  minutes,
  seconds,
  isExpired,
  isWarning,
  selectedRound,
  onSelectedRoundChange,
  onStartNextRound,
  onEndCurrentRound,
  onPauseRound,
  onResumeRound,
  onResetRounds,
  onUpdateRoundDuration,
  themeColors,
  themedStyles,
  baseUrl,
}: RoundManagementCardProps) {
  const [hoveredButton, setHoveredButton] = React.useState<string | null>(null)
  const [localDuration, setLocalDuration] = React.useState<number | undefined>(roundDuration ?? undefined)

  // Sync local duration with prop
  React.useEffect(() => {
    setLocalDuration(roundDuration ?? undefined)
  }, [roundDuration])

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value)
    const newDuration = val > 0 ? val : undefined
    setLocalDuration(newDuration)
    onUpdateRoundDuration(newDuration)
  }

  return (
    <Card
      className={cn(
        'mb-6 transition-colors',
        !themedStyles && isExpired && 'border-amber-500 bg-amber-50 dark:bg-amber-950/30',
        !themedStyles && isWarning && 'border-orange-400 bg-orange-50 dark:bg-orange-950/30'
      )}
      style={themedStyles && !isExpired && !isWarning ? themedStyles.card : undefined}
    >
      <CardContent className="p-6">
        {/* Main Timer Display */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span
              className="text-sm uppercase tracking-wider"
              style={themedStyles?.cardTextMuted}
            >
              Round {currentRound || 0} of {numberOfRounds || 1}
            </span>
            {currentRound && currentRound > 0 && isPaused && (
              <Badge className="bg-blue-600 text-white">Pawsed 🐾</Badge>
            )}
            {currentRound && currentRound > 0 && roundStartedAt && !isPaused && (
              <Badge
                variant={isExpired ? 'destructive' : 'outline'}
                className={!isExpired && themedStyles ? 'border-0' : ''}
                style={!isExpired && themedStyles ? themedStyles.badgeOnCard : undefined}
              >
                {isExpired ? "TIME'S UP" : 'Active'}
              </Badge>
            )}
            {(!currentRound || currentRound === 0) && (
              <Badge
                variant="outline"
                className={themedStyles ? 'border-0' : ''}
                style={themedStyles ? { backgroundColor: `${themeColors?.muted}80`, color: themedStyles.cardText.color } : undefined}
              >
                Not Started
              </Badge>
            )}
          </div>

          {currentRound && currentRound > 0 && (roundStartedAt || isPaused) ? (
            roundDuration ? (
              <div className="space-y-2">
                <div
                  className={cn(
                    'text-7xl sm:text-8xl font-mono font-bold tabular-nums leading-none py-4',
                    isExpired ? 'text-amber-600' : isPaused ? 'text-blue-600' : isWarning ? 'text-orange-600 animate-pulse' : ''
                  )}
                  style={!isExpired && !isPaused && !isWarning && themedStyles ? themedStyles.cardText : undefined}
                >
                  {isExpired ? (
                    <span className="flex items-center justify-center gap-3">
                      <AlertCircle className="size-12" />
                      TIME&apos;S UP
                    </span>
                  ) : (
                    `${minutes}:${seconds.toString().padStart(2, '0')}`
                  )}
                </div>
                {isPaused && (
                  <div className="text-lg font-bold text-blue-600 uppercase tracking-widest animate-pulse">
                    PAWSED
                  </div>
                )}
              </div>
            ) : (
              <div className="text-4xl font-medium py-4" style={themedStyles?.cardTextMuted}>
                No time limit set
              </div>
            )
          ) : (
            <div className="text-4xl font-medium py-4" style={themedStyles?.cardTextMuted}>
              Waiting to start...
            </div>
          )}

          {/* Progress bar */}
          {roundDuration && currentRound && currentRound > 0 && (roundStartedAt || isPaused) && (
            <div
              className="w-full max-w-md mx-auto h-2 rounded-full overflow-hidden"
              style={themedStyles ? { backgroundColor: `${themedStyles.cardTextMuted.color}20` } : { backgroundColor: 'var(--muted)' }}
            >
              <div
                className={cn(
                  'h-full transition-all duration-1000',
                  !themedStyles && (isExpired ? 'bg-amber-500' : isPaused ? 'bg-blue-500' : isWarning ? 'bg-orange-500' : 'bg-primary')
                )}
                style={{
                  width: `${(timeRemaining / (roundDuration * 60 * 1000)) * 100}%`,
                  backgroundColor: isExpired ? '#f59e0b' : isPaused ? '#3b82f6' : isWarning ? '#f97316' : themedStyles ? themeColors?.primary : undefined,
                }}
              />
            </div>
          )}
        </div>

        {/* Duration Setting */}
        {!roundStartedAt && (
          <div className="flex items-center justify-center gap-3 mb-6">
            <Label htmlFor="duration-input" className="text-sm" style={themedStyles?.cardTextMuted}>
              Round Duration:
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="duration-input"
                type="number"
                min={1}
                max={180}
                value={localDuration || ''}
                onChange={handleDurationChange}
                placeholder="No limit"
                className="w-24 text-center"
                style={themedStyles?.input}
              />
              <span className="text-sm" style={themedStyles?.cardTextMuted}>minutes</span>
            </div>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
          {(currentRound || 0) < (numberOfRounds || 1) && (
            <Button
              onClick={onStartNextRound}
              size="lg"
              className="gap-2 transition-colors"
              style={themedStyles
                ? hoveredButton === 'startRound'
                  ? themedStyles.primaryButtonHover
                  : themedStyles.primaryButton
                : undefined
              }
              onMouseEnter={() => setHoveredButton('startRound')}
              onMouseLeave={() => setHoveredButton(null)}
            >
              <Play className="size-5" />
              {!currentRound || currentRound === 0
                ? 'Start Round 1'
                : !roundStartedAt
                ? `Start Round ${(currentRound || 0) + 1}`
                : `Start Round ${(currentRound || 0) + 1}`}
            </Button>
          )}

          {currentRound && currentRound > 0 && roundDuration && (roundStartedAt || isPaused) && (
            isPaused ? (
              <Button
                onClick={onResumeRound}
                variant="default"
                size="lg"
                className="gap-2 transition-colors"
                style={themedStyles
                  ? hoveredButton === 'resume'
                    ? themedStyles.primaryButtonHover
                    : themedStyles.primaryButton
                  : undefined
                }
                onMouseEnter={() => setHoveredButton('resume')}
                onMouseLeave={() => setHoveredButton(null)}
              >
                <Play className="size-5" />
                Resume
              </Button>
            ) : (
              <Button
                onClick={onPauseRound}
                variant="outline"
                size="lg"
                className="gap-2 transition-colors"
                style={themedStyles
                  ? hoveredButton === 'pause'
                    ? themedStyles.outlineButtonOnCardHover
                    : themedStyles.outlineButtonOnCard
                  : undefined
                }
                onMouseEnter={() => setHoveredButton('pause')}
                onMouseLeave={() => setHoveredButton(null)}
              >
                <Pause className="size-5" />
                Paws
              </Button>
            )
          )}

          {currentRound && currentRound > 0 && (roundStartedAt || isPaused) && (
            <Button
              onClick={onEndCurrentRound}
              variant="outline"
              size="lg"
              className="gap-2 transition-colors"
              style={themedStyles
                ? hoveredButton === 'endRound'
                  ? themedStyles.outlineButtonOnCardHover
                  : themedStyles.outlineButtonOnCard
                : undefined
              }
              onMouseEnter={() => setHoveredButton('endRound')}
              onMouseLeave={() => setHoveredButton(null)}
            >
              <Square className="size-5" />
              End Round {currentRound}
            </Button>
          )}

          {currentRound === numberOfRounds && !roundStartedAt && (
            <Badge
              variant="secondary"
              className="text-base px-4 py-2"
              style={themedStyles ? { backgroundColor: `${themeColors?.muted}60`, color: themedStyles.cardText.color } : undefined}
            >
              All rounds complete
            </Badge>
          )}
        </div>

        {/* Round Selector & Timer Links */}
        <div
          className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t"
          style={themedStyles?.divider}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm" style={themedStyles?.cardTextMuted}>View:</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 transition-colors"
                  style={themedStyles
                    ? hoveredButton === 'roundSelect'
                      ? themedStyles.outlineButtonOnCardHover
                      : themedStyles.outlineButtonOnCard
                    : undefined
                  }
                  onMouseEnter={() => setHoveredButton('roundSelect')}
                  onMouseLeave={() => setHoveredButton(null)}
                >
                  Round {selectedRound}
                  <ChevronDown className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {Array.from({ length: numberOfRounds || 1 }, (_, i) => (
                  <DropdownMenuItem
                    key={i + 1}
                    onClick={() => onSelectedRoundChange(i + 1)}
                    className={cn(selectedRound === i + 1 && 'bg-accent')}
                  >
                    Round {i + 1}
                    {currentRound === i + 1 && (
                      <Badge
                        variant="outline"
                        className="ml-2 text-xs border-0"
                        style={themedStyles ? themedStyles.badgeOnCard : undefined}
                      >
                        Active
                      </Badge>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 transition-colors"
              onClick={() => window.open(`${baseUrl}/timer/${eventId}`, '_blank')}
              style={themedStyles
                ? hoveredButton === 'openTimer'
                  ? themedStyles.outlineButtonOnCardHover
                  : themedStyles.outlineButtonOnCard
                : undefined
              }
              onMouseEnter={() => setHoveredButton('openTimer')}
              onMouseLeave={() => setHoveredButton(null)}
            >
              <Timer className="size-4" />
              Open Timer
              <ExternalLink className="size-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 transition-colors"
              onClick={() => {
                navigator.clipboard.writeText(`${baseUrl}/timer/${eventId}`)
                toast.success('Copied.')
              }}
              style={themedStyles?.cardTextMuted}
            >
              <Copy className="size-4" />
              Copy Link
            </Button>
            {(currentRound || 0) > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 hover:text-destructive transition-colors"
                onClick={onResetRounds}
                style={themedStyles?.cardTextMuted}
              >
                <RotateCcw className="size-4" />
                Reset Rounds
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
