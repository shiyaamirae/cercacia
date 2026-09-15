import { z } from "zod";
import type {
  CompanyBriefing,
  Finding,
  InvestigationArea,
  InvestigationResult,
  ResearchBrief,
  Source,
} from "@/types/investigation";
import {
  buildSynthesisOutputSchema,
  type SynthesisOutput,
  type SynthesisOutputSchema,
} from "@/lib/schemas/evidence";
import {
  buildSourcePool,
  type PooledSource,
  type RawSource,
} from "@/lib/research/source-pool";
import { buildSynthesisPrompt } from "@/lib/research/prompts";
import { callMistralStructured } from "@/lib/ai/mistral";
import { callGroqStructured } from "@/lib/ai/groq";

export type SynthesisFailureReason =
  "no_sources" | "provider_failure" | "invalid_structure";

export type SynthesisResult =
  | { ok: true; result: InvestigationResult }
  | { ok: false; reason: SynthesisFailureReason };

type GoalReport = {
  goal: InvestigationArea;
  content: string;
  sources: RawSource[];
};

type AttemptOutcome =
  | { status: "success"; data: SynthesisOutput }
  | { status: "invalid_after_retry" }
  | { status: "provider_error" };

const PROVIDER_RETRY_DELAY_MS = 1500;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * One provider, up to two attempts total, covering both failure modes
 * observed in practice: a thrown network/provider error (e.g. a transient
 * 5xx, or the provider's own constrained decoder failing) gets one retry
 * after a short backoff, same prompt; a structured-output validation
 * failure gets one retry with the validation errors appended as corrective
 * context (§22). Either way, only one retry per provider — a second
 * failure of either kind falls back to the next provider.
 */
async function attemptProvider(
  providerName: string,
  callFn: (prompt: string) => Promise<unknown>,
  prompt: string,
  schema: SynthesisOutputSchema
): Promise<AttemptOutcome> {
  let currentPrompt = prompt;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    let raw: unknown;
    try {
      raw = await callFn(currentPrompt);
    } catch (error) {
      console.error(
        `${providerName} synthesis call failed (attempt ${attempt + 1}):`,
        error
      );
      if (attempt === 0) {
        await sleep(PROVIDER_RETRY_DELAY_MS);
        continue;
      }
      return { status: "provider_error" };
    }

    const parsed = schema.safeParse(raw);
    if (parsed.success) return { status: "success", data: parsed.data };

    console.error(
      `${providerName} synthesis output failed schema validation (attempt ${attempt + 1}):`,
      parsed.error.message
    );
    currentPrompt = `${prompt}\n\nYour previous response did not match the required schema. Validation errors:\n${parsed.error.message}\n\nRespond again with corrected JSON that exactly matches the schema.`;
  }

  return { status: "invalid_after_retry" };
}

function resolveSources(
  refs: string[],
  poolByRef: Map<string, PooledSource>,
  relevanceByRef: Map<string, "high" | "medium" | "low">
): Source[] {
  return refs
    .map((ref): Source | null => {
      const pooled = poolByRef.get(ref);
      if (!pooled) return null;
      return {
        title: pooled.title,
        url: pooled.url,
        domain: pooled.domain,
        publishedAt: pooled.publishedAt,
        accessedAt: pooled.accessedAt,
        sourceTier: pooled.sourceTier,
        relevance: relevanceByRef.get(ref) ?? "medium",
      };
    })
    .filter((source): source is Source => source !== null);
}

function assembleResult(
  data: SynthesisOutput,
  pool: PooledSource[]
): InvestigationResult {
  const poolByRef = new Map(pool.map((source) => [source.ref, source]));
  const relevanceByRef = new Map(data.sources.map((s) => [s.ref, s.relevance]));
  const resolve = (refs: string[]) =>
    resolveSources(refs, poolByRef, relevanceByRef);

  const findings: Finding[] = data.findings.map((finding) => ({
    id: crypto.randomUUID(),
    claim: finding.claim,
    classification: finding.classification,
    confidence: finding.confidence,
    evidence: finding.evidence,
    sources: resolve(finding.sourceRefs),
    whyItMatters: finding.whyItMatters,
    limitations: finding.limitations,
    investigationArea: finding.investigationArea,
  }));

  const companyBriefing: CompanyBriefing = {
    companySummary: data.companyBriefing.companySummary,
    companyTags: data.companyBriefing.companyTags.map((tag) => ({
      label: tag.label,
      sources: resolve(tag.sourceRefs),
    })),
    idealFitSummary: data.companyBriefing.idealFitSummary,
    idealFitSkills: data.companyBriefing.idealFitSkills.map((item) => ({
      skill: item.skill,
      sources: resolve(item.sourceRefs),
    })),
    roleHighlights: data.companyBriefing.roleHighlights.map((item) => ({
      point: item.point,
      whyItMatters: item.whyItMatters,
      sources: resolve(item.sourceRefs),
    })),
  };

  return {
    executiveSignal: data.executiveSignal,
    companyBriefing,
    findings,
    openQuestions: data.openQuestions,
  };
}

export async function synthesizeInvestigation(
  brief: ResearchBrief,
  goalReports: GoalReport[]
): Promise<SynthesisResult> {
  const pool = buildSourcePool(
    brief.company,
    goalReports.flatMap((report) => report.sources)
  );

  if (pool.length === 0) {
    return { ok: false, reason: "no_sources" };
  }

  const refs = pool.map((source) => source.ref) as [string, ...string[]];
  const schema = buildSynthesisOutputSchema(refs);
  const jsonSchema = z.toJSONSchema(schema);
  const prompt = buildSynthesisPrompt(brief, goalReports, pool);

  const mistralOutcome = await attemptProvider(
    "Mistral",
    (p) => callMistralStructured(p, jsonSchema, "investigation_result"),
    prompt,
    schema
  );
  if (mistralOutcome.status === "success") {
    return { ok: true, result: assembleResult(mistralOutcome.data, pool) };
  }

  const groqOutcome = await attemptProvider(
    "Groq",
    (p) => callGroqStructured(p, jsonSchema, "investigation_result"),
    prompt,
    schema
  );
  if (groqOutcome.status === "success") {
    return { ok: true, result: assembleResult(groqOutcome.data, pool) };
  }

  return {
    ok: false,
    reason:
      groqOutcome.status === "provider_error"
        ? "provider_failure"
        : "invalid_structure",
  };
}
