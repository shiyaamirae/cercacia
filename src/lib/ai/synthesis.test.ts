import { describe, expect, it, vi } from "vitest";
import type { ResearchBrief } from "@/types/investigation";

const callGeminiStructured = vi.fn();
const callGroqStructured = vi.fn();

vi.mock("@/lib/ai/gemini", () => ({
  callGeminiStructured: (...args: unknown[]) => callGeminiStructured(...args),
}));
vi.mock("@/lib/ai/groq", () => ({
  callGroqStructured: (...args: unknown[]) => callGroqStructured(...args),
}));

const { synthesizeInvestigation } = await import("./synthesis");

const brief: ResearchBrief = {
  company: "Acme Corp",
  role: "Staff Engineer",
  jobDescription: "Build reliable distributed systems.",
  goals: ["company"],
  freshness: "6_months",
};

const goalReports = [
  {
    goal: "company" as const,
    content: "Acme Corp recently launched a new product line.",
    sources: [{ url: "https://acme.io/news", title: "Acme news" }],
  },
];

function validOutput(ref: string) {
  return {
    executiveSignal: "Acme Corp is expanding its product line.",
    sources: [{ ref, relevance: "high" }],
    findings: [
      {
        claim: "Acme Corp launched a new product line.",
        classification: "fact",
        confidence: "high",
        evidence: ["Official announcement"],
        sourceRefs: [ref],
        whyItMatters: "Signals investment in this area.",
        limitations: null,
        investigationArea: "company",
      },
    ],
    openQuestions: ["What internal priorities drove this launch?"],
  };
}

describe("synthesizeInvestigation", () => {
  it("returns no_sources when no goal produced any retrievable source", async () => {
    const result = await synthesizeInvestigation(brief, [
      { goal: "company", content: "", sources: [] },
    ]);
    expect(result).toEqual({ ok: false, reason: "no_sources" });
    expect(callGeminiStructured).not.toHaveBeenCalled();
  });

  it("succeeds on Gemini's first attempt without falling back to Groq", async () => {
    callGeminiStructured
      .mockReset()
      .mockImplementation(async () => validOutput("S1"));
    callGroqStructured.mockReset();

    const result = await synthesizeInvestigation(brief, goalReports);

    expect(result.ok).toBe(true);
    expect(callGroqStructured).not.toHaveBeenCalled();
    if (result.ok) {
      expect(result.result.findings[0].sources[0].url).toBe(
        "https://acme.io/news"
      );
    }
  });

  it("retries Gemini once with corrective context after an invalid structure, then succeeds", async () => {
    callGeminiStructured
      .mockReset()
      .mockImplementationOnce(async () => ({ nonsense: true }))
      .mockImplementationOnce(async () => validOutput("S1"));
    callGroqStructured.mockReset();

    const result = await synthesizeInvestigation(brief, goalReports);

    expect(result.ok).toBe(true);
    expect(callGeminiStructured).toHaveBeenCalledTimes(2);
    expect(callGeminiStructured.mock.calls[1][0]).toContain(
      "did not match the required schema"
    );
    expect(callGroqStructured).not.toHaveBeenCalled();
  });

  it("retries Gemini once after a thrown error (transient failures happen), then falls back to Groq", async () => {
    callGeminiStructured
      .mockReset()
      .mockRejectedValue(new Error("rate limited"));
    callGroqStructured
      .mockReset()
      .mockImplementation(async () => validOutput("S1"));

    vi.useFakeTimers();
    const resultPromise = synthesizeInvestigation(brief, goalReports);
    await vi.runAllTimersAsync();
    const result = await resultPromise;
    vi.useRealTimers();

    expect(result.ok).toBe(true);
    expect(callGeminiStructured).toHaveBeenCalledTimes(2);
    expect(callGroqStructured).toHaveBeenCalledTimes(1);
  });

  it("fails gracefully as provider_failure when both providers error outright twice", async () => {
    callGeminiStructured
      .mockReset()
      .mockRejectedValue(new Error("network error"));
    callGroqStructured
      .mockReset()
      .mockRejectedValue(new Error("network error"));

    vi.useFakeTimers();
    const resultPromise = synthesizeInvestigation(brief, goalReports);
    await vi.runAllTimersAsync();
    const result = await resultPromise;
    vi.useRealTimers();

    expect(result).toEqual({ ok: false, reason: "provider_failure" });
    expect(callGeminiStructured).toHaveBeenCalledTimes(2);
    expect(callGroqStructured).toHaveBeenCalledTimes(2);
  });

  it("fails gracefully as invalid_structure when both providers return unfixable output", async () => {
    callGeminiStructured
      .mockReset()
      .mockImplementation(async () => ({ nonsense: true }));
    callGroqStructured
      .mockReset()
      .mockImplementation(async () => ({ nonsense: true }));

    const result = await synthesizeInvestigation(brief, goalReports);

    expect(result).toEqual({ ok: false, reason: "invalid_structure" });
    expect(callGeminiStructured).toHaveBeenCalledTimes(2);
    expect(callGroqStructured).toHaveBeenCalledTimes(2);
  });
});
