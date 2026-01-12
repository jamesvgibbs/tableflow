"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface GuestFormProps {
  onAddGuest: (guest: {
    name: string
    department?: string
    email?: string
    phone?: string
  }) => void
}

export function GuestForm({ onAddGuest }: GuestFormProps) {
  const [name, setName] = React.useState("")
  const [department, setDepartment] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [error, setError] = React.useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate name is not empty
    const trimmedName = name.trim()
    if (!trimmedName) {
      setError("Name is required")
      return
    }

    // Clear error
    setError("")

    // Call callback with guest data
    onAddGuest({
      name: trimmedName,
      department: department.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
    })

    // Clear form
    setName("")
    setDepartment("")
    setEmail("")
    setPhone("")
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">
          Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          type="text"
          placeholder="Enter guest name"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            if (error) setError("")
          }}
          aria-invalid={!!error}
          aria-describedby={error ? "name-error" : undefined}
        />
        {error && (
          <p id="name-error" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="department">Department</Label>
        <Input
          id="department"
          type="text"
          placeholder="Enter department (optional)"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter email (optional)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="Enter phone (optional)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>

      <Button type="submit" className="w-full">
        Add Guest
      </Button>
    </form>
  )
}
