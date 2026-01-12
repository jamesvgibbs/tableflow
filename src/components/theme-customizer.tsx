"use client";

import * as React from "react";
import { Paintbrush, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import { ThemePresetSelector } from "./theme-preset-selector";
import { ColorPicker } from "./color-picker";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ThemeColors,
  getPresetById,
  getDefaultTheme,
} from "@/lib/theme-presets";
import { cn } from "@/lib/utils";

interface ThemeCustomizerProps {
  themePreset?: string;
  customColors?: ThemeColors;
  onThemePresetChange: (preset: string | undefined) => void;
  onCustomColorsChange: (colors: ThemeColors | undefined) => void;
}

export function ThemeCustomizer({
  themePreset,
  customColors,
  onThemePresetChange,
  onCustomColorsChange,
}: ThemeCustomizerProps) {
  const [isCustomizing, setIsCustomizing] = React.useState(false);

  // Get current working colors
  const workingColors = React.useMemo(() => {
    if (customColors) return customColors;
    if (themePreset) {
      const preset = getPresetById(themePreset);
      if (preset) return preset.colors;
    }
    return getDefaultTheme();
  }, [themePreset, customColors]);

  const handlePresetSelect = (presetId: string | undefined) => {
    onThemePresetChange(presetId);
    onCustomColorsChange(undefined); // Clear custom colors when selecting a preset
    setIsCustomizing(false);
  };

  const handleCustomColorsChange = (colors: ThemeColors) => {
    onThemePresetChange(undefined); // Clear preset when customizing
    onCustomColorsChange(colors);
  };

  const handleStartCustomizing = () => {
    setIsCustomizing(true);
    // Initialize custom colors from current preset or defaults
    if (!customColors) {
      onCustomColorsChange(workingColors);
    }
  };

  const handleResetTheme = () => {
    onThemePresetChange(undefined);
    onCustomColorsChange(undefined);
    setIsCustomizing(false);
  };

  const hasTheme = themePreset || customColors;

  return (
    <div className="space-y-6 p-4">
      {/* Header with reset */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Choose a Theme</p>
        {hasTheme && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetTheme}
            className="text-muted-foreground hover:text-destructive gap-1.5 h-8"
          >
            <RotateCcw className="size-3" />
            Reset
          </Button>
        )}
      </div>

      {/* Theme Presets */}
      <ThemePresetSelector
        selectedPreset={themePreset}
        onSelectPreset={handlePresetSelect}
        customColors={customColors}
      />

      <Separator />

      {/* Custom Colors Toggle */}
      <div>
        <Button
          variant="outline"
          onClick={() =>
            isCustomizing ? setIsCustomizing(false) : handleStartCustomizing()
          }
          className="w-full justify-between"
        >
          <span className="flex items-center gap-2">
            <Paintbrush className="size-4" />
            Customize Colors
          </span>
          {isCustomizing ? (
            <ChevronUp className="size-4" />
          ) : (
            <ChevronDown className="size-4" />
          )}
        </Button>

        {/* Color Picker - Expandable */}
        <div
          className={cn(
            "overflow-hidden transition-all duration-300 ease-in-out",
            isCustomizing
              ? "max-h-[800px] mt-4 opacity-100"
              : "max-h-0 opacity-0"
          )}
        >
          {customColors && (
            <ColorPicker
              colors={customColors}
              onChange={handleCustomColorsChange}
            />
          )}
        </div>
      </div>
    </div>
  );
}
