export type InvestigationArea =
  | "company"
  | "role"
  | "ai"
  | "people"
  | "product"
  | "customers"
  | "case_studies"
  | "interview"
  | "portfolio"
  | "custom";

export type Freshness =
  "6_months" | "current_year" | "2_years" | "no_restriction";

export type InvestigationSetup = {
  company: string;
  role: string;
  jobDescription: string;
  goals: InvestigationArea[];
  customQuestion?: string;
  freshness: Freshness;
};
