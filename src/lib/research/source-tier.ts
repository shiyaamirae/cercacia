import type { SourceTier } from "@/types/investigation";

/**
 * Tier 3 per PRD §14/ProjectInst §13: community evidence — useful signal,
 * never independently authoritative. Matched by domain suffix.
 */
const COMMUNITY_DOMAINS = [
  "linkedin.com",
  "reddit.com",
  "glassdoor.com",
  "indeed.com",
  "trustpilot.com",
  "g2.com",
  "capterra.com",
  "quora.com",
];

/** Tier 2: reputable journalism / industry publications, curated. */
const PUBLICATION_DOMAINS = [
  "techcrunch.com",
  "bloomberg.com",
  "reuters.com",
  "ft.com",
  "wsj.com",
  "forbes.com",
  "businessinsider.com",
  "theverge.com",
  "wired.com",
  "handelsblatt.com",
  "sifted.eu",
];

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function matchesDomainList(domain: string, list: string[]): boolean {
  return list.some((known) => domain === known || domain.endsWith(`.${known}`));
}

/**
 * A source on the company's own domain is Tier 1 (official). We don't know
 * the company's real domain up front — only its name — so we match the
 * normalized company name against the domain's registrable label. Deliberately
 * conservative: anything not clearly matched falls to Tier 4 (discovery-only)
 * rather than assuming credibility, per §14's "lower-quality sources may help
 * discover a lead but should not independently establish important claims."
 */
export function classifySourceTier(
  domain: string,
  company: string
): SourceTier {
  const normalizedDomain = domain.toLowerCase().replace(/^www\./, "");
  const normalizedCompany = normalize(company);

  if (normalizedCompany.length > 0) {
    const domainLabel = normalize(normalizedDomain.split(".")[0] ?? "");
    if (
      domainLabel === normalizedCompany ||
      domainLabel.includes(normalizedCompany) ||
      normalizedCompany.includes(domainLabel)
    ) {
      return 1;
    }
  }

  if (matchesDomainList(normalizedDomain, PUBLICATION_DOMAINS)) {
    return 2;
  }

  if (matchesDomainList(normalizedDomain, COMMUNITY_DOMAINS)) {
    return 3;
  }

  return 4;
}
