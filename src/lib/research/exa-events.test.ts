import { describe, expect, it } from "vitest";
import { parseExaChunk } from "./exa-events";

// Payload shapes below are trimmed from real Exa /search stream captures
// (2026-09-15, live probes against a real Taxfix query), not invented —
// see DECISIONS.md and apiread.md.

describe("parseExaChunk", () => {
  it("maps a results event to RawSource, using publishedDate when present", () => {
    const data = JSON.stringify({
      requestId: "e4d5",
      type: "results",
      results: [
        {
          id: "https://www.linkedin.com/posts/timoilola_a",
          url: "https://www.linkedin.com/posts/timoilola_a",
          title: "Timo Ilola on hiring",
          publishedDate: "2025-06-19T00:00:00.000Z",
        },
        {
          id: "https://theorg.com/org/taxfix/teams/leadership-team-1",
          url: "https://theorg.com/org/taxfix/teams/leadership-team-1",
          title: "Taxfix leadership team",
          publishedDate: null,
        },
      ],
    });

    expect(parseExaChunk(data)).toEqual({
      kind: "results",
      sources: [
        {
          url: "https://www.linkedin.com/posts/timoilola_a",
          title: "Timo Ilola on hiring",
          publishedAt: "2025-06-19T00:00:00.000Z",
        },
        {
          url: "https://theorg.com/org/taxfix/teams/leadership-team-1",
          title: "Taxfix leadership team",
          publishedAt: null,
        },
      ],
    });
  });

  it("drops a result missing a url or title rather than passing it through", () => {
    const data = JSON.stringify({
      type: "results",
      results: [{ url: "https://example.com/a" /* no title */ }],
    });

    expect(parseExaChunk(data)).toEqual({ kind: "results", sources: [] });
  });

  it("parses a grounding event, arriving separately from done", () => {
    const data = JSON.stringify({
      requestId: "e4d5",
      type: "grounding",
      grounding: [
        {
          field: "claims[0].evidence",
          citations: [
            {
              url: "https://business.google.com/en-all/think/taxfix-veo",
              title: "Taxfix redefines video production with VEO",
            },
          ],
          confidence: "high",
        },
      ],
    });

    expect(parseExaChunk(data)).toEqual({
      kind: "grounding",
      grounding: [
        {
          field: "claims[0].evidence",
          citations: [
            {
              url: "https://business.google.com/en-all/think/taxfix-veo",
              title: "Taxfix redefines video production with VEO",
            },
          ],
          confidence: "high",
        },
      ],
    });
  });

  it("pulls the claims array out of a done event's nested output.content", () => {
    const data = JSON.stringify({
      requestId: "e4d5",
      type: "done",
      output: {
        content: {
          claims: [
            {
              claim: "Taxfix has adopted an AI-first strategy.",
              evidence: "Taxfix CMO Alexander Beresford stated this publicly.",
            },
          ],
        },
      },
      searchTime: 4645.1,
      costDollars: { total: 0.012 },
    });

    expect(parseExaChunk(data)).toEqual({
      kind: "done",
      claims: [
        {
          claim: "Taxfix has adopted an AI-first strategy.",
          evidence: "Taxfix CMO Alexander Beresford stated this publicly.",
        },
      ],
    });
  });

  it("ignores text-delta frames — just the JSON output streaming character by character", () => {
    const data = JSON.stringify({
      requestId: "e4d5",
      type: "text-delta",
      delta: '{"claims":[',
      choices: [
        { index: 0, delta: { role: "assistant" }, finish_reason: null },
      ],
    });

    expect(parseExaChunk(data)).toBeNull();
  });

  it("returns null for the literal [DONE] sentinel instead of throwing", () => {
    expect(() => parseExaChunk("[DONE]")).not.toThrow();
    expect(parseExaChunk("[DONE]")).toBeNull();
  });
});
