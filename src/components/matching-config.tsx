"use client"

import * as React from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import { Id } from "../../convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  MATCHING_PRESETS,
  type MatchingPresetId,
  type MatchingWeights,
} from "@/lib/types"
import { Check, Loader2, RotateCcw, History } from "lucide-react"

interface MatchingConfigProps {
  eventId: Id<"events">
}

// Descriptions for each weight
const WEIGHT_DESCRIPTIONS: Record<keyof MatchingWeights, { label: string; description: string }> = {
  departmentMix: {
    label: "Department Mixing",
    description: "Higher values seat people from different departments together. Lower values group same departments.",
  },
  interestAffinity: {
    label: "Interest Affinity",
    description: "Higher values group people with similar interests. Lower values mix different interests.",
  },
  jobLevelDiversity: {
    label: "Job Level Diversity",
    description: "Higher values mix different job levels (junior with senior). Lower values group similar levels.",
  },
  goalCompatibility: {
    label: "Goal Compatibility",
    description: "Higher values match complementary networking goals (e.g., mentees with potential mentors).",
  },
  repeatAvoidance: {
    label: "Repeat Avoidance",
    description: "Higher values strongly prevent sitting with the same people across rounds.",
  },
}

// Order of weights to display
const WEIGHT_ORDER: (keyof MatchingWeights)[] = [
  "departmentMix",
  "interestAffinity",
  "jobLevelDiversity",
  "goalCompatibility",
  "repeatAvoidance",
]

export function MatchingConfig({ eventId }: MatchingConfigProps) {
  const config = useQuery(api.matchingConfig.getByEventWithDefaults, { eventId })
  const updateWeights = useMutation(api.matchingConfig.updateWeights)
  const updateNoveltyPreference = useMutation(api.matchingConfig.updateNoveltyPreference)
  const applyPreset = useMutation(api.matchingConfig.applyPreset)

  const [localWeights, setLocalWeights] = React.useState<MatchingWeights | null>(null)
  const [localNovelty, setLocalNovelty] = React.useState<number | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [saved, setSaved] = React.useState(false)

  // Initialize local weights and novelty when config loads
  React.useEffect(() => {
    if (config?.weights && !localWeights) {
      setLocalWeights(config.weights)
    }
    if (config && localNovelty === null) {
      setLocalNovelty(config.noveltyPreference ?? 0.5)
    }
  }, [config, localWeights, localNovelty])

  // Show loading state
  if (!config) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Matching Algorithm</CardTitle>
          <CardDescription>Loading configuration...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  const weights = localWeights ?? config.weights

  const handleWeightChange = (key: keyof MatchingWeights, value: number) => {
    setLocalWeights((prev) => ({
      ...(prev ?? config.weights),
      [key]: value,
    }))
    setSaved(false)
  }

  const handleSave = async () => {
    if (!localWeights) return
    setSaving(true)
    try {
      await updateWeights({ eventId, weights: localWeights })
      // Also save novelty preference if changed
      if (localNovelty !== null && localNovelty !== (config?.noveltyPreference ?? 0.5)) {
        await updateNoveltyPreference({ eventId, noveltyPreference: localNovelty })
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  const handleNoveltyChange = (value: number) => {
    setLocalNovelty(value)
    setSaved(false)
  }

  const handleApplyPreset = async (presetId: MatchingPresetId) => {
    setSaving(true)
    try {
      await applyPreset({ eventId, preset: presetId })
      // Update local state with preset weights
      setLocalWeights(MATCHING_PRESETS[presetId].weights)
      // Set novelty based on preset type
      const noveltyForPreset = presetId === "maxDiversity" || presetId === "networkingOptimized" ? 0.8 : 0.5
      setLocalNovelty(noveltyForPreset)
      await updateNoveltyPreference({ eventId, noveltyPreference: noveltyForPreset })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setLocalWeights(config.weights)
    setLocalNovelty(config.noveltyPreference ?? 0.5)
    setSaved(false)
  }

  const noveltyValue = localNovelty ?? config.noveltyPreference ?? 0.5
  const hasWeightChanges = localWeights && JSON.stringify(localWeights) !== JSON.stringify(config.weights)
  const hasNoveltyChanges = localNovelty !== null && localNovelty !== (config.noveltyPreference ?? 0.5)
  const hasChanges = hasWeightChanges || hasNoveltyChanges

  return (
    <Card>
      <CardHeader>
        <CardTitle>Matching Algorithm</CardTitle>
        <CardDescription>
          Configure how guests are matched and seated together. These weights affect
          multi-round table assignments.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Presets */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Quick Presets</Label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.entries(MATCHING_PRESETS) as [MatchingPresetId, typeof MATCHING_PRESETS[MatchingPresetId]][]).map(
              ([id, preset]) => (
                <Button
                  key={id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleApplyPreset(id)}
                  disabled={saving}
                  className="justify-start"
                >
                  <span className="truncate">{preset.name}</span>
                </Button>
              )
            )}
          </div>
        </div>

        {/* Weight Sliders */}
        <div className="space-y-6">
          <Label className="text-sm font-medium">Fine-tune Weights</Label>
          {WEIGHT_ORDER.map((key) => (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor={key} className="text-sm">
                  {WEIGHT_DESCRIPTIONS[key].label}
                </Label>
                <span className="text-sm text-muted-foreground tabular-nums w-12 text-right">
                  {weights[key].toFixed(2)}
                </span>
              </div>
              <Slider
                id={key}
                min={key === "repeatAvoidance" ? 0 : -1}
                max={1}
                step={0.1}
                value={[weights[key]]}
                onValueChange={([value]) => handleWeightChange(key, value)}
                disabled={saving}
              />
              <p className="text-xs text-muted-foreground">
                {WEIGHT_DESCRIPTIONS[key].description}
              </p>
            </div>
          ))}
        </div>

        {/* Cross-Event Memory */}
        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-muted-foreground" />
            <Label className="text-sm font-medium">Cross-Event Memory</Label>
          </div>
          <p className="text-sm text-muted-foreground">
            I remember who sat together at your previous events. Use this to help guests meet new people.
          </p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="novelty" className="text-sm">
                New Connections Preference
              </Label>
              <span className="text-sm text-muted-foreground tabular-nums w-12 text-right">
                {noveltyValue.toFixed(2)}
              </span>
            </div>
            <Slider
              id="novelty"
              min={0}
              max={1}
              step={0.1}
              value={[noveltyValue]}
              onValueChange={([value]) => handleNoveltyChange(value)}
              disabled={saving}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Ignore history</span>
              <span>Strongly prefer new</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {noveltyValue < 0.3
                ? "I will not consider who sat together before. Repeat tablemates are fine."
                : noveltyValue < 0.7
                  ? "I will gently encourage new connections while still allowing some familiar faces."
                  : "I will strongly avoid seating people with past tablemates from your other events."}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-4 border-t">
          <Button onClick={handleSave} disabled={saving || !hasChanges}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : saved ? (
              <Check className="mr-2 h-4 w-4" />
            ) : null}
            {saved ? "Saved" : "Save Changes"}
          </Button>
          {hasChanges && (
            <Button variant="outline" onClick={handleReset} disabled={saving}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
