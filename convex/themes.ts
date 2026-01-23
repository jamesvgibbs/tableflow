/**
 * Theme definitions for email templates
 * Mirrors the frontend theme-presets.ts for use in Convex actions
 */

export interface ThemeColors {
  primary: string
  secondary: string
  accent: string
  background: string
  foreground: string
  muted: string
}

interface ThemePreset {
  id: string
  colors: ThemeColors
}

const themePresets: ThemePreset[] = [
  {
    id: "desert-disco",
    colors: {
      primary: "#4E1212",
      secondary: "#FFDB96",
      accent: "#BC5831",
      background: "#295C74",
      foreground: "#FFDB96",
      muted: "#3D4E5C",
    },
  },
  {
    id: "groovy",
    colors: {
      primary: "#6700D9",
      secondary: "#C9A5FF",
      accent: "#FF6B35",
      background: "#1A0A2E",
      foreground: "#F0E6FF",
      muted: "#2D1B4E",
    },
  },
  {
    id: "art-nouveau",
    colors: {
      primary: "#B8860B",
      secondary: "#2E4A3E",
      accent: "#DAA520",
      background: "#1C2B24",
      foreground: "#F5E6D3",
      muted: "#3A5548",
    },
  },
  {
    id: "abstract-landscape",
    colors: {
      primary: "#3B82F6",
      secondary: "#D4A574",
      accent: "#F59E0B",
      background: "#1E3A5F",
      foreground: "#F8FAFC",
      muted: "#2D4A6F",
    },
  },
  {
    id: "desert-matisse",
    colors: {
      primary: "#C1440E",
      secondary: "#E8B832",
      accent: "#D64045",
      background: "#2C1810",
      foreground: "#FAF3E0",
      muted: "#4A2C20",
    },
  },
  {
    id: "woodcut",
    colors: {
      primary: "#1A1A1A",
      secondary: "#F5E6D3",
      accent: "#8B4513",
      background: "#FAF7F2",
      foreground: "#1A1A1A",
      muted: "#E8DFD4",
    },
  },
  {
    id: "linocut",
    colors: {
      primary: "#1E3A5F",
      secondary: "#FFFFFF",
      accent: "#F97316",
      background: "#0F172A",
      foreground: "#F8FAFC",
      muted: "#1E293B",
    },
  },
  {
    id: "south-west",
    colors: {
      primary: "#C2703E",
      secondary: "#40E0D0",
      accent: "#FFD93D",
      background: "#2C1810",
      foreground: "#FDF4E3",
      muted: "#4A3328",
    },
  },
  {
    id: "modern",
    colors: {
      primary: "#0F172A",
      secondary: "#F1F5F9",
      accent: "#3B82F6",
      background: "#FFFFFF",
      foreground: "#0F172A",
      muted: "#E2E8F0",
    },
  },
  {
    id: "corporate",
    colors: {
      primary: "#1E40AF",
      secondary: "#DBEAFE",
      accent: "#059669",
      background: "#F8FAFC",
      foreground: "#1E293B",
      muted: "#CBD5E1",
    },
  },
]

const defaultTheme: ThemeColors = {
  primary: "#6700D9",
  secondary: "#F0F1FF",
  accent: "#00F0D2",
  background: "#FAFAFA",
  foreground: "#1A1A2E",
  muted: "#E5E5E5",
}

export function resolveThemeColors(
  themePreset?: string,
  customColors?: ThemeColors
): ThemeColors {
  // Custom colors take precedence
  if (customColors) {
    return customColors
  }

  // Then check for preset
  if (themePreset) {
    const preset = themePresets.find((p) => p.id === themePreset)
    if (preset) {
      return preset.colors
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
