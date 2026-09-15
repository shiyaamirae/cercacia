import { describe, expect, it } from "vitest";
import { parseSseChunk } from "./sse";

describe("parseSseChunk", () => {
  it("parses a complete event with an event name and data line", () => {
    const { events } = parseSseChunk(
      'event: chat.completion.chunk\ndata: {"a":1}\n\n'
    );
    expect(events).toEqual([
      { event: "chat.completion.chunk", data: '{"a":1}' },
    ]);
  });

  it("keeps an incomplete trailing frame as the remainder instead of emitting it", () => {
    const { events, remainder } = parseSseChunk(
      'event: chat.completion.chunk\ndata: {"a":1}\n\nevent: chat.completion.chunk\ndata: {"a":2'
    );
    expect(events).toHaveLength(1);
    expect(remainder).toBe('event: chat.completion.chunk\ndata: {"a":2');
  });

  it("parses a bare event with no data line, like Tavily's terminal 'done' frame", () => {
    const { events } = parseSseChunk("event: done\n\n");
    expect(events).toEqual([{ event: "done", data: "" }]);
  });

  it("joins multiple data lines within one frame per the SSE spec", () => {
    const { events } = parseSseChunk("data: line one\ndata: line two\n\n");
    expect(events[0].data).toBe("line one\nline two");
  });

  it("reassembles an event split across two chunks once the remainder is fed back in", () => {
    const first = parseSseChunk(
      'event: chat.completion.chunk\ndata: {"a":1}\n\nevent: don'
    );
    const second = parseSseChunk(`${first.remainder}e\n\n`);
    expect(second.events).toEqual([{ event: "done", data: "" }]);
  });
});
