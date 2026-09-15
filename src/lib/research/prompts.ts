import type { InvestigationArea, ResearchBrief } from "@/types/investigation";
import {
  FRESHNESS_OPTIONS,
  INVESTIGATION_GOALS,
} from "@/lib/investigation-goals";
import type { PooledSource } from "@/lib/research/source-pool";

const JD_EXCERPT_LENGTH = 600;

// PRD §64 — verbatim required content for the research stage.
export const RESEARCH_PROMPT_V1 = `You are conducting evidence-backed research for a job applicant.

Your job is not to produce a generic company summary.

Investigate the company and role according to the user's selected research goals.

Prioritize recent information while preserving important older context.

Prefer primary sources.

Every substantive conclusion must be traceable to retrieved evidence.

Separate:
- fact
- evidence-backed inference
- inference
- unknown
- contradiction

Do not invent:
- sources
- URLs
- quotes
- statistics
- employee roles
- company strategy
- interview processes
- customer sentiment

If evidence is insufficient, say so.

Do not treat public employee/customer discussion as representative of the entire organization or user base.

Do not claim to know internal information unless publicly established by a reliable source.`;

export function buildGoalResearchInput(
  brief: ResearchBrief,
  goal: InvestigationArea
): string {
  const goalOption = INVESTIGATION_GOALS.find((option) => option.id === goal);
  const freshnessOption = FRESHNESS_OPTIONS.find(
    (f) => f.id === brief.freshness
  );
  const jdExcerpt = brief.jobDescription.slice(0, JD_EXCERPT_LENGTH);

  const goalInstruction =
    goal === "custom" && brief.customQuestion
      ? brief.customQuestion
      : `${goalOption?.title ?? goal} — ${goalOption?.description ?? ""}`;

  return [
    RESEARCH_PROMPT_V1,
    "",
    `Company: ${brief.company}`,
    `Role: ${brief.role}`,
    `Role context (from the job description): ${jdExcerpt}`,
    "",
    `Investigate: ${goalInstruction}`,
    "",
    "Prioritize sources that add signal beyond the job posting itself: LinkedIn posts, " +
      "company blog/engineering posts, news coverage, interviews or public posts from the " +
      "CEO/leadership/hiring team, and posts about team growth or hiring plans. Avoid " +
      "treating this company's own job listing for this role (or a mirror of it on a job " +
      "board) as a source of insight about what the company values — it's already given to " +
      "you above; the point of researching is to find what it doesn't say.",
    "",
    `Freshness: ${freshnessOption?.label ?? brief.freshness}` +
      (freshnessOption?.description
        ? ` — ${freshnessOption.description}`
        : "") +
      ". Prioritize this window while still including older sources that establish important context.",
    "If the company is associated with a particular country or region, also consider relevant local-language sources — but don't assume local-language evidence is automatically more authoritative than English-language evidence.",
  ].join("\n");
}

// PRD §65 — the synthesis model normalizes/classifies, it does not research.
export const SYNTHESIS_PROMPT_V1 = `You receive raw research output, already gathered. Your job is NOT to conduct new research.

Your job is to:
- normalize findings
- classify claims (fact / evidence_backed_inference / inference / unknown / contradicted)
- remove unsupported claims
- detect contradictions
- identify uncertainty
- connect evidence to the user's role
- produce structured output matching the given schema exactly

Rules:
- If evidence isn't present for a claim, classification must be "unknown", never "inference".
- Never silently convert an inference into a fact. State interpretation as interpretation.
- Cite sources only by the "ref" ids given below (e.g. "S1") — never write a URL, domain, or
  source title yourself. A finding's sourceRefs must only contain refs listed in the source pool.
- "evidence" and "sourceRefs" are different fields. evidence is 1-3 short paraphrased excerpts
  of what the sources actually say (plain text, no ref ids in it). sourceRefs is the separate
  list of which pool refs support the claim. Do not put ref ids like "S1" inside evidence.
- If credible sources disagree, represent both sides and classify the finding "contradicted" —
  do not average or hide the disagreement.
- Separate role requirements into explicit (directly stated in the JD), strongly implied
  (supported by multiple signals), and possible/unverified (plausible but insufficiently
  supported) — reflect this in the claim wording, not just the classification.
- Customer/employee/community discussion is a signal, not representative research. Never write
  "users want X" or invent percentages — prefer "a recurring theme in the reviewed feedback was X".
- Confidence reflects research strength (primary evidence / multiple independent sources = high;
  reasonable evidence with limitations = medium; weak, indirect, or mostly community evidence =
  low), not a probability estimate.
- Always include an openQuestions list: things the public evidence does not establish that would
  matter to this applicant (e.g. exact hiring manager, internal priorities, unpublished roadmap).
  This is mandatory even when research went well — it prevents false certainty.
- executiveSignal is 5-7 sentences on what matters most before this applicant applies, grounded
  only in the findings you produce.
- Also produce a companyBriefing object, the dashboard's first section:
  - companySummary: one sentence stating what the company is, grounded in research.
  - companyTags: up to 5 short factual tags about the company itself — notable acquisitions,
    employee count, revenue/funding, awards or recognition, or other notable facts found in
    research. Not generic descriptors, not search terms. If fewer than 5 are actually
    supported by the research, return fewer — never invent a tag to fill the count.
  - idealFitSummary and idealFitSkills (up to 3): who the company appears to value in a role
    like this and why, based on evidence about the company's product, team, strategy, or
    culture — NOT extracted or paraphrased from the job description. The job description is
    given only so you understand what role this is being evaluated against; it is never a
    source of fact for this field.
  - roleHighlights (up to 5): things this candidate should know about the company specific to
    this role, each with a one-line "why it matters to this role." Must come from researched
    evidence — never copied or paraphrased from the job description, never a false or invented
    claim.
  - Before including any idealFitSkills or roleHighlights item, apply this test: "could a
    candidate have learned this from reading the job posting alone, even if worded
    differently?" If yes, it does not belong here — these fields exist specifically to add
    what the job posting does NOT already tell the candidate, not to restate it. This applies
    even when a discovered source is itself a copy of the job posting (e.g. a mirror on a job
    board or the company's own careers page) — that source can support ordinary findings, but
    never idealFitSkills or roleHighlights.
    Example — a job posting says "you'll work in small, focused pods with high ownership":
    - BAD (job-posting paraphrase, do not do this): "Comfortable working in small,
      autonomous teams with end-to-end ownership."
    - GOOD (adds something the posting didn't say): "The company restructured its product
      org into small cross-functional pods in 2025, replacing its former stage-gated review
      process — candidates who've resisted process-heavy environments before are likely to
      fit better than those who thrive on structure."
    Prefer citing a specific, named fact (a person, a date, a program name, a metric, an
    event) over restating a trait or competency in different words — named facts can't have
    come from generic job-posting language, restated traits often can.
  - Every companyTags/idealFitSkills/roleHighlights item must carry at least one real
    sourceRef from the pool. If nothing in the pool supports an item, leave it out rather than
    include it unsupported.`;

function formatSourcePool(pool: PooledSource[]): string {
  return pool
    .map((source) => `${source.ref}: ${source.title} (${source.domain})`)
    .join("\n");
}

export function buildSynthesisPrompt(
  brief: ResearchBrief,
  goalReports: { goal: InvestigationArea; content: string }[],
  pool: PooledSource[]
): string {
  const reports = goalReports
    .map((report) => `### Research for "${report.goal}"\n${report.content}`)
    .join("\n\n");

  return [
    SYNTHESIS_PROMPT_V1,
    "",
    `Company: ${brief.company}`,
    `Role: ${brief.role}`,
    `Full job description:\n${brief.jobDescription}`,
    brief.customQuestion
      ? `Candidate's custom question: ${brief.customQuestion}`
      : "",
    "",
    "Source pool (cite only these refs):",
    formatSourcePool(pool),
    "",
    "Raw research output:",
    reports,
  ]
    .filter(Boolean)
    .join("\n");
}
