"use client"

import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Leaf,
  Wheat,
  Milk,
  AlertTriangle,
  Shell,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { DietaryInfo } from "@/lib/types"

// Configuration for each dietary restriction
const DIETARY_CONFIG: Record<string, {
  label: string
  shortLabel: string
  icon: LucideIcon
  variant: "default" | "secondary" | "destructive" | "outline"
  className: string
  isAllergy: boolean
}> = {
  'vegetarian': {
    label: 'Vegetarian',
    shortLabel: 'Veg',
    icon: Leaf,
    variant: 'secondary',
    className: 'bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400',
    isAllergy: false,
  },
  'vegan': {
    label: 'Vegan',
    shortLabel: 'Vegan',
    icon: Leaf,
    variant: 'secondary',
    className: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400',
    isAllergy: false,
  },
  'gluten-free': {
    label: 'Gluten-Free',
    shortLabel: 'GF',
    icon: Wheat,
    variant: 'secondary',
    className: 'bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400',
    isAllergy: false,
  },
  'dairy-free': {
    label: 'Dairy-Free',
    shortLabel: 'DF',
    icon: Milk,
    variant: 'secondary',
    className: 'bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400',
    isAllergy: false,
  },
  'nut-allergy': {
    label: 'Nut Allergy',
    shortLabel: 'Nuts',
    icon: AlertTriangle,
    variant: 'destructive',
    className: 'bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400',
    isAllergy: true,
  },
  'shellfish-allergy': {
    label: 'Shellfish Allergy',
    shortLabel: 'Shellfish',
    icon: Shell,
    variant: 'destructive',
    className: 'bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400',
    isAllergy: true,
  },
  'halal': {
    label: 'Halal',
    shortLabel: 'Halal',
    icon: Leaf,
    variant: 'outline',
    className: 'bg-purple-100 text-purple-800 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400',
    isAllergy: false,
  },
  'kosher': {
    label: 'Kosher',
    shortLabel: 'Kosher',
    icon: Leaf,
    variant: 'outline',
    className: 'bg-indigo-100 text-indigo-800 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400',
    isAllergy: false,
  },
}

interface DietaryBadgeProps {
  restriction: string
  showIcon?: boolean
  compact?: boolean
  className?: string
}

/**
 * Single dietary restriction badge
 */
export function DietaryBadge({
  restriction,
  showIcon = true,
  compact = false,
  className
}: DietaryBadgeProps) {
  const config = DIETARY_CONFIG[restriction]

  if (!config) {
    // Unknown restriction - show as generic badge
    return (
      <Badge variant="outline" className={cn("text-xs", className)}>
        {restriction}
      </Badge>
    )
  }

  const Icon = config.icon
  const label = compact ? config.shortLabel : config.label

  return (
    <Badge
      variant={config.variant}
      className={cn(
        "text-xs font-medium",
        config.className,
        className
      )}
    >
      {showIcon && <Icon className="mr-1 h-3 w-3" />}
      {label}
    </Badge>
  )
}

interface DietaryBadgesProps {
  dietary?: DietaryInfo | null
  showIcon?: boolean
  compact?: boolean
  maxVisible?: number
  className?: string
}

/**
 * Display all dietary badges for a guest with optional tooltip for overflow
 */
export function DietaryBadges({
  dietary,
  showIcon = true,
  compact = false,
  maxVisible = 3,
  className
}: DietaryBadgesProps) {
  if (!dietary || (dietary.restrictions.length === 0 && !dietary.notes)) {
    return null
  }

  const { restrictions, notes } = dietary
  const visibleRestrictions = restrictions.slice(0, maxVisible)
  const hiddenCount = restrictions.length - maxVisible
  const hasOverflow = hiddenCount > 0 || !!notes

  const badges = (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {visibleRestrictions.map((restriction) => (
        <DietaryBadge
          key={restriction}
          restriction={restriction}
          showIcon={showIcon}
          compact={compact}
        />
      ))}
      {hasOverflow && (
        <Badge variant="outline" className="text-xs">
          +{hiddenCount + (notes ? 1 : 0)} more
        </Badge>
      )}
    </div>
  )

  if (!hasOverflow) {
    return badges
  }

  // Show tooltip with full list
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badges}
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1">
              {restrictions.map((restriction) => (
                <DietaryBadge
                  key={restriction}
                  restriction={restriction}
                  showIcon={showIcon}
                  compact={false}
                />
              ))}
            </div>
            {notes && (
              <p className="text-xs text-muted-foreground border-t pt-2">
                Notes: {notes}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

interface DietarySummaryProps {
  dietary?: DietaryInfo | null
  className?: string
}

/**
 * Compact summary of dietary requirements (e.g., "2 restrictions")
 */
export function DietarySummary({ dietary, className }: DietarySummaryProps) {
  if (!dietary || (dietary.restrictions.length === 0 && !dietary.notes)) {
    return null
  }

  const { restrictions, notes } = dietary
  const allergies = restrictions.filter(r => DIETARY_CONFIG[r]?.isAllergy)
  const preferences = restrictions.filter(r => !DIETARY_CONFIG[r]?.isAllergy)

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("flex items-center gap-1", className)}>
            {allergies.length > 0 && (
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="mr-1 h-3 w-3" />
                {allergies.length} allerg{allergies.length === 1 ? 'y' : 'ies'}
              </Badge>
            )}
            {preferences.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                <Leaf className="mr-1 h-3 w-3" />
                {preferences.length} pref{preferences.length === 1 ? '' : 's'}
              </Badge>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1">
              {restrictions.map((restriction) => (
                <DietaryBadge
                  key={restriction}
                  restriction={restriction}
                  showIcon={true}
                  compact={false}
                />
              ))}
            </div>
            {notes && (
              <p className="text-xs text-muted-foreground border-t pt-2">
                Notes: {notes}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
