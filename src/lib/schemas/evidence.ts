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

const personEntrySchema = z.object({
  name: z.string(),
  title: z.string(),
  note: z.string(),
  sources: z.array(sourceSchema),
});

export const peopleSectionSchema = z.object({
  keyPeople: z.array(personEntrySchema),
  hiringContacts: z.array(personEntrySchema),
});

export const structureSectionSchema = z.object({
  teams: z.array(
    z.object({
      name: z.string(),
      note: z.string(),
      sources: z.array(sourceSchema),
    })
  ),
  orgNotes: z.array(
    z.object({ point: z.string(), sources: z.array(sourceSchema) })
  ),
});

export const relevantWorkSectionSchema = z.object({
  items: z.array(
    z.object({
      title: z.string(),
      summary: z.string(),
      publishedAt: z.string().nullable(),
      sources: z.array(sourceSchema),
    })
  ),
});

export const investigationResultSchema = z.object({
  executiveSignal: z.string(),
  companyBriefing: companyBriefingSchema,
  people: peopleSectionSchema,
  structure: structureSectionSchema,
  relevantWork: relevantWorkSectionSchema,
  findings: z.array(findingSchema),
  openQuestions: z.array(z.string()),
});

export type SourceValues = z.infer<typeof sourceSchema>;
export type FindingValues = z.infer<typeof findingSchema>;
export type CompanyBriefingValues = z.infer<typeof companyBriefingSchema>;
export type PeopleSectionValues = z.infer<typeof peopleSectionSchema>;
export type StructureSectionValues = z.infer<typeof structureSectionSchema>;
export type RelevantWorkSectionValues = z.infer<
  typeof relevantWorkSectionSchema
>;
export type InvestigationResultValues = z.infer<
  typeof investigationResultSchema
>;

/** Enforced backstop for "brief" (1-3 short sentences) on the new dashboard sections' free-text
 * fields — not just a prompt request. ~280 chars is roughly 2-3 short sentences. */
const BRIEF_TEXT_MAX = 280;

/**
 * The LLM never sees or produces raw URLs — it can only cite sources by `ref`,
 * constrained to the pool built from what was actually retrieved (see
 * lib/research/source-pool.ts). title/url/domain/accessedAt are resolved from
 * the pool afterward, never from model output, so a source can't be fabricated.
 */
export function buildSynthesisOutputSchema(refs: [string, ...string[]]) {
  const ref = z.enum(refs);
  const personEntry = z.object({
    name: z.string(),
    title: z.string(),
    note: z.string().max(BRIEF_TEXT_MAX),
    sourceRefs: z.array(ref).min(1),
  });

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
    people: z.object({
      keyPeople: z.array(personEntry).max(5),
      hiringContacts: z.array(personEntry).max(3),
    }),
    structure: z.object({
      teams: z
        .array(
          z.object({
            name: z.string(),
            note: z.string().max(BRIEF_TEXT_MAX),
            sourceRefs: z.array(ref).min(1),
          })
        )
        .max(5),
      orgNotes: z
        .array(
          z.object({
            point: z.string().max(BRIEF_TEXT_MAX),
            sourceRefs: z.array(ref).min(1),
          })
        )
        .max(3),
    }),
    relevantWork: z.object({
      items: z
        .array(
          z.object({
            title: z.string(),
            summary: z.string().max(BRIEF_TEXT_MAX),
            publishedAt: z.string().nullable(),
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
