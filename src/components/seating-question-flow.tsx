"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import {
  QUESTIONS_BY_TYPE,
  SEATING_EVENT_TYPES,
  type SeatingEventType,
  type Question,
} from "@/lib/seating-types"

interface QuestionCardProps {
  question: Question
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

function QuestionCard({ question, value, onChange, disabled }: QuestionCardProps) {
  return (
    <div className="space-y-3">
      <Label className="text-base font-medium">{question.question}</Label>
      <div className="space-y-2">
        {question.options.map((option) => {
          const isSelected = value === option.id

          return (
            <button
              key={option.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(option.id)}
              className={cn(
                "w-full flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-all",
                "hover:border-primary/50 hover:bg-accent/30",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "disabled:pointer-events-none disabled:opacity-50",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border"
              )}
            >
              <div className="flex items-center gap-3 w-full">
                <div
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                    isSelected
                      ? "border-primary bg-primary"
                      : "border-muted-foreground/30"
                  )}
                >
                  {isSelected && (
                    <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                  )}
                </div>
                <span className="font-medium text-sm">{option.label}</span>
              </div>
              <p className="text-xs text-muted-foreground pl-8">
                {option.description}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}

interface SeatingQuestionFlowProps {
  seatingType: SeatingEventType
  answers: Record<string, string>
  onChange: (answers: Record<string, string>) => void
  disabled?: boolean
}

export function SeatingQuestionFlow({
  seatingType,
  answers,
  onChange,
  disabled = false,
}: SeatingQuestionFlowProps) {
  const typeConfig = SEATING_EVENT_TYPES[seatingType]
  const questions = QUESTIONS_BY_TYPE[seatingType]

  const handleAnswerChange = (questionId: string, value: string) => {
    onChange({
      ...answers,
      [questionId]: value,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <typeConfig.icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">{typeConfig.tagline}</h2>
          <p className="text-sm text-muted-foreground">
            Answer a few questions. I will do the math.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {questions.map((question) => (
          <QuestionCard
            key={question.id}
            question={question}
            value={answers[question.id] || question.default}
            onChange={(value) => handleAnswerChange(question.id, value)}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  )
}
