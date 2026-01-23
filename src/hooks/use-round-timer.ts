/**
 * Custom hook for managing round timer countdown
 */

import * as React from 'react'

interface RoundTimerState {
  timeRemaining: number
  minutes: number
  seconds: number
  isExpired: boolean
  isWarning: boolean
  isPaused: boolean
}

interface RoundTimerInput {
  roundStartedAt: string | undefined | null
  roundDuration: number | undefined | null
  currentRound: number | undefined | null
  isPaused: boolean | undefined
  pausedTimeRemaining: number | undefined | null
}

/**
 * Hook to manage round timer countdown with pause support
 * @param input - Round timing data from the event
 * @returns Timer state including time remaining, formatted values, and status flags
 */
export function useRoundTimer(input: RoundTimerInput): RoundTimerState {
  const { roundStartedAt, roundDuration, currentRound, isPaused, pausedTimeRemaining } = input
  const [timeRemaining, setTimeRemaining] = React.useState<number>(0)

  React.useEffect(() => {
    // If paused, show the paused time
    if (isPaused && pausedTimeRemaining !== undefined && pausedTimeRemaining !== null) {
      setTimeRemaining(pausedTimeRemaining)
      return
    }

    if (!roundStartedAt || !roundDuration || !currentRound) {
      setTimeRemaining(0)
      return
    }

    const endTime = new Date(roundStartedAt).getTime() + roundDuration * 60 * 1000

    const updateTimer = () => {
      const remaining = Math.max(0, endTime - Date.now())
      setTimeRemaining(remaining)
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [roundStartedAt, roundDuration, currentRound, isPaused, pausedTimeRemaining])

  const minutes = Math.floor(timeRemaining / 60000)
  const seconds = Math.floor((timeRemaining % 60000) / 1000)
  const isExpired = timeRemaining === 0 && !!roundStartedAt && !!roundDuration && !isPaused
  const isWarning = timeRemaining > 0 && timeRemaining < 60000 && !isPaused

  return {
    timeRemaining,
    minutes,
    seconds,
    isExpired,
    isWarning,
    isPaused: isPaused === true,
  }
}
