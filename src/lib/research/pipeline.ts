import type {
  InvestigationArea,
  InvestigationResult,
  InvestigationSetup,
} from "@/types/investigation";
import { buildResearchBrief } from "@/lib/research/brief";
import { buildGoalResearchInput } from "@/lib/research/prompts";
import { runGoalResearch } from "@/lib/research/exa";
import type { RawSource } from "@/lib/research/source-pool";
import {
  synthesizeInvestigation,
  type SynthesisFailureReason,
} from "@/lib/ai/synthesis";

export type GoalStage = "searching" | "reading_sources" | "complete" | "failed";

export type PipelineEvent =
  | { type: "goal_stage"; goal: InvestigationArea; stage: GoalStage }
  | { type: "synthesizing" }
  | { type: "result"; result: InvestigationResult }
  | { type: "error"; reason: SynthesisFailureReason };

type GoalReport = {
  goal: InvestigationArea;
  content: string;
  sources: RawSource[];
};

async function researchGoal(
  goal: InvestigationArea,
  input: string,
  onEvent: (event: PipelineEvent) => void
): Promise<GoalReport> {
  onEvent({ type: "goal_stage", goal, stage: "searching" });

  try {
    const result = await runGoalResearch(input, (streamEvent) => {
      if (streamEvent.kind === "results") {
        onEvent({ type: "goal_stage", goal, stage: "reading_sources" });
      }
    });
    onEvent({ type: "goal_stage", goal, stage: "complete" });
    return { goal, content: result.content, sources: result.sources };
  } catch (error) {
    console.error(`Research failed for goal "${goal}":`, error);
    onEvent({ type: "goal_stage", goal, stage: "failed" });
    return { goal, content: "", sources: [] };
  }
}

/**
 * Runs the full server-side research pipeline: one concurrent Exa deep-
 * search call per selected goal (§38 — no hard-coded queries), then
 * synthesis (§65). Never throws — every outcome, including total failure,
 * is reported through onEvent so the caller can stream it to the client.
 */
export async function runInvestigationPipeline(
  setup: InvestigationSetup,
  onEvent: (event: PipelineEvent) => void
): Promise<void> {
  const brief = buildResearchBrief(setup);

  const goalReports = await Promise.all(
    brief.goals.map((goal) =>
      researchGoal(goal, buildGoalResearchInput(brief, goal), onEvent)
    )
  );

  const usableReports = goalReports.filter(
    (report) => report.sources.length > 0
  );
  if (usableReports.length === 0) {
    onEvent({ type: "error", reason: "no_sources" });
    return;
  }

  onEvent({ type: "synthesizing" });
  const synthesis = await synthesizeInvestigation(brief, usableReports);

  if (!synthesis.ok) {
    onEvent({ type: "error", reason: synthesis.reason });
    return;
  }

  onEvent({ type: "result", result: synthesis.result });
}
