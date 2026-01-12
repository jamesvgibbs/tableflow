'use client'

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { ThemeColors } from '@/lib/theme-presets'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'

// WCAG 2.1 AA compliant contrast calculations
function getLuminance(hex: string): number {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return 0
  const [r, g, b] = [1, 2, 3].map((i) => {
    const c = parseInt(result[i], 16) / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function getContrastRatio(color1: string, color2: string): number {
  const l1 = getLuminance(color1)
  const l2 = getLuminance(color2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

function getAccessibleTextColor(background: string): string {
  const blackRatio = getContrastRatio(background, '#000000')
  const whiteRatio = getContrastRatio(background, '#FFFFFF')
  return blackRatio > whiteRatio ? '#000000' : '#FFFFFF'
}

// Minimum contrast ratio for WCAG AA (normal text)
const WCAG_AA_RATIO = 4.5

// Adjust a color's lightness to meet contrast requirements
function adjustColorForContrast(color: string, targetBg: string, minRatio: number = WCAG_AA_RATIO): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color)
  if (!result) return color

  let r = parseInt(result[1], 16)
  let g = parseInt(result[2], 16)
  let b = parseInt(result[3], 16)

  const bgLuminance = getLuminance(targetBg)
  const shouldDarken = bgLuminance > 0.5 // Dark text on light bg, or vice versa

  // Iteratively adjust until we meet the ratio
  for (let i = 0; i < 100; i++) {
    const currentColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
    const ratio = getContrastRatio(currentColor, targetBg)

    if (ratio >= minRatio) {
      return currentColor.toUpperCase()
    }

    // Adjust RGB values
    const step = shouldDarken ? -5 : 5
    r = Math.max(0, Math.min(255, r + step))
    g = Math.max(0, Math.min(255, g + step))
    b = Math.max(0, Math.min(255, b + step))
  }

  // Fallback to black or white
  return shouldDarken ? '#000000' : '#FFFFFF'
}

// Adjust background color so auto-text has sufficient contrast
function adjustBgForAutoText(bgColor: string, minRatio: number = WCAG_AA_RATIO): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(bgColor)
  if (!result) return bgColor

  let r = parseInt(result[1], 16)
  let g = parseInt(result[2], 16)
  let b = parseInt(result[3], 16)

  // Check current contrast with both black and white
  const blackRatio = getContrastRatio(bgColor, '#000000')
  const whiteRatio = getContrastRatio(bgColor, '#FFFFFF')
  const bestRatio = Math.max(blackRatio, whiteRatio)

  if (bestRatio >= minRatio) return bgColor

  // Determine direction: make darker (for white text) or lighter (for black text)
  const shouldDarken = whiteRatio > blackRatio

  for (let i = 0; i < 100; i++) {
    const currentColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
    const autoText = getAccessibleTextColor(currentColor)
    const ratio = getContrastRatio(currentColor, autoText)

    if (ratio >= minRatio) {
      return currentColor.toUpperCase()
    }

    const step = shouldDarken ? -5 : 5
    r = Math.max(0, Math.min(255, r + step))
    g = Math.max(0, Math.min(255, g + step))
    b = Math.max(0, Math.min(255, b + step))
  }

  return shouldDarken ? '#1A1A1A' : '#F5F5F5'
}

interface ContrastCheck {
  name: string
  foreground: string
  background: string
  ratio: number
  passes: boolean
}

function validateThemeContrast(colors: ThemeColors): ContrastCheck[] {
  const autoTextOnPrimary = getAccessibleTextColor(colors.primary)
  const autoTextOnAccent = getAccessibleTextColor(colors.accent)

  return [
    {
      name: 'Text on Background',
      foreground: colors.foreground,
      background: colors.background,
      ratio: getContrastRatio(colors.foreground, colors.background),
      passes: getContrastRatio(colors.foreground, colors.background) >= WCAG_AA_RATIO,
    },
    {
      name: 'Text on Cards',
      foreground: colors.foreground,
      background: colors.secondary,
      ratio: getContrastRatio(colors.foreground, colors.secondary),
      passes: getContrastRatio(colors.foreground, colors.secondary) >= WCAG_AA_RATIO,
    },
    {
      name: 'Primary Button',
      foreground: autoTextOnPrimary,
      background: colors.primary,
      ratio: getContrastRatio(autoTextOnPrimary, colors.primary),
      passes: getContrastRatio(autoTextOnPrimary, colors.primary) >= WCAG_AA_RATIO,
    },
    {
      name: 'Accent Badge',
      foreground: autoTextOnAccent,
      background: colors.accent,
      ratio: getContrastRatio(autoTextOnAccent, colors.accent),
      passes: getContrastRatio(autoTextOnAccent, colors.accent) >= WCAG_AA_RATIO,
    },
  ]
}

interface ContrastWarning {
  message: string
  ratio: number
  needed: number
  recommendation?: string
}

interface ColorInputProps {
  label: string
  description?: string
  value: string
  onChange: (value: string) => void
  warnings?: ContrastWarning[]
}

function ColorInput({ label, description, value, onChange, warnings }: ColorInputProps) {
  const [localValue, setLocalValue] = React.useState(value)

  React.useEffect(() => {
    setLocalValue(value)
  }, [value])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setLocalValue(newValue)

    // Only update parent if valid hex color
    if (/^#[0-9A-Fa-f]{6}$/.test(newValue)) {
      onChange(newValue)
    }
  }

  const handleColorPickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.toUpperCase()
    setLocalValue(newValue)
    onChange(newValue)
  }

  // Calculate accessible text color for the swatch label
  const swatchTextColor = getAccessibleTextColor(value)
  const hasWarnings = warnings && warnings.length > 0

  return (
    <div className={cn(
      "p-3 rounded-lg border transition-colors",
      hasWarnings
        ? "border-amber-300 bg-amber-50/50 dark:border-amber-700 dark:bg-amber-950/20"
        : "border-transparent"
    )}>
      <div className="flex items-center gap-3">
        <div className="relative">
          <input
            type="color"
            value={value}
            onChange={handleColorPickerChange}
            className="absolute inset-0 opacity-0 cursor-pointer w-12 h-12"
          />
          <div
            className="w-12 h-12 rounded-md border-2 border-input cursor-pointer shadow-sm flex items-center justify-center"
            style={{ backgroundColor: value }}
          >
            <span
              className="text-[10px] font-bold uppercase tracking-tight"
              style={{ color: swatchTextColor }}
            >
              {label.slice(0, 3)}
            </span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <Label className="text-sm font-medium block">{label}</Label>
          {description && (
            <span className="text-xs text-muted-foreground block">{description}</span>
          )}
        </div>
        <Input
          type="text"
          value={localValue}
          onChange={handleInputChange}
          placeholder="#000000"
          className={cn(
            'font-mono uppercase w-24 text-xs',
            !/^#[0-9A-Fa-f]{6}$/.test(localValue) && localValue !== value
              ? 'border-destructive'
              : ''
          )}
          maxLength={7}
        />
      </div>
      {/* Inline contrast warnings with recommendations */}
      {hasWarnings && (
        <div className="mt-2 space-y-2">
          {warnings.map((warning, idx) => (
            <div key={idx} className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400">
                <AlertTriangle className="h-3 w-3 shrink-0" />
                <span className="flex-1">{warning.message}</span>
                <span className="font-mono">
                  {warning.ratio.toFixed(1)}:1 (need {warning.needed}:1)
                </span>
              </div>
              {warning.recommendation && warning.recommendation !== value && (
                <button
                  type="button"
                  onClick={() => onChange(warning.recommendation!)}
                  className="flex items-center gap-2 text-xs px-2 py-1.5 rounded bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/50 dark:hover:bg-amber-900 text-amber-800 dark:text-amber-200 transition-colors w-full"
                >
                  <div
                    className="w-4 h-4 rounded border border-amber-300 dark:border-amber-600 shrink-0"
                    style={{ backgroundColor: warning.recommendation }}
                  />
                  <span>Use recommended:</span>
                  <span className="font-mono font-medium">{warning.recommendation}</span>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

interface ColorPickerProps {
  colors: ThemeColors
  onChange: (colors: ThemeColors) => void
}

export function ColorPicker({ colors, onChange }: ColorPickerProps) {
  const handleColorChange = (key: keyof ThemeColors, value: string) => {
    onChange({
      ...colors,
      [key]: value,
    })
  }

  const contrastChecks = validateThemeContrast(colors)
  const failedChecks = contrastChecks.filter((c) => !c.passes)
  const allPass = failedChecks.length === 0

  // Map contrast issues to specific color fields with recommendations
  const getWarningsForColor = (colorKey: keyof ThemeColors): ContrastWarning[] => {
    const warnings: ContrastWarning[] = []

    for (const check of contrastChecks) {
      if (check.passes) continue

      // Map check names to affected color fields with smart recommendations
      if (check.name === 'Text on Background') {
        if (colorKey === 'foreground') {
          // Recommend adjusted foreground color for the background
          const recommendation = adjustColorForContrast(colors.foreground, colors.background)
          warnings.push({
            message: 'Low contrast with Background',
            ratio: check.ratio,
            needed: WCAG_AA_RATIO,
            recommendation,
          })
        } else if (colorKey === 'background') {
          // Recommend adjusted background for the foreground
          const recommendation = adjustColorForContrast(colors.background, colors.foreground)
          warnings.push({
            message: 'Low contrast with Foreground text',
            ratio: check.ratio,
            needed: WCAG_AA_RATIO,
            recommendation,
          })
        }
      } else if (check.name === 'Text on Cards') {
        if (colorKey === 'foreground') {
          // Recommend adjusted foreground for card background
          const recommendation = adjustColorForContrast(colors.foreground, colors.secondary)
          warnings.push({
            message: 'Low contrast on Card backgrounds',
            ratio: check.ratio,
            needed: WCAG_AA_RATIO,
            recommendation,
          })
        } else if (colorKey === 'secondary') {
          // Recommend adjusted secondary (card bg) for foreground text
          const recommendation = adjustColorForContrast(colors.secondary, colors.foreground)
          warnings.push({
            message: 'Low contrast with Foreground text',
            ratio: check.ratio,
            needed: WCAG_AA_RATIO,
            recommendation,
          })
        }
      } else if (check.name === 'Primary Button' && colorKey === 'primary') {
        // Recommend adjusted primary so auto-text has good contrast
        const recommendation = adjustBgForAutoText(colors.primary)
        warnings.push({
          message: 'Button text may be hard to read',
          ratio: check.ratio,
          needed: WCAG_AA_RATIO,
          recommendation,
        })
      } else if (check.name === 'Accent Badge' && colorKey === 'accent') {
        // Recommend adjusted accent so auto-text has good contrast
        const recommendation = adjustBgForAutoText(colors.accent)
        warnings.push({
          message: 'Badge text may be hard to read',
          ratio: check.ratio,
          needed: WCAG_AA_RATIO,
          recommendation,
        })
      }
    }

    return warnings
  }

  return (
    <div className="space-y-6">
      {/* WCAG Compliance Status - Compact summary */}
      <div
        className={cn(
          'p-3 rounded-lg border flex items-center gap-3',
          allPass
            ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900'
            : 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900'
        )}
      >
        {allPass ? (
          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
        ) : (
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
        )}
        <p
          className={cn(
            'font-medium text-sm',
            allPass
              ? 'text-green-800 dark:text-green-200'
              : 'text-amber-800 dark:text-amber-200'
          )}
        >
          {allPass
            ? 'All colors meet WCAG 2.1 AA contrast standards'
            : `${failedChecks.length} contrast ${failedChecks.length === 1 ? 'issue' : 'issues'} detected below`}
        </p>
      </div>

      {/* Color Inputs - Single column */}
      <div className="space-y-2">
        <ColorInput
          label="Primary"
          description="Buttons, links, and interactive elements"
          value={colors.primary}
          onChange={(v) => handleColorChange('primary', v)}
          warnings={getWarningsForColor('primary')}
        />
        <ColorInput
          label="Secondary"
          description="Card and container backgrounds"
          value={colors.secondary}
          onChange={(v) => handleColorChange('secondary', v)}
          warnings={getWarningsForColor('secondary')}
        />
        <ColorInput
          label="Accent"
          description="Highlights, badges, and decorative elements"
          value={colors.accent}
          onChange={(v) => handleColorChange('accent', v)}
          warnings={getWarningsForColor('accent')}
        />
        <ColorInput
          label="Background"
          description="Main page background color"
          value={colors.background}
          onChange={(v) => handleColorChange('background', v)}
          warnings={getWarningsForColor('background')}
        />
        <ColorInput
          label="Foreground"
          description="Primary text color used throughout"
          value={colors.foreground}
          onChange={(v) => handleColorChange('foreground', v)}
          warnings={getWarningsForColor('foreground')}
        />
        <ColorInput
          label="Muted"
          description="Subtle elements, borders, and secondary text"
          value={colors.muted}
          onChange={(v) => handleColorChange('muted', v)}
          warnings={getWarningsForColor('muted')}
        />
      </div>

      {/* Live Preview */}
      <div
        className="p-6 rounded-lg border-2"
        style={{
          backgroundColor: colors.background,
          borderColor: colors.muted,
        }}
      >
        <p
          className="text-lg font-semibold mb-3"
          style={{ color: colors.foreground }}
        >
          Preview
        </p>
        <div
          className="p-4 rounded-md mb-3"
          style={{ backgroundColor: colors.secondary }}
        >
          <p
            className="text-sm font-medium mb-2"
            style={{ color: colors.foreground }}
          >
            Card Content
          </p>
          <p
            className="text-xs"
            style={{ color: `${colors.foreground}99` }}
          >
            This is how text appears on card backgrounds
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            className="px-4 py-2 rounded-md font-medium transition-colors"
            style={{
              backgroundColor: colors.primary,
              color: getAccessibleTextColor(colors.primary),
            }}
          >
            Primary Button
          </button>
          <button
            className="px-4 py-2 rounded-md font-medium"
            style={{
              backgroundColor: colors.secondary,
              color: getAccessibleTextColor(colors.secondary),
            }}
          >
            Secondary
          </button>
          <span
            className="px-3 py-1 rounded-full text-sm font-medium"
            style={{
              backgroundColor: colors.accent,
              color: getAccessibleTextColor(colors.accent),
            }}
          >
            Badge
          </span>
        </div>
        <p
          className="mt-3 text-sm"
          style={{ color: colors.muted }}
        >
          Muted text for secondary information
        </p>
      </div>
    </div>
  )
}
