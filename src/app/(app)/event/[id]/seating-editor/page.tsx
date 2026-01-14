"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useQuery, useMutation } from "convex/react"
import { api } from "@convex/_generated/api"
import { Id } from "@convex/_generated/dataModel"
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core"
import {
  ArrowLeft,
  Check,
  X,
  RefreshCw,
  AlertTriangle,
  Pin,
  Link2Off,
  Link2,
  Plus,
  Loader2,
  Utensils,
  Sparkles,
  Dog,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface PageProps {
  params: Promise<{ id: string }>
}

type ConstraintType = "pin" | "repel" | "attract"

type TableAssignment = {
  guestId: Id<"guests">
  guestName: string
  guestDepartment?: string
  tableNumber: number
  roundNumber: number
}

// Generate a consistent color from a string (department name)
function stringToColor(str: string): string {
  if (!str) return "hsl(220, 40%, 60%)"
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash % 360)
  return `hsl(${hue}, 60%, 50%)`
}

// Get initials from name
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

// Guest Avatar Component
interface GuestAvatarProps {
  guest: TableAssignment
  size?: "sm" | "md" | "lg"
  isPinned?: boolean
  hasRepel?: boolean
  hasAttract?: boolean
  isDragging?: boolean
  showTooltip?: boolean
}

function GuestAvatar({
  guest,
  size = "md",
  isPinned,
  hasRepel,
  hasAttract,
  isDragging,
  showTooltip = true,
}: GuestAvatarProps) {
  const bgColor = stringToColor(guest.guestDepartment || "")
  const initials = getInitials(guest.guestName)

  const sizeClasses = {
    sm: "w-7 h-7 text-[10px]",
    md: "w-9 h-9 text-xs",
    lg: "w-12 h-12 text-sm",
  }

  const avatar = (
    <div
      className={`
        ${sizeClasses[size]}
        rounded-full flex items-center justify-center font-bold text-white
        shadow-md border-2 border-white
        transition-all duration-200 ease-out
        ${isDragging ? "scale-125 shadow-xl ring-4 ring-primary/50 z-50" : "hover:scale-110 hover:z-10"}
        relative select-none
      `}
      style={{ backgroundColor: bgColor }}
    >
      {initials}

      {/* Constraint indicators */}
      {isPinned && (
        <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-blue-500 rounded-full flex items-center justify-center shadow border border-white">
          <Pin className="w-2 h-2 text-white" />
        </div>
      )}
      {hasRepel && (
        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full flex items-center justify-center shadow border border-white">
          <Link2Off className="w-2 h-2 text-white" />
        </div>
      )}
      {hasAttract && (
        <div className="absolute -bottom-0.5 -left-0.5 w-3.5 h-3.5 bg-green-500 rounded-full flex items-center justify-center shadow border border-white">
          <Link2 className="w-2 h-2 text-white" />
        </div>
      )}
    </div>
  )

  if (!showTooltip) return avatar

  return (
    <Tooltip>
      <TooltipTrigger asChild>{avatar}</TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <div className="space-y-1">
          <p className="font-semibold">{guest.guestName}</p>
          {guest.guestDepartment && (
            <p className="text-xs text-muted-foreground">{guest.guestDepartment}</p>
          )}
          {(isPinned || hasRepel || hasAttract) && (
            <div className="flex gap-1 pt-1 flex-wrap">
              {isPinned && <Badge variant="secondary" className="text-[10px] bg-blue-100 text-blue-700">Pinned</Badge>}
              {hasRepel && <Badge variant="secondary" className="text-[10px] bg-red-100 text-red-700">Separated</Badge>}
              {hasAttract && <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-700">Together</Badge>}
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

// Draggable Guest Seat positioned around the table
interface DraggableSeatProps {
  guest: TableAssignment
  index: number
  total: number
  tableRadius: number
  isPinned: boolean
  hasRepel: boolean
  hasAttract: boolean
  disabled: boolean
}

function DraggableSeat({
  guest,
  index,
  total,
  tableRadius,
  isPinned,
  hasRepel,
  hasAttract,
  disabled,
}: DraggableSeatProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: guest.guestId,
    disabled: disabled || isPinned,
  })

  // Calculate position around the circle (starting from top, going clockwise)
  const angle = (index / total) * 2 * Math.PI - Math.PI / 2
  const x = Math.cos(angle) * tableRadius
  const y = Math.sin(angle) * tableRadius

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`absolute ${!disabled && !isPinned ? "cursor-grab active:cursor-grabbing" : "cursor-default"}`}
      style={{
        left: "50%",
        top: "50%",
        transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 100 : 1,
      }}
    >
      <GuestAvatar
        guest={guest}
        size="md"
        isPinned={isPinned}
        hasRepel={hasRepel}
        hasAttract={hasAttract}
        isDragging={isDragging}
      />
    </div>
  )
}

// Empty seat placeholder
function EmptySeat({ index, total, tableRadius }: { index: number; total: number; tableRadius: number }) {
  const angle = (index / total) * 2 * Math.PI - Math.PI / 2
  const x = Math.cos(angle) * tableRadius
  const y = Math.sin(angle) * tableRadius

  return (
    <div
      className="absolute w-8 h-8 rounded-full border-2 border-dashed border-muted-foreground/30 bg-muted/30"
      style={{
        left: "50%",
        top: "50%",
        transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
      }}
    />
  )
}

// Circular Table Component
interface CircularTableProps {
  tableNumber: number
  guests: TableAssignment[]
  maxSeats: number
  constraints: Array<{
    _id: Id<"seatingConstraints">
    type: string
    guestIds: Id<"guests">[]
    tableNumber?: number
  }> | null
  canDrag: boolean
  isOver?: boolean
}

function CircularTable({
  tableNumber,
  guests,
  maxSeats,
  constraints,
  canDrag,
  isOver,
}: CircularTableProps) {
  const { setNodeRef } = useDroppable({
    id: `table-${tableNumber}`,
  })

  // Size calculations
  const containerSize = 160
  const tableVisualSize = 70 // The brown table circle
  const seatRadius = (containerSize / 2) - 16 // Where seats sit around the table

  return (
    <div
      ref={setNodeRef}
      className={`relative transition-all duration-200 ${isOver ? "scale-105" : ""}`}
      style={{ width: containerSize, height: containerSize }}
    >
      {/* Table surface - the brown circle */}
      <div
        className={`
          absolute rounded-full
          bg-gradient-to-br from-amber-700 to-amber-900
          shadow-lg border-4 border-amber-600
          transition-all duration-200
          ${isOver ? "ring-4 ring-primary/40 ring-offset-2 ring-offset-background" : ""}
        `}
        style={{
          width: tableVisualSize,
          height: tableVisualSize,
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        {/* Table shine */}
        <div className="absolute inset-1 rounded-full bg-gradient-to-br from-white/20 to-transparent" />

        {/* Table number */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-amber-100">{tableNumber}</span>
        </div>
      </div>

      {/* Guest seats around the table */}
      {guests.map((guest, idx) => {
        const guestConstraints = constraints?.filter((c) =>
          c.guestIds.some((id) => id === guest.guestId)
        )
        const isPinned = guestConstraints?.some((c) => c.type === "pin") || false
        const hasRepel = guestConstraints?.some((c) => c.type === "repel") || false
        const hasAttract = guestConstraints?.some((c) => c.type === "attract") || false

        return (
          <DraggableSeat
            key={guest.guestId}
            guest={guest}
            index={idx}
            total={maxSeats}
            tableRadius={seatRadius}
            isPinned={isPinned}
            hasRepel={hasRepel}
            hasAttract={hasAttract}
            disabled={!canDrag}
          />
        )
      })}

      {/* Empty seat placeholders */}
      {Array.from({ length: maxSeats - guests.length }, (_, idx) => (
        <EmptySeat
          key={`empty-${idx}`}
          index={guests.length + idx}
          total={maxSeats}
          tableRadius={seatRadius}
        />
      ))}

      {/* Capacity badge - positioned below the table */}
      <div
        className="absolute left-1/2 -translate-x-1/2 z-10"
        style={{ bottom: -20 }}
      >
        <Badge
          variant={guests.length >= maxSeats ? "default" : "outline"}
          className={`
            text-[10px] px-1.5 py-0 shadow-md
            ${guests.length >= maxSeats ? "bg-green-600 hover:bg-green-600" : "bg-background"}
          `}
        >
          {guests.length}/{maxSeats}
        </Badge>
      </div>
    </div>
  )
}

// Seatherder Messages
const seatherderMessages = {
  empty: "I do not see any guests here yet. The tables are lonely.",
  previewMode: "I am thinking. These are my suggestions, not final.",
  hasConflicts: "I found problems. These guests cannot sit this way.",
  allGood: "Good. Everyone has a seat.",
  dragHint: "You can move guests between tables. I will adjust.",
  noAssignments: "I have not assigned anyone yet. Would you like me to think?",
}

// Main Page Component
export default function SeatingEditorPage({ params }: PageProps) {
  const router = useRouter()
  const [eventId, setEventId] = React.useState<Id<"events"> | null>(null)
  const [selectedRound, setSelectedRound] = React.useState(1)
  const [isPreviewMode, setIsPreviewMode] = React.useState(false)
  const [constraintDialogOpen, setConstraintDialogOpen] = React.useState(false)
  const [newConstraintType, setNewConstraintType] = React.useState<ConstraintType>("pin")
  const [selectedGuest1, setSelectedGuest1] = React.useState<string>("")
  const [selectedGuest2, setSelectedGuest2] = React.useState<string>("")
  const [selectedTable, setSelectedTable] = React.useState<string>("")
  const [constraintReason, setConstraintReason] = React.useState("")
  const [savingConstraint, setSavingConstraint] = React.useState(false)
  const [activeDragGuest, setActiveDragGuest] = React.useState<TableAssignment | null>(null)
  const [overTableId, setOverTableId] = React.useState<string | null>(null)

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  // Load params
  React.useEffect(() => {
    async function loadParams() {
      const resolvedParams = await params
      setEventId(resolvedParams.id as Id<"events">)
    }
    loadParams()
  }, [params])

  // Queries
  const event = useQuery(api.events.get, eventId ? { id: eventId } : "skip")
  const guests = useQuery(api.guests.getByEvent, eventId ? { eventId } : "skip")
  const roundAssignments = useQuery(api.guests.getAllRoundAssignmentsByEvent, eventId ? { eventId } : "skip")
  const constraints = useQuery(api.constraints.getByEvent, eventId ? { eventId } : "skip")
  const preview = useQuery(api.preview.getPreview, eventId ? { eventId } : "skip")
  const conflictCheck = useQuery(api.constraints.checkConflicts, eventId ? { eventId } : "skip")

  // Mutations
  const generatePreview = useMutation(api.preview.generatePreview)
  const commitPreview = useMutation(api.preview.commitPreview)
  const discardPreview = useMutation(api.preview.discardPreview)
  const updatePreviewAssignment = useMutation(api.preview.updatePreviewAssignment)
  const createConstraint = useMutation(api.constraints.create)
  const removeConstraint = useMutation(api.constraints.remove)

  // Computed values
  const numberOfRounds = event?.numberOfRounds || 1
  const tableSize = event?.tableSize || 8
  const numTables = guests ? Math.ceil(guests.length / tableSize) : 0

  // Get assignments by round
  const getAssignmentsByRound = React.useCallback((round: number): TableAssignment[] => {
    if (preview && preview.byRound[round]) {
      return preview.byRound[round] as TableAssignment[]
    }
    if (!guests || !roundAssignments) return []

    return guests.map((g) => {
      const guestAssignments = roundAssignments[g._id]
      const roundAssignment = guestAssignments?.find((a) => a.roundNumber === round)
      return {
        guestId: g._id,
        guestName: g.name,
        guestDepartment: g.department,
        tableNumber: roundAssignment?.tableNumber || g.tableNumber || 0,
        roundNumber: round,
      }
    })
  }, [preview, guests, roundAssignments])

  // Group assignments by table
  const assignmentsByTable = React.useMemo(() => {
    const assignments = getAssignmentsByRound(selectedRound)
    const byTable = new Map<number, TableAssignment[]>()
    for (let t = 1; t <= numTables; t++) {
      byTable.set(t, [])
    }
    for (const a of assignments) {
      const tableNum = a.tableNumber || 0
      if (tableNum > 0 && byTable.has(tableNum)) {
        byTable.get(tableNum)!.push(a)
      }
    }
    return byTable
  }, [getAssignmentsByRound, selectedRound, numTables])

  // Handlers
  const handleGeneratePreview = async () => {
    if (!eventId) return
    try {
      await generatePreview({ eventId })
      setIsPreviewMode(true)
    } catch (error) {
      console.error("Failed to generate preview:", error)
    }
  }

  const handleCommitPreview = async () => {
    if (!eventId) return
    try {
      await commitPreview({ eventId })
      setIsPreviewMode(false)
    } catch (error) {
      console.error("Failed to commit preview:", error)
    }
  }

  const handleDiscardPreview = async () => {
    if (!eventId) return
    try {
      await discardPreview({ eventId })
      setIsPreviewMode(false)
    } catch (error) {
      console.error("Failed to discard preview:", error)
    }
  }

  const handleCreateConstraint = async () => {
    if (!eventId) return
    setSavingConstraint(true)
    try {
      const guestIds: Id<"guests">[] = []
      if (selectedGuest1) guestIds.push(selectedGuest1 as Id<"guests">)
      if (selectedGuest2 && newConstraintType !== "pin") {
        guestIds.push(selectedGuest2 as Id<"guests">)
      }

      await createConstraint({
        eventId,
        type: newConstraintType,
        guestIds,
        tableNumber: newConstraintType === "pin" ? parseInt(selectedTable) : undefined,
        reason: constraintReason || undefined,
      })

      setConstraintDialogOpen(false)
      setSelectedGuest1("")
      setSelectedGuest2("")
      setSelectedTable("")
      setConstraintReason("")
    } catch (error) {
      console.error("Failed to create constraint:", error)
    } finally {
      setSavingConstraint(false)
    }
  }

  const handleDeleteConstraint = async (constraintId: Id<"seatingConstraints">) => {
    try {
      await removeConstraint({ id: constraintId })
    } catch (error) {
      console.error("Failed to delete constraint:", error)
    }
  }

  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    const allAssignments = getAssignmentsByRound(selectedRound)
    const draggedGuest = allAssignments.find((a) => a.guestId === event.active.id)
    setActiveDragGuest(draggedGuest || null)
  }

  const handleDragOver = (event: DragOverEvent) => {
    setOverTableId(event.over?.id?.toString() || null)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveDragGuest(null)
    setOverTableId(null)

    if (!over || !eventId || !preview) return

    const overId = over.id as string
    if (!overId.startsWith("table-")) return

    const newTableNumber = parseInt(overId.replace("table-", ""))
    const guestId = active.id as Id<"guests">

    const currentAssignment = getAssignmentsByRound(selectedRound).find((a) => a.guestId === guestId)
    if (!currentAssignment || currentAssignment.tableNumber === newTableNumber) return

    const targetTableGuests = assignmentsByTable.get(newTableNumber) || []
    if (targetTableGuests.length >= tableSize) return

    try {
      await updatePreviewAssignment({
        eventId,
        guestId,
        roundNumber: selectedRound,
        newTableNumber,
      })
    } catch (error) {
      console.error("Failed to update assignment:", error)
    }
  }

  // Loading state
  if (!eventId || event === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-bounce">
            <Dog className="w-12 h-12 text-amber-600 mx-auto" />
          </div>
          <p className="text-muted-foreground">I am fetching the seating chart...</p>
        </div>
      </div>
    )
  }

  // Not found
  if (event === null) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Dog className="w-5 h-5 text-amber-600" />
              I cannot find this event
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              This event does not exist. Perhaps it was deleted.
            </p>
            <Button onClick={() => router.push("/admin")} className="w-full">
              <ArrowLeft className="mr-2 size-4" />
              Take me back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const hasAssignments = Array.from(assignmentsByTable.values()).some((t) => t.length > 0)
  const allTablesSeated = hasAssignments && Array.from(assignmentsByTable.values()).every((t) => t.length > 0)

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b bg-card sticky top-0 z-20">
          <div className="container mx-auto p-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/event/${eventId}`)}
                >
                  <ArrowLeft className="size-4 mr-2" />
                  Back
                </Button>
                <div>
                  <div className="flex items-center gap-2">
                    <Dog className="w-5 h-5 text-amber-600" />
                    <h1 className="text-lg font-bold">I am arranging seats</h1>
                  </div>
                  <p className="text-sm text-muted-foreground">{event.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Select
                  value={selectedRound.toString()}
                  onValueChange={(v) => setSelectedRound(parseInt(v))}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: numberOfRounds }, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        Round {i + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {!isPreviewMode && !preview ? (
                  <Button onClick={handleGeneratePreview} className="bg-amber-600 hover:bg-amber-700">
                    <Sparkles className="size-4 mr-2" />
                    Let me think
                  </Button>
                ) : (
                  <>
                    {preview && (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
                        <Sparkles className="size-3 mr-1" />
                        Preview
                      </Badge>
                    )}
                    <Button onClick={handleCommitPreview} className="bg-green-600 hover:bg-green-700">
                      <Check className="size-4 mr-2" />
                      I like this
                    </Button>
                    <Button onClick={handleDiscardPreview} variant="outline">
                      <X className="size-4 mr-2" />
                      Discard
                    </Button>
                  </>
                )}

                {event.isAssigned && !preview && (
                  <Button onClick={handleGeneratePreview} variant="outline">
                    <RefreshCw className="size-4 mr-2" />
                    Rethink
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="border-b bg-muted/30">
          <div className="container mx-auto px-4 py-2">
            <div className="flex items-center gap-2">
              <Dog className="w-4 h-4 text-amber-600" />
              <p className="text-sm text-muted-foreground">
                {conflictCheck && conflictCheck.length > 0
                  ? seatherderMessages.hasConflicts
                  : preview
                    ? seatherderMessages.previewMode
                    : !hasAssignments
                      ? seatherderMessages.noAssignments
                      : allTablesSeated
                        ? seatherderMessages.allGood
                        : seatherderMessages.dragHint}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto p-4 md:p-6">
          <div className="flex gap-6 flex-col lg:flex-row">
            {/* Seating Chart */}
            <div className="flex-1 min-w-0">
              {/* Conflict Warnings */}
              {conflictCheck && conflictCheck.length > 0 && (
                <Card className="mb-4 border-destructive/50 bg-destructive/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-destructive">
                      <AlertTriangle className="size-4" />
                      I found problems with these constraints
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm text-destructive/80 space-y-1">
                      {conflictCheck.map((conflict, idx) => (
                        <li key={idx}>• {conflict.message}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Venue Floor */}
              <Card className="p-6">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragEnd={handleDragEnd}
                >
                  <div className="flex flex-wrap gap-x-6 gap-y-8 justify-center pb-2">
                    {Array.from({ length: numTables }, (_, i) => {
                      const tableNum = i + 1
                      const tableGuests = assignmentsByTable.get(tableNum) || []
                      const canDrag = !!preview
                      const isOver = overTableId === `table-${tableNum}`

                      return (
                        <CircularTable
                          key={tableNum}
                          tableNumber={tableNum}
                          guests={tableGuests}
                          maxSeats={tableSize}
                          constraints={constraints || null}
                          canDrag={canDrag}
                          isOver={isOver}
                        />
                      )
                    })}
                  </div>

                  <DragOverlay>
                    {activeDragGuest ? (
                      <GuestAvatar guest={activeDragGuest} size="lg" isDragging showTooltip={false} />
                    ) : null}
                  </DragOverlay>
                </DndContext>

                {/* Empty state */}
                {numTables === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Utensils className="w-12 h-12 text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground mb-1">{seatherderMessages.empty}</p>
                    <p className="text-sm text-muted-foreground/60">Add guests to see the seating chart.</p>
                  </div>
                )}
              </Card>

              {/* Legend */}
              <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground flex-wrap">
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded-full bg-blue-500 flex items-center justify-center">
                    <Pin className="w-2 h-2 text-white" />
                  </div>
                  <span>Pinned</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded-full bg-red-500 flex items-center justify-center">
                    <Link2Off className="w-2 h-2 text-white" />
                  </div>
                  <span>Keep apart</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded-full bg-green-500 flex items-center justify-center">
                    <Link2 className="w-2 h-2 text-white" />
                  </div>
                  <span>Together</span>
                </div>
              </div>
            </div>

            {/* Constraints Panel */}
            <div className="w-full lg:w-72 shrink-0">
              <Card className="sticky top-28">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Dog className="w-4 h-4 text-amber-600" />
                      My Rules
                    </CardTitle>
                    <Dialog open={constraintDialogOpen} onOpenChange={setConstraintDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="h-7">
                          <Plus className="size-3.5" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Dog className="w-5 h-5 text-amber-600" />
                            Tell me a rule
                          </DialogTitle>
                          <DialogDescription>
                            I will remember this when I assign seats.
                          </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>What kind of rule?</Label>
                            <Select
                              value={newConstraintType}
                              onValueChange={(v) => setNewConstraintType(v as ConstraintType)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pin">
                                  <div className="flex items-center gap-2">
                                    <Pin className="size-4 text-blue-500" />
                                    Pin to specific table
                                  </div>
                                </SelectItem>
                                <SelectItem value="repel">
                                  <div className="flex items-center gap-2">
                                    <Link2Off className="size-4 text-red-500" />
                                    Keep these guests apart
                                  </div>
                                </SelectItem>
                                <SelectItem value="attract">
                                  <div className="flex items-center gap-2">
                                    <Link2 className="size-4 text-green-500" />
                                    Seat these guests together
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>{newConstraintType === "pin" ? "Which guest?" : "First guest"}</Label>
                            <Select value={selectedGuest1} onValueChange={setSelectedGuest1}>
                              <SelectTrigger>
                                <SelectValue placeholder="Choose a guest..." />
                              </SelectTrigger>
                              <SelectContent>
                                <ScrollArea className="h-[200px]">
                                  {guests?.map((g) => (
                                    <SelectItem key={g._id} value={g._id}>
                                      <div className="flex items-center gap-2">
                                        <div
                                          className="w-2.5 h-2.5 rounded-full"
                                          style={{ backgroundColor: stringToColor(g.department || "") }}
                                        />
                                        {g.name}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </ScrollArea>
                              </SelectContent>
                            </Select>
                          </div>

                          {newConstraintType !== "pin" && (
                            <div className="space-y-2">
                              <Label>Second guest</Label>
                              <Select value={selectedGuest2} onValueChange={setSelectedGuest2}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Choose another guest..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <ScrollArea className="h-[200px]">
                                    {guests
                                      ?.filter((g) => g._id !== selectedGuest1)
                                      .map((g) => (
                                        <SelectItem key={g._id} value={g._id}>
                                          <div className="flex items-center gap-2">
                                            <div
                                              className="w-2.5 h-2.5 rounded-full"
                                              style={{ backgroundColor: stringToColor(g.department || "") }}
                                            />
                                            {g.name}
                                          </div>
                                        </SelectItem>
                                      ))}
                                  </ScrollArea>
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          {newConstraintType === "pin" && (
                            <div className="space-y-2">
                              <Label>Which table?</Label>
                              <Select value={selectedTable} onValueChange={setSelectedTable}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Pick a table..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.from({ length: numTables }, (_, i) => (
                                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                                      Table {i + 1}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          <div className="space-y-2">
                            <Label>Why? (optional)</Label>
                            <Textarea
                              value={constraintReason}
                              onChange={(e) => setConstraintReason(e.target.value)}
                              placeholder="I will remember..."
                              rows={2}
                            />
                          </div>
                        </div>

                        <DialogFooter>
                          <Button variant="outline" onClick={() => setConstraintDialogOpen(false)}>
                            Nevermind
                          </Button>
                          <Button
                            onClick={handleCreateConstraint}
                            disabled={
                              savingConstraint ||
                              !selectedGuest1 ||
                              (newConstraintType !== "pin" && !selectedGuest2) ||
                              (newConstraintType === "pin" && !selectedTable)
                            }
                            className="bg-amber-600 hover:bg-amber-700"
                          >
                            {savingConstraint && <Loader2 className="size-4 mr-2 animate-spin" />}
                            I will remember
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[350px]">
                    {!constraints || constraints.length === 0 ? (
                      <div className="text-center py-8">
                        <Dog className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">
                          No rules yet. I will seat guests however I think is best.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {constraints.map((constraint) => (
                          <div
                            key={constraint._id}
                            className={`
                              p-2.5 rounded-lg border text-sm
                              ${constraint.type === "pin" ? "bg-blue-50 border-blue-200" : ""}
                              ${constraint.type === "repel" ? "bg-red-50 border-red-200" : ""}
                              ${constraint.type === "attract" ? "bg-green-50 border-green-200" : ""}
                            `}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-1.5">
                                  {constraint.type === "pin" && (
                                    <>
                                      <Pin className="size-3.5 text-blue-600" />
                                      <span className="text-[10px] font-semibold text-blue-700 uppercase">Pinned</span>
                                    </>
                                  )}
                                  {constraint.type === "repel" && (
                                    <>
                                      <Link2Off className="size-3.5 text-red-600" />
                                      <span className="text-[10px] font-semibold text-red-700 uppercase">Separated</span>
                                    </>
                                  )}
                                  {constraint.type === "attract" && (
                                    <>
                                      <Link2 className="size-3.5 text-green-600" />
                                      <span className="text-[10px] font-semibold text-green-700 uppercase">Together</span>
                                    </>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {constraint.guests.map((g) => (
                                    <span
                                      key={g._id}
                                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/80 text-xs"
                                    >
                                      {g.name}
                                    </span>
                                  ))}
                                </div>
                                {constraint.type === "pin" && constraint.tableNumber && (
                                  <p className="text-[10px] text-muted-foreground mt-1">
                                    → Table {constraint.tableNumber}
                                  </p>
                                )}
                                {constraint.reason && (
                                  <p className="text-[10px] text-muted-foreground mt-1 italic truncate">
                                    &quot;{constraint.reason}&quot;
                                  </p>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 shrink-0"
                                onClick={() => handleDeleteConstraint(constraint._id)}
                              >
                                <X className="size-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
