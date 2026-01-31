'use client'

import * as React from 'react'
import { Minimize } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { ThemeColors } from '@/lib/theme-presets'
import { EventThemeProvider } from '@/components/event-theme-provider'
import { Button } from '@/components/ui/button'

interface PresentationModeProps {
  eventName: string
  themePreset?: string
  customColors?: ThemeColors
  themeColors?: ThemeColors
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
  checkedIn: number
  total: number
  onExit: () => void
}

export function PresentationMode({
  eventName,
  themePreset,
  customColors,
  themeColors,
  currentRound,
  numberOfRounds,
  roundStartedAt,
  roundDuration,
  isPaused,
  minutes,
  seconds,
  isExpired,
  isWarning,
  checkedIn,
  total,
  onExit,
}: PresentationModeProps) {
  return (
    <EventThemeProvider themePreset={themePreset} customColors={customColors}>
      <div
        className={cn(
          'min-h-screen flex flex-col items-center justify-center p-8 transition-colors duration-500',
          isExpired ? 'bg-amber-600' : isPaused ? 'bg-blue-700' : isWarning ? 'bg-orange-600' : 'bg-[var(--event-background,#000)]'
        )}
        style={themeColors && !isExpired && !isPaused && !isWarning ? { backgroundColor: themeColors.background } : undefined}
      >
        {/* Exit presentation button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onExit}
          className="absolute top-4 right-4 text-white/70 hover:text-white hover:bg-white/10"
        >
          <Minimize className="size-5" />
        </Button>

        {/* Event name */}
        <div className="absolute top-4 left-4">
          <h1
            className="text-lg sm:text-xl font-medium"
            style={{ color: themeColors?.foreground || '#fff' }}
          >
            {eventName}
          </h1>
        </div>

        {/* Timer Display */}
        <div className="text-center">
          <p
            className="text-xl sm:text-2xl mb-2 uppercase tracking-widest opacity-60"
            style={{ color: themeColors?.foreground || '#fff' }}
          >
            Round {currentRound || 0} of {numberOfRounds || 1}
          </p>

          {currentRound && currentRound > 0 && (roundStartedAt || isPaused) ? (
            roundDuration ? (
              <div
                className={cn(
                  'font-mono font-bold tabular-nums leading-none',
                  'text-[8rem] sm:text-[12rem] md:text-[16rem] lg:text-[20rem]',
                  isExpired ? 'text-white animate-pulse' : isWarning ? 'text-white animate-pulse' : ''
                )}
                style={{ color: isExpired || isWarning || isPaused ? '#fff' : themeColors?.foreground || '#fff' }}
              >
                {isExpired ? "TIME'S UP" : `${minutes}:${seconds.toString().padStart(2, '0')}`}
              </div>
            ) : (
              <div
                className="text-4xl font-medium opacity-60 py-4"
                style={{ color: themeColors?.foreground || '#fff' }}
              >
                No time limit
              </div>
            )
          ) : (
            <div
              className="text-4xl font-medium opacity-60 py-4"
              style={{ color: themeColors?.foreground || '#fff' }}
            >
              Waiting to start...
            </div>
          )}

          {isPaused && (
            <div className="mt-8 text-2xl sm:text-4xl font-bold uppercase tracking-widest text-white animate-pulse">
              PAWSED
            </div>
          )}

          {/* Check-in stats */}
          <div
            className="mt-12 flex items-center justify-center gap-8"
            style={{ color: themeColors?.foreground || '#fff' }}
          >
            <div className="text-center">
              <p className="text-6xl font-bold">{checkedIn}</p>
              <p className="text-sm uppercase tracking-wider opacity-60">Checked In</p>
            </div>
            <div className="text-4xl opacity-30">/</div>
            <div className="text-center">
              <p className="text-6xl font-bold">{total}</p>
              <p className="text-sm uppercase tracking-wider opacity-60">Total</p>
            </div>
          </div>
        </div>

        {/* Round indicators at bottom */}
        <div className="absolute bottom-8 left-0 right-0 flex justify-center">
          <div className="flex items-center gap-4">
            {Array.from({ length: numberOfRounds || 1 }, (_, i) => (
              <div
                key={i}
                className={cn(
                  'w-4 h-4 rounded-full transition-colors',
                  i + 1 < (currentRound || 0)
                    ? 'opacity-30'
                    : i + 1 === currentRound
                    ? 'opacity-100'
                    : 'opacity-10'
                )}
                style={{ backgroundColor: themeColors?.foreground || '#fff' }}
              />
            ))}
          </div>
        </div>
      </div>
    </EventThemeProvider>
  )
}
