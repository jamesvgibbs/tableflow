"use client"

import * as React from "react"
import Papa from "papaparse"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload } from "lucide-react"
import {
  DIETARY_OPTIONS,
  JOB_LEVELS,
  NETWORKING_GOALS,
  type DietaryInfo,
  type GuestAttributes,
  type JobLevel,
  type NetworkingGoal,
} from "@/lib/types"
import type { SeatingEventType } from "@/lib/seating-types"

interface CsvUploadProps {
  onImportGuests: (
    guests: {
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
    }[]
  ) => void
  /** Custom label for department/group field (default: "Department") */
  departmentLabel?: string
  /** Custom label for guests (default: "guest") */
  guestLabel?: string
  /** Plural label for guests (default: "guests") */
  guestLabelPlural?: string
  /** Seating event type to show relevant columns */
  seatingType?: SeatingEventType | null
}

type ColumnMapping = {
  firstName: string | null
  lastName: string | null
  fullName: string | null
  department: string | null
  email: string | null
  phone: string | null
  dietary: string | null
  interests: string | null
  jobLevel: string | null
  goals: string | null
  // Event-type specific columns
  familyName: string | null
  side: string | null
  company: string | null
  team: string | null
  managementLevel: string | null
  isVip: string | null
}

// Map common dietary synonyms to our standard options
const DIETARY_SYNONYMS: Record<string, string> = {
  'veg': 'vegetarian',
  'veggie': 'vegetarian',
  'vegetarian': 'vegetarian',
  'vegan': 'vegan',
  'plant-based': 'vegan',
  'plant based': 'vegan',
  'gluten free': 'gluten-free',
  'gluten-free': 'gluten-free',
  'gf': 'gluten-free',
  'celiac': 'gluten-free',
  'coeliac': 'gluten-free',
  'dairy free': 'dairy-free',
  'dairy-free': 'dairy-free',
  'df': 'dairy-free',
  'lactose free': 'dairy-free',
  'lactose-free': 'dairy-free',
  'no dairy': 'dairy-free',
  'nut allergy': 'nut-allergy',
  'nut-allergy': 'nut-allergy',
  'no nuts': 'nut-allergy',
  'nut free': 'nut-allergy',
  'nut-free': 'nut-allergy',
  'peanut allergy': 'nut-allergy',
  'tree nut allergy': 'nut-allergy',
  'shellfish allergy': 'shellfish-allergy',
  'shellfish-allergy': 'shellfish-allergy',
  'no shellfish': 'shellfish-allergy',
  'shellfish free': 'shellfish-allergy',
  'halal': 'halal',
  'kosher': 'kosher',
}

/**
 * Parse a dietary string (comma or semicolon separated) into structured DietaryInfo
 */
function parseDietaryString(raw: string): DietaryInfo | undefined {
  if (!raw || !raw.trim()) return undefined

  const parts = raw.split(/[,;]/).map(p => p.trim().toLowerCase()).filter(Boolean)
  const restrictions: string[] = []
  const unknownParts: string[] = []

  for (const part of parts) {
    const normalized = DIETARY_SYNONYMS[part]
    if (normalized && DIETARY_OPTIONS.includes(normalized as typeof DIETARY_OPTIONS[number])) {
      if (!restrictions.includes(normalized)) {
        restrictions.push(normalized)
      }
    } else {
      // Check if part contains any known synonym
      let found = false
      for (const [synonym, value] of Object.entries(DIETARY_SYNONYMS)) {
        if (part.includes(synonym)) {
          if (!restrictions.includes(value)) {
            restrictions.push(value)
          }
          found = true
          break
        }
      }
      if (!found && part.length > 0) {
        unknownParts.push(part)
      }
    }
  }

  if (restrictions.length === 0 && unknownParts.length === 0) {
    return undefined
  }

  return {
    restrictions,
    notes: unknownParts.length > 0 ? unknownParts.join(', ') : undefined,
  }
}

// Map common job level synonyms to our standard options
const JOB_LEVEL_SYNONYMS: Record<string, JobLevel> = {
  'junior': 'junior',
  'jr': 'junior',
  'entry': 'junior',
  'entry level': 'junior',
  'entry-level': 'junior',
  'associate': 'junior',
  'mid': 'mid',
  'mid-level': 'mid',
  'mid level': 'mid',
  'intermediate': 'mid',
  'senior': 'senior',
  'sr': 'senior',
  'lead': 'senior',
  'principal': 'senior',
  'staff': 'senior',
  'executive': 'executive',
  'exec': 'executive',
  'director': 'executive',
  'vp': 'executive',
  'vice president': 'executive',
  'c-level': 'executive',
  'c level': 'executive',
  'ceo': 'executive',
  'cto': 'executive',
  'cfo': 'executive',
  'coo': 'executive',
  'manager': 'mid',
  'mgr': 'mid',
}

/**
 * Parse a job level string to our standard options
 */
function parseJobLevel(raw: string): JobLevel | undefined {
  if (!raw || !raw.trim()) return undefined

  const normalized = raw.trim().toLowerCase()

  // Direct match
  if (JOB_LEVEL_SYNONYMS[normalized]) {
    return JOB_LEVEL_SYNONYMS[normalized]
  }

  // Partial match
  for (const [synonym, level] of Object.entries(JOB_LEVEL_SYNONYMS)) {
    if (normalized.includes(synonym)) {
      return level
    }
  }

  // Check if it's a valid level directly
  if (JOB_LEVELS.includes(normalized as JobLevel)) {
    return normalized as JobLevel
  }

  return undefined
}

// Map common goal synonyms to our standard options
const GOAL_SYNONYMS: Record<string, NetworkingGoal> = {
  'mentor': 'find-mentor',
  'find mentor': 'find-mentor',
  'find-mentor': 'find-mentor',
  'mentee': 'find-mentor',
  'mentorship': 'find-mentor',
  'recruit': 'recruit',
  'recruiting': 'recruit',
  'hiring': 'recruit',
  'hire': 'recruit',
  'talent': 'recruit',
  'learn': 'learn',
  'learning': 'learn',
  'education': 'learn',
  'skills': 'learn',
  'network': 'network',
  'networking': 'network',
  'connections': 'network',
  'connect': 'network',
  'partner': 'partner',
  'partnership': 'partner',
  'partners': 'partner',
  'collaborate': 'partner',
  'collaboration': 'partner',
  'sell': 'sell',
  'sales': 'sell',
  'selling': 'sell',
  'customers': 'sell',
  'clients': 'sell',
  'invest': 'invest',
  'investment': 'invest',
  'investing': 'invest',
  'funding': 'invest',
  'raise': 'invest',
  'fundraise': 'invest',
}

/**
 * Parse a goals string (comma or semicolon separated) to our standard options
 */
function parseGoals(raw: string): NetworkingGoal[] | undefined {
  if (!raw || !raw.trim()) return undefined

  const parts = raw.split(/[,;]/).map(p => p.trim().toLowerCase()).filter(Boolean)
  const goals: NetworkingGoal[] = []

  for (const part of parts) {
    // Direct match
    let matched: NetworkingGoal | undefined

    if (GOAL_SYNONYMS[part]) {
      matched = GOAL_SYNONYMS[part]
    } else {
      // Partial match
      for (const [synonym, goal] of Object.entries(GOAL_SYNONYMS)) {
        if (part.includes(synonym)) {
          matched = goal
          break
        }
      }
    }

    // Check direct goal value
    if (!matched && NETWORKING_GOALS.includes(part as NetworkingGoal)) {
      matched = part as NetworkingGoal
    }

    if (matched && !goals.includes(matched)) {
      goals.push(matched)
    }
  }

  return goals.length > 0 ? goals : undefined
}

/**
 * Parse interests string (comma or semicolon separated)
 */
function parseInterests(raw: string): string[] | undefined {
  if (!raw || !raw.trim()) return undefined

  const parts = raw.split(/[,;]/).map(p => p.trim()).filter(Boolean)
  return parts.length > 0 ? parts : undefined
}

export function CsvUpload({
  onImportGuests,
  departmentLabel = "Department",
  guestLabel = "guest",
  guestLabelPlural = "guests",
  seatingType,
}: CsvUploadProps) {
  const [file, setFile] = React.useState<File | null>(null)
  const [headers, setHeaders] = React.useState<string[]>([])
  const [previewData, setPreviewData] = React.useState<string[][]>([])
  const [columnMapping, setColumnMapping] = React.useState<ColumnMapping>({
    firstName: null,
    lastName: null,
    fullName: null,
    department: null,
    email: null,
    phone: null,
    dietary: null,
    interests: null,
    jobLevel: null,
    goals: null,
    familyName: null,
    side: null,
    company: null,
    team: null,
    managementLevel: null,
    isVip: null,
  })
  const [allData, setAllData] = React.useState<string[][]>([])
  const [error, setError] = React.useState("")
  const [warning, setWarning] = React.useState("")
  const [useFullName, setUseFullName] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Create valid options for select dropdowns, filtering out empty headers
  // and using indices as keys to handle duplicates
  const headerOptions = React.useMemo(() => {
    return headers
      .map((header, index) => ({ header: header.trim(), index }))
      .filter(({ header }) => header !== "")
  }, [headers])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setError("")
    setWarning("")

    const fileExtension = selectedFile.name.split(".").pop()?.toLowerCase()

    try {
      if (fileExtension === "csv") {
        Papa.parse(selectedFile, {
          complete: (results) => {
            const data = results.data as string[][]
            if (data.length === 0) {
              setError("This file is empty.")
              return
            }

            const headerRow = data[0]
            const dataRows = data.slice(1).filter((row) => row.some((cell) => cell.trim()))

            // Check for empty or duplicate headers
            const emptyCount = headerRow.filter(h => !h.trim()).length
            const validHeaders = headerRow.filter(h => h.trim())

            if (validHeaders.length === 0) {
              setError("I cannot find column headers. Make sure the first row has names.")
              return
            }

            if (emptyCount > 0) {
              setWarning(`${emptyCount} empty column header${emptyCount > 1 ? 's were' : ' was'} found and will be skipped.`)
            }

            setHeaders(headerRow)
            setAllData(dataRows)
            setPreviewData(dataRows.slice(0, 3))
            autoDetectColumns(headerRow)
          },
          error: (err) => {
            setError(`I had trouble reading this file: ${err.message}`)
          },
        })
      } else {
        setError("I can only read .csv files.")
      }
    } catch (err) {
      setError(`I could not read this file: ${err instanceof Error ? err.message : "Unknown error"}`)
    }
  }

  const autoDetectColumns = (headerRow: string[]) => {
    const mapping: ColumnMapping = {
      firstName: null,
      lastName: null,
      fullName: null,
      department: null,
      email: null,
      phone: null,
      dietary: null,
      interests: null,
      jobLevel: null,
      goals: null,
      familyName: null,
      side: null,
      company: null,
      team: null,
      managementLevel: null,
      isVip: null,
    }

    let hasFirstName = false
    let hasLastName = false

    headerRow.forEach((header) => {
      const lowerHeader = header.toLowerCase().trim()

      if (lowerHeader.includes("first") && (lowerHeader.includes("name") || lowerHeader === "first")) {
        mapping.firstName = header
        hasFirstName = true
      } else if (lowerHeader.includes("last") && (lowerHeader.includes("name") || lowerHeader === "last")) {
        mapping.lastName = header
        hasLastName = true
        // Also use last name as family name if no explicit family name column
        if (!mapping.familyName) {
          mapping.familyName = header
        }
      } else if (
        lowerHeader === "name" ||
        lowerHeader === "full name" ||
        lowerHeader === "fullname" ||
        (lowerHeader.includes("name") && !lowerHeader.includes("first") && !lowerHeader.includes("last") && !lowerHeader.includes("department") && !lowerHeader.includes("family") && !lowerHeader.includes("company"))
      ) {
        mapping.fullName = header
      } else if (lowerHeader.includes("department") || lowerHeader.includes("dept") || lowerHeader.includes("group")) {
        mapping.department = header
      } else if (lowerHeader.includes("email") || lowerHeader.includes("e-mail")) {
        mapping.email = header
      } else if (lowerHeader.includes("phone") || lowerHeader.includes("tel") || lowerHeader.includes("mobile")) {
        mapping.phone = header
      } else if (
        lowerHeader.includes("dietary") ||
        lowerHeader.includes("diet") ||
        lowerHeader.includes("allerg") ||
        lowerHeader.includes("food") ||
        lowerHeader.includes("restriction") ||
        lowerHeader === "special requirements"
      ) {
        mapping.dietary = header
      } else if (
        lowerHeader.includes("interest") ||
        lowerHeader.includes("hobby") ||
        lowerHeader.includes("hobbies") ||
        lowerHeader === "topics"
      ) {
        mapping.interests = header
      } else if (
        lowerHeader.includes("job level") ||
        lowerHeader.includes("job_level") ||
        lowerHeader.includes("level") ||
        lowerHeader.includes("seniority") ||
        lowerHeader.includes("title") ||
        lowerHeader.includes("rank")
      ) {
        mapping.jobLevel = header
      } else if (
        lowerHeader.includes("goal") ||
        lowerHeader.includes("objective") ||
        lowerHeader.includes("looking for") ||
        lowerHeader.includes("seeking") ||
        lowerHeader.includes("purpose")
      ) {
        mapping.goals = header
      }
      // Event-type specific column detection
      else if (lowerHeader.includes("family") && lowerHeader.includes("name")) {
        mapping.familyName = header
      } else if (
        lowerHeader === "side" ||
        lowerHeader.includes("bride") ||
        lowerHeader.includes("groom")
      ) {
        mapping.side = header
      } else if (
        lowerHeader.includes("company") ||
        lowerHeader.includes("organization") ||
        lowerHeader.includes("org") ||
        lowerHeader.includes("employer")
      ) {
        mapping.company = header
      } else if (
        lowerHeader === "team" ||
        lowerHeader.includes("team name")
      ) {
        mapping.team = header
      } else if (
        lowerHeader.includes("management") ||
        lowerHeader.includes("manager") ||
        lowerHeader.includes("ic") ||
        lowerHeader.includes("individual contributor")
      ) {
        mapping.managementLevel = header
      } else if (
        lowerHeader === "vip" ||
        lowerHeader.includes("vip") ||
        lowerHeader.includes("special guest")
      ) {
        mapping.isVip = header
      }
    })

    // If we found first/last name columns, use that mode; otherwise use full name mode
    if (hasFirstName || hasLastName) {
      setUseFullName(false)
    } else if (mapping.fullName) {
      setUseFullName(true)
    }

    setColumnMapping(mapping)
  }

  const handleImport = () => {
    // Validate that name columns are selected
    if (useFullName) {
      if (!columnMapping.fullName) {
        setError("I need to know which column has the names.")
        return
      }
    } else {
      if (!columnMapping.firstName) {
        setError("I need to know which column has the first names.")
        return
      }
    }

    const firstNameIndex = columnMapping.firstName ? headers.indexOf(columnMapping.firstName) : -1
    const lastNameIndex = columnMapping.lastName ? headers.indexOf(columnMapping.lastName) : -1
    const fullNameIndex = columnMapping.fullName ? headers.indexOf(columnMapping.fullName) : -1
    const departmentIndex = columnMapping.department ? headers.indexOf(columnMapping.department) : -1
    const emailIndex = columnMapping.email ? headers.indexOf(columnMapping.email) : -1
    const phoneIndex = columnMapping.phone ? headers.indexOf(columnMapping.phone) : -1
    const dietaryIndex = columnMapping.dietary ? headers.indexOf(columnMapping.dietary) : -1
    const interestsIndex = columnMapping.interests ? headers.indexOf(columnMapping.interests) : -1
    const jobLevelIndex = columnMapping.jobLevel ? headers.indexOf(columnMapping.jobLevel) : -1
    const goalsIndex = columnMapping.goals ? headers.indexOf(columnMapping.goals) : -1
    // Event-type specific column indices
    const familyNameIndex = columnMapping.familyName ? headers.indexOf(columnMapping.familyName) : -1
    const sideIndex = columnMapping.side ? headers.indexOf(columnMapping.side) : -1
    const companyIndex = columnMapping.company ? headers.indexOf(columnMapping.company) : -1
    const teamIndex = columnMapping.team ? headers.indexOf(columnMapping.team) : -1
    const managementLevelIndex = columnMapping.managementLevel ? headers.indexOf(columnMapping.managementLevel) : -1
    const isVipIndex = columnMapping.isVip ? headers.indexOf(columnMapping.isVip) : -1

    const guests = allData
      .map((row) => {
        let name = ""

        if (useFullName && fullNameIndex >= 0) {
          name = (row[fullNameIndex] || "").trim()
        } else if (firstNameIndex >= 0) {
          const firstName = (row[firstNameIndex] || "").trim()
          const lastName = lastNameIndex >= 0 ? (row[lastNameIndex] || "").trim() : ""
          name = [firstName, lastName].filter(Boolean).join(" ")
        }

        if (!name) return null

        // Parse dietary data if column is mapped
        const dietaryRaw = dietaryIndex >= 0 ? row[dietaryIndex]?.trim() : undefined
        const dietary = dietaryRaw ? parseDietaryString(dietaryRaw) : undefined

        // Parse matching attributes
        const interestsRaw = interestsIndex >= 0 ? row[interestsIndex]?.trim() : undefined
        const jobLevelRaw = jobLevelIndex >= 0 ? row[jobLevelIndex]?.trim() : undefined
        const goalsRaw = goalsIndex >= 0 ? row[goalsIndex]?.trim() : undefined

        const interests = interestsRaw ? parseInterests(interestsRaw) : undefined
        const jobLevel = jobLevelRaw ? parseJobLevel(jobLevelRaw) : undefined
        const goals = goalsRaw ? parseGoals(goalsRaw) : undefined

        // Build attributes if any are present
        const hasAttributes = interests || jobLevel || goals
        const attributes: GuestAttributes | undefined = hasAttributes
          ? {
              interests,
              jobLevel,
              goals,
            }
          : undefined

        // Parse event-type specific fields
        const familyName = familyNameIndex >= 0 ? row[familyNameIndex]?.trim() || undefined : undefined
        const sideRaw = sideIndex >= 0 ? row[sideIndex]?.trim().toLowerCase() || "" : ""
        const side = sideRaw.includes("bride") ? "bride" : sideRaw.includes("groom") ? "groom" : sideRaw.includes("both") ? "both" : sideRaw || undefined
        const company = companyIndex >= 0 ? row[companyIndex]?.trim() || undefined : undefined
        const team = teamIndex >= 0 ? row[teamIndex]?.trim() || undefined : undefined
        const managementLevelRaw = managementLevelIndex >= 0 ? row[managementLevelIndex]?.trim().toLowerCase() || "" : ""
        const managementLevel = managementLevelRaw.includes("exec") ? "exec" :
          managementLevelRaw.includes("director") ? "director" :
          managementLevelRaw.includes("manager") || managementLevelRaw.includes("mgr") ? "manager" :
          managementLevelRaw.includes("ic") || managementLevelRaw.includes("individual") ? "ic" :
          managementLevelRaw || undefined
        const isVipRaw = isVipIndex >= 0 ? row[isVipIndex]?.trim().toLowerCase() || "" : ""
        const isVip = isVipRaw === "yes" || isVipRaw === "true" || isVipRaw === "1" || isVipRaw === "vip" ? true : undefined

        return {
          name,
          department: departmentIndex >= 0 ? row[departmentIndex]?.trim() || undefined : undefined,
          email: emailIndex >= 0 ? row[emailIndex]?.trim() || undefined : undefined,
          phone: phoneIndex >= 0 ? row[phoneIndex]?.trim() || undefined : undefined,
          dietary,
          attributes,
          familyName,
          side,
          company,
          team,
          managementLevel,
          isVip,
        }
      })
      .filter((guest): guest is NonNullable<typeof guest> => guest !== null)

    if (guests.length === 0) {
      setError(`I could not find any ${guestLabelPlural} in this file.`)
      return
    }

    onImportGuests(guests)
    handleReset()
  }

  const handleReset = () => {
    setFile(null)
    setHeaders([])
    setPreviewData([])
    setAllData([])
    setColumnMapping({
      firstName: null,
      lastName: null,
      fullName: null,
      department: null,
      email: null,
      phone: null,
      dietary: null,
      interests: null,
      jobLevel: null,
      goals: null,
      familyName: null,
      side: null,
      company: null,
      team: null,
      managementLevel: null,
      isVip: null,
    })
    setUseFullName(false)
    setError("")
    setWarning("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Check if we can import
  const canImport = useFullName ? !!columnMapping.fullName : !!columnMapping.firstName

  // Generate preview name for a row
  const getPreviewName = (row: string[]) => {
    if (useFullName && columnMapping.fullName) {
      const idx = headers.indexOf(columnMapping.fullName)
      return idx >= 0 ? row[idx] || "" : ""
    } else if (columnMapping.firstName) {
      const firstIdx = headers.indexOf(columnMapping.firstName)
      const lastIdx = columnMapping.lastName ? headers.indexOf(columnMapping.lastName) : -1
      const first = firstIdx >= 0 ? row[firstIdx] || "" : ""
      const last = lastIdx >= 0 ? row[lastIdx] || "" : ""
      return [first, last].filter(Boolean).join(" ")
    }
    return ""
  }

  // Generate preview dietary for a row
  const getPreviewDietary = (row: string[]) => {
    if (!columnMapping.dietary) return ""
    const idx = headers.indexOf(columnMapping.dietary)
    if (idx < 0) return ""
    const raw = row[idx] || ""
    const parsed = parseDietaryString(raw)
    if (!parsed) return raw
    const parts = [...parsed.restrictions]
    if (parsed.notes) parts.push(`(${parsed.notes})`)
    return parts.join(", ")
  }

  return (
    <div className="space-y-4">
      {!file ? (
        <div className="space-y-2">
          <Label htmlFor="file-upload">Upload CSV File</Label>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              id="file-upload"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full"
            >
              <Upload className="mr-2 size-4" />
              Choose File
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            I can read .csv files.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  File: {file.name}
                </CardTitle>
                <span className="text-sm text-muted-foreground">
                  {allData.length} rows found
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Name Mode Toggle */}
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={useFullName ? "outline" : "default"}
                  size="sm"
                  onClick={() => setUseFullName(false)}
                >
                  First + Last Name
                </Button>
                <Button
                  type="button"
                  variant={useFullName ? "default" : "outline"}
                  size="sm"
                  onClick={() => setUseFullName(true)}
                >
                  Full Name
                </Button>
              </div>

              {/* Column Mapping */}
              <div>
                <h3 className="text-sm font-medium mb-3">Column Mapping</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {useFullName ? (
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="fullname-column">
                        Full Name Column <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={columnMapping.fullName || "__none__"}
                        onValueChange={(value) =>
                          setColumnMapping({ ...columnMapping, fullName: value === "__none__" ? null : value })
                        }
                      >
                        <SelectTrigger id="fullname-column" className="w-full">
                          <SelectValue placeholder="Select column" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Select column...</SelectItem>
                          {headerOptions.map(({ header, index }) => (
                            <SelectItem key={index} value={header}>
                              {header}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="firstname-column">
                          First Name Column <span className="text-destructive">*</span>
                        </Label>
                        <Select
                          value={columnMapping.firstName || "__none__"}
                          onValueChange={(value) =>
                            setColumnMapping({ ...columnMapping, firstName: value === "__none__" ? null : value })
                          }
                        >
                          <SelectTrigger id="firstname-column" className="w-full">
                            <SelectValue placeholder="Select column" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">Select column...</SelectItem>
                            {headerOptions.map(({ header, index }) => (
                              <SelectItem key={index} value={header}>
                                {header}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="lastname-column">Last Name Column</Label>
                        <Select
                          value={columnMapping.lastName || "__none__"}
                          onValueChange={(value) =>
                            setColumnMapping({ ...columnMapping, lastName: value === "__none__" ? null : value })
                          }
                        >
                          <SelectTrigger id="lastname-column" className="w-full">
                            <SelectValue placeholder="Select column (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">None</SelectItem>
                            {headerOptions.map(({ header, index }) => (
                              <SelectItem key={index} value={header}>
                                {header}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="department-column">{departmentLabel} / Group</Label>
                    <Select
                      value={columnMapping.department || "__none__"}
                      onValueChange={(value) =>
                        setColumnMapping({ ...columnMapping, department: value === "__none__" ? null : value })
                      }
                    >
                      <SelectTrigger id="department-column" className="w-full">
                        <SelectValue placeholder="Select column (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">None</SelectItem>
                        {headerOptions.map(({ header, index }) => (
                          <SelectItem key={index} value={header}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email-column">Email</Label>
                    <Select
                      value={columnMapping.email || "__none__"}
                      onValueChange={(value) =>
                        setColumnMapping({ ...columnMapping, email: value === "__none__" ? null : value })
                      }
                    >
                      <SelectTrigger id="email-column" className="w-full">
                        <SelectValue placeholder="Select column (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">None</SelectItem>
                        {headerOptions.map(({ header, index }) => (
                          <SelectItem key={index} value={header}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone-column">Phone</Label>
                    <Select
                      value={columnMapping.phone || "__none__"}
                      onValueChange={(value) =>
                        setColumnMapping({ ...columnMapping, phone: value === "__none__" ? null : value })
                      }
                    >
                      <SelectTrigger id="phone-column" className="w-full">
                        <SelectValue placeholder="Select column (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">None</SelectItem>
                        {headerOptions.map(({ header, index }) => (
                          <SelectItem key={index} value={header}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dietary-column">Dietary / Allergies</Label>
                    <Select
                      value={columnMapping.dietary || "__none__"}
                      onValueChange={(value) =>
                        setColumnMapping({ ...columnMapping, dietary: value === "__none__" ? null : value })
                      }
                    >
                      <SelectTrigger id="dietary-column" className="w-full">
                        <SelectValue placeholder="Select column (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">None</SelectItem>
                        {headerOptions.map(({ header, index }) => (
                          <SelectItem key={index} value={header}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="interests-column">Interests</Label>
                    <Select
                      value={columnMapping.interests || "__none__"}
                      onValueChange={(value) =>
                        setColumnMapping({ ...columnMapping, interests: value === "__none__" ? null : value })
                      }
                    >
                      <SelectTrigger id="interests-column" className="w-full">
                        <SelectValue placeholder="Select column (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">None</SelectItem>
                        {headerOptions.map(({ header, index }) => (
                          <SelectItem key={index} value={header}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="jobLevel-column">Job Level</Label>
                    <Select
                      value={columnMapping.jobLevel || "__none__"}
                      onValueChange={(value) =>
                        setColumnMapping({ ...columnMapping, jobLevel: value === "__none__" ? null : value })
                      }
                    >
                      <SelectTrigger id="jobLevel-column" className="w-full">
                        <SelectValue placeholder="Select column (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">None</SelectItem>
                        {headerOptions.map(({ header, index }) => (
                          <SelectItem key={index} value={header}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="goals-column">Networking Goals</Label>
                    <Select
                      value={columnMapping.goals || "__none__"}
                      onValueChange={(value) =>
                        setColumnMapping({ ...columnMapping, goals: value === "__none__" ? null : value })
                      }
                    >
                      <SelectTrigger id="goals-column" className="w-full">
                        <SelectValue placeholder="Select column (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">None</SelectItem>
                        {headerOptions.map(({ header, index }) => (
                          <SelectItem key={index} value={header}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Preview */}
              {previewData.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-3">
                    Preview (First 3 Rows)
                  </h3>
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="bg-muted/50">Resulting Name</TableHead>
                          {columnMapping.department && <TableHead className="bg-muted/50">Department</TableHead>}
                          {columnMapping.dietary && <TableHead className="bg-muted/50">Dietary</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewData.map((row, idx) => {
                          const previewName = getPreviewName(row)
                          const deptIdx = columnMapping.department ? headers.indexOf(columnMapping.department) : -1
                          const previewDept = deptIdx >= 0 ? row[deptIdx] || "" : ""
                          const previewDietary = getPreviewDietary(row)
                          return (
                            <TableRow key={idx}>
                              <TableCell>
                                {previewName || (
                                  <span className="text-muted-foreground italic">
                                    Select columns to preview
                                  </span>
                                )}
                              </TableCell>
                              {columnMapping.department && (
                                <TableCell className="text-muted-foreground">
                                  {previewDept}
                                </TableCell>
                              )}
                              {columnMapping.dietary && (
                                <TableCell className="text-muted-foreground text-xs">
                                  {previewDietary}
                                </TableCell>
                              )}
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {warning && (
                <p className="text-sm text-amber-600 dark:text-amber-500">
                  Note: {warning}
                </p>
              )}

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleImport}
                  disabled={!canImport}
                  className="flex-1"
                >
                  Bring in {allData.length} {allData.length !== 1 ? guestLabelPlural : guestLabel}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {error && !file && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
