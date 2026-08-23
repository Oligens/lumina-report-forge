export type EvidenceClass = "official" | "secondary" | "analysis" | "hypothesis";
export type ConfidenceLevel = "high" | "medium" | "low" | "unverified";
export type SourceTier = 5 | 4 | 3 | 2 | 1;

export interface ResearchSource {
  id: string;
  title: string;
  url: string;
  publisher: string;
  tier: SourceTier;
  class: Exclude<EvidenceClass, "analysis" | "hypothesis">;
  authoritative: boolean;
  jurisdiction?: string;
  publishedAt?: string;
  effectiveFrom?: string;
  verifiedAt: string;
  accessible: boolean;
  reason: string;
}

export interface EvidenceItem {
  id: string;
  claim: string;
  sourceId?: string;
  sourceQuote?: string;
  locator?: string;
  class: EvidenceClass;
  confidence: ConfidenceLevel;
  verified: boolean;
}

export interface ExpertFinding {
  expertId: string;
  conclusion: string;
  evidence: EvidenceItem[];
  confidence: ConfidenceLevel;
  blockers: string[];
  disagreements: string[];
}

export interface ResearchTrace {
  query: string;
  searchedAt: string;
  sources: ResearchSource[];
  evidence: EvidenceItem[];
  findings: ExpertFinding[];
  unresolvedQuestions: string[];
  finalConfidence: ConfidenceLevel;
}
