import { describe, expect, it } from "vitest";
import { parseNdjsonChunk } from "./ndjson";

describe("parseNdjsonChunk", () => {
  it("parses complete lines into events", () => {
    const { events } = parseNdjsonChunk(
      '{"type":"synthesizing"}\n{"type":"error","reason":"no_sources"}\n'
    );
    expect(events).toEqual([
      { type: "synthesizing" },
      { type: "error", reason: "no_sources" },
    ]);
  });

  it("keeps an incomplete trailing line as the remainder instead of parsing it", () => {
    const { events, remainder } = parseNdjsonChunk(
      '{"type":"synthesizing"}\n{"type":"erro'
    );
    expect(events).toEqual([{ type: "synthesizing" }]);
    expect(remainder).toBe('{"type":"erro');
  });

  it("reassembles a line split across two chunks once the remainder is fed back in", () => {
    const first = parseNdjsonChunk('{"type":"synthesizing"}\n{"type":"err');
    const second = parseNdjsonChunk(
      `${first.remainder}or","reason":"no_sources"}\n`
    );
    expect(second.events).toEqual([{ type: "error", reason: "no_sources" }]);
  });

  it("skips blank lines", () => {
    const { events } = parseNdjsonChunk('{"type":"synthesizing"}\n\n');
    expect(events).toEqual([{ type: "synthesizing" }]);
  });
});
