"use client"

import * as React from "react"
import { Eye, Send, Info, Sparkles, Replace } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface EmailComposerProps {
  /** Email type being composed */
  emailType: "invitation" | "confirmation" | "custom"
  /** Initial subject line */
  defaultSubject?: string
  /** Initial body content */
  defaultBody?: string
  /** Event name for preview */
  eventName?: string
  /** Sample guest name for preview */
  sampleGuestName?: string
  /** Sample table number for preview */
  sampleTableNumber?: number
  /** Called when the email is ready to send */
  onSend?: (email: { subject: string; body: string }) => void
  /** Called when content changes */
  onChange?: (email: { subject: string; body: string }) => void
  /** Whether to show the send button */
  showSendButton?: boolean
  /** Whether sending is in progress */
  isSending?: boolean
}

// Available placeholders for email templates
const PLACEHOLDERS = [
  { key: "{{guest_name}}", label: "Guest Name", description: "The guest's full name" },
  { key: "{{event_name}}", label: "Event Name", description: "Your event's name" },
  { key: "{{table_number}}", label: "Table Number", description: "Their assigned table" },
  { key: "{{qr_code_url}}", label: "QR Code", description: "Check-in QR code link" },
]

// Default templates with Seatherder voice
const DEFAULT_TEMPLATES = {
  invitation: {
    subject: "You are invited: {{event_name}}",
    body: `Hello {{guest_name}},

I am inviting you to {{event_name}}.

I have a QR code for you: {{qr_code_url}}

Show this when you arrive. I will remember you.

See you there,
Seatherder 🐕`,
  },
  confirmation: {
    subject: "You are checked in: {{event_name}}",
    body: `Hello {{guest_name}},

I have you checked in to {{event_name}}.

Your table is {{table_number}}. I chose it carefully.

Enjoy the event,
Seatherder 🐕`,
  },
  custom: {
    subject: "",
    body: "",
  },
}

export function EmailComposer({
  emailType,
  defaultSubject,
  defaultBody,
  eventName = "Your Event",
  sampleGuestName = "Alex Johnson",
  sampleTableNumber = 7,
  onSend,
  onChange,
  showSendButton = true,
  isSending = false,
}: EmailComposerProps) {
  const template = DEFAULT_TEMPLATES[emailType]
  const [subject, setSubject] = React.useState(defaultSubject ?? template.subject)
  const [body, setBody] = React.useState(defaultBody ?? template.body)
  const [activeTab, setActiveTab] = React.useState<"edit" | "preview">("edit")

  // Notify parent of changes
  React.useEffect(() => {
    onChange?.({ subject, body })
  }, [subject, body, onChange])

  // Replace placeholders with sample values for preview
  const renderPreview = (text: string) => {
    return text
      .replace(/\{\{guest_name\}\}/g, sampleGuestName)
      .replace(/\{\{event_name\}\}/g, eventName)
      .replace(/\{\{table_number\}\}/g, String(sampleTableNumber))
      .replace(/\{\{qr_code_url\}\}/g, "[QR Code Link]")
  }

  // Insert placeholder at cursor position
  const insertPlaceholder = (placeholder: string) => {
    const textarea = document.getElementById("email-body") as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newBody = body.slice(0, start) + placeholder + body.slice(end)
    setBody(newBody)

    // Restore focus and cursor position
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + placeholder.length, start + placeholder.length)
    }, 0)
  }

  // Reset to default template
  const handleReset = () => {
    setSubject(template.subject)
    setBody(template.body)
  }

  // Handle send
  const handleSend = () => {
    onSend?.({ subject, body })
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Subject Line */}
        <div className="space-y-2">
          <Label htmlFor="email-subject">Subject Line</Label>
          <Input
            id="email-subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="What should the subject say?"
          />
          <p className="text-xs text-muted-foreground">
            Placeholders work here too.
          </p>
        </div>

        <Separator />

        {/* Main Content Area with Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "edit" | "preview")}>
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="edit" className="gap-2">
                <Sparkles className="size-4" />
                Write
              </TabsTrigger>
              <TabsTrigger value="preview" className="gap-2">
                <Eye className="size-4" />
                Preview
              </TabsTrigger>
            </TabsList>

            {emailType !== "custom" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="gap-1 text-muted-foreground"
              >
                <Replace className="size-3" />
                Reset to default
              </Button>
            )}
          </div>

          <TabsContent value="edit" className="space-y-4 mt-4">
            {/* Placeholder Reference */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Info className="size-4" />
                  Placeholders
                </CardTitle>
                <CardDescription className="text-xs">
                  Click to insert. I will replace these with real values.
                </CardDescription>
              </CardHeader>
              <CardContent className="py-2">
                <div className="flex flex-wrap gap-2">
                  {PLACEHOLDERS.map((p) => (
                    <Tooltip key={p.key}>
                      <TooltipTrigger asChild>
                        <Badge
                          variant="outline"
                          className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors font-mono text-xs"
                          onClick={() => insertPlaceholder(p.key)}
                        >
                          {p.key}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-medium">{p.label}</p>
                        <p className="text-xs text-muted-foreground">{p.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Email Body Editor */}
            <div className="space-y-2">
              <Label htmlFor="email-body">Message</Label>
              <Textarea
                id="email-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your message here..."
                className="min-h-[300px] font-mono text-sm resize-y"
              />
              <p className="text-xs text-muted-foreground">
                Plain text. I do not support HTML yet. Keep it simple.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="mt-4">
            <Card>
              <CardHeader className="py-3 border-b">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Subject:</p>
                  <p className="font-medium">{renderPreview(subject) || "(no subject)"}</p>
                </div>
              </CardHeader>
              <CardContent className="py-4">
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {renderPreview(body) || (
                    <span className="text-muted-foreground italic">
                      Write something. I will show you how it looks.
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
            <p className="text-xs text-muted-foreground mt-2">
              This is how {sampleGuestName} would see it. Each guest gets their own values.
            </p>
          </TabsContent>
        </Tabs>

        {/* Send Button */}
        {showSendButton && onSend && (
          <>
            <Separator />
            <Button
              onClick={handleSend}
              disabled={!subject.trim() || !body.trim() || isSending}
              className="w-full gap-2"
              size="lg"
            >
              <Send className="size-4" />
              {isSending ? "Sending..." : "I am ready. Send it."}
            </Button>
          </>
        )}
      </div>
    </TooltipProvider>
  )
}
