import { describe, expect, it } from "vitest";
import { classifySourceTier } from "./source-tier";

describe("classifySourceTier", () => {
  it("classifies the company's own domain as Tier 1", () => {
    expect(classifySourceTier("taxfix.de", "Taxfix")).toBe(1);
  });

  it("classifies a curated publication domain as Tier 2", () => {
    expect(classifySourceTier("techcrunch.com", "Taxfix")).toBe(2);
  });

  it("classifies a curated community domain as Tier 3", () => {
    expect(classifySourceTier("www.linkedin.com", "Taxfix")).toBe(3);
  });

  it("defaults an unrecognized domain to Tier 4 rather than assuming credibility", () => {
    expect(classifySourceTier("some-random-blog.example", "Taxfix")).toBe(4);
  });

  it("matches the company domain regardless of TLD or case", () => {
    expect(classifySourceTier("TAXFIX.COM", "taxfix")).toBe(1);
  });

  it("still classifies correctly for a different company, proving no hard-coding (PRD §38)", () => {
    expect(classifySourceTier("acme.io", "Acme")).toBe(1);
    expect(classifySourceTier("taxfix.de", "Acme")).toBe(4);
  });
});
