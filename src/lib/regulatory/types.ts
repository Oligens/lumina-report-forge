export type RegulatorySourceKind = "standard_setter" | "legislation" | "regulator" | "central_bank" | "tax_authority" | "audit_oversight";

export type CoverageStatus = "verified" | "partial" | "needs_review";

export interface RegulatorySource {
  id: string;
  title: string;
  url: string;
  publisher: string;
  kind: RegulatorySourceKind;
  accessedOrVerifiedOn: string;
  authoritative: boolean;
}

export interface RegulatoryRule {
  id: string;
  topic: string;
  statement: string;
  effectiveFrom: string;
  effectiveTo?: string;
  priority: number;
  sourceIds: string[];
  conditions?: string[];
}

export interface RegulatoryFramework {
  id: string;
  name: string;
  family: "IFRS" | "IAS" | "IPSAS" | "US_GAAP" | "OHADA_SYSCOHADA" | "PCG" | "NATIONAL_GAAP" | "PUBLIC_ACCOUNTING" | "TAX" | "AUDIT" | "BANKING" | "MIXED";
  version: string;
  effectiveFrom: string;
  effectiveTo?: string;
  scope: string[];
  sourceIds: string[];
  rules: RegulatoryRule[];
}

export interface JurisdictionProfile {
  countryCode: string;
  countryName: string;
  jurisdictionId: string;
  authorityLevel: "national" | "regional" | "supranational";
  officialLanguage?: string[];
  frameworks: RegulatoryFramework[];
  sources: RegulatorySource[];
  coverage: CoverageStatus;
  lastVerified: string;
  notes?: string[];
}

export interface RegulatoryResolution {
  countryCode: string;
  jurisdictionId: string;
  entityType: string;
  sector?: string;
  reportingPurpose: "financial_reporting" | "public_sector" | "tax" | "audit" | "banking" | "macro";
  asOfDate: string;
  frameworks: RegulatoryFramework[];
  sources: RegulatorySource[];
  confidence: "high" | "medium" | "low";
  warnings: string[];
}
