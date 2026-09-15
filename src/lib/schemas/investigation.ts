import { z } from "zod";

const investigationAreaSchema = z.enum([
  "company",
  "role",
  "ai",
  "people",
  "product",
  "customers",
  "case_studies",
  "interview",
  "portfolio",
  "custom",
]);

export const freshnessSchema = z.enum([
  "6_months",
  "current_year",
  "2_years",
  "no_restriction",
]);

export const investigationSetupSchema = z
  .object({
    company: z.string().trim().min(1, "Company is required."),
    role: z.string().trim().min(1, "Role is required."),
    jobDescription: z
      .string()
      .trim()
      .min(10, "Paste the job description, or a link to it."),
    goals: z
      .array(investigationAreaSchema)
      .min(1, "Pick at least one investigation goal."),
    customQuestion: z.string().trim().optional(),
    freshness: freshnessSchema.default("6_months"),
  })
  .superRefine((values, ctx) => {
    if (values.goals.includes("custom") && !values.customQuestion) {
      ctx.addIssue({
        code: "custom",
        path: ["customQuestion"],
        message: "Tell us what else to investigate, or remove the Custom goal.",
      });
    }
  });

export type InvestigationSetupInput = z.input<typeof investigationSetupSchema>;
export type InvestigationSetupValues = z.infer<typeof investigationSetupSchema>;
