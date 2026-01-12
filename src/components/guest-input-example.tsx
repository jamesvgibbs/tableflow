"use client"

import * as React from "react"
import { GuestForm } from "@/components/guest-form"
import { BulkEntry } from "@/components/bulk-entry"
import { CsvUpload } from "@/components/csv-upload"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

/**
 * Example usage of guest input components.
 * This demonstrates how to integrate all three input methods into a single interface.
 */
export function GuestInputExample() {
  const [guests, setGuests] = React.useState<
    Array<{
      name: string
      department?: string
      email?: string
      phone?: string
    }>
  >([])

  const handleAddGuest = (guest: {
    name: string
    department?: string
    email?: string
    phone?: string
  }) => {
    setGuests((prev) => [...prev, guest])
    console.log("Added guest:", guest)
  }

  const handleAddGuests = (
    newGuests: Array<{
      name: string
      department?: string
      email?: string
      phone?: string
    }>
  ) => {
    setGuests((prev) => [...prev, ...newGuests])
    console.log(`Added ${newGuests.length} guests:`, newGuests)
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Guest Input Components</h1>
        <p className="text-muted-foreground mt-2">
          Choose your preferred method to add guests
        </p>
      </div>

      <Tabs defaultValue="single" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="single">Single Entry</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Entry</TabsTrigger>
          <TabsTrigger value="upload">CSV/Excel Upload</TabsTrigger>
        </TabsList>

        <TabsContent value="single" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Add Single Guest</CardTitle>
            </CardHeader>
            <CardContent>
              <GuestForm onAddGuest={handleAddGuest} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Guest Entry</CardTitle>
            </CardHeader>
            <CardContent>
              <BulkEntry onAddGuests={handleAddGuests} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upload" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>CSV/Excel Upload</CardTitle>
            </CardHeader>
            <CardContent>
              <CsvUpload onImportGuests={handleAddGuests} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {guests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Added Guests ({guests.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {guests.map((guest, idx) => (
                <div
                  key={idx}
                  className="p-3 border rounded-md bg-muted/30 text-sm"
                >
                  <div className="font-medium">{guest.name}</div>
                  {guest.department && (
                    <div className="text-muted-foreground">
                      Department: {guest.department}
                    </div>
                  )}
                  {guest.email && (
                    <div className="text-muted-foreground">
                      Email: {guest.email}
                    </div>
                  )}
                  {guest.phone && (
                    <div className="text-muted-foreground">
                      Phone: {guest.phone}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
