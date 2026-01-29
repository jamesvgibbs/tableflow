'use client'

import * as React from 'react'
import { HelpCircle, X } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Storage key prefix for dismissed tooltips
const TOOLTIP_STORAGE_PREFIX = 'seatherder_tooltip_'

/**
 * Feature tooltip definitions in Seatherder's voice
 */
export const FEATURE_TOOLTIPS = {
  // Matching wizard features
  'matching-wizard': {
    title: 'How I Match People',
    content: 'I ask a few questions to understand what matters for your event. Then I figure out who should sit together. No spreadsheets, no politics.',
  },
  'department-mixing': {
    title: 'Mixing Departments',
    content: 'I try to put people from different teams at each table. Cross-pollination. Fresh conversations. Fewer silo complaints from your CEO.',
  },
  'interest-matching': {
    title: 'Common Interests',
    content: 'When you tell me what people are into, I find common ground. Photography enthusiasts together. Foodies together. You get the idea.',
  },
  'repeat-avoidance': {
    title: 'No Repeats',
    content: 'I remember who sat together before. At your next event, I introduce them to new faces. Networking is about new connections.',
  },

  // Constraint features
  'pin-constraint': {
    title: 'Pinning Guests',
    content: 'Sometimes you need someone at a specific table. The CEO, maybe. Or Aunt Martha near the cake. I will respect that.',
  },
  'repel-constraint': {
    title: 'Keeping Apart',
    content: 'Some people should not sit together. I do not ask why. I just make sure they are at different tables.',
  },
  'attract-constraint': {
    title: 'Keeping Together',
    content: 'Sometimes people need to be near each other. New hires with their buddies. Couples who insist. I will seat them together.',
  },

  // Multi-round features
  'multi-round': {
    title: 'Multiple Rounds',
    content: 'For networking events, I rotate everyone. Different table, different people each round. Maximum mingling.',
  },
  'round-timer': {
    title: 'Round Timer',
    content: 'I keep track of time so you do not have to. When the round ends, I let everyone know it is time to move.',
  },

  // Guest features
  'guest-import': {
    title: 'Adding Guests',
    content: 'One at a time, paste a list, or upload a CSV. I am flexible. Just give me names and I will organize the rest.',
  },
  'dietary-tracking': {
    title: 'Dietary Needs',
    content: 'I track who needs vegetarian, gluten-free, or whatever else. Your catering team will thank you.',
  },
  'guest-self-service': {
    title: 'Guest Portal',
    content: 'Each guest gets their own link to update their details. Less back-and-forth for you. They handle their own dietary needs.',
  },

  // QR and check-in
  'qr-checkin': {
    title: 'QR Check-in',
    content: 'Each guest has a unique code. Scan it, they are checked in. I show them their table. Simple.',
  },
  'bulk-checkin': {
    title: 'Bulk Check-in',
    content: 'Sometimes you need to check in everyone at once. Late arrivals, last-minute walk-ins. I can handle groups.',
  },
} as const

export type FeatureTooltipId = keyof typeof FEATURE_TOOLTIPS

interface FeatureTooltipProps {
  /** The feature ID - must match a key in FEATURE_TOOLTIPS */
  feature: FeatureTooltipId
  /** Optional custom trigger element */
  children?: React.ReactNode
  /** Additional classes for the trigger */
  className?: string
  /** Size of the help icon when using default trigger */
  iconSize?: 'sm' | 'md' | 'lg'
  /** Side of the popover */
  side?: 'top' | 'bottom' | 'left' | 'right'
  /** Alignment of the popover */
  align?: 'start' | 'center' | 'end'
  /** Whether to show the dismiss button */
  dismissable?: boolean
  /** Callback when dismissed */
  onDismiss?: () => void
}

/**
 * Hook to manage tooltip dismissed state
 */
export function useFeatureTooltip(feature: FeatureTooltipId) {
  const [isDismissed, setIsDismissed] = React.useState(true) // Default to dismissed to prevent flash

  React.useEffect(() => {
    // Check localStorage for dismissed state
    const stored = localStorage.getItem(`${TOOLTIP_STORAGE_PREFIX}${feature}`)
    setIsDismissed(stored === 'dismissed')
  }, [feature])

  const dismiss = React.useCallback(() => {
    localStorage.setItem(`${TOOLTIP_STORAGE_PREFIX}${feature}`, 'dismissed')
    setIsDismissed(true)
  }, [feature])

  const reset = React.useCallback(() => {
    localStorage.removeItem(`${TOOLTIP_STORAGE_PREFIX}${feature}`)
    setIsDismissed(false)
  }, [feature])

  return { isDismissed, dismiss, reset }
}

/**
 * Reset all feature tooltips (useful for testing or new user experience)
 */
export function resetAllFeatureTooltips() {
  Object.keys(FEATURE_TOOLTIPS).forEach(key => {
    localStorage.removeItem(`${TOOLTIP_STORAGE_PREFIX}${key}`)
  })
}

/**
 * Feature tooltip component that displays contextual help in Seatherder's voice.
 *
 * Usage:
 * ```tsx
 * <FeatureTooltip feature="matching-wizard" />
 *
 * // With custom trigger
 * <FeatureTooltip feature="pin-constraint">
 *   <span className="underline cursor-help">Learn more</span>
 * </FeatureTooltip>
 * ```
 */
export function FeatureTooltip({
  feature,
  children,
  className,
  iconSize = 'sm',
  side = 'top',
  align = 'center',
  dismissable = true,
  onDismiss,
}: FeatureTooltipProps) {
  const [open, setOpen] = React.useState(false)
  const { isDismissed, dismiss } = useFeatureTooltip(feature)

  const tooltip = FEATURE_TOOLTIPS[feature]

  const iconSizeClass = {
    sm: 'size-4',
    md: 'size-5',
    lg: 'size-6',
  }[iconSize]

  const handleDismiss = () => {
    dismiss()
    setOpen(false)
    onDismiss?.()
  }

  // If dismissed and no custom children (using default icon), don't show anything
  if (isDismissed && !children) {
    return null
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children || (
          <button
            type="button"
            className={cn(
              'inline-flex items-center justify-center rounded-full',
              'text-muted-foreground hover:text-foreground',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              'transition-colors',
              className
            )}
          >
            <HelpCircle className={iconSizeClass} />
            <span className="sr-only">Help for {tooltip.title}</span>
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent
        side={side}
        align={align}
        className="w-72 p-4"
      >
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-semibold text-sm">{tooltip.title}</h4>
            {dismissable && !isDismissed && (
              <Button
                variant="ghost"
                size="icon"
                className="size-6 shrink-0 -mr-2 -mt-1"
                onClick={handleDismiss}
              >
                <X className="size-3" />
                <span className="sr-only">Dismiss</span>
              </Button>
            )}
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {tooltip.content}
          </p>
          {dismissable && !isDismissed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="w-full mt-2 text-xs"
            >
              Got it, do not show again
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

/**
 * Inline help text with optional tooltip.
 * Shows as inline text that opens a tooltip on click.
 */
export function InlineHelp({
  feature,
  children,
  className,
}: {
  feature: FeatureTooltipId
  children: React.ReactNode
  className?: string
}) {
  return (
    <FeatureTooltip feature={feature} side="top" align="start">
      <span
        className={cn(
          'inline-flex items-center gap-1 cursor-help',
          'text-muted-foreground hover:text-foreground',
          'border-b border-dashed border-current',
          className
        )}
      >
        {children}
        <HelpCircle className="size-3" />
      </span>
    </FeatureTooltip>
  )
}
