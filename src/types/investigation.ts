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

export type ResearchBrief = InvestigationSetup;

export type SourceTier = 1 | 2 | 3 | 4;

export type Source = {
  title: string;
  url: string;
  domain: string;
  publishedAt: string | null;
  accessedAt: string;
  sourceTier: SourceTier;
  relevance: "high" | "medium" | "low";
};

export type FindingClassification =
  | "fact"
  | "evidence_backed_inference"
  | "inference"
  | "unknown"
  | "contradicted";

export type Confidence = "high" | "medium" | "low";

export type Finding = {
  id: string;
  claim: string;
  classification: FindingClassification;
  confidence: Confidence;
  evidence: string[];
  sources: Source[];
  whyItMatters: string;
  limitations: string | null;
  investigationArea: InvestigationArea;
};

export type CompanyBriefing = {
  companySummary: string;
  companyTags: { label: string; sources: Source[] }[];
  idealFitSummary: string;
  idealFitSkills: { skill: string; sources: Source[] }[];
  roleHighlights: { point: string; whyItMatters: string; sources: Source[] }[];
};

export type InvestigationResult = {
  executiveSignal: string;
  companyBriefing: CompanyBriefing;
  findings: Finding[];
  openQuestions: string[];
};
