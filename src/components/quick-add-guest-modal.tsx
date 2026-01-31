"use client"

import * as React from "react"
import { Loader2, Plus, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

interface QuickAddGuestModalProps {
  onAdd: (guest: {
    name: string
    email?: string
    phone?: string
    dietaryNotes?: string
  }) => Promise<void>
  trigger?: React.ReactNode
  guestLabel?: string
}

export function QuickAddGuestModal({
  onAdd,
  trigger,
  guestLabel = "Guest",
}: QuickAddGuestModalProps) {
  const [open, setOpen] = React.useState(false)
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [dietaryNotes, setDietaryNotes] = React.useState("")
  const [showOptional, setShowOptional] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const resetForm = () => {
    setName("")
    setEmail("")
    setPhone("")
    setDietaryNotes("")
    setShowOptional(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsSubmitting(true)
    try {
      await onAdd({
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        dietaryNotes: dietaryNotes.trim() || undefined,
      })
      resetForm()
      setOpen(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" variant="outline" className="gap-2">
            <Plus className="size-4" />
            Quick Add
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Quick Add {guestLabel}</DialogTitle>
            <DialogDescription>
              Add a walk-in guest quickly. Only name is required.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Guest name"
                autoFocus
                required
              />
            </div>

            <Collapsible open={showOptional} onOpenChange={setShowOptional}>
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full gap-2 text-muted-foreground"
                >
                  {showOptional ? (
                    <>
                      <ChevronUp className="size-4" />
                      Hide optional fields
                    </>
                  ) : (
                    <>
                      <ChevronDown className="size-4" />
                      Show optional fields
                    </>
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dietary">Dietary Notes</Label>
                  <Textarea
                    id="dietary"
                    value={dietaryNotes}
                    onChange={(e) => setDietaryNotes(e.target.value)}
                    placeholder="Any dietary requirements..."
                    rows={2}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="size-4 mr-2" />
                  Add {guestLabel}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
