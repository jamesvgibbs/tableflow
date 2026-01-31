"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { ArrowLeft, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SeatingTypeSelector } from "@/components/seating-type-selector";
import { SeatingQuestionFlow } from "@/components/seating-question-flow";
import { SeatingConfirmation } from "@/components/seating-confirmation";
import { SeatherderLoading } from "@/components/seatherder-loading";
import {
  SEATING_EVENT_TYPES,
  QUESTIONS_BY_TYPE,
  type SeatingEventType,
} from "@/lib/seating-types";
import { mapAnswersToConfig, getDefaultAnswers } from "@/lib/config-mapper";

type WizardStep = "type" | "questions" | "confirm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function SeatingWizardPage({ params }: PageProps) {
  const router = useRouter();
  const [eventId, setEventId] = React.useState<Id<"events"> | null>(null);
  const [step, setStep] = React.useState<WizardStep>("type");
  const [seatingType, setSeatingType] = React.useState<SeatingEventType | null>(
    null
  );
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);

  // Load params on mount
  React.useEffect(() => {
    async function loadParams() {
      const resolvedParams = await params;
      setEventId(resolvedParams.id as Id<"events">);
    }
    loadParams();
  }, [params]);

  // Fetch event and existing config
  const event = useQuery(api.events.get, eventId ? { id: eventId } : "skip");
  const existingConfig = useQuery(
    api.matchingConfig.getByEvent,
    eventId ? { eventId } : "skip"
  );

  // Mutation to save config
  const saveSeatingConfig = useMutation(api.matchingConfig.saveSeatingConfig);

  // Initialize from existing config
  React.useEffect(() => {
    if (existingConfig?.seatingType && !seatingType) {
      setSeatingType(existingConfig.seatingType as SeatingEventType);
      if (existingConfig.answers) {
        setAnswers(existingConfig.answers as Record<string, string>);
      }
      // If we have an existing config, start at questions step
      setStep("questions");
    }
  }, [existingConfig, seatingType]);

  // Handle type selection
  const handleTypeSelect = (type: SeatingEventType) => {
    setSeatingType(type);
    // Set default answers for this type
    setAnswers(getDefaultAnswers(type));
    setStep("questions");
  };

  // Handle moving to confirmation
  const handleContinue = () => {
    setStep("confirm");
  };

  // Handle going back
  const handleBack = () => {
    if (step === "confirm") {
      setStep("questions");
    } else if (step === "questions") {
      setStep("type");
    }
  };

  // Handle saving the configuration
  const handleSave = async () => {
    if (!eventId || !seatingType) return;

    setSaving(true);
    try {
      const config = mapAnswersToConfig(seatingType, answers);
      await saveSeatingConfig({
        eventId,
        seatingType: config.seatingType,
        answers: config.answers,
        weights: config.weights,
        numberOfRounds: config.numberOfRounds,
        vipTables: config.vipTables,
      });
      // Navigate back to event page
      router.push(`/event/${eventId}`);
    } catch (error) {
      console.error("Failed to save seating config:", error);
    } finally {
      setSaving(false);
    }
  };

  // Loading state
  if (!eventId || event === undefined) {
    return <SeatherderLoading message="I am loading the seating options..." />;
  }

  // Not found state
  if (event === null) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>I cannot find this event</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              This event does not exist, or it wandered off. I am not sure which.
            </p>
            <Button onClick={() => router.push("/admin")} className="w-full">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if all questions are answered
  const allQuestionsAnswered = seatingType
    ? QUESTIONS_BY_TYPE[seatingType].every(
        (q) => answers[q.id] !== undefined && answers[q.id] !== ""
      )
    : false;

  return (
    <div className="bg-background">
      <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-2xl">
        {/* Header */}
        <div className="space-y-1 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">
            How should I seat your guests?
          </h1>
          <p className="text-muted-foreground">
            Tell me about your event. I will figure out the rest.
          </p>
        </div>

        {/* Wizard Content */}
        <div className="space-y-6">
          {step === "type" && (
            <SeatingTypeSelector
              value={seatingType}
              onChange={handleTypeSelect}
            />
          )}

          {step === "questions" && seatingType && (
            <>
              <SeatingQuestionFlow
                seatingType={seatingType}
                answers={answers}
                onChange={setAnswers}
              />
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={handleBack}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Change Event Type
                </Button>
                <Button
                  onClick={handleContinue}
                  disabled={!allQuestionsAnswered}
                  className="flex-1"
                >
                  Continue
                </Button>
              </div>
            </>
          )}

          {step === "confirm" && seatingType && (
            <SeatingConfirmation
              seatingType={seatingType}
              answers={answers}
              onConfirm={handleSave}
              onBack={handleBack}
              saving={saving}
            />
          )}
        </div>

        {/* Configured State Summary (if already configured) */}
        {existingConfig?.seatingType && step === "type" && (
          <Card className="mt-6 border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400">
                  <Check className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium">I am already configured.</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Current setup:{" "}
                    {SEATING_EVENT_TYPES[
                      existingConfig.seatingType as SeatingEventType
                    ]?.name || "Custom"}
                    . Select an event type above to change it.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
