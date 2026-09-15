import type { Confidence, FindingClassification } from "@/types/investigation";

export const NOT_ENOUGH_EVIDENCE = "Not enough evidence to identify this yet.";
export const NO_OPEN_QUESTIONS =
  "No open questions identified for this investigation.";

export function sourceCountLabel(count: number): string {
  return `${count} source${count === 1 ? "" : "s"} on file`;
}

export const CLASSIFICATION_LABEL: Record<FindingClassification, string> = {
  fact: "Fact",
  evidence_backed_inference: "Evidence-backed inference",
  inference: "Inference",
  unknown: "Unknown",
  contradicted: "Contradicted",
};

export const CONFIDENCE_LABEL: Record<Confidence, string> = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence",
};
