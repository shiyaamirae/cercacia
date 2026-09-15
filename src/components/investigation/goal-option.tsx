"use client";

import { cn } from "cn";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { InvestigationGoalOption } from "@/lib/investigation-goals";

type GoalOptionProps = {
  goal: InvestigationGoalOption;
  selected: boolean;
  onToggle: () => void;
  customValue?: string;
  onCustomChange?: (value: string) => void;
  customError?: string;
};

export function GoalOption({
  goal,
  selected,
  onToggle,
  customValue,
  onCustomChange,
  customError,
}: GoalOptionProps) {
  const isCustom = goal.id === "custom";

  return (
    <div
      data-slot="goal-option"
      className={cn(
        "flex flex-col gap-2 rounded-xl border p-3.5 text-left transition-colors",
        selected
          ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
          : "border-border bg-card"
      )}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={selected}
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <span className="flex flex-col gap-1">
          <span className="text-sm font-medium">{goal.title}</span>
          <span className="text-xs leading-relaxed text-muted-foreground">
            {goal.description}
          </span>
        </span>
        <span
          aria-hidden
          className={cn(
            "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border",
            selected
              ? "border-primary bg-primary text-primary-foreground"
              : "border-input"
          )}
        >
          {selected && (
            <svg viewBox="0 0 12 12" className="size-2.5" fill="none">
              <path
                d="M2.5 6.3 5 8.8l4.5-5.5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </span>
      </button>

      {isCustom && selected && (
        <div className="flex flex-col gap-1.5 pt-1">
          <Label htmlFor="custom-question" className="sr-only">
            What else do you want CercaCia to investigate?
          </Label>
          <Textarea
            id="custom-question"
            placeholder="What else do you want CercaCia to investigate?"
            value={customValue ?? ""}
            onChange={(event) => onCustomChange?.(event.target.value)}
            aria-invalid={Boolean(customError)}
            className="min-h-20"
          />
          {customError && (
            <p className="text-xs text-destructive">{customError}</p>
          )}
        </div>
      )}
    </div>
  );
}
