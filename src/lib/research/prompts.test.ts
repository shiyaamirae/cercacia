import { describe, expect, it } from "vitest";
import { buildGoalResearchInput } from "./prompts";
import type { ResearchBrief } from "@/types/investigation";

const brief: ResearchBrief = {
  company: "Acme Corp",
  role: "Staff Engineer",
  jobDescription: "Build reliable distributed systems.",
  goals: ["company", "custom"],
  customQuestion: "Is our observability idea aligned with their pain points?",
  freshness: "current_year",
};

describe("buildGoalResearchInput", () => {
  it("dynamically includes the given company and role, not a hard-coded example (PRD §38)", () => {
    const input = buildGoalResearchInput(brief, "company");
    expect(input).toContain("Acme Corp");
    expect(input).toContain("Staff Engineer");
    expect(input).not.toContain("Taxfix");
  });

  it("uses the custom question verbatim for the custom goal instead of a generic description", () => {
    const input = buildGoalResearchInput(brief, "custom");
    expect(input).toContain(
      "Is our observability idea aligned with their pain points?"
    );
  });

  it("reflects the selected freshness window", () => {
    const input = buildGoalResearchInput(brief, "company");
    expect(input).toContain("Current year");
  });
});
