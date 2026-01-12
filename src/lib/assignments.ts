import { Guest, TableAssignment, Event } from '@/lib/types'
import { v4 as uuidv4 } from 'uuid'

/**
 * Fisher-Yates shuffle algorithm for true randomization
 * @param array - Array to shuffle
 * @returns Shuffled copy of the array
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Assigns guests to tables with smart department-aware distribution
 * Spreads guests from the same department across different tables to encourage mixing
 * @param guests - Array of guests to assign
 * @param tableSize - Number of guests per table
 * @returns Object containing updated guests array and tables array
 */
export function assignTables(
  guests: Guest[],
  tableSize: number
): { guests: Guest[]; tables: TableAssignment[] } {
  if (guests.length === 0) {
    return { guests: [], tables: [] }
  }

  if (tableSize <= 0) {
    throw new Error('Table size must be greater than 0')
  }

  // Calculate number of tables needed
  const tableCount = Math.ceil(guests.length / tableSize)

  // Initialize empty tables
  const tables: TableAssignment[] = Array.from({ length: tableCount }, (_, i) => ({
    tableNumber: i + 1,
    guests: [],
    qrCodeId: uuidv4()
  }))

  // Group guests by department
  const guestsByDept = new Map<string, Guest[]>()
  const noDeptGuests: Guest[] = []

  guests.forEach((guest) => {
    const dept = guest.department?.trim() || ""
    if (dept) {
      if (!guestsByDept.has(dept)) {
        guestsByDept.set(dept, [])
      }
      guestsByDept.get(dept)!.push({ ...guest })
    } else {
      noDeptGuests.push({ ...guest })
    }
  })

  // Shuffle within each department group
  guestsByDept.forEach((deptGuests) => {
    shuffleArray(deptGuests)
  })
  shuffleArray(noDeptGuests)

  // Sort departments by size (largest first) for better distribution
  const sortedDepts = [...guestsByDept.entries()].sort((a, b) => b[1].length - a[1].length)

  // Round-robin assign guests from each department across tables
  // Prioritizing tables with fewer same-department guests
  sortedDepts.forEach(([, deptGuests]) => {
    deptGuests.forEach((guest) => {
      // Find the table with fewest guests that has room and ideally no same-dept guests
      const availableTables = tables
        .filter((t) => t.guests.length < tableSize)
        .sort((a, b) => {
          const aDeptCount = a.guests.filter((g) => g.department === guest.department).length
          const bDeptCount = b.guests.filter((g) => g.department === guest.department).length
          // Prioritize tables with fewer same-department guests, then fewer total guests
          if (aDeptCount !== bDeptCount) return aDeptCount - bDeptCount
          return a.guests.length - b.guests.length
        })

      if (availableTables.length > 0) {
        guest.tableNumber = availableTables[0].tableNumber
        guest.qrCodeId = uuidv4()
        availableTables[0].guests.push(guest)
      }
    })
  })

  // Assign guests without departments to fill remaining spots
  noDeptGuests.forEach((guest) => {
    const availableTables = tables
      .filter((t) => t.guests.length < tableSize)
      .sort((a, b) => a.guests.length - b.guests.length)

    if (availableTables.length > 0) {
      guest.tableNumber = availableTables[0].tableNumber
      guest.qrCodeId = uuidv4()
      availableTables[0].guests.push(guest)
    }
  })

  // Collect all assigned guests and filter out empty tables
  const allGuests = tables.flatMap((t) => t.guests)
  const nonEmptyTables = tables.filter((t) => t.guests.length > 0)

  return {
    guests: allGuests,
    tables: nonEmptyTables
  }
}

/**
 * Detects when 3 or more guests from the same department are at one table
 * @param table - Table assignment to analyze
 * @returns Object with clustering status and cluster details
 */
export function detectDepartmentClustering(table: TableAssignment): {
  hasClustering: boolean
  clusters: { department: string; count: number }[]
} {
  // Count guests by department
  const departmentCounts = new Map<string, number>()

  table.guests.forEach(guest => {
    if (guest.department) {
      const current = departmentCounts.get(guest.department) || 0
      departmentCounts.set(guest.department, current + 1)
    }
  })

  // Find clusters (3+ from same department)
  const clusters: { department: string; count: number }[] = []

  departmentCounts.forEach((count, department) => {
    if (count >= 3) {
      clusters.push({ department, count })
    }
  })

  return {
    hasClustering: clusters.length > 0,
    clusters
  }
}

/**
 * Clears all table assignments from an event
 * @param event - Event to reset
 * @returns Event with cleared assignments
 */
export function resetAssignments(event: Event): Event {
  // Clear table assignments
  const clearedGuests = event.guests.map(guest => ({
    ...guest,
    tableNumber: undefined,
    qrCodeId: undefined
  }))

  return {
    ...event,
    guests: clearedGuests,
    tables: [],
    isAssigned: false
  }
}
