"use client"

import * as React from "react"
import { Check, ChevronLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  generateConfirmationMessage,
  SEATING_EVENT_TYPES,
  type SeatingEventType,
} from "@/lib/seating-types"

interface SeatingConfirmationProps {
  seatingType: SeatingEventType
  answers: Record<string, string>
  onConfirm: () => void
  onBack: () => void
  saving?: boolean
}

export function SeatingConfirmation({
  seatingType,
  answers,
  onConfirm,
  onBack,
  saving = false,
}: SeatingConfirmationProps) {
  const typeConfig = SEATING_EVENT_TYPES[seatingType]
  const confirmation = generateConfirmationMessage(seatingType, answers)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <typeConfig.icon className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>{confirmation.headline}</CardTitle>
            <CardDescription>
              This is what I will do when you assign tables.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {confirmation.behaviors.map((behavior, index) => (
            <li key={index} className="flex items-start gap-3">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary mt-0.5">
                <Check className="h-3 w-3" />
              </div>
              <span className="text-sm">{behavior}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={saving}
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Adjust
        </Button>
        <Button onClick={onConfirm} disabled={saving} className="flex-1">
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            confirmation.cta
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
