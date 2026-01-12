import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Department color mapping for consistent visual coding
const DEPARTMENT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  engineering: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-300" },
  design: { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-300" },
  marketing: { bg: "bg-pink-100", text: "text-pink-700", border: "border-pink-300" },
  sales: { bg: "bg-green-100", text: "text-green-700", border: "border-green-300" },
  hr: { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-300" },
  finance: { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-300" },
  operations: { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-300" },
  product: { bg: "bg-indigo-100", text: "text-indigo-700", border: "border-indigo-300" },
  legal: { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-300" },
  support: { bg: "bg-cyan-100", text: "text-cyan-700", border: "border-cyan-300" },
}

// Fallback colors for departments not in the list
const FALLBACK_COLORS = [
  { bg: "bg-rose-100", text: "text-rose-700", border: "border-rose-300" },
  { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-300" },
  { bg: "bg-teal-100", text: "text-teal-700", border: "border-teal-300" },
  { bg: "bg-violet-100", text: "text-violet-700", border: "border-violet-300" },
  { bg: "bg-fuchsia-100", text: "text-fuchsia-700", border: "border-fuchsia-300" },
]

// Cache for consistent fallback colors per department
const departmentColorCache = new Map<string, { bg: string; text: string; border: string }>()

export function getDepartmentColors(department: string | undefined): { bg: string; text: string; border: string } {
  if (!department) {
    return { bg: "bg-muted", text: "text-muted-foreground", border: "border-border" }
  }

  const normalized = department.toLowerCase().trim()

  // Check predefined colors
  if (DEPARTMENT_COLORS[normalized]) {
    return DEPARTMENT_COLORS[normalized]
  }

  // Check cache for fallback
  if (departmentColorCache.has(normalized)) {
    return departmentColorCache.get(normalized)!
  }

  // Generate consistent fallback based on string hash
  const hash = normalized.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const fallback = FALLBACK_COLORS[hash % FALLBACK_COLORS.length]
  departmentColorCache.set(normalized, fallback)

  return fallback
}
