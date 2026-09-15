import type { SourceTier } from "@/types/investigation";
import { classifySourceTier } from "@/lib/research/source-tier";

export type RawSource = {
  url: string;
  title: string;
};

export type PooledSource = {
  ref: string;
  title: string;
  url: string;
  domain: string;
  sourceTier: SourceTier;
  accessedAt: string;
  publishedAt: null;
};

function extractDomain(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

/**
 * Dedupes raw sources Tavily actually returned across all goal-level research
 * calls and assigns each a stable `ref`. The synthesis model only ever sees
 * these refs (see buildSynthesisOutputSchema) — never raw URLs — so a cited
 * source can't be anything other than something Tavily really retrieved.
 * Malformed URLs are dropped rather than passed through, per §16 (never show
 * a source that can't be verified).
 */
export function buildSourcePool(
  company: string,
  rawSourcesByUrl: RawSource[]
): PooledSource[] {
  const accessedAt = new Date().toISOString();
  const seen = new Map<string, PooledSource>();
  let nextIndex = 1;

  for (const raw of rawSourcesByUrl) {
    const domain = extractDomain(raw.url);
    if (!domain || seen.has(raw.url)) continue;

    seen.set(raw.url, {
      ref: `S${nextIndex}`,
      title: raw.title,
      url: raw.url,
      domain,
      sourceTier: classifySourceTier(domain, company),
      accessedAt,
      publishedAt: null,
    });
    nextIndex += 1;
  }

  return Array.from(seen.values());
}
