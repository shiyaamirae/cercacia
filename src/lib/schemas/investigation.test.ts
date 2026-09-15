import { describe, expect, it } from "vitest";
import { investigationSetupSchema } from "./investigation";

const baseInput = {
  company: "Taxfix",
  role: "AI First Builder — Design",
  jobDescription: "Paste the full job description or link here.",
  goals: ["company", "ai"],
};

describe("investigationSetupSchema", () => {
  it("accepts a valid setup and defaults freshness to 6_months", () => {
    const result = investigationSetupSchema.parse(baseInput);
    expect(result.freshness).toBe("6_months");
  });

  it("rejects when no goals are selected", () => {
    const result = investigationSetupSchema.safeParse({
      ...baseInput,
      goals: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects more than the max goals (each one is a real research call)", () => {
    const result = investigationSetupSchema.safeParse({
      ...baseInput,
      goals: ["company", "role", "ai", "people", "product", "customers"],
    });
    expect(result.success).toBe(false);
  });

  it("accepts exactly the max number of goals", () => {
    const result = investigationSetupSchema.safeParse({
      ...baseInput,
      goals: ["company", "role", "ai", "people", "product"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects when the custom goal is selected without a custom question", () => {
    const result = investigationSetupSchema.safeParse({
      ...baseInput,
      goals: ["custom"],
    });
    expect(result.success).toBe(false);
  });

  it("accepts the custom goal when a custom question is provided", () => {
    const result = investigationSetupSchema.safeParse({
      ...baseInput,
      goals: ["custom"],
      customQuestion:
        "Is my escalation-copilot idea aligned with their pain points?",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a job description that's too short to be a real JD or link", () => {
    const result = investigationSetupSchema.safeParse({
      ...baseInput,
      jobDescription: "short",
    });
    expect(result.success).toBe(false);
  });
});
