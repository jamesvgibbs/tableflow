"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useQuery, useMutation, useAction } from "convex/react"
import { api } from "@convex/_generated/api"
import { Id } from "@convex/_generated/dataModel"
import {
  Mail,
  Send,
  Upload,
  Trash2,
  Settings,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  FileText,
  Loader2,
  Info,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { SeatherderLoading } from "@/components/seatherder-loading"
interface PageProps {
  params: Promise<{ id: string }>
}

export default function EmailsPage({ params }: PageProps) {
  const router = useRouter()

  // Use React.use() for Next.js 15+ async params
  const resolvedParams = React.use(params)
  const eventId = resolvedParams.id as Id<"events">

  // Email settings form state
  const [senderName, setSenderName] = React.useState("")
  const [replyTo, setReplyTo] = React.useState("")
  const [invitationSubject, setInvitationSubject] = React.useState("")
  const [confirmationSubject, setConfirmationSubject] = React.useState("")
  const [settingsChanged, setSettingsChanged] = React.useState(false)

  // Dialog state
  const [showSendDialog, setShowSendDialog] = React.useState(false)
  const [isSending, setIsSending] = React.useState(false)
  const [sendProgress, setSendProgress] = React.useState<{
    sent: number
    total: number
    errors: string[]
  } | null>(null)

  // File upload state
  const [isUploading, setIsUploading] = React.useState(false)

  // Test email state
  const [showTestEmailDialog, setShowTestEmailDialog] = React.useState(false)
  const [testEmailAddress, setTestEmailAddress] = React.useState("")
  const [isSendingTestEmail, setIsSendingTestEmail] = React.useState(false)

  // Convex queries
  const event = useQuery(api.events.get, { id: eventId })
  const emailStats = useQuery(api.email.getEmailStats, { eventId })
  const emailLogs = useQuery(api.email.getEmailLogsByEvent, { eventId })
  const attachments = useQuery(api.attachments.getByEvent, { eventId })

  // Convex mutations and actions
  const updateEmailSettings = useMutation(api.events.updateEmailSettings)
  const generateUploadUrl = useMutation(api.attachments.generateUploadUrl)
  const saveAttachment = useMutation(api.attachments.saveAttachment)
  const deleteAttachment = useMutation(api.attachments.deleteAttachment)
  const sendBulkInvitations = useMutation(api.email.sendBulkInvitations)
  const sendTestEmail = useAction(api.email.sendTestEmail)

  // Sync settings from event
  React.useEffect(() => {
    if (event?.emailSettings) {
      setSenderName(event.emailSettings.senderName || "")
      setReplyTo(event.emailSettings.replyTo || "")
      setInvitationSubject(event.emailSettings.invitationSubject || "")
      setConfirmationSubject(event.emailSettings.confirmationSubject || "")
      setSettingsChanged(false)
    }
  }, [event?.emailSettings])

  // Track settings changes
  const handleSettingsChange = (field: string, value: string) => {
    switch (field) {
      case "senderName":
        setSenderName(value)
        break
      case "replyTo":
        setReplyTo(value)
        break
      case "invitationSubject":
        setInvitationSubject(value)
        break
      case "confirmationSubject":
        setConfirmationSubject(value)
        break
    }
    setSettingsChanged(true)
  }

  // Save email settings
  const handleSaveSettings = async () => {
    if (!senderName.trim()) {
      toast.error("Sender name is required")
      return
    }

    try {
      await updateEmailSettings({
        id: eventId,
        emailSettings: {
          senderName: senderName.trim(),
          replyTo: replyTo.trim() || undefined,
          invitationSubject: invitationSubject.trim() || undefined,
          confirmationSubject: confirmationSubject.trim() || undefined,
        },
      })
      setSettingsChanged(false)
      toast.success("Email settings saved")
    } catch {
      toast.error("Failed to save settings")
    }
  }

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    const file = e.target.files[0]
    const maxSize = 10 * 1024 * 1024 // 10MB

    if (file.size > maxSize) {
      toast.error("File is too large. Maximum size is 10MB.")
      return
    }

    setIsUploading(true)
    try {
      // Get upload URL
      const uploadUrl = await generateUploadUrl()

      // Upload file
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      })

      if (!response.ok) {
        throw new Error("Upload failed")
      }

      const { storageId } = await response.json()

      // Save attachment metadata
      await saveAttachment({
        eventId,
        filename: file.name,
        storageId,
        contentType: file.type,
        size: file.size,
      })

      toast.success(`Uploaded ${file.name}`)
    } catch {
      toast.error("Failed to upload file")
    } finally {
      setIsUploading(false)
      // Reset file input
      e.target.value = ""
    }
  }

  // Delete attachment
  const handleDeleteAttachment = async (attachmentId: Id<"emailAttachments">) => {
    try {
      await deleteAttachment({ id: attachmentId })
      toast.success("Attachment deleted")
    } catch {
      toast.error("Failed to delete attachment")
    }
  }

  // Send bulk invitations (queued for rate-limited delivery)
  const handleSendInvitations = async () => {
    setIsSending(true)
    setSendProgress(null)

    try {
      const result = await sendBulkInvitations({
        eventId,
        baseUrl: window.location.origin,
      })

      setSendProgress({
        sent: result.queued,
        total: result.queued + result.skipped,
        errors: [],
      })

      if (result.queued > 0) {
        toast.success(
          `Queued ${result.queued} invitation${result.queued !== 1 ? "s" : ""} for delivery`
        )
      } else if (result.message) {
        toast.info(result.message)
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to queue invitations"
      )
    } finally {
      setIsSending(false)
    }
  }

  // Send test email
  const handleSendTestEmail = async () => {
    if (!testEmailAddress.trim()) {
      toast.error("Please enter an email address")
      return
    }

    setIsSendingTestEmail(true)

    try {
      const result = await sendTestEmail({
        eventId,
        toEmail: testEmailAddress.trim(),
      })

      if (result.success) {
        toast.success(`Test email sent to ${testEmailAddress}`)
        setShowTestEmailDialog(false)
        setTestEmailAddress("")
      } else {
        toast.error(result.error || "Failed to send test email")
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send test email")
    } finally {
      setIsSendingTestEmail(false)
    }
  }

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="size-3" />
            Sent
          </Badge>
        )
      case "delivered":
        return (
          <Badge variant="default" className="gap-1 bg-green-600">
            <CheckCircle className="size-3" />
            Delivered
          </Badge>
        )
      case "bounced":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="size-3" />
            Bounced
          </Badge>
        )
      case "failed":
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="size-3" />
            Failed
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Loading state
  if (event === undefined) {
    return <SeatherderLoading message="I am loading the email settings..." />
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
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div>
        <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-4xl">
          {/* Header */}
          <div className="space-y-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">I can send your invitations</h1>
            </div>

            <Separator />
          </div>

          {/* Stats Cards */}
          {emailStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{emailStats.guestsWithEmail}</div>
                  <p className="text-xs text-muted-foreground">Guests with Email</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{emailStats.invitationsSent}</div>
                  <p className="text-xs text-muted-foreground">Invitations Sent</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-green-600">
                    {emailStats.byStatus.delivered}
                  </div>
                  <p className="text-xs text-muted-foreground">Delivered</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-red-600">
                    {emailStats.byStatus.bounced + emailStats.byStatus.failed}
                  </div>
                  <p className="text-xs text-muted-foreground">Failed/Bounced</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Main Content */}
          <Tabs defaultValue="send" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="send">Send Emails</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            {/* Send Tab */}
            <TabsContent value="send" className="space-y-6">
              {/* Attachments Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="size-5" />
                    Event Attachments
                  </CardTitle>
                  <CardDescription>
                    I can attach files to your invitations.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Upload Button */}
                  <div>
                    <Label
                      htmlFor="file-upload"
                      className="cursor-pointer inline-flex items-center gap-2"
                    >
                      <Button variant="outline" asChild disabled={isUploading}>
                        <span>
                          {isUploading ? (
                            <Loader2 className="mr-2 size-4 animate-spin" />
                          ) : (
                            <Upload className="mr-2 size-4" />
                          )}
                          Upload File
                        </span>
                      </Button>
                    </Label>
                    <Input
                      id="file-upload"
                      type="file"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                      accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.gif"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Max file size: 10MB. Supported: PDF, Word, images.
                    </p>
                  </div>

                  {/* Attachments List */}
                  {attachments && attachments.length > 0 ? (
                    <div className="space-y-2">
                      {attachments.map((attachment) => (
                        <div
                          key={attachment._id}
                          className="flex items-center justify-between p-3 rounded-lg border"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <FileText className="size-5 text-muted-foreground shrink-0" />
                            <div className="min-w-0">
                              <p className="font-medium truncate">
                                {attachment.filename}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatFileSize(attachment.size)} &middot;{" "}
                                {formatDate(attachment.uploadedAt)}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteAttachment(attachment._id)}
                            className="shrink-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      No attachments yet. Your invitations will be text-only.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Send Invitations Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="size-5" />
                    Send Invitations
                  </CardTitle>
                  <CardDescription>
                    I will send invitations to guests who have not gotten one yet.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {emailStats && (
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <div>
                        <span className="font-medium">
                          {emailStats.guestsWithEmail - emailStats.invitationsSent}
                        </span>{" "}
                        <span className="text-muted-foreground">guests to email</span>
                      </div>
                      <div className="text-muted-foreground">
                        {emailStats.invitationsSent} already sent
                      </div>
                      {emailStats.guestsWithoutEmail > 0 && (
                        <div className="text-yellow-600">
                          {emailStats.guestsWithoutEmail} without email
                        </div>
                      )}
                    </div>
                  )}

                  {!event.emailSettings?.senderName && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 text-yellow-800 dark:text-yellow-200">
                      <Info className="size-4 mt-0.5 shrink-0" />
                      <p className="text-sm">
                        Configure email settings before sending invitations.
                      </p>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      size="lg"
                      onClick={() => setShowSendDialog(true)}
                      disabled={
                        !event.emailSettings?.senderName ||
                        !emailStats ||
                        emailStats.guestsWithEmail - emailStats.invitationsSent === 0
                      }
                      className="flex-1 gap-2"
                    >
                      <Mail className="size-5" />
                      Send Invitations
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => setShowTestEmailDialog(true)}
                      disabled={!event?.emailSettings?.senderName}
                      className="gap-2"
                    >
                      <Send className="size-5" />
                      Send Test Email
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="size-5" />
                    Email Settings
                  </CardTitle>
                  <CardDescription>
                    Tell me how to sign your emails.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="sender-name">Sender Name *</Label>
                    <Input
                      id="sender-name"
                      placeholder="e.g., Company Events Team"
                      value={senderName}
                      onChange={(e) => handleSettingsChange("senderName", e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      The name that appears in the &quot;From&quot; field
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reply-to">Reply-To Email</Label>
                    <Input
                      id="reply-to"
                      type="email"
                      placeholder="e.g., events@company.com"
                      value={replyTo}
                      onChange={(e) => handleSettingsChange("replyTo", e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Where replies will be sent (optional)
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="invitation-subject">Invitation Subject</Label>
                    <Input
                      id="invitation-subject"
                      placeholder={`Default: You're Invited: ${event.name}`}
                      value={invitationSubject}
                      onChange={(e) =>
                        handleSettingsChange("invitationSubject", e.target.value)
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Use {"{{event_name}}"} for event name, {"{{guest_name}}"} for guest
                      name
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmation-subject">
                      Check-in Confirmation Subject
                    </Label>
                    <Input
                      id="confirmation-subject"
                      placeholder={`Default: You're Checked In: ${event.name}`}
                      value={confirmationSubject}
                      onChange={(e) =>
                        handleSettingsChange("confirmationSubject", e.target.value)
                      }
                    />
                  </div>

                  <div className="pt-4">
                    <Button
                      onClick={handleSaveSettings}
                      disabled={!senderName.trim() || !settingsChanged}
                    >
                      Save Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Placeholders Reference */}
              <Card>
                <CardHeader>
                  <CardTitle>Template Placeholders</CardTitle>
                  <CardDescription>
                    Available placeholders for subject lines
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="font-mono bg-muted p-2 rounded">
                      {"{{guest_name}}"}
                    </div>
                    <div className="p-2">Guest&apos;s name</div>
                    <div className="font-mono bg-muted p-2 rounded">
                      {"{{event_name}}"}
                    </div>
                    <div className="p-2">Event name</div>
                    <div className="font-mono bg-muted p-2 rounded">
                      {"{{table_number}}"}
                    </div>
                    <div className="p-2">Assigned table (confirmation only)</div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="size-5" />
                    Email History
                  </CardTitle>
                  <CardDescription>
                    View all emails sent for this event
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!emailLogs || emailLogs.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">
                      No emails have been sent yet
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Recipient</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Sent</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {emailLogs.map((log) => (
                            <TableRow key={log._id}>
                              <TableCell className="font-medium">
                                {log.recipientEmail}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {log.type === "invitation"
                                    ? "Invitation"
                                    : log.type === "checkin_confirmation"
                                    ? "Check-in"
                                    : log.type}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Tooltip>
                                  <TooltipTrigger>
                                    {getStatusBadge(log.status)}
                                  </TooltipTrigger>
                                  {log.errorMessage && (
                                    <TooltipContent>
                                      <p className="max-w-xs">{log.errorMessage}</p>
                                    </TooltipContent>
                                  )}
                                </Tooltip>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {log.sentAt ? formatDate(log.sentAt) : "-"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Send Confirmation Dialog */}
        <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Invitation Emails</DialogTitle>
              <DialogDescription>
                {emailStats && (
                  <>
                    This will send invitation emails to{" "}
                    <strong>
                      {emailStats.guestsWithEmail - emailStats.invitationsSent}
                    </strong>{" "}
                    guests who haven&apos;t received one yet.
                    {attachments && attachments.length > 0 && (
                      <span className="block mt-2">
                        {attachments.length} attachment
                        {attachments.length !== 1 ? "s" : ""} will be included.
                      </span>
                    )}
                  </>
                )}
              </DialogDescription>
            </DialogHeader>

            {sendProgress && (
              <div className="space-y-4 py-4">
                <Progress
                  value={(sendProgress.sent / sendProgress.total) * 100}
                />
                <p className="text-sm text-center">
                  Sent {sendProgress.sent} of {sendProgress.total}
                </p>
                {sendProgress.errors.length > 0 && (
                  <div className="text-sm text-destructive">
                    <p className="font-medium">Errors:</p>
                    <ul className="list-disc list-inside max-h-32 overflow-y-auto">
                      {sendProgress.errors.slice(0, 5).map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                      {sendProgress.errors.length > 5 && (
                        <li>...and {sendProgress.errors.length - 5} more</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowSendDialog(false)
                  setSendProgress(null)
                }}
                disabled={isSending}
              >
                {sendProgress ? "Close" : "Cancel"}
              </Button>
              {!sendProgress && (
                <Button onClick={handleSendInvitations} disabled={isSending}>
                  {isSending ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 size-4" />
                      Send Emails
                    </>
                  )}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Test Email Dialog */}
        <Dialog open={showTestEmailDialog} onOpenChange={setShowTestEmailDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Test Email</DialogTitle>
              <DialogDescription>
                Send a test email to verify your email configuration is working.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="test-email">Email Address</Label>
                <Input
                  id="test-email"
                  type="email"
                  placeholder="your@email.com"
                  value={testEmailAddress}
                  onChange={(e) => setTestEmailAddress(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && testEmailAddress.trim() && !isSendingTestEmail) {
                      handleSendTestEmail()
                    }
                  }}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowTestEmailDialog(false)
                  setTestEmailAddress("")
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendTestEmail}
                disabled={isSendingTestEmail || !testEmailAddress.trim()}
              >
                {isSendingTestEmail ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 size-4" />
                    Send Test
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}
