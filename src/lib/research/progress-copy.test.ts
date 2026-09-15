import { describe, expect, it } from "vitest";
import { failureCopy, goalStageLabel } from "./progress-copy";

describe("goalStageLabel", () => {
  it("labels every real pipeline stage for a given goal", () => {
    expect(goalStageLabel("AI", "searching")).toBe("Canvassing sources on AI");
    expect(goalStageLabel("AI", "reading_sources")).toBe(
      "Following the trail on AI"
    );
    expect(goalStageLabel("AI", "complete")).toBe("AI — evidence gathered");
    expect(goalStageLabel("AI", "failed")).toBe("AI — trail went cold");
  });
});

describe("failureCopy", () => {
  it("returns the PRD §55 string verbatim for no_sources, not retryable", () => {
    const copy = failureCopy("no_sources");
    expect(copy.message).toBe(
      "CercaCia couldn't find enough reliable public evidence to establish this."
    );
    expect(copy.canRetry).toBe(false);
  });

  it("returns the PRD §55 string verbatim for provider_failure, retryable", () => {
    const copy = failureCopy("provider_failure");
    expect(copy.message).toBe(
      "Research temporarily failed. Your investigation hasn't been lost."
    );
    expect(copy.canRetry).toBe(true);
  });

  it("returns the PRD §55 string verbatim for invalid_structure, not retryable", () => {
    const copy = failureCopy("invalid_structure");
    expect(copy.message).toBe(
      "CercaCia couldn't safely structure this finding."
    );
    expect(copy.canRetry).toBe(false);
  });
});
