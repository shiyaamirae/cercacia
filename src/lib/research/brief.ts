import type { InvestigationSetup, ResearchBrief } from "@/types/investigation";

/**
 * Turns a committed setup into the structured research brief (PRD §13). Kept
 * as its own step — even though the shape matches InvestigationSetup today —
 * so brief construction has one place to grow if it ever needs to diverge
 * (e.g. trimming/normalizing) from what the setup screen collects.
 */
export function buildResearchBrief(setup: InvestigationSetup): ResearchBrief {
  return {
    company: setup.company.trim(),
    role: setup.role.trim(),
    jobDescription: setup.jobDescription.trim(),
    goals: setup.goals,
    customQuestion: setup.customQuestion?.trim() || undefined,
    freshness: setup.freshness,
  };
}
