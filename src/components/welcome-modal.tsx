'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Dog, ArrowRight, Users, Shuffle, QrCode, Clock } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface WelcomeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WelcomeModal({ open, onOpenChange }: WelcomeModalProps) {
  const router = useRouter()

  const handleCreateEvent = () => {
    onOpenChange(false)
    router.push('/admin?create=true')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-center sm:text-left">
          <div className="flex items-center gap-3 mb-2">
            <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Dog className="size-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl">
                Hello! I am <span className="text-primary">Seatherder</span>.
              </DialogTitle>
              <DialogDescription className="text-sm">
                Your event seating assistant
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-muted-foreground">
            I help organize seating at events. Give me a guest list and I will figure out
            who sits where. No more spreadsheets. No more politics. Just smart tables.
          </p>

          <div className="grid gap-3">
            <FeatureRow
              icon={<Users className="size-4" />}
              title="Import your guests"
              description="Paste names, upload a CSV, or add them one by one."
            />
            <FeatureRow
              icon={<Shuffle className="size-4" />}
              title="I assign the tables"
              description="I mix departments, match interests, and avoid repeats."
            />
            <FeatureRow
              icon={<QrCode className="size-4" />}
              title="Check in with QR codes"
              description="Guests scan a code and find their table instantly."
            />
            <FeatureRow
              icon={<Clock className="size-4" />}
              title="Multiple rounds"
              description="Networking events? I rotate seating each round."
            />
          </div>
        </div>

        <DialogFooter className="sm:justify-between gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Look around first
          </Button>
          <Button onClick={handleCreateEvent} className="gap-2">
            Create my first event
            <ArrowRight className="size-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function FeatureRow({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="size-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <p className="font-medium text-sm">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}
