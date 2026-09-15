import type { GoalStage } from "@/lib/research/pipeline";
import type { SynthesisFailureReason } from "@/lib/ai/synthesis";

/**
 * Per-goal stage copy for the progress screen. Mapped 1:1 to the real
 * `GoalStage`s the pipeline emits (§31 — represent only actual stages, no
 * invented agent theater).
 */
export function goalStageLabel(goalTitle: string, stage: GoalStage): string {
  switch (stage) {
    case "searching":
      return `Canvassing sources on ${goalTitle}`;
    case "reading_sources":
      return `Following the trail on ${goalTitle}`;
    case "complete":
      return `${goalTitle} — evidence gathered`;
    case "failed":
      return `${goalTitle} — trail went cold`;
  }
}

type FailureCopy = {
  message: string;
  canRetry: boolean;
};

/**
 * PRD §55 critical-failure copy, verbatim — CLAUDE.md requires this exact
 * wording, not a paraphrase.
 */
export function failureCopy(reason: SynthesisFailureReason): FailureCopy {
  switch (reason) {
    case "no_sources":
      return {
        message:
          "CercaCia couldn't find enough reliable public evidence to establish this.",
        canRetry: false,
      };
    case "provider_failure":
      return {
        message:
          "Research temporarily failed. Your investigation hasn't been lost.",
        canRetry: true,
      };
    case "invalid_structure":
      return {
        message: "CercaCia couldn't safely structure this finding.",
        canRetry: false,
      };
  }
}
