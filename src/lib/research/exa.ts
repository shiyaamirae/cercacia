import { parseSseChunk } from "@/lib/research/sse";
import {
  parseExaChunk,
  type ExaClaim,
  type ExaGrounding,
  type ExaStreamEvent,
} from "@/lib/research/exa-events";
import type { RawSource } from "@/lib/research/source-pool";

const EXA_SEARCH_URL = "https://api.exa.ai/search";

export class ExaResearchError extends Error {}

export type GoalResearchResult = {
  content: string;
  sources: RawSource[];
};

const CLAIMS_OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    claims: {
      type: "array",
      items: {
        type: "object",
        properties: {
          claim: { type: "string" },
          evidence: { type: "string" },
        },
        required: ["claim", "evidence"],
      },
    },
  },
  required: ["claims"],
};

/**
 * Formats grounded claim/evidence pairs into the same "one report per goal,
 * plain text" shape `buildSynthesisPrompt` already expects — no change
 * needed there. Citation URLs are included as hints for which raw source
 * backs which claim (Exa's own grounding, live-verified — Tavily's prose
 * reports never gave us this); the synthesis model still only *outputs*
 * ref-constrained citations per the existing schema, this is just better
 * prompt context, not a change to the anti-hallucination enforcement.
 */
function formatExaReport(
  claims: ExaClaim[],
  grounding: ExaGrounding[]
): string {
  return claims
    .map((item, index) => {
      const citedUrls = new Set(
        grounding
          .filter((entry) => entry.field.startsWith(`claims[${index}]`))
          .flatMap((entry) => entry.citations.map((citation) => citation.url))
      );
      const sourcesLine =
        citedUrls.size > 0 ? `\nSources: ${[...citedUrls].join(", ")}` : "";

      return `Claim: ${item.claim}\nEvidence: ${item.evidence}${sourcesLine}`;
    })
    .join("\n\n");
}

/**
 * Runs one Exa deep-search research call for a single investigation goal,
 * streamed. Resolves once Exa emits its `done` event with the final grounded
 * claims. `outputSchema` + `type: "deep"` were live-verified (2026-09-15) to
 * produce well-grounded claim/evidence/citation output for ~$0.012/call —
 * see DECISIONS.md.
 */
export async function runGoalResearch(
  input: string,
  onEvent?: (event: ExaStreamEvent) => void
): Promise<GoalResearchResult> {
  const apiKey = process.env.EXA_API_KEY;
  if (!apiKey) {
    throw new ExaResearchError("EXA_API_KEY is not configured");
  }

  const response = await fetch(EXA_SEARCH_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: input,
      type: "deep",
      numResults: 8,
      contents: { text: { maxCharacters: 1500 } },
      outputSchema: CLAIMS_OUTPUT_SCHEMA,
      stream: true,
    }),
  });

  if (!response.ok || !response.body) {
    throw new ExaResearchError(
      `Exa research request failed with status ${response.status}`
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let sources: RawSource[] = [];
  let grounding: ExaGrounding[] = [];

  while (true) {
    const { value, done: readerDone } = await reader.read();
    if (readerDone) break;

    buffer += decoder.decode(value, { stream: true });
    const { events, remainder } = parseSseChunk(buffer);
    buffer = remainder;

    for (const event of events) {
      if (!event.data) continue;
      const parsed = parseExaChunk(event.data);
      if (!parsed) continue;

      if (parsed.kind === "results") {
        sources = parsed.sources;
        onEvent?.(parsed);
      } else if (parsed.kind === "grounding") {
        grounding = parsed.grounding;
      } else if (parsed.kind === "done") {
        return { content: formatExaReport(parsed.claims, grounding), sources };
      }
    }
  }

  return { content: "", sources };
}
