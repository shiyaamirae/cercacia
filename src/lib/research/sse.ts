export type SseEvent = { event: string; data: string };

/**
 * Splits a growing text buffer into complete SSE frames (blank-line delimited)
 * plus whatever incomplete trailing text should be kept for the next chunk.
 * Pure and network-free so it's testable against captured payloads.
 */
export function parseSseChunk(buffer: string): {
  events: SseEvent[];
  remainder: string;
} {
  const parts = buffer.split("\n\n");
  const remainder = parts.pop() ?? "";
  const events: SseEvent[] = [];

  for (const part of parts) {
    let eventName = "message";
    const dataLines: string[] = [];

    for (const line of part.split("\n")) {
      if (line.startsWith("event:")) {
        eventName = line.slice("event:".length).trim();
      } else if (line.startsWith("data:")) {
        dataLines.push(line.slice("data:".length).trim());
      }
    }

    if (dataLines.length > 0 || eventName !== "message") {
      events.push({ event: eventName, data: dataLines.join("\n") });
    }
  }

  return { events, remainder };
}
