import type { Confidence, Finding } from "@/types/investigation";

const CONFIDENCE_RANK: Record<Confidence, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

const MAX_KEY_SIGNALS = 6;

/**
 * Picks the 3-6 highest-value findings for the dashboard's key signal cards
 * (PRD §21) — highest confidence first, capped at 6. Doesn't force a floor
 * of 3: if the investigation only produced fewer findings than that, all of
 * them show.
 */
export function selectKeySignals(findings: Finding[]): Finding[] {
  return [...findings]
    .sort(
      (a, b) => CONFIDENCE_RANK[a.confidence] - CONFIDENCE_RANK[b.confidence]
    )
    .slice(0, MAX_KEY_SIGNALS);
}
