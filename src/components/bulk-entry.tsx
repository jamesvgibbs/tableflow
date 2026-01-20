"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"

interface BulkEntryProps {
  onAddGuests: (guests: { name: string; department?: string }[]) => void
}

export function BulkEntry({ onAddGuests }: BulkEntryProps) {
  const [text, setText] = React.useState("")
  const [error, setError] = React.useState("")

  const parseInput = (input: string): { name: string; department?: string }[] => {
    const lines = input.split("\n")
    const guests: { name: string; department?: string }[] = []

    for (const line of lines) {
      const trimmedLine = line.trim()

      // Skip empty lines
      if (!trimmedLine) continue

      // Check if line contains comma (format: "Name, Department")
      if (trimmedLine.includes(",")) {
        const parts = trimmedLine.split(",")
        const name = parts[0].trim()
        const department = parts.slice(1).join(",").trim() // Handle names/depts with commas

        if (name) {
          guests.push({
            name,
            department: department || undefined,
          })
        }
      } else {
        // Just a name
        guests.push({
          name: trimmedLine,
        })
      }
    }

    return guests
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedText = text.trim()
    if (!trimmedText) {
      setError("I need at least one name.")
      return
    }

    const guests = parseInput(trimmedText)

    if (guests.length === 0) {
      setError("I could not find any names in there.")
      return
    }

    // Clear error
    setError("")

    // Call callback with parsed guests
    onAddGuests(guests)

    // Clear textarea
    setText("")
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="bulk-text">Bulk Guest Entry</Label>
        <Card className="p-3 bg-muted/30">
          <CardContent className="p-0 space-y-2">
            <p className="text-sm text-muted-foreground">
              Here is how to do it:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>One name per line</li>
              <li>Or use format: Name, Department</li>
              <li>Example: John Doe, Engineering</li>
            </ul>
          </CardContent>
        </Card>
        <Textarea
          id="bulk-text"
          placeholder="John Doe&#10;Jane Smith, Marketing&#10;Bob Johnson, Engineering"
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            if (error) setError("")
          }}
          rows={10}
          aria-invalid={!!error}
          aria-describedby={error ? "bulk-error" : undefined}
        />
        {error && (
          <p id="bulk-error" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full">
        Add these guests
      </Button>
    </form>
  )
}
