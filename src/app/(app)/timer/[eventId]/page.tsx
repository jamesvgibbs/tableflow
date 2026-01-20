'use client'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { Id } from '@convex/_generated/dataModel'
import { Maximize, Minimize, Volume2, VolumeX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SeatherderLoading } from '@/components/seatherder-loading'
import { cn } from '@/lib/utils'
import { resolveThemeColors } from '@/lib/theme-presets'

// Sound state interface for refs (avoids setState in effects)
interface SoundState {
  hasPlayedWarning: boolean
  hasPlayedEnd: boolean
  hasSeenActiveTimer: boolean
  previousTimeRemaining: number | null
}

// WCAG contrast calculation functions
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

interface TimerPageProps {
  params: Promise<{ eventId: string }>
}

export default function TimerPage({ params }: TimerPageProps) {
  const [eventId, setEventId] = useState<Id<'events'> | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)

  // Use ref for sound-related state to avoid setState in effects
  const soundStateRef = useRef<SoundState>({
    hasPlayedWarning: false,
    hasPlayedEnd: false,
    hasSeenActiveTimer: false,
    previousTimeRemaining: null,
  })

  // Load params
  useEffect(() => {
    params.then((p) => setEventId(p.eventId as Id<'events'>))
  }, [params])

  // Query event data
  const event = useQuery(api.events.get, eventId ? { id: eventId } : 'skip')

  // Resolve theme colors
  const themeColors = useMemo(() => {
    if (!event) return null
    return resolveThemeColors(event.themePreset, event.customColors)
  }, [event])

  // Calculate time remaining - timer pattern requires setState in effect
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- Timer sync pattern: external time → React state */
    // If paused, use the stored paused time
    if (event?.isPaused && event?.pausedTimeRemaining !== undefined) {
      setTimeRemaining(event.pausedTimeRemaining)
      return
    }

    if (!event?.roundStartedAt || !event?.roundDuration || !event?.currentRound) {
      setTimeRemaining(0)
      return
    }

    const endTime = new Date(event.roundStartedAt).getTime() + event.roundDuration * 60 * 1000

    const updateTimer = () => {
      const remaining = Math.max(0, endTime - Date.now())
      setTimeRemaining(remaining)
    }

    updateTimer()
    const interval = setInterval(updateTimer, 100) // Update more frequently for smoother display

    return () => clearInterval(interval)
  }, [event?.roundStartedAt, event?.roundDuration, event?.currentRound, event?.isPaused, event?.pausedTimeRemaining])

  // Reset sound flags when round changes
  useEffect(() => {
    soundStateRef.current = {
      hasPlayedWarning: false,
      hasPlayedEnd: false,
      hasSeenActiveTimer: false,
      previousTimeRemaining: null,
    }
  }, [event?.currentRound])

  // Track when we've seen an active timer (needed for sound logic)
  useEffect(() => {
    if (timeRemaining > 0) {
      soundStateRef.current.hasSeenActiveTimer = true
    }
    soundStateRef.current.previousTimeRemaining = timeRemaining
  }, [timeRemaining])

  // Simple beep using Web Audio API
  const playBeep = useCallback((frequency: number, duration: number) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = frequency
      oscillator.type = 'sine'
      gainNode.gain.value = 0.3

      oscillator.start()
      setTimeout(() => {
        oscillator.stop()
        audioContext.close()
      }, duration)
    } catch {
      // Audio not supported
    }
  }, [])

  // Play sounds at key moments - only when TRANSITIONING to these states
  useEffect(() => {
    const soundState = soundStateRef.current
    if (!soundEnabled || !soundState.hasSeenActiveTimer) return

    // Warning at 1 minute - only play when crossing the threshold
    if (
      timeRemaining > 0 &&
      timeRemaining <= 60000 &&
      soundState.previousTimeRemaining !== null &&
      soundState.previousTimeRemaining > 60000 &&
      !soundState.hasPlayedWarning
    ) {
      playBeep(440, 200)
      soundStateRef.current.hasPlayedWarning = true
    }

    // End sound - only play when transitioning from >0 to 0
    if (
      timeRemaining === 0 &&
      soundState.previousTimeRemaining !== null &&
      soundState.previousTimeRemaining > 0 &&
      event?.currentRound &&
      !soundState.hasPlayedEnd
    ) {
      playBeep(880, 500)
      setTimeout(() => playBeep(880, 500), 600)
      setTimeout(() => playBeep(880, 500), 1200)
      soundStateRef.current.hasPlayedEnd = true
    }
  }, [timeRemaining, soundEnabled, event?.currentRound, playBeep])

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
      setIsFullscreen(true)
    } else {
      document.exitFullscreen().catch(() => {})
      setIsFullscreen(false)
    }
  }, [])

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Format time
  const minutes = Math.floor(timeRemaining / 60000)
  const seconds = Math.floor((timeRemaining % 60000) / 1000)

  // State flags
  const isWaiting = !event?.currentRound || event.currentRound === 0
  const isPaused = event?.isPaused === true
  const isRoundEnded = event?.currentRound && event.currentRound > 0 && !event?.roundStartedAt && !isPaused
  const isExpired = timeRemaining === 0 && event?.currentRound && event.currentRound > 0 && event?.roundStartedAt && !isPaused
  const isWarning = !isExpired && !isPaused && timeRemaining > 0 && timeRemaining < 60000

  // Determine background color based on state
  const getBackgroundStyle = () => {
    // Override colors for special states
    if (isExpired) return { backgroundColor: '#D97706' } // amber
    if (isPaused) return { backgroundColor: '#1D4ED8' } // blue
    if (isWarning) return { backgroundColor: '#EA580C' } // orange
    if (isRoundEnded) return { backgroundColor: '#15803D' } // green

    // Use theme background if available
    if (themeColors) {
      return { backgroundColor: themeColors.background }
    }

    return { backgroundColor: '#000' } // default black
  }

  // Determine text color with WCAG compliance
  const getTextColor = () => {
    // For special states, use white (backgrounds are already designed for white text)
    if (isExpired || isPaused || isWarning || isRoundEnded) {
      return '#FFFFFF'
    }

    // Use WCAG-compliant text color based on theme
    if (themeColors) {
      return getAccessibleTextColor(themeColors.background, themeColors.foreground)
    }

    return '#FFFFFF' // default white on black
  }

  const textColor = getTextColor()

  // Loading state
  if (!eventId || event === undefined) {
    return <SeatherderLoading message="I am loading the timer..." />
  }

  // Event not found
  if (event === null) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-2xl">I cannot find this event</div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 transition-colors duration-500"
      style={getBackgroundStyle()}
    >
      {/* Controls */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="hover:bg-white/10"
          style={{ color: `${textColor}99` }}
        >
          {soundEnabled ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleFullscreen}
          className="hover:bg-white/10"
          style={{ color: `${textColor}99` }}
        >
          {isFullscreen ? <Minimize className="size-5" /> : <Maximize className="size-5" />}
        </Button>
      </div>

      {/* Event name */}
      <div className="absolute top-4 left-4">
        <h1
          className="text-lg sm:text-xl font-medium"
          style={{ color: `${textColor}B3` }}
        >
          {event.name}
        </h1>
      </div>

      {/* Main content */}
      <div className="text-center">
        {isWaiting ? (
          // Waiting for round to start
          <>
            <p
              className="text-xl sm:text-2xl mb-4 uppercase tracking-widest"
              style={{ color: `${textColor}99` }}
            >
              Waiting for
            </p>
            <p
              className="text-4xl sm:text-6xl font-bold mb-8"
              style={{ color: textColor }}
            >
              Round 1
            </p>
            <div className="flex items-center justify-center gap-2">
              <div
                className="w-3 h-3 rounded-full animate-pulse"
                style={{ backgroundColor: `${textColor}66` }}
              />
              <div
                className="w-3 h-3 rounded-full animate-pulse [animation-delay:0.2s]"
                style={{ backgroundColor: `${textColor}66` }}
              />
              <div
                className="w-3 h-3 rounded-full animate-pulse [animation-delay:0.4s]"
                style={{ backgroundColor: `${textColor}66` }}
              />
            </div>
          </>
        ) : isRoundEnded ? (
          // Round ended by admin
          <>
            <p
              className="text-xl sm:text-2xl mb-2 uppercase tracking-widest"
              style={{ color: `${textColor}CC` }}
            >
              Round {event.currentRound} Complete
            </p>
            <div
              className="text-6xl sm:text-[8rem] font-bold leading-none"
              style={{ color: textColor }}
            >
              ROUND OVER
            </div>
            {(event.currentRound || 0) < (event.numberOfRounds || 1) && (
              <p
                className="text-xl sm:text-2xl mt-8"
                style={{ color: `${textColor}B3` }}
              >
                Waiting for Round {(event.currentRound || 0) + 1}
              </p>
            )}
            {event.currentRound === event.numberOfRounds && (
              <p
                className="text-xl sm:text-2xl mt-8"
                style={{ color: `${textColor}B3` }}
              >
                All rounds complete!
              </p>
            )}
          </>
        ) : isExpired ? (
          // Time's up
          <>
            <p
              className="text-xl sm:text-2xl mb-2 uppercase tracking-widest"
              style={{ color: `${textColor}CC` }}
            >
              Round {event.currentRound}
            </p>
            <div
              className="text-6xl sm:text-[10rem] font-bold leading-none animate-pulse"
              style={{ color: textColor }}
            >
              TIME&apos;S UP
            </div>
            {(event.currentRound || 0) < (event.numberOfRounds || 1) && (
              <p
                className="text-xl sm:text-2xl mt-8"
                style={{ color: `${textColor}B3` }}
              >
                Get ready for Round {(event.currentRound || 0) + 1}
              </p>
            )}
          </>
        ) : isPaused ? (
          // Paused
          <>
            <p
              className="text-xl sm:text-2xl mb-2 uppercase tracking-widest"
              style={{ color: `${textColor}99` }}
            >
              Round {event.currentRound} of {event.numberOfRounds || 1}
            </p>
            <div
              className="font-mono font-bold tabular-nums leading-none text-[8rem] sm:text-[12rem] md:text-[16rem] lg:text-[20rem]"
              style={{ color: `${textColor}CC` }}
            >
              {minutes}:{seconds.toString().padStart(2, '0')}
            </div>
            <div
              className="mt-8 text-2xl sm:text-4xl font-bold uppercase tracking-widest animate-pulse"
              style={{ color: textColor }}
            >
              PAWSED
            </div>
            {/* Progress bar */}
            {event.roundDuration && (
              <div className="w-full max-w-2xl mx-auto mt-8">
                <div
                  className="h-2 rounded-full overflow-hidden"
                  style={{ backgroundColor: `${textColor}33` }}
                >
                  <div
                    className="h-full"
                    style={{
                      width: `${(timeRemaining / (event.roundDuration * 60 * 1000)) * 100}%`,
                      backgroundColor: `${textColor}99`,
                    }}
                  />
                </div>
              </div>
            )}
          </>
        ) : (
          // Countdown
          <>
            <p
              className="text-xl sm:text-2xl mb-2 uppercase tracking-widest"
              style={{ color: `${textColor}99` }}
            >
              Round {event.currentRound} of {event.numberOfRounds || 1}
            </p>
            <div
              className={cn(
                'font-mono font-bold tabular-nums leading-none',
                'text-[8rem] sm:text-[12rem] md:text-[16rem] lg:text-[20rem]',
                isWarning && 'animate-pulse'
              )}
              style={{ color: textColor }}
            >
              {minutes}:{seconds.toString().padStart(2, '0')}
            </div>
            {/* Progress bar */}
            {event.roundDuration && (
              <div className="w-full max-w-2xl mx-auto mt-8">
                <div
                  className="h-2 rounded-full overflow-hidden"
                  style={{ backgroundColor: `${textColor}33` }}
                >
                  <div
                    className={cn(
                      'h-full transition-all duration-100'
                    )}
                    style={{
                      width: `${(timeRemaining / (event.roundDuration * 60 * 1000)) * 100}%`,
                      backgroundColor: isWarning ? textColor : `${textColor}99`,
                    }}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Round info at bottom */}
      {!isWaiting && (
        <div className="absolute bottom-4 left-4 right-4 flex justify-center">
          <div className="flex items-center gap-4 text-sm">
            {Array.from({ length: event.numberOfRounds || 1 }, (_, i) => (
              <div
                key={i}
                className="w-3 h-3 rounded-full transition-colors"
                style={{
                  backgroundColor:
                    i + 1 < (event.currentRound || 0)
                      ? `${textColor}4D`
                      : i + 1 === event.currentRound
                      ? textColor
                      : `${textColor}1A`,
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
