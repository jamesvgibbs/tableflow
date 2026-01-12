'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Timer, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RoundTimerProps {
  startedAt: string
  durationMinutes: number
  roundNumber: number
  className?: string
}

export function RoundTimer({
  startedAt,
  durationMinutes,
  roundNumber,
  className
}: RoundTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0)

  useEffect(() => {
    const endTime = new Date(startedAt).getTime() + durationMinutes * 60 * 1000

    const updateTimer = () => {
      const remaining = Math.max(0, endTime - Date.now())
      setTimeRemaining(remaining)
    }

    // Initial update
    updateTimer()

    // Update every second
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [startedAt, durationMinutes])

  const minutes = Math.floor(timeRemaining / 60000)
  const seconds = Math.floor((timeRemaining % 60000) / 1000)
  const isExpired = timeRemaining === 0
  const isWarning = !isExpired && timeRemaining < 60000 // Less than 1 minute

  return (
    <Card
      className={cn(
        'transition-colors',
        isExpired && 'border-amber-500 bg-amber-50 dark:bg-amber-950/30',
        isWarning && 'border-orange-400 bg-orange-50 dark:bg-orange-950/30',
        className
      )}
    >
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isExpired ? (
            <AlertCircle className="h-5 w-5 text-amber-600" />
          ) : (
            <Timer className={cn('h-5 w-5', isWarning ? 'text-orange-600' : 'text-primary')} />
          )}
          <span className="font-medium">Round {roundNumber}</span>
        </div>
        <div
          className={cn(
            'text-3xl font-mono font-bold tabular-nums',
            isExpired ? 'text-amber-600' : isWarning ? 'text-orange-600' : 'text-foreground'
          )}
        >
          {isExpired ? (
            "TIME'S UP"
          ) : (
            `${minutes}:${seconds.toString().padStart(2, '0')}`
          )}
        </div>
      </CardContent>
    </Card>
  )
}
