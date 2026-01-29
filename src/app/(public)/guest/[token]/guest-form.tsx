"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@convex/_generated/api"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Save, CheckCircle2 } from "lucide-react"

interface GuestPortalFormProps {
  token: string
  initialPhone: string
  initialDietary: {
    restrictions: string[]
    notes?: string
  }
  initialRsvpStatus: string
  isReadOnly: boolean
}

const DIETARY_OPTIONS = [
  { id: "vegetarian", label: "Vegetarian" },
  { id: "vegan", label: "Vegan" },
  { id: "gluten-free", label: "Gluten-Free" },
  { id: "dairy-free", label: "Dairy-Free" },
  { id: "nut-allergy", label: "Nut Allergy" },
  { id: "shellfish-allergy", label: "Shellfish Allergy" },
  { id: "halal", label: "Halal" },
  { id: "kosher", label: "Kosher" },
]

export function GuestPortalForm({
  token,
  initialPhone,
  initialDietary,
  initialRsvpStatus,
  isReadOnly,
}: GuestPortalFormProps) {
  const [phone, setPhone] = useState(initialPhone)
  const [restrictions, setRestrictions] = useState<string[]>(initialDietary.restrictions || [])
  const [dietaryNotes, setDietaryNotes] = useState(initialDietary.notes || "")
  const [rsvpStatus, setRsvpStatus] = useState(initialRsvpStatus)
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const selfServiceUpdate = useMutation(api.guests.selfServiceUpdate)

  const handleRestrictionToggle = (restrictionId: string) => {
    setRestrictions((prev) =>
      prev.includes(restrictionId)
        ? prev.filter((r) => r !== restrictionId)
        : [...prev, restrictionId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isReadOnly) {
      toast.error("The deadline for changes has passed.")
      return
    }

    setIsSaving(true)

    try {
      await selfServiceUpdate({
        token,
        phone: phone || undefined,
        dietary: {
          restrictions,
          notes: dietaryNotes || undefined,
        },
        rsvpStatus,
      })

      setShowSuccess(true)
      toast.success("Your information has been updated.")

      // Hide success indicator after 3 seconds
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong."
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Update Your Details</CardTitle>
          <CardDescription>
            {isReadOnly
              ? "Changes are no longer accepted for this event."
              : "Make any changes you need below."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* RSVP Status */}
          <div className="space-y-2">
            <Label htmlFor="rsvp">RSVP Status</Label>
            <Select
              value={rsvpStatus}
              onValueChange={setRsvpStatus}
              disabled={isReadOnly}
            >
              <SelectTrigger id="rsvp">
                <SelectValue placeholder="Select your status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="confirmed">I will attend</SelectItem>
                <SelectItem value="declined">I cannot attend</SelectItem>
                <SelectItem value="pending">Not sure yet</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="Your phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={isReadOnly}
            />
            <p className="text-xs text-muted-foreground">
              For event-day communication only.
            </p>
          </div>

          {/* Dietary Restrictions */}
          <div className="space-y-3">
            <Label>Dietary Restrictions</Label>
            <div className="grid grid-cols-2 gap-3">
              {DIETARY_OPTIONS.map((option) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={option.id}
                    checked={restrictions.includes(option.id)}
                    onCheckedChange={() => handleRestrictionToggle(option.id)}
                    disabled={isReadOnly}
                  />
                  <label
                    htmlFor={option.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Dietary Notes */}
          <div className="space-y-2">
            <Label htmlFor="dietary-notes">Additional Dietary Notes</Label>
            <Textarea
              id="dietary-notes"
              placeholder="Any other dietary requirements or allergies..."
              value={dietaryNotes}
              onChange={(e) => setDietaryNotes(e.target.value)}
              disabled={isReadOnly}
              rows={3}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            disabled={isReadOnly || isSaving}
            className="w-full gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : showSuccess ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Saved
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
