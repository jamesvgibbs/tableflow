"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { Id } from "@convex/_generated/dataModel"
import { ArrowLeft } from "lucide-react"

import { MatchingConfig } from "@/components/matching-config"
import { SeatherderLoading } from "@/components/seatherder-loading"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface PageProps {
  params: Promise<{ id: string }>
}

export default function MatchingSettingsPage({ params }: PageProps) {
  const router = useRouter()
  const [eventId, setEventId] = React.useState<Id<"events"> | null>(null)

  // Load params on mount
  React.useEffect(() => {
    async function loadParams() {
      const resolvedParams = await params
      setEventId(resolvedParams.id as Id<"events">)
    }
    loadParams()
  }, [params])

  // Fetch event to check it exists
  const event = useQuery(
    api.events.get,
    eventId ? { id: eventId } : "skip"
  )

  // Loading state
  if (!eventId || event === undefined) {
    return <SeatherderLoading message="I am loading the matching settings..." />
  }

  // Not found state
  if (event === null) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Event Not Found</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              The event you&apos;re looking for doesn&apos;t exist or has been deleted.
            </p>
            <Button onClick={() => router.push("/admin")} className="w-full">
              <ArrowLeft className="mr-2 size-4" />
              Back to Admin
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-2xl">
        {/* Header */}
        <div className="space-y-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/event/${eventId}`)}
            className="gap-2"
          >
            <ArrowLeft className="size-4" />
            Back to {event.name}
          </Button>

          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-bold">Tell me how to seat your guests</h1>
            <p className="text-muted-foreground">
              I will use your preferences when I assign tables.
            </p>
          </div>
        </div>

        {/* Matching Config */}
        <MatchingConfig eventId={eventId} />
      </div>
    </div>
  )
}
