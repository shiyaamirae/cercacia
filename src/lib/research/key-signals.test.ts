import { describe, expect, it } from "vitest";
import { selectKeySignals } from "./key-signals";
import type { Finding } from "@/types/investigation";

function makeFinding(id: string, confidence: Finding["confidence"]): Finding {
  return {
    id,
    claim: `Claim ${id}`,
    classification: "fact",
    confidence,
    evidence: [],
    sources: [],
    whyItMatters: "",
    limitations: null,
    investigationArea: "company",
  };
}

describe("selectKeySignals", () => {
  it("orders high confidence before medium before low", () => {
    const findings = [
      makeFinding("low", "low"),
      makeFinding("high", "high"),
      makeFinding("medium", "medium"),
    ];

    expect(selectKeySignals(findings).map((f) => f.id)).toEqual([
      "high",
      "medium",
      "low",
    ]);
  });

  it("caps at 6 even when more findings are available", () => {
    const findings = Array.from({ length: 10 }, (_, i) =>
      makeFinding(`f${i}`, "high")
    );

    expect(selectKeySignals(findings)).toHaveLength(6);
  });

  it("returns fewer than 3 when that's all there is, without padding", () => {
    const findings = [makeFinding("a", "high"), makeFinding("b", "medium")];

    expect(selectKeySignals(findings)).toHaveLength(2);
  });
});
