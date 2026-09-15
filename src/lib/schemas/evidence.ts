import { z } from "zod";
import { investigationAreaSchema } from "@/lib/schemas/investigation";

export const sourceSchema = z.object({
  title: z.string(),
  url: z.string(),
  domain: z.string(),
  publishedAt: z.string().nullable(),
  accessedAt: z.string(),
  sourceTier: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  relevance: z.enum(["high", "medium", "low"]),
});

export const findingSchema = z.object({
  id: z.string(),
  claim: z.string(),
  classification: z.enum([
    "fact",
    "evidence_backed_inference",
    "inference",
    "unknown",
    "contradicted",
  ]),
  confidence: z.enum(["high", "medium", "low"]),
  evidence: z.array(z.string()),
  sources: z.array(sourceSchema),
  whyItMatters: z.string(),
  limitations: z.string().nullable(),
  investigationArea: investigationAreaSchema,
});

export const companyBriefingSchema = z.object({
  companySummary: z.string(),
  companyTags: z.array(
    z.object({ label: z.string(), sources: z.array(sourceSchema) })
  ),
  idealFitSummary: z.string(),
  idealFitSkills: z.array(
    z.object({ skill: z.string(), sources: z.array(sourceSchema) })
  ),
  roleHighlights: z.array(
    z.object({
      point: z.string(),
      whyItMatters: z.string(),
      sources: z.array(sourceSchema),
    })
  ),
});

export const investigationResultSchema = z.object({
  executiveSignal: z.string(),
  companyBriefing: companyBriefingSchema,
  findings: z.array(findingSchema),
  openQuestions: z.array(z.string()),
});

export type SourceValues = z.infer<typeof sourceSchema>;
export type FindingValues = z.infer<typeof findingSchema>;
export type CompanyBriefingValues = z.infer<typeof companyBriefingSchema>;
export type InvestigationResultValues = z.infer<
  typeof investigationResultSchema
>;

/**
 * The LLM never sees or produces raw URLs — it can only cite sources by `ref`,
 * constrained to the pool built from Tavily's actual results (see
 * lib/research/source-pool.ts). title/url/domain/accessedAt are resolved from
 * the pool afterward, never from model output, so a source can't be fabricated.
 */
export function buildSynthesisOutputSchema(refs: [string, ...string[]]) {
  const ref = z.enum(refs);

  return z.object({
    executiveSignal: z.string(),
    sources: z.array(
      z.object({
        ref,
        relevance: z.enum(["high", "medium", "low"]),
      })
    ),
    companyBriefing: z.object({
      companySummary: z.string(),
      companyTags: z
        .array(z.object({ label: z.string(), sourceRefs: z.array(ref).min(1) }))
        .max(5),
      idealFitSummary: z.string(),
      idealFitSkills: z
        .array(z.object({ skill: z.string(), sourceRefs: z.array(ref).min(1) }))
        .max(3),
      roleHighlights: z
        .array(
          z.object({
            point: z.string(),
            whyItMatters: z.string(),
            sourceRefs: z.array(ref).min(1),
          })
        )
        .max(5),
    }),
    findings: z.array(
      z.object({
        claim: z.string(),
        classification: z.enum([
          "fact",
          "evidence_backed_inference",
          "inference",
          "unknown",
          "contradicted",
        ]),
        confidence: z.enum(["high", "medium", "low"]),
        evidence: z.array(z.string()),
        sourceRefs: z.array(ref),
        whyItMatters: z.string(),
        limitations: z.string().nullable(),
        investigationArea: investigationAreaSchema,
      })
    ),
    openQuestions: z.array(z.string()),
  });
}

export type SynthesisOutputSchema = ReturnType<
  typeof buildSynthesisOutputSchema
>;
export type SynthesisOutput = z.infer<SynthesisOutputSchema>;
