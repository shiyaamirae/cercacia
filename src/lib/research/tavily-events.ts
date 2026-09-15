import type { RawSource } from "@/lib/research/source-pool";

export type TavilyStreamEvent =
  | { kind: "tool_call"; name: string; queries?: string[] }
  | { kind: "tool_response"; name: string; sources: RawSource[] }
  | { kind: "sources"; sources: RawSource[] };

type TavilyDelta = {
  content?: string;
  sources?: RawSource[];
  tool_calls?: {
    type: "tool_call" | "tool_response";
    tool_call?: Array<{ name: string; queries?: string[] }>;
    tool_response?: Array<{ name: string; sources?: RawSource[] }>;
  };
};

type TavilyChunk = {
  choices?: Array<{ delta?: TavilyDelta }>;
};

export type ParsedTavilyChunk = {
  contentDelta: string;
  sourcesDelta: RawSource[] | null;
  events: TavilyStreamEvent[];
};

const EMPTY: ParsedTavilyChunk = {
  contentDelta: "",
  sourcesDelta: null,
  events: [],
};

/**
 * Interprets one `data:` JSON payload from Tavily's Research stream. Pure —
 * no network — so it's testable against real captured payloads.
 */
export function parseTavilyChunk(data: string): ParsedTavilyChunk {
  let chunk: TavilyChunk;
  try {
    chunk = JSON.parse(data);
  } catch {
    return EMPTY;
  }

  const delta = chunk.choices?.[0]?.delta;
  if (!delta) return EMPTY;

  const events: TavilyStreamEvent[] = [];

  if (delta.tool_calls?.type === "tool_call") {
    for (const call of delta.tool_calls.tool_call ?? []) {
      events.push({
        kind: "tool_call",
        name: call.name,
        queries: call.queries,
      });
    }
  }

  if (delta.tool_calls?.type === "tool_response") {
    for (const toolResponse of delta.tool_calls.tool_response ?? []) {
      events.push({
        kind: "tool_response",
        name: toolResponse.name,
        sources: toolResponse.sources ?? [],
      });
    }
  }

  if (delta.sources) {
    events.push({ kind: "sources", sources: delta.sources });
  }

  return {
    contentDelta: typeof delta.content === "string" ? delta.content : "",
    sourcesDelta: delta.sources ?? null,
    events,
  };
}
