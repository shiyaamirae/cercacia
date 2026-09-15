import { describe, expect, it, vi } from "vitest";
import type { InvestigationSetup } from "@/types/investigation";

const runGoalResearch = vi.fn();
const synthesizeInvestigation = vi.fn();

vi.mock("@/lib/research/tavily", () => ({
  runGoalResearch: (...args: unknown[]) => runGoalResearch(...args),
}));
vi.mock("@/lib/ai/synthesis", () => ({
  synthesizeInvestigation: (...args: unknown[]) =>
    synthesizeInvestigation(...args),
}));

const { runInvestigationPipeline } = await import("./pipeline");

const setup: InvestigationSetup = {
  company: "Acme Corp",
  role: "Staff Engineer",
  jobDescription: "Build reliable distributed systems.",
  goals: ["company", "ai"],
  freshness: "6_months",
};

describe("runInvestigationPipeline", () => {
  it("researches every selected goal concurrently and reports a stage per goal", async () => {
    runGoalResearch.mockReset().mockImplementation(async (input: string) => ({
      content: `report for ${input}`,
      sources: [{ url: "https://acme.io/a", title: "A" }],
    }));
    synthesizeInvestigation.mockReset().mockResolvedValue({
      ok: true,
      result: { executiveSignal: "", findings: [], openQuestions: [] },
    });

    const events: unknown[] = [];
    await runInvestigationPipeline(setup, (event) => events.push(event));

    const goalStages = events.filter(
      (e) => (e as { type: string }).type === "goal_stage"
    );
    expect(goalStages).toEqual(
      expect.arrayContaining([
        { type: "goal_stage", goal: "company", stage: "searching" },
        { type: "goal_stage", goal: "company", stage: "complete" },
        { type: "goal_stage", goal: "ai", stage: "searching" },
        { type: "goal_stage", goal: "ai", stage: "complete" },
      ])
    );
    expect(events.at(-1)).toEqual({
      type: "result",
      result: { executiveSignal: "", findings: [], openQuestions: [] },
    });
  });

  it("tolerates one goal failing as long as another goal returns usable sources", async () => {
    runGoalResearch
      .mockReset()
      .mockRejectedValueOnce(new Error("Tavily timed out"))
      .mockResolvedValueOnce({
        content: "ok",
        sources: [{ url: "https://acme.io/a", title: "A" }],
      });
    synthesizeInvestigation.mockReset().mockResolvedValue({
      ok: true,
      result: { executiveSignal: "", findings: [], openQuestions: [] },
    });

    const events: unknown[] = [];
    await runInvestigationPipeline(setup, (event) => events.push(event));

    expect(events).toContainEqual({
      type: "goal_stage",
      goal: "company",
      stage: "failed",
    });
    expect(events.at(-1)).toMatchObject({ type: "result" });
  });

  it("reports no_sources and never calls synthesis when every goal fails", async () => {
    runGoalResearch
      .mockReset()
      .mockRejectedValue(new Error("Tavily timed out"));
    synthesizeInvestigation.mockReset();

    const events: unknown[] = [];
    await runInvestigationPipeline(setup, (event) => events.push(event));

    expect(events.at(-1)).toEqual({ type: "error", reason: "no_sources" });
    expect(synthesizeInvestigation).not.toHaveBeenCalled();
  });

  it("forwards a synthesis failure as the pipeline's final error event", async () => {
    runGoalResearch.mockReset().mockResolvedValue({
      content: "ok",
      sources: [{ url: "https://acme.io/a", title: "A" }],
    });
    synthesizeInvestigation
      .mockReset()
      .mockResolvedValue({ ok: false, reason: "invalid_structure" });

    const events: unknown[] = [];
    await runInvestigationPipeline(setup, (event) => events.push(event));

    expect(events.at(-1)).toEqual({
      type: "error",
      reason: "invalid_structure",
    });
  });
});
