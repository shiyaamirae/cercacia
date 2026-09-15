"use client";

import { Controller, type UseFormReturn } from "react-hook-form";
import { cn } from "cn";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { GoalOption } from "@/components/investigation/goal-option";
import {
  FRESHNESS_OPTIONS,
  INVESTIGATION_GOALS,
  MAX_INVESTIGATION_GOALS,
} from "@/lib/investigation-goals";
import type { InvestigationSetupInput } from "@/lib/schemas/investigation";

type SetupFormProps = {
  form: UseFormReturn<InvestigationSetupInput>;
};

export function SetupForm({ form }: SetupFormProps) {
  const {
    register,
    control,
    formState: { errors },
  } = form;

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-5">
        <h2 className="font-display text-xl">Company &amp; role</h2>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              placeholder="Taxfix"
              aria-invalid={Boolean(errors.company)}
              {...register("company")}
            />
            {errors.company && (
              <p className="text-xs text-destructive">
                {errors.company.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="role">Role</Label>
            <Input
              id="role"
              placeholder="AI First Builder — Design"
              aria-invalid={Boolean(errors.role)}
              {...register("role")}
            />
            {errors.role && (
              <p className="text-xs text-destructive">{errors.role.message}</p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="jobDescription">Job description</Label>
          <Textarea
            id="jobDescription"
            placeholder="Paste the full job description or link here."
            className="min-h-40"
            aria-invalid={Boolean(errors.jobDescription)}
            {...register("jobDescription")}
          />
          {errors.jobDescription && (
            <p className="text-xs text-destructive">
              {errors.jobDescription.message}
            </p>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="font-display text-xl">Investigation goals</h2>
          <p className="text-sm text-muted-foreground">
            Select up to {MAX_INVESTIGATION_GOALS} areas to investigate — each
            one runs its own research call, so fewer, sharper goals go further
            than many broad ones.
          </p>
        </div>

        <Controller
          name="goals"
          control={control}
          render={({ field }) => {
            const selected = field.value ?? [];
            const limitReached = selected.length >= MAX_INVESTIGATION_GOALS;
            return (
              <div className="grid gap-3 sm:grid-cols-2">
                {INVESTIGATION_GOALS.map((goal) => {
                  const isSelected = selected.includes(goal.id);
                  return (
                    <GoalOption
                      key={goal.id}
                      goal={goal}
                      selected={isSelected}
                      disabled={!isSelected && limitReached}
                      onToggle={() => {
                        field.onChange(
                          isSelected
                            ? selected.filter((id) => id !== goal.id)
                            : [...selected, goal.id]
                        );
                      }}
                      customValue={form.watch("customQuestion")}
                      onCustomChange={(value) =>
                        form.setValue("customQuestion", value, {
                          shouldValidate: true,
                        })
                      }
                      customError={errors.customQuestion?.message}
                    />
                  );
                })}
              </div>
            );
          }}
        />
        {errors.goals && (
          <p className="text-xs text-destructive">{errors.goals.message}</p>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-xl">Research freshness</h2>

        <Controller
          name="freshness"
          control={control}
          render={({ field }) => (
            <RadioGroup
              value={field.value}
              onValueChange={field.onChange}
              className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap"
            >
              {FRESHNESS_OPTIONS.map((option) => {
                const isActive = field.value === option.id;
                return (
                  <Label
                    key={option.id}
                    htmlFor={`freshness-${option.id}`}
                    className={cn(
                      "cursor-pointer items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-normal transition-colors",
                      isActive
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-card text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <RadioGroupItem
                      id={`freshness-${option.id}`}
                      value={option.id}
                      className="sr-only"
                    />
                    {option.label}
                  </Label>
                );
              })}
            </RadioGroup>
          )}
        />
        <p className="text-xs text-muted-foreground">
          Prioritizing recent sources doesn&rsquo;t mean ignoring older ones
          that establish important context.
        </p>
      </section>
    </div>
  );
}
