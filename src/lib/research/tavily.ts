import { parseSseChunk } from "@/lib/research/sse";
import {
  parseTavilyChunk,
  type TavilyStreamEvent,
} from "@/lib/research/tavily-events";
import type { RawSource } from "@/lib/research/source-pool";

const TAVILY_RESEARCH_URL = "https://api.tavily.com/research";

export class TavilyResearchError extends Error {}

export type GoalResearchResult = {
  content: string;
  sources: RawSource[];
};

/**
 * Runs one Tavily Research task (model: "mini" — moderate default per §40)
 * and streams it, forwarding Tavily's real internal progress via onEvent as
 * it happens. Resolves with the accumulated report + discovered sources once
 * Tavily emits `event: done`.
 */
export async function runGoalResearch(
  input: string,
  onEvent?: (event: TavilyStreamEvent) => void
): Promise<GoalResearchResult> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    throw new TavilyResearchError("TAVILY_API_KEY is not configured");
  }

  const response = await fetch(TAVILY_RESEARCH_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ input, model: "mini", stream: true }),
  });

  if (!response.ok || !response.body) {
    throw new TavilyResearchError(
      `Tavily research request failed with status ${response.status}`
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let content = "";
  let sources: RawSource[] = [];

  while (true) {
    const { value, done: readerDone } = await reader.read();
    if (readerDone) break;

    buffer += decoder.decode(value, { stream: true });
    const { events, remainder } = parseSseChunk(buffer);
    buffer = remainder;

    for (const event of events) {
      if (event.event === "done") {
        return { content, sources };
      }
      if (!event.data) continue;

      const parsed = parseTavilyChunk(event.data);
      content += parsed.contentDelta;
      if (parsed.sourcesDelta) sources = parsed.sourcesDelta;
      for (const streamEvent of parsed.events) onEvent?.(streamEvent);
    }
  }

  return { content, sources };
}
