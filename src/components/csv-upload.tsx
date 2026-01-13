"use client"

import * as React from "react"
import Papa from "papaparse"
import * as XLSX from "xlsx"
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

interface CsvUploadProps {
  onImportGuests: (
    guests: {
      name: string
      department?: string
      email?: string
      phone?: string
    }[]
  ) => void
}

type ColumnMapping = {
  firstName: string | null
  lastName: string | null
  fullName: string | null
  department: string | null
  email: string | null
  phone: string | null
}

export function CsvUpload({ onImportGuests }: CsvUploadProps) {
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
              setError("CSV file is empty")
              return
            }

            const headerRow = data[0]
            const dataRows = data.slice(1).filter((row) => row.some((cell) => cell.trim()))

            // Check for empty or duplicate headers
            const emptyCount = headerRow.filter(h => !h.trim()).length
            const validHeaders = headerRow.filter(h => h.trim())

            if (validHeaders.length === 0) {
              setError("No valid column headers found. Please ensure your file has at least one non-empty column header in the first row.")
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
            setError(`Error parsing CSV: ${err.message}`)
          },
        })
      } else if (fileExtension === "xlsx" || fileExtension === "xls") {
        const arrayBuffer = await selectedFile.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer, { type: "array" })
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        const data = XLSX.utils.sheet_to_json<string[]>(firstSheet, {
          header: 1,
          defval: "",
        })

        if (data.length === 0) {
          setError("Excel file is empty")
          return
        }

        const headerRow = data[0].map(String)
        const dataRows = data.slice(1).filter((row) => row.some((cell) => cell.toString().trim()))

        // Check for empty or duplicate headers
        const emptyCount = headerRow.filter(h => !h.trim()).length
        const validHeaders = headerRow.filter(h => h.trim())

        if (validHeaders.length === 0) {
          setError("No valid column headers found. Please ensure your file has at least one non-empty column header in the first row.")
          return
        }

        if (emptyCount > 0) {
          setWarning(`${emptyCount} empty column header${emptyCount > 1 ? 's were' : ' was'} found and will be skipped.`)
        }

        setHeaders(headerRow)
        setAllData(dataRows.map((row) => row.map(String)))
        setPreviewData(dataRows.slice(0, 3).map((row) => row.map(String)))
        autoDetectColumns(headerRow)
      } else {
        setError("Unsupported file type. Please use .csv, .xlsx, or .xls")
      }
    } catch (err) {
      setError(`Error reading file: ${err instanceof Error ? err.message : "Unknown error"}`)
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
      } else if (
        lowerHeader === "name" ||
        lowerHeader === "full name" ||
        lowerHeader === "fullname" ||
        (lowerHeader.includes("name") && !lowerHeader.includes("first") && !lowerHeader.includes("last") && !lowerHeader.includes("department"))
      ) {
        mapping.fullName = header
      } else if (lowerHeader.includes("department") || lowerHeader.includes("dept") || lowerHeader.includes("group")) {
        mapping.department = header
      } else if (lowerHeader.includes("email") || lowerHeader.includes("e-mail")) {
        mapping.email = header
      } else if (lowerHeader.includes("phone") || lowerHeader.includes("tel") || lowerHeader.includes("mobile")) {
        mapping.phone = header
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
        setError("Full Name column is required")
        return
      }
    } else {
      if (!columnMapping.firstName) {
        setError("First Name column is required")
        return
      }
    }

    const firstNameIndex = columnMapping.firstName ? headers.indexOf(columnMapping.firstName) : -1
    const lastNameIndex = columnMapping.lastName ? headers.indexOf(columnMapping.lastName) : -1
    const fullNameIndex = columnMapping.fullName ? headers.indexOf(columnMapping.fullName) : -1
    const departmentIndex = columnMapping.department ? headers.indexOf(columnMapping.department) : -1
    const emailIndex = columnMapping.email ? headers.indexOf(columnMapping.email) : -1
    const phoneIndex = columnMapping.phone ? headers.indexOf(columnMapping.phone) : -1

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

        return {
          name,
          department: departmentIndex >= 0 ? row[departmentIndex]?.trim() || undefined : undefined,
          email: emailIndex >= 0 ? row[emailIndex]?.trim() || undefined : undefined,
          phone: phoneIndex >= 0 ? row[phoneIndex]?.trim() || undefined : undefined,
        }
      })
      .filter((guest): guest is NonNullable<typeof guest> => guest !== null)

    if (guests.length === 0) {
      setError("No valid guests found in the file")
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

  return (
    <div className="space-y-4">
      {!file ? (
        <div className="space-y-2">
          <Label htmlFor="file-upload">Upload CSV or Excel File</Label>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              id="file-upload"
              type="file"
              accept=".csv,.xlsx,.xls"
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
            Accepts .csv, .xlsx, and .xls files
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
                    <Label htmlFor="department-column">Department / Group</Label>
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
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewData.map((row, idx) => {
                          const previewName = getPreviewName(row)
                          const deptIdx = columnMapping.department ? headers.indexOf(columnMapping.department) : -1
                          const previewDept = deptIdx >= 0 ? row[deptIdx] || "" : ""
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
                  Import {allData.length} Guest{allData.length !== 1 ? "s" : ""}
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
