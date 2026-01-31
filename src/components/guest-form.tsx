"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DIETARY_OPTIONS,
  DEFAULT_INTERESTS,
  JOB_LEVELS,
  JOB_LEVEL_LABELS,
  NETWORKING_GOALS,
  NETWORKING_GOAL_LABELS,
  type DietaryInfo,
  type GuestAttributes,
  type JobLevel,
  type NetworkingGoal,
} from "@/lib/types"
import type { SeatingEventType } from "@/lib/seating-types"

export interface GuestFormData {
  name: string
  department?: string
  email?: string
  phone?: string
  dietary?: DietaryInfo
  attributes?: GuestAttributes
  // Event-type specific fields
  familyName?: string
  side?: string
  company?: string
  team?: string
  managementLevel?: string
  isVip?: boolean
}

interface GuestFormProps {
  /** Callback for creating a new guest (create mode) */
  onAddGuest?: (guest: GuestFormData) => void
  /** Callback for updating an existing guest (edit mode) */
  onEditGuest?: (guest: GuestFormData) => void
  /** Initial guest data for pre-filling the form (edit mode) */
  initialGuest?: Partial<GuestFormData>
  /** Form mode: 'create' for new guests, 'edit' for existing guests */
  mode?: 'create' | 'edit'
  /** Custom label for the department field (default: "Department") */
  departmentLabel?: string
  /** Custom label for the guest (default: "Guest") - used in button text */
  guestLabel?: string
  /** Seating event type to show relevant fields */
  seatingType?: SeatingEventType | null
}

// Human-readable labels for dietary options
const DIETARY_LABELS: Record<string, string> = {
  'vegetarian': 'Vegetarian',
  'vegan': 'Vegan',
  'gluten-free': 'Gluten-Free',
  'dairy-free': 'Dairy-Free',
  'nut-allergy': 'Nut Allergy',
  'shellfish-allergy': 'Shellfish Allergy',
  'halal': 'Halal',
  'kosher': 'Kosher',
}

// Management level options
const MANAGEMENT_LEVELS = ["ic", "manager", "director", "exec"] as const
const MANAGEMENT_LEVEL_LABELS: Record<string, string> = {
  ic: "Individual Contributor",
  manager: "Manager",
  director: "Director",
  exec: "Executive",
}

// Side options for weddings
const SIDE_OPTIONS = ["bride", "groom", "both"] as const
const SIDE_LABELS: Record<string, string> = {
  bride: "Bride's Side",
  groom: "Groom's Side",
  both: "Both Sides",
}

export function GuestForm({
  onAddGuest,
  onEditGuest,
  initialGuest,
  mode = 'create',
  departmentLabel = "Department",
  seatingType,
}: GuestFormProps) {
  const [name, setName] = React.useState(initialGuest?.name ?? "")
  const [department, setDepartment] = React.useState(initialGuest?.department ?? "")
  const [email, setEmail] = React.useState(initialGuest?.email ?? "")
  const [phone, setPhone] = React.useState(initialGuest?.phone ?? "")
  const [dietaryRestrictions, setDietaryRestrictions] = React.useState<string[]>(
    initialGuest?.dietary?.restrictions ?? []
  )
  const [dietaryNotes, setDietaryNotes] = React.useState(initialGuest?.dietary?.notes ?? "")
  const [error, setError] = React.useState("")

  // Matching attributes state
  const [interests, setInterests] = React.useState<string[]>(
    initialGuest?.attributes?.interests ?? []
  )
  const [jobLevel, setJobLevel] = React.useState<JobLevel | "">(
    (initialGuest?.attributes?.jobLevel as JobLevel) ?? ""
  )
  const [goals, setGoals] = React.useState<NetworkingGoal[]>(
    (initialGuest?.attributes?.goals as NetworkingGoal[]) ?? []
  )

  // Event-type specific state
  const [familyName, setFamilyName] = React.useState(initialGuest?.familyName ?? "")
  const [side, setSide] = React.useState(initialGuest?.side ?? "")
  const [company, setCompany] = React.useState(initialGuest?.company ?? "")
  const [team, setTeam] = React.useState(initialGuest?.team ?? "")
  const [managementLevel, setManagementLevel] = React.useState(initialGuest?.managementLevel ?? "")
  const [isVip, setIsVip] = React.useState(initialGuest?.isVip ?? false)

  // Reset form when initialGuest changes (for switching between guests in edit mode)
  React.useEffect(() => {
    if (initialGuest) {
      setName(initialGuest.name ?? "")
      setDepartment(initialGuest.department ?? "")
      setEmail(initialGuest.email ?? "")
      setPhone(initialGuest.phone ?? "")
      setDietaryRestrictions(initialGuest.dietary?.restrictions ?? [])
      setDietaryNotes(initialGuest.dietary?.notes ?? "")
      setInterests(initialGuest.attributes?.interests ?? [])
      setJobLevel((initialGuest.attributes?.jobLevel as JobLevel) ?? "")
      setGoals((initialGuest.attributes?.goals as NetworkingGoal[]) ?? [])
      setFamilyName(initialGuest.familyName ?? "")
      setSide(initialGuest.side ?? "")
      setCompany(initialGuest.company ?? "")
      setTeam(initialGuest.team ?? "")
      setManagementLevel(initialGuest.managementLevel ?? "")
      setIsVip(initialGuest.isVip ?? false)
      setError("")
    }
  }, [initialGuest])

  const handleDietaryChange = (restriction: string, checked: boolean) => {
    setDietaryRestrictions(prev =>
      checked
        ? [...prev, restriction]
        : prev.filter(r => r !== restriction)
    )
  }

  const handleInterestChange = (interest: string, checked: boolean) => {
    setInterests(prev =>
      checked
        ? [...prev, interest]
        : prev.filter(i => i !== interest)
    )
  }

  const handleGoalChange = (goal: NetworkingGoal, checked: boolean) => {
    setGoals(prev =>
      checked
        ? [...prev, goal]
        : prev.filter(g => g !== goal)
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate name is not empty
    const trimmedName = name.trim()
    if (!trimmedName) {
      setError("I need a name.")
      return
    }

    // Clear error
    setError("")

    // Build dietary info if any restrictions or notes
    const hasDietary = dietaryRestrictions.length > 0 || dietaryNotes.trim()
    const dietary: DietaryInfo | undefined = hasDietary
      ? {
          restrictions: dietaryRestrictions,
          notes: dietaryNotes.trim() || undefined,
        }
      : undefined

    // Build matching attributes if any are set
    const hasAttributes = interests.length > 0 || jobLevel || goals.length > 0
    const attributes: GuestAttributes | undefined = hasAttributes
      ? {
          interests: interests.length > 0 ? interests : undefined,
          jobLevel: jobLevel || undefined,
          goals: goals.length > 0 ? goals : undefined,
        }
      : undefined

    // Build guest data object
    const guestData: GuestFormData = {
      name: trimmedName,
      department: department.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      dietary,
      attributes,
      // Event-type specific fields
      familyName: familyName.trim() || undefined,
      side: side || undefined,
      company: company.trim() || undefined,
      team: team.trim() || undefined,
      managementLevel: managementLevel || undefined,
      isVip: isVip || undefined,
    }

    // Call the appropriate callback based on mode
    if (mode === 'edit' && onEditGuest) {
      onEditGuest(guestData)
      // Don't clear form in edit mode - the dialog will close
    } else if (onAddGuest) {
      onAddGuest(guestData)
      // Clear form after adding in create mode
      setName("")
      setDepartment("")
      setEmail("")
      setPhone("")
      setDietaryRestrictions([])
      setDietaryNotes("")
      setInterests([])
      setJobLevel("")
      setGoals([])
      // Clear event-type specific fields
      setFamilyName("")
      setSide("")
      setCompany("")
      setTeam("")
      setManagementLevel("")
      setIsVip(false)
    }
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
          placeholder="Who is this?"
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
        <Label htmlFor="department">{departmentLabel}</Label>
        <Input
          id="department"
          type="text"
          placeholder={`What ${departmentLabel.toLowerCase()} are they in?`}
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="How do I email them?"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="Phone number?"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>

      {/* Event-type specific fields */}
      {(seatingType === "wedding" || seatingType === "social") && (
        <div className="space-y-2">
          <Label htmlFor="familyName">
            Family Name {seatingType === "wedding" && <span className="text-destructive">*</span>}
          </Label>
          <Input
            id="familyName"
            type="text"
            placeholder="What is their last name?"
            value={familyName}
            onChange={(e) => setFamilyName(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            I use this to group families together.
          </p>
        </div>
      )}

      {seatingType === "wedding" && (
        <div className="space-y-2">
          <Label htmlFor="side">Side</Label>
          <Select value={side} onValueChange={setSide}>
            <SelectTrigger id="side">
              <SelectValue placeholder="Whose side are they on?" />
            </SelectTrigger>
            <SelectContent>
              {SIDE_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {SIDE_LABELS[option]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {(seatingType === "corporate" || seatingType === "networking") && (
        <div className="space-y-2">
          <Label htmlFor="company">
            Company {seatingType === "corporate" && <span className="text-destructive">*</span>}
          </Label>
          <Input
            id="company"
            type="text"
            placeholder="What company are they from?"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            I need this to mix or match companies.
          </p>
        </div>
      )}

      {seatingType === "team" && (
        <div className="space-y-2">
          <Label htmlFor="team">
            Team <span className="text-destructive">*</span>
          </Label>
          <Input
            id="team"
            type="text"
            placeholder="What team are they on?"
            value={team}
            onChange={(e) => setTeam(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            I need this to break up or keep teams.
          </p>
        </div>
      )}

      {seatingType === "team" && (
        <div className="space-y-2">
          <Label htmlFor="managementLevel">Management Level</Label>
          <Select value={managementLevel} onValueChange={setManagementLevel}>
            <SelectTrigger id="managementLevel">
              <SelectValue placeholder="Are they a manager?" />
            </SelectTrigger>
            <SelectContent>
              {MANAGEMENT_LEVELS.map((level) => (
                <SelectItem key={level} value={level}>
                  {MANAGEMENT_LEVEL_LABELS[level]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {seatingType === "wedding" && (
        <div className="flex items-center space-x-2">
          <Checkbox
            id="isVip"
            checked={isVip}
            onCheckedChange={(checked) => setIsVip(checked === true)}
          />
          <Label htmlFor="isVip" className="text-sm font-normal cursor-pointer">
            VIP Guest (special table seating)
          </Label>
        </div>
      )}

      <Accordion type="multiple" className="w-full space-y-2">
        <AccordionItem value="dietary" className="border rounded-md px-3">
          <AccordionTrigger className="text-sm font-medium py-3">
            Dietary Requirements
            {dietaryRestrictions.length > 0 && (
              <span className="ml-2 text-xs text-muted-foreground">
                ({dietaryRestrictions.length} selected)
              </span>
            )}
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {DIETARY_OPTIONS.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox
                      id={`dietary-${option}`}
                      checked={dietaryRestrictions.includes(option)}
                      onCheckedChange={(checked) =>
                        handleDietaryChange(option, checked === true)
                      }
                    />
                    <Label
                      htmlFor={`dietary-${option}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {DIETARY_LABELS[option] || option}
                    </Label>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <Label htmlFor="dietary-notes" className="text-sm">
                  Additional Notes
                </Label>
                <Textarea
                  id="dietary-notes"
                  placeholder="Any other dietary requirements or allergies..."
                  value={dietaryNotes}
                  onChange={(e) => setDietaryNotes(e.target.value)}
                  className="min-h-[60px] resize-none"
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="matching" className="border rounded-md px-3">
          <AccordionTrigger className="text-sm font-medium py-3">
            Matching Attributes
            {(interests.length > 0 || jobLevel || goals.length > 0) && (
              <span className="ml-2 text-xs text-muted-foreground">
                ({interests.length + (jobLevel ? 1 : 0) + goals.length} set)
              </span>
            )}
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <div className="space-y-4">
              {/* Job Level */}
              <div className="space-y-2">
                <Label htmlFor="job-level" className="text-sm">
                  Job Level
                </Label>
                <Select
                  value={jobLevel}
                  onValueChange={(value) => setJobLevel(value as JobLevel)}
                >
                  <SelectTrigger id="job-level">
                    <SelectValue placeholder="Select job level..." />
                  </SelectTrigger>
                  <SelectContent>
                    {JOB_LEVELS.map((level) => (
                      <SelectItem key={level} value={level}>
                        {JOB_LEVEL_LABELS[level]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Interests */}
              <div className="space-y-2">
                <Label className="text-sm">Interests</Label>
                <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto pr-2">
                  {DEFAULT_INTERESTS.map((interest) => (
                    <div key={interest} className="flex items-center space-x-2">
                      <Checkbox
                        id={`interest-${interest}`}
                        checked={interests.includes(interest)}
                        onCheckedChange={(checked) =>
                          handleInterestChange(interest, checked === true)
                        }
                      />
                      <Label
                        htmlFor={`interest-${interest}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {interest}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Networking Goals */}
              <div className="space-y-2">
                <Label className="text-sm">Networking Goals</Label>
                <div className="grid grid-cols-2 gap-2">
                  {NETWORKING_GOALS.map((goal) => (
                    <div key={goal} className="flex items-center space-x-2">
                      <Checkbox
                        id={`goal-${goal}`}
                        checked={goals.includes(goal)}
                        onCheckedChange={(checked) =>
                          handleGoalChange(goal, checked === true)
                        }
                      />
                      <Label
                        htmlFor={`goal-${goal}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {NETWORKING_GOAL_LABELS[goal]}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Button type="submit" className="w-full">
        {mode === 'edit' ? 'Save changes' : 'Add them'}
      </Button>
    </form>
  )
}
