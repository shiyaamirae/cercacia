"use client";

import type { UseFormReturn } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  FRESHNESS_OPTIONS,
  INVESTIGATION_GOALS,
} from "@/lib/investigation-goals";
import type { InvestigationSetupInput } from "@/lib/schemas/investigation";

type InvestigationSummaryProps = {
  form: UseFormReturn<InvestigationSetupInput>;
};

export function InvestigationSummary({ form }: InvestigationSummaryProps) {
  const values = form.watch();
  const selectedGoals = INVESTIGATION_GOALS.filter((goal) =>
    (values.goals ?? []).includes(goal.id)
  );
  const freshness = FRESHNESS_OPTIONS.find((f) => f.id === values.freshness);

  return (
    <div className="sticky bottom-0 z-10 -mx-6 border-t border-border bg-background/95 px-6 py-4 backdrop-blur sm:-mx-10 sm:px-10 lg:top-24 lg:bottom-auto lg:mx-0 lg:rounded-xl lg:border lg:bg-card lg:p-5 lg:backdrop-blur-none">
      <div className="flex flex-col gap-3">
        <div>
          <p className="font-display text-base leading-snug">
            {values.company?.trim() || "Company"}
          </p>
          <p className="text-sm text-muted-foreground">
            {values.role?.trim() || "Role"}
          </p>
        </div>

        <Separator className="hidden lg:block" />

        <div className="hidden flex-col gap-1.5 lg:flex">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Investigating
          </p>
          {selectedGoals.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {selectedGoals.map((goal) => (
                <Badge key={goal.id} variant="secondary">
                  {goal.title}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No leads chosen yet.
            </p>
          )}
        </div>

        <div className="hidden flex-col gap-1 lg:flex">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Freshness
          </p>
          <p className="text-sm text-muted-foreground">
            {freshness?.description || freshness?.label}
          </p>
        </div>

        <Button type="submit" size="lg" className="mt-1 w-full">
          INVESTIGATE
        </Button>
      </div>
    </div>
  );
}
