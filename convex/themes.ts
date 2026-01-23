/**
 * Theme definitions for email templates
 *
 * Theme colors are loaded from shared/theme-colors.json to ensure
 * consistency between Convex backend and frontend.
 */

import themeData from "../shared/theme-colors.json"

export interface ThemeColors {
  primary: string
  secondary: string
  accent: string
  background: string
  foreground: string
  muted: string
}

/**
 * Validate that an object has the ThemeColors shape
 * Throws an error if validation fails (fail-fast at load time)
 */
function validateThemeColors(obj: unknown, name: string): ThemeColors {
  if (!obj || typeof obj !== "object") {
    throw new Error(`Invalid theme colors for ${name}: not an object`)
  }
  const colors = obj as Record<string, unknown>
  const requiredFields = ["primary", "secondary", "accent", "background", "foreground", "muted"] as const
  for (const field of requiredFields) {
    if (typeof colors[field] !== "string") {
      throw new Error(`Invalid theme colors for ${name}: missing or invalid '${field}'`)
    }
  }
  return {
    primary: colors.primary as string,
    secondary: colors.secondary as string,
    accent: colors.accent as string,
    background: colors.background as string,
    foreground: colors.foreground as string,
    muted: colors.muted as string,
  }
}

// Build theme preset map from shared JSON for O(1) lookup
// Validates each preset at load time to catch config errors early
const themePresetsMap = new Map<string, ThemeColors>(
  Object.entries(themeData.presets).map(([key, value]) => [
    key,
    validateThemeColors(value, `preset '${key}'`),
  ])
)

const defaultTheme: ThemeColors = validateThemeColors(themeData.default, "default")

export function resolveThemeColors(
  themePreset?: string,
  customColors?: ThemeColors
): ThemeColors {
  // Custom colors take precedence
  if (customColors) {
    return customColors
  }

  // Then check for preset (O(1) lookup)
  if (themePreset) {
    const colors = themePresetsMap.get(themePreset)
    if (colors) {
      return colors
    }
  }

  // Fall back to default
  return defaultTheme
}

/**
 * Calculate contrast color (black or white) for text on a given background
 */
export function getContrastColor(hexColor: string): string {
  // Remove # if present
  const hex = hexColor.replace("#", "")

  // Parse RGB
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)

  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

  // Return black for light backgrounds, white for dark
  return luminance > 0.5 ? "#000000" : "#FFFFFF"
}
