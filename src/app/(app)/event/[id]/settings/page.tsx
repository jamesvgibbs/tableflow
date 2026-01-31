"use client"

import * as React from "react"
import { use, useState, useCallback } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@convex/_generated/api"
import { Id } from "@convex/_generated/dataModel"
import { toast } from "sonner"
import {
  Palette,
  Type,
  Globe,
  Calendar,
  Bell,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { ThemeColors } from "@/lib/theme-presets"
import { type EventTypeSettings } from "@/lib/event-types"

import { ThemeCustomizer } from "@/components/theme-customizer"
import { TerminologyCustomizer } from "@/components/terminology-customizer"
import { SeatherderLoading } from "@/components/seatherder-loading"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface PageProps {
  params: Promise<{ id: string }>
}

type Section = "appearance" | "terminology" | "portal"

const sections = [
  { id: "appearance" as Section, label: "Appearance", icon: Palette, description: "Theme and colors" },
  { id: "terminology" as Section, label: "Terminology", icon: Type, description: "Custom labels" },
  { id: "portal" as Section, label: "Guest Portal", icon: Globe, description: "Self-service settings" },
]

export default function SettingsPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const eventId = resolvedParams.id as Id<"events">
  const [activeSection, setActiveSection] = useState<Section>("appearance")

  // Query event data
  const event = useQuery(api.events.get, { id: eventId })

  // Mutations
  const updateThemePreset = useMutation(api.events.updateThemePreset)
  const updateCustomColors = useMutation(api.events.updateCustomColors)
  const updateEventTypeSettings = useMutation(api.events.updateEventTypeSettings)
  const updateSelfServiceSettings = useMutation(api.events.updateSelfServiceSettings)

  // Theme handlers
  const handleThemePresetChange = useCallback(
    async (preset: string | undefined) => {
      try {
        await updateThemePreset({ id: eventId, themePreset: preset })
      } catch {
        toast.error("I could not update the theme.")
      }
    },
    [eventId, updateThemePreset]
  )

  const handleCustomColorsChange = useCallback(
    async (colors: ThemeColors | undefined) => {
      try {
        await updateCustomColors({ id: eventId, customColors: colors })
      } catch {
        toast.error("I could not update the colors.")
      }
    },
    [eventId, updateCustomColors]
  )

  // Terminology handler
  const handleTerminologyChange = useCallback(
    async (settings: EventTypeSettings) => {
      try {
        await updateEventTypeSettings({ id: eventId, eventTypeSettings: settings })
      } catch {
        toast.error("I could not update the terminology.")
      }
    },
    [eventId, updateEventTypeSettings]
  )

  // Self-service settings handlers
  const handleUpdateSelfServiceDeadline = useCallback(
    async (deadline: string | null) => {
      try {
        await updateSelfServiceSettings({
          id: eventId,
          selfServiceDeadline: deadline,
        })
        toast.success(deadline ? "Deadline set." : "Deadline cleared.")
      } catch {
        toast.error("I could not update the deadline.")
      }
    },
    [eventId, updateSelfServiceSettings]
  )

  const handleUpdateSelfServiceNotifications = useCallback(
    async (enabled: boolean) => {
      try {
        await updateSelfServiceSettings({
          id: eventId,
          selfServiceNotificationsEnabled: enabled,
        })
      } catch {
        toast.error("I could not update notifications.")
      }
    },
    [eventId, updateSelfServiceSettings]
  )

  // Loading state
  if (event === undefined) {
    return <SeatherderLoading message="Loading settings..." />
  }

  // Not found
  if (event === null) {
    return (
      <div className="flex items-center justify-center p-8">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Event not found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This event does not exist or has been deleted.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="bg-background">
      <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Customize how your event looks and behaves.
          </p>
        </div>

        {/* Two-column layout */}
        <div className="flex flex-col md:flex-row gap-8">
          {/* Section Navigation */}
          <nav className="md:w-56 shrink-0">
            <div className="flex flex-row md:flex-col gap-1">
              {sections.map((section) => {
                const Icon = section.icon
                const isActive = activeSection === section.id
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors w-full",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    <div className="min-w-0">
                      <div className="font-medium text-sm">{section.label}</div>
                      <div className={cn(
                        "text-xs truncate hidden md:block",
                        isActive ? "text-primary-foreground/70" : "text-muted-foreground"
                      )}>
                        {section.description}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </nav>

          {/* Content Area */}
          <div className="flex-1 min-w-0">
            {/* Appearance Section */}
            {activeSection === "appearance" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="size-5" />
                    Appearance
                  </CardTitle>
                  <CardDescription>
                    Choose a color theme for guest check-in screens and the live round timer.
                    These colors help your event feel cohesive and on-brand.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ThemeCustomizer
                    themePreset={event.themePreset}
                    customColors={event.customColors}
                    onThemePresetChange={handleThemePresetChange}
                    onCustomColorsChange={handleCustomColorsChange}
                  />
                </CardContent>
              </Card>
            )}

            {/* Terminology Section */}
            {activeSection === "terminology" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Type className="size-5" />
                    Terminology
                  </CardTitle>
                  <CardDescription>
                    Customize how I refer to attendees, seating, and groups throughout your event.
                    For example, change &quot;Guest&quot; to &quot;Attendee&quot; or &quot;Table&quot; to &quot;Pod&quot;.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TerminologyCustomizer
                    eventType={event.eventType}
                    eventTypeSettings={event.eventTypeSettings}
                    onSettingsChange={handleTerminologyChange}
                  />
                </CardContent>
              </Card>
            )}

            {/* Guest Portal Section */}
            {activeSection === "portal" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="size-5" />
                    Guest Portal
                  </CardTitle>
                  <CardDescription>
                    Allow guests to update their own information through a personal link.
                    You can set a deadline and choose whether to receive notifications.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Deadline Setting */}
                  <div className="space-y-3">
                    <Label htmlFor="deadline" className="flex items-center gap-2">
                      <Calendar className="size-4 text-muted-foreground" />
                      Update Deadline
                    </Label>
                    <Input
                      id="deadline"
                      type="datetime-local"
                      value={
                        event.selfServiceDeadline
                          ? new Date(event.selfServiceDeadline).toISOString().slice(0, 16)
                          : ""
                      }
                      onChange={(e) => {
                        const value = e.target.value
                        if (value) {
                          handleUpdateSelfServiceDeadline(new Date(value).toISOString())
                        } else {
                          handleUpdateSelfServiceDeadline(null)
                        }
                      }}
                      className="max-w-xs"
                    />
                    <p className="text-sm text-muted-foreground">
                      After this time, guests will no longer be able to update their information.
                    </p>
                    {event.selfServiceDeadline && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUpdateSelfServiceDeadline(null)}
                        className="text-destructive hover:text-destructive"
                      >
                        Clear deadline
                      </Button>
                    )}
                  </div>

                  {/* Notifications Toggle */}
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center gap-3">
                      <Bell className="size-5 text-muted-foreground" />
                      <div className="space-y-0.5">
                        <Label htmlFor="notifications" className="font-medium">
                          Email Notifications
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Get notified when guests update their information.
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="notifications"
                      checked={event.selfServiceNotificationsEnabled ?? false}
                      onCheckedChange={handleUpdateSelfServiceNotifications}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
