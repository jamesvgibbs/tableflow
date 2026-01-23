/**
 * Theme utility functions for WCAG contrast calculations and themed styles
 */

import type { ThemeColors } from '@/lib/theme-presets'

/**
 * Calculate relative luminance of a hex color
 * Based on WCAG 2.1 guidelines
 */
export function getLuminance(hex: string): number {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return 0
  const [r, g, b] = [1, 2, 3].map((i) => {
    const c = parseInt(result[i], 16) / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/**
 * Calculate contrast ratio between two colors
 * Per WCAG 2.1 formula
 */
export function getContrastRatio(color1: string, color2: string): number {
  const l1 = getLuminance(color1)
  const l2 = getLuminance(color2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Get an accessible text color for a given background
 * Returns black or white based on contrast ratio (WCAG AA: 4.5:1)
 */
export function getAccessibleTextColor(background: string, preferredColor?: string): string {
  if (preferredColor) {
    const ratio = getContrastRatio(background, preferredColor)
    if (ratio >= 4.5) return preferredColor
  }
  const blackRatio = getContrastRatio(background, '#000000')
  const whiteRatio = getContrastRatio(background, '#FFFFFF')
  return blackRatio > whiteRatio ? '#000000' : '#FFFFFF'
}

/**
 * Get a muted text color appropriate for the background luminance
 */
export function getAccessibleMutedColor(background: string): string {
  const bgLuminance = getLuminance(background)
  return bgLuminance > 0.5 ? '#666666' : '#999999'
}

/**
 * Adjust brightness of a hex color
 * @param factor - Values > 1 lighten, < 1 darken
 */
export function adjustBrightness(hex: string, factor: number): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return hex
  const adjust = (value: number) => Math.min(255, Math.max(0, Math.round(value * factor)))
  const r = adjust(parseInt(result[1], 16)).toString(16).padStart(2, '0')
  const g = adjust(parseInt(result[2], 16)).toString(16).padStart(2, '0')
  const b = adjust(parseInt(result[3], 16)).toString(16).padStart(2, '0')
  return `#${r}${g}${b}`
}

export interface ThemedStyles {
  page: { background: string; color: string }
  pageText: { color: string }
  pageTextMuted: { color: string }
  card: { backgroundColor: string; borderColor: string }
  cardText: { color: string }
  cardTextMuted: { color: string }
  primaryButton: { backgroundColor: string; color: string; border: string }
  primaryButtonHover: { backgroundColor: string; color: string; border: string }
  outlineButton: { backgroundColor: string; color: string; borderColor: string }
  outlineButtonHover: { backgroundColor: string; color: string; borderColor: string }
  outlineButtonOnCard: { backgroundColor: string; color: string; borderColor: string }
  outlineButtonOnCardHover: { backgroundColor: string; color: string; borderColor: string }
  ghostButton: { backgroundColor: string; color: string }
  ghostButtonHover: { backgroundColor: string; color: string }
  badge: { backgroundColor: string; color: string }
  badgeOnCard: { backgroundColor: string; color: string }
  badgeOutline: { backgroundColor: string; color: string; borderColor: string }
  badgeOutlineOnCard: { backgroundColor: string; color: string; borderColor: string }
  progressBar: { backgroundColor: string }
  progressFill: { backgroundColor: string }
  input: { backgroundColor: string; color: string; borderColor: string }
  tabsList: { backgroundColor: string }
  tabTrigger: { color: string; backgroundColor: string }
  tabTriggerActive: { backgroundColor: string; color: string }
  divider: { borderColor: string }
}

/**
 * Generate a complete themed styles object from theme colors
 * Used for inline styling of themed components
 */
export function getThemedStyles(themeColors: ThemeColors | undefined): ThemedStyles | null {
  if (!themeColors) return null

  const pageTextColor = getAccessibleTextColor(themeColors.background, themeColors.foreground)
  const pageTextColorStrong = getAccessibleTextColor(themeColors.background)
  const pageTextMuted = getAccessibleMutedColor(themeColors.background)
  const cardTextColor = getAccessibleTextColor(themeColors.secondary)
  const cardTextMuted = getAccessibleMutedColor(themeColors.secondary)
  const primaryHoverBg = adjustBrightness(themeColors.primary, 0.85)
  const tabsListBg = themeColors.muted
  const tabsTextStrong = getAccessibleTextColor(tabsListBg)

  return {
    page: {
      background: themeColors.background,
      color: pageTextColor,
    },
    pageText: { color: pageTextColor },
    pageTextMuted: { color: pageTextMuted },
    card: {
      backgroundColor: themeColors.secondary,
      borderColor: `${themeColors.muted}40`,
    },
    cardText: { color: cardTextColor },
    cardTextMuted: { color: cardTextMuted },
    primaryButton: {
      backgroundColor: themeColors.primary,
      color: getAccessibleTextColor(themeColors.primary),
      border: 'none',
    },
    primaryButtonHover: {
      backgroundColor: primaryHoverBg,
      color: getAccessibleTextColor(primaryHoverBg),
      border: 'none',
    },
    outlineButton: {
      backgroundColor: 'transparent',
      color: pageTextColorStrong,
      borderColor: `${pageTextColorStrong}40`,
    },
    outlineButtonHover: {
      backgroundColor: `${pageTextColorStrong}15`,
      color: pageTextColorStrong,
      borderColor: `${pageTextColorStrong}40`,
    },
    outlineButtonOnCard: {
      backgroundColor: 'transparent',
      color: cardTextColor,
      borderColor: `${cardTextColor}40`,
    },
    outlineButtonOnCardHover: {
      backgroundColor: `${cardTextColor}10`,
      color: cardTextColor,
      borderColor: `${cardTextColor}40`,
    },
    ghostButton: {
      backgroundColor: 'transparent',
      color: pageTextColor,
    },
    ghostButtonHover: {
      backgroundColor: `${pageTextColor}15`,
      color: pageTextColor,
    },
    badge: {
      backgroundColor: themeColors.accent,
      color: getAccessibleTextColor(themeColors.accent),
    },
    badgeOnCard: {
      backgroundColor: themeColors.accent,
      color: getAccessibleTextColor(themeColors.accent),
    },
    badgeOutline: {
      backgroundColor: 'transparent',
      color: pageTextColor,
      borderColor: `${pageTextColor}40`,
    },
    badgeOutlineOnCard: {
      backgroundColor: 'transparent',
      color: cardTextColor,
      borderColor: `${cardTextColor}40`,
    },
    progressBar: {
      backgroundColor: `${pageTextColor}20`,
    },
    progressFill: {
      backgroundColor: themeColors.primary,
    },
    input: {
      backgroundColor: `${themeColors.secondary}80`,
      color: cardTextColor,
      borderColor: `${themeColors.muted}40`,
    },
    tabsList: {
      backgroundColor: tabsListBg,
    },
    tabTrigger: {
      color: tabsTextStrong,
      backgroundColor: 'transparent',
    },
    tabTriggerActive: {
      backgroundColor: themeColors.secondary,
      color: cardTextColor,
    },
    divider: {
      borderColor: `${pageTextColor}20`,
    },
  }
}
