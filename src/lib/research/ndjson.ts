import type { PipelineEvent } from "@/lib/research/pipeline";

/**
 * Splits a growing text buffer into complete newline-delimited JSON lines
 * plus whatever incomplete trailing text should be kept for the next chunk.
 * Pure and network-free so it's testable without a real stream, mirroring
 * `parseSseChunk`.
 */
export function parseNdjsonChunk(buffer: string): {
  events: PipelineEvent[];
  remainder: string;
} {
  const lines = buffer.split("\n");
  const remainder = lines.pop() ?? "";
  const events = lines
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line) as PipelineEvent);

  return { events, remainder };
}
