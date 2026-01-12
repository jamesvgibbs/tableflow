'use client'

import * as React from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { themePresets, ThemePreset, ThemeColors } from '@/lib/theme-presets'

interface ThemePresetSelectorProps {
  selectedPreset?: string
  onSelectPreset: (presetId: string | undefined) => void
  customColors?: ThemeColors
}

function getContrastColor(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return '#000000'
  const r = parseInt(result[1], 16)
  const g = parseInt(result[2], 16)
  const b = parseInt(result[3], 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? '#000000' : '#FFFFFF'
}

function PresetCard({
  preset,
  isSelected,
  onClick,
}: {
  preset: ThemePreset
  isSelected: boolean
  onClick: () => void
}) {
  const { colors } = preset

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative rounded-xl overflow-hidden text-left transition-all',
        'ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        isSelected ? 'ring-2 ring-primary ring-offset-2' : 'hover:scale-[1.02]'
      )}
    >
      {/* Main card with background color */}
      <div
        className="p-4 min-h-[120px] flex flex-col"
        style={{ backgroundColor: colors.background }}
      >
        {/* Mini preview: simulated card */}
        <div
          className="rounded-lg p-2 mb-3 flex-1"
          style={{ backgroundColor: colors.secondary }}
        >
          {/* Simulated header text */}
          <div
            className="h-2 w-16 rounded mb-2"
            style={{ backgroundColor: `${colors.foreground}40` }}
          />
          {/* Simulated big number */}
          <div
            className="text-2xl font-bold"
            style={{ color: colors.primary }}
          >
            7
          </div>
          {/* Simulated badge */}
          <div
            className="inline-block h-3 w-10 rounded-full mt-1"
            style={{ backgroundColor: colors.accent }}
          />
        </div>

        {/* Theme name */}
        <div className="flex items-center justify-between">
          <div>
            <p
              className="font-semibold text-sm"
              style={{ color: colors.foreground }}
            >
              {preset.name}
            </p>
            <p
              className="text-xs mt-0.5 opacity-70 line-clamp-1"
              style={{ color: colors.foreground }}
            >
              {preset.description}
            </p>
          </div>
          {isSelected && (
            <div
              className="size-5 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: colors.primary }}
            >
              <Check className="size-3" style={{ color: getContrastColor(colors.primary) }} />
            </div>
          )}
        </div>
      </div>
    </button>
  )
}

export function ThemePresetSelector({
  selectedPreset,
  onSelectPreset,
  customColors,
}: ThemePresetSelectorProps) {
  const isCustom = customColors && !selectedPreset

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Default/None option */}
      <button
        onClick={() => onSelectPreset(undefined)}
        className={cn(
          'relative rounded-xl overflow-hidden text-left transition-all',
          'ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          !selectedPreset && !customColors
            ? 'ring-2 ring-primary ring-offset-2'
            : 'hover:scale-[1.02]'
        )}
      >
        <div className="p-4 min-h-[120px] flex flex-col bg-gradient-to-br from-slate-100 via-slate-50 to-white dark:from-slate-800 dark:via-slate-900 dark:to-slate-950">
          {/* Mini preview */}
          <div className="rounded-lg p-2 mb-3 flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="h-2 w-16 rounded mb-2 bg-slate-200 dark:bg-slate-600" />
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">7</div>
            <div className="inline-block h-3 w-10 rounded-full mt-1 bg-slate-300 dark:bg-slate-600" />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">Default</p>
              <p className="text-xs mt-0.5 text-slate-500 dark:text-slate-400">System theme</p>
            </div>
            {!selectedPreset && !customColors && (
              <div className="size-5 rounded-full flex items-center justify-center shrink-0 bg-primary">
                <Check className="size-3 text-primary-foreground" />
              </div>
            )}
          </div>
        </div>
      </button>

      {/* Preset themes */}
      {themePresets.map((preset) => (
        <PresetCard
          key={preset.id}
          preset={preset}
          isSelected={selectedPreset === preset.id && !customColors}
          onClick={() => onSelectPreset(preset.id)}
        />
      ))}

      {/* Custom colors indicator */}
      {isCustom && (
        <button
          className="relative rounded-xl overflow-hidden text-left ring-2 ring-primary ring-offset-2 ring-offset-background"
        >
          <div
            className="p-4 min-h-[120px] flex flex-col"
            style={{ backgroundColor: customColors.background }}
          >
            <div
              className="rounded-lg p-2 mb-3 flex-1"
              style={{ backgroundColor: customColors.secondary }}
            >
              <div
                className="h-2 w-16 rounded mb-2"
                style={{ backgroundColor: `${customColors.foreground}40` }}
              />
              <div
                className="text-2xl font-bold"
                style={{ color: customColors.primary }}
              >
                7
              </div>
              <div
                className="inline-block h-3 w-10 rounded-full mt-1"
                style={{ backgroundColor: customColors.accent }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p
                  className="font-semibold text-sm"
                  style={{ color: customColors.foreground }}
                >
                  Custom
                </p>
                <p
                  className="text-xs mt-0.5 opacity-70"
                  style={{ color: customColors.foreground }}
                >
                  Your custom colors
                </p>
              </div>
              <div
                className="size-5 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: customColors.primary }}
              >
                <Check className="size-3" style={{ color: getContrastColor(customColors.primary) }} />
              </div>
            </div>
          </div>
        </button>
      )}
    </div>
  )
}
