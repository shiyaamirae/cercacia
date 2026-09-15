import { describe, expect, it } from "vitest";
import { buildSourcePool } from "./source-pool";

describe("buildSourcePool", () => {
  it("assigns stable, sequential refs starting at S1", () => {
    const pool = buildSourcePool("Taxfix", [
      { url: "https://taxfix.de/blog", title: "Blog" },
      { url: "https://techcrunch.com/article", title: "Article" },
    ]);

    expect(pool.map((s) => s.ref)).toEqual(["S1", "S2"]);
  });

  it("dedupes sources that appear more than once across goal research calls", () => {
    const pool = buildSourcePool("Taxfix", [
      { url: "https://taxfix.de/blog", title: "Blog" },
      { url: "https://taxfix.de/blog", title: "Blog (again)" },
    ]);

    expect(pool).toHaveLength(1);
  });

  it("drops sources with a malformed URL instead of throwing or passing them through", () => {
    const pool = buildSourcePool("Taxfix", [
      { url: "not-a-url", title: "Bad" },
      { url: "https://taxfix.de/blog", title: "Blog" },
    ]);

    expect(pool).toHaveLength(1);
    expect(pool[0].url).toBe("https://taxfix.de/blog");
  });

  it("derives domain from the URL and never uses a publishedAt the API didn't provide", () => {
    const pool = buildSourcePool("Taxfix", [
      { url: "https://www.taxfix.de/blog/post", title: "Post" },
    ]);

    expect(pool[0].domain).toBe("taxfix.de");
    expect(pool[0].publishedAt).toBeNull();
  });

  it("carries a real publishedAt through when the source provided one", () => {
    const pool = buildSourcePool("Taxfix", [
      {
        url: "https://taxfix.de/blog/post",
        title: "Post",
        publishedAt: "2025-06-19T00:00:00.000Z",
      },
    ]);

    expect(pool[0].publishedAt).toBe("2025-06-19T00:00:00.000Z");
  });

  it("classifies tier using the same rules as classifySourceTier", () => {
    const pool = buildSourcePool("Taxfix", [
      { url: "https://taxfix.de/blog", title: "Official" },
    ]);

    expect(pool[0].sourceTier).toBe(1);
  });
});
