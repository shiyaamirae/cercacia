import type { InvestigationArea } from "@/types/investigation";

export type InvestigationGoalOption = {
  id: InvestigationArea;
  title: string;
  description: string;
};

/**
 * Single source of truth for the 9 default investigation categories + custom,
 * per PRD §8. Reused by the setup screen's goal selector and, later, the
 * Evidence Explorer's investigation-area filters.
 */
export const INVESTIGATION_GOALS: InvestigationGoalOption[] = [
  {
    id: "company",
    title: "Company",
    description:
      "Recent strategic changes, leadership moves, and product or business direction.",
  },
  {
    id: "role",
    title: "Role",
    description: "What skills matter most, and what success likely looks like.",
  },
  {
    id: "ai",
    title: "AI",
    description:
      "How central AI is to the company's strategy, and how this role relates to it.",
  },
  {
    id: "people",
    title: "People",
    description:
      "Relevant leaders, the likely hiring manager, and team members.",
  },
  {
    id: "product",
    title: "Product",
    description: "Current product, UX/product patterns, strengths, and gaps.",
  },
  {
    id: "customers",
    title: "Customers",
    description: "Recurring customer pain, complaints, and unmet needs.",
  },
  {
    id: "case_studies",
    title: "Case studies",
    description:
      "Comparable products, UX/AI patterns, and lessons worth applying.",
  },
  {
    id: "interview",
    title: "Interview",
    description:
      "Publicly reported interview patterns and likely themes for this role.",
  },
  {
    id: "portfolio",
    title: "Portfolio",
    description:
      "What to demonstrate, and what would make a portfolio project relevant.",
  },
  {
    id: "custom",
    title: "Custom",
    description: "Ask CercaCia to investigate something specific.",
  },
];

export const FRESHNESS_OPTIONS: {
  id: "6_months" | "current_year" | "2_years" | "no_restriction";
  label: string;
  description: string;
}[] = [
  {
    id: "6_months",
    label: "Recent",
    description: "Prioritize the last 6 months",
  },
  { id: "current_year", label: "Current year", description: "" },
  { id: "2_years", label: "Last 2 years", description: "" },
  { id: "no_restriction", label: "No restriction", description: "" },
];
