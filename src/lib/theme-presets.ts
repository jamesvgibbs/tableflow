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

export const themePresets: ThemePreset[] = [
  {
    id: "desert-disco",
    name: "Desert Disco",
    description: "Warm maroons, earthy teals, and sunset oranges",
    colors: {
      primary: "#4E1212",      // maroon
      secondary: "#FFDB96",    // cream
      accent: "#BC5831",       // orange
      background: "#295C74",   // teal
      foreground: "#FFDB96",   // cream
      muted: "#3D4E5C",        // muted teal
    },
  },
  {
    id: "groovy",
    name: "Groovy",
    description: "Vibrant purples with electric accents",
    colors: {
      primary: "#6700D9",      // purple
      secondary: "#C9A5FF",    // light purple
      accent: "#FF6B35",       // orange
      background: "#1A0A2E",   // deep purple
      foreground: "#F0E6FF",   // pale purple
      muted: "#2D1B4E",        // muted purple
    },
  },
  {
    id: "art-nouveau",
    name: "Art Nouveau",
    description: "Elegant golds and deep forest greens",
    colors: {
      primary: "#B8860B",      // dark goldenrod
      secondary: "#2E4A3E",    // forest green
      accent: "#DAA520",       // goldenrod
      background: "#1C2B24",   // deep green
      foreground: "#F5E6D3",   // cream
      muted: "#3A5548",        // muted green
    },
  },
  {
    id: "abstract-landscape",
    name: "Abstract Landscape",
    description: "Sky blues and sandy earth tones",
    colors: {
      primary: "#3B82F6",      // bright blue
      secondary: "#D4A574",    // sand
      accent: "#F59E0B",       // amber
      background: "#1E3A5F",   // deep blue
      foreground: "#F8FAFC",   // white
      muted: "#2D4A6F",        // muted blue
    },
  },
  {
    id: "desert-matisse",
    name: "Desert Matisse",
    description: "Bold reds and ochres inspired by Matisse",
    colors: {
      primary: "#C1440E",      // burnt orange
      secondary: "#E8B832",    // ochre
      accent: "#D64045",       // coral red
      background: "#2C1810",   // dark brown
      foreground: "#FAF3E0",   // warm white
      muted: "#4A2C20",        // muted brown
    },
  },
  {
    id: "woodcut",
    name: "Woodcut",
    description: "High contrast black and warm cream",
    colors: {
      primary: "#1A1A1A",      // near black
      secondary: "#F5E6D3",    // warm cream
      accent: "#8B4513",       // saddle brown
      background: "#FAF7F2",   // off white
      foreground: "#1A1A1A",   // near black
      muted: "#E8DFD4",        // muted cream
    },
  },
  {
    id: "linocut",
    name: "Linocut",
    description: "Deep navy with crisp white accents",
    colors: {
      primary: "#1E3A5F",      // navy
      secondary: "#FFFFFF",    // white
      accent: "#F97316",       // orange
      background: "#0F172A",   // dark navy
      foreground: "#F8FAFC",   // white
      muted: "#1E293B",        // slate
    },
  },
  {
    id: "south-west",
    name: "South-West",
    description: "Terracotta, turquoise, and desert sands",
    colors: {
      primary: "#C2703E",      // terracotta
      secondary: "#40E0D0",    // turquoise
      accent: "#FFD93D",       // golden yellow
      background: "#2C1810",   // adobe brown
      foreground: "#FDF4E3",   // sand
      muted: "#4A3328",        // muted brown
    },
  },
  {
    id: "modern",
    name: "Modern",
    description: "Clean minimalist black and white",
    colors: {
      primary: "#0F172A",      // slate 900
      secondary: "#F1F5F9",    // slate 100
      accent: "#3B82F6",       // blue 500
      background: "#FFFFFF",   // white
      foreground: "#0F172A",   // slate 900
      muted: "#E2E8F0",        // slate 200
    },
  },
  {
    id: "corporate",
    name: "Corporate",
    description: "Professional blue palette",
    colors: {
      primary: "#1E40AF",      // blue 800
      secondary: "#DBEAFE",    // blue 100
      accent: "#059669",       // emerald 600
      background: "#F8FAFC",   // slate 50
      foreground: "#1E293B",   // slate 800
      muted: "#CBD5E1",        // slate 300
    },
  },
]

export function getPresetById(id: string): ThemePreset | undefined {
  return themePresets.find(preset => preset.id === id)
}

export function getDefaultTheme(): ThemeColors {
  return {
    primary: "#6700D9",      // purple (from globals.css)
    secondary: "#F0F1FF",    // pale purple
    accent: "#00F0D2",       // teal
    background: "#FAFAFA",   // off-white
    foreground: "#1A1A2E",   // dark
    muted: "#E5E5E5",        // gray
  }
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
    const preset = getPresetById(themePreset)
    if (preset) {
      return preset.colors
    }
  }

  // Fall back to default
  return getDefaultTheme()
}
