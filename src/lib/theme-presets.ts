/**
 * Theme presets for the frontend UI
 *
 * Theme colors are loaded from shared/theme-colors.json to ensure
 * consistency between Convex backend and frontend.
 */

import themeData from "../../shared/theme-colors.json"

export interface ThemeColors {
  primary: string
  secondary: string
  accent: string
  background: string
  foreground: string
  muted: string
}

export interface ThemePreset {
  id: string
  name: string
  description: string
  colors: ThemeColors
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

// Metadata for theme presets (names/descriptions for UI display)
const themeMetadata: Record<string, { name: string; description: string }> = {
  "desert-disco": {
    name: "Desert Disco",
    description: "Warm maroons, earthy teals, and sunset oranges",
  },
  "groovy": {
    name: "Groovy",
    description: "Vibrant purples with electric accents",
  },
  "art-nouveau": {
    name: "Art Nouveau",
    description: "Elegant golds and deep forest greens",
  },
  "abstract-landscape": {
    name: "Abstract Landscape",
    description: "Sky blues and sandy earth tones",
  },
  "desert-matisse": {
    name: "Desert Matisse",
    description: "Bold reds and ochres inspired by Matisse",
  },
  "woodcut": {
    name: "Woodcut",
    description: "High contrast black and warm cream",
  },
  "linocut": {
    name: "Linocut",
    description: "Deep navy with crisp white accents",
  },
  "south-west": {
    name: "South-West",
    description: "Terracotta, turquoise, and desert sands",
  },
  "modern": {
    name: "Modern",
    description: "Clean minimalist black and white",
  },
  "corporate": {
    name: "Corporate",
    description: "Professional blue palette",
  },
}

// Build theme presets by merging shared colors with frontend metadata
// Validates each preset at load time to catch config errors early
export const themePresets: ThemePreset[] = Object.entries(themeData.presets).map(
  ([id, colors]) => ({
    id,
    name: themeMetadata[id]?.name ?? id,
    description: themeMetadata[id]?.description ?? "",
    colors: validateThemeColors(colors, `preset '${id}'`),
  })
)

// Build Map for O(1) lookup
const themePresetsMap = new Map<string, ThemePreset>(
  themePresets.map((preset) => [preset.id, preset])
)

// O(1) lookup for preset by ID
export function getPresetById(id: string): ThemePreset | undefined {
  return themePresetsMap.get(id)
}

// Default theme from shared JSON (validated at load time)
const defaultTheme: ThemeColors = validateThemeColors(themeData.default, "default")

export function getDefaultTheme(): ThemeColors {
  return defaultTheme
}

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
    const preset = themePresetsMap.get(themePreset)
    if (preset) {
      return preset.colors
    }
  }

  // Fall back to default
  return defaultTheme
}
