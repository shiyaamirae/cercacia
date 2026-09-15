import { describe, expect, it } from "vitest";
import { parseTavilyChunk } from "./tavily-events";

// Payload shapes below are trimmed from real Tavily Research stream captures
// (2026-09-15), not invented — see DECISIONS.md.

describe("parseTavilyChunk", () => {
  it("turns a Planning tool_call delta into a tool_call event", () => {
    const data = JSON.stringify({
      choices: [
        {
          delta: {
            role: "assistant",
            tool_calls: {
              type: "tool_call",
              tool_call: [
                {
                  id: "x",
                  name: "Planning",
                  arguments: "Initializing research plan...",
                },
              ],
            },
          },
        },
      ],
    });

    const result = parseTavilyChunk(data);
    expect(result.events).toEqual([
      { kind: "tool_call", name: "Planning", queries: undefined },
    ]);
    expect(result.contentDelta).toBe("");
    expect(result.sourcesDelta).toBeNull();
  });

  it("carries the generated search queries on a WebSearch tool_call", () => {
    const data = JSON.stringify({
      choices: [
        {
          delta: {
            tool_calls: {
              type: "tool_call",
              tool_call: [
                {
                  name: "WebSearch",
                  queries: ["company AI 2026", "company leadership"],
                },
              ],
            },
          },
        },
      ],
    });

    const result = parseTavilyChunk(data);
    expect(result.events).toEqual([
      {
        kind: "tool_call",
        name: "WebSearch",
        queries: ["company AI 2026", "company leadership"],
      },
    ]);
  });

  it("carries discovered sources on a WebSearch tool_response", () => {
    const data = JSON.stringify({
      choices: [
        {
          delta: {
            tool_calls: {
              type: "tool_response",
              tool_response: [
                {
                  name: "WebSearch",
                  sources: [{ url: "https://example.com/a", title: "A" }],
                },
              ],
            },
          },
        },
      ],
    });

    const result = parseTavilyChunk(data);
    expect(result.events).toEqual([
      {
        kind: "tool_response",
        name: "WebSearch",
        sources: [{ url: "https://example.com/a", title: "A" }],
      },
    ]);
  });

  it("accumulates report text from content deltas", () => {
    const data = JSON.stringify({
      choices: [
        {
          delta: { role: "assistant", content: "## AI products\n\n- Item [1]" },
        },
      ],
    });

    const result = parseTavilyChunk(data);
    expect(result.contentDelta).toBe("## AI products\n\n- Item [1]");
    expect(result.events).toEqual([]);
  });

  it("surfaces the final full source list as both a sources event and sourcesDelta", () => {
    const sources = [{ url: "https://example.com/a", title: "A" }];
    const data = JSON.stringify({ choices: [{ delta: { sources } }] });

    const result = parseTavilyChunk(data);
    expect(result.sourcesDelta).toEqual(sources);
    expect(result.events).toEqual([{ kind: "sources", sources }]);
  });

  it("returns an empty result for malformed JSON instead of throwing", () => {
    expect(() => parseTavilyChunk("not json")).not.toThrow();
    expect(parseTavilyChunk("not json")).toEqual({
      contentDelta: "",
      sourcesDelta: null,
      events: [],
    });
  });

  it("returns an empty result when the chunk has no delta", () => {
    expect(parseTavilyChunk(JSON.stringify({ choices: [] }))).toEqual({
      contentDelta: "",
      sourcesDelta: null,
      events: [],
    });
  });
});
