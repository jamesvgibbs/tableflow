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
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
      }
    : null
}

// WCAG 2.1 relative luminance calculation
function getLuminance(rgb: { r: number; g: number; b: number }): number {
  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  return 0.2126 * toLinear(rgb.r) + 0.7152 * toLinear(rgb.g) + 0.0722 * toLinear(rgb.b)
}

function getContrastRatio(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1)
  const rgb2 = hexToRgb(hex2)
  if (!rgb1 || !rgb2) return 1
  const l1 = getLuminance(rgb1)
  const l2 = getLuminance(rgb2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

// Choose black or white text based on which provides better WCAG contrast
function getContrastColor(hex: string): string {
  const blackRatio = getContrastRatio(hex, '#000000')
  const whiteRatio = getContrastRatio(hex, '#FFFFFF')
  return blackRatio > whiteRatio ? '#000000' : '#FFFFFF'
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
