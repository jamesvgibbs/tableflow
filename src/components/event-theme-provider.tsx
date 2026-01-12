'use client'

import * as React from 'react'
import { ThemeColors, resolveThemeColors } from '@/lib/theme-presets'

interface EventThemeProviderProps {
  themePreset?: string
  customColors?: ThemeColors
  children: React.ReactNode
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

function getContrastColor(hex: string): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return '#000000'

  // Calculate relative luminance
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255
  return luminance > 0.5 ? '#000000' : '#FFFFFF'
}

function adjustBrightness(hex: string, factor: number): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex

  const adjust = (value: number) => {
    const adjusted = Math.round(value * factor)
    return Math.min(255, Math.max(0, adjusted))
  }

  const r = adjust(rgb.r).toString(16).padStart(2, '0')
  const g = adjust(rgb.g).toString(16).padStart(2, '0')
  const b = adjust(rgb.b).toString(16).padStart(2, '0')

  return `#${r}${g}${b}`
}

export function EventThemeProvider({
  themePreset,
  customColors,
  children,
}: EventThemeProviderProps) {
  const colors = resolveThemeColors(themePreset, customColors)

  const cssVars = React.useMemo(() => {
    // Derive additional colors
    const primaryForeground = getContrastColor(colors.primary)
    const secondaryForeground = getContrastColor(colors.secondary)
    const accentForeground = getContrastColor(colors.accent)
    const mutedForeground = adjustBrightness(colors.foreground, 0.6)
    const border = adjustBrightness(colors.muted, 0.9)
    const ring = colors.primary

    return {
      '--event-primary': colors.primary,
      '--event-primary-foreground': primaryForeground,
      '--event-secondary': colors.secondary,
      '--event-secondary-foreground': secondaryForeground,
      '--event-accent': colors.accent,
      '--event-accent-foreground': accentForeground,
      '--event-background': colors.background,
      '--event-foreground': colors.foreground,
      '--event-muted': colors.muted,
      '--event-muted-foreground': mutedForeground,
      '--event-border': border,
      '--event-ring': ring,
    }
  }, [colors])

  return (
    <div
      className="event-theme"
      style={cssVars as React.CSSProperties}
    >
      {children}
    </div>
  )
}

// Hook to check if we're inside an EventThemeProvider
export function useEventTheme() {
  return React.useContext(EventThemeContext)
}

const EventThemeContext = React.createContext<ThemeColors | null>(null)

// Utility classes for event-themed components
export const eventThemeClasses = {
  background: 'bg-[var(--event-background)]',
  foreground: 'text-[var(--event-foreground)]',
  primary: 'bg-[var(--event-primary)] text-[var(--event-primary-foreground)]',
  secondary: 'bg-[var(--event-secondary)] text-[var(--event-secondary-foreground)]',
  accent: 'bg-[var(--event-accent)] text-[var(--event-accent-foreground)]',
  muted: 'bg-[var(--event-muted)] text-[var(--event-muted-foreground)]',
  border: 'border-[var(--event-border)]',
  ring: 'ring-[var(--event-ring)]',
}
