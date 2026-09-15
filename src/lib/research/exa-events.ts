import type { RawSource } from "@/lib/research/source-pool";

export type ExaClaim = { claim: string; evidence: string };

export type ExaGrounding = {
  field: string;
  citations: { url: string; title: string }[];
  confidence: "low" | "medium" | "high";
};

export type ExaStreamEvent =
  | { kind: "results"; sources: RawSource[] }
  | { kind: "grounding"; grounding: ExaGrounding[] }
  | { kind: "done"; claims: ExaClaim[] };

type ExaResultItem = {
  url?: string;
  title?: string;
  publishedDate?: string;
};

type ExaChunk = {
  type?: string;
  results?: ExaResultItem[];
  grounding?: ExaGrounding[];
  output?: { content?: { claims?: ExaClaim[] } };
};

/**
 * Interprets one `data:` JSON payload from Exa's `/search` SSE stream. Pure —
 * no network — so it's testable against real captured payloads. Confirmed
 * live: `results`, `grounding`, and `done` are
 * three separate events (grounding is NOT nested inside `done` — it arrives
 * as its own frame before it). Exa's stream also sends a literal `[DONE]`
 * sentinel line, which isn't JSON — handled the same way as any other
 * unparseable line (skipped, not thrown), same as `text-delta` frames
 * (the JSON output streaming character by character, not needed since we
 * read the final `done` payload directly).
 */
export function parseExaChunk(data: string): ExaStreamEvent | null {
  let chunk: ExaChunk;
  try {
    chunk = JSON.parse(data);
  } catch {
    return null;
  }

  if (chunk.type === "results") {
    const sources: RawSource[] = (chunk.results ?? [])
      .filter(
        (item): item is ExaResultItem & { url: string; title: string } =>
          typeof item.url === "string" && typeof item.title === "string"
      )
      .map((item) => ({
        url: item.url,
        title: item.title,
        publishedAt: item.publishedDate ?? null,
      }));
    return { kind: "results", sources };
  }

  if (chunk.type === "grounding") {
    return { kind: "grounding", grounding: chunk.grounding ?? [] };
  }

  if (chunk.type === "done") {
    return { kind: "done", claims: chunk.output?.content?.claims ?? [] };
  }

  return null;
}
