import type { JurisdictionProfile, RegulatoryFramework, RegulatoryResolution, RegulatorySource } from "./types";

export const GLOBAL_SOURCES: RegulatorySource[] = [
  { id: "ifrs-issued-2026", title: "Issued IFRS Accounting Standards 2026", url: "https://www.ifrs.org/issued-standards/", publisher: "IFRS Foundation / IASB", kind: "standard_setter", accessedOrVerifiedOn: "2026-08-22", authoritative: true },
  { id: "ipsas-handbook-2026", title: "2026 Handbook of IPSAS Pronouncements", url: "https://www.ipsasb.org/publications/2026-handbook-international-public-sector-accounting-standards-board-pronouncements", publisher: "IPSASB", kind: "standard_setter", accessedOrVerifiedOn: "2026-08-22", authoritative: true },
  { id: "fasb-standards", title: "FASB Accounting Standards Codification", url: "https://www.fasb.org/standards", publisher: "FASB", kind: "standard_setter", accessedOrVerifiedOn: "2026-08-22", authoritative: true },
  { id: "ohada-audcif", title: "Acte uniforme relatif au droit comptable et à l'information financière (AUDCIF)", url: "https://www.ohada.org/acte-uniforme-relatif-au-droit-comptable-et-a-linformation-financiere-audcif/", publisher: "OHADA", kind: "legislation", accessedOrVerifiedOn: "2026-08-22", authoritative: true },
  { id: "ohada-sycebnl", title: "Acte uniforme relatif au système comptable des entités à but non lucratif (SYCEBNL)", url: "https://www.ohada.org/acte-uniforme-relatif-au-systeme-comptable-des-entites-a-but-non-lucratif/", publisher: "OHADA", kind: "legislation", accessedOrVerifiedOn: "2026-08-22", authoritative: true },
  { id: "fr-anc-pcg-2026", title: "Recueil des normes comptables françaises — PCG, 1er janvier 2026", url: "https://www.anc.gouv.fr/files/anc/files/1_Normes_fran%C3%A7aises/recueil/2026/Recueil-PCG-Janvier-2026.pdf", publisher: "Autorité des normes comptables", kind: "standard_setter", accessedOrVerifiedOn: "2026-08-22", authoritative: true },
  { id: "haiti-brh-financials", title: "États financiers et référentiel comptable de la BRH", url: "https://www.brh.ht/", publisher: "Banque de la République d'Haïti", kind: "central_bank", accessedOrVerifiedOn: "2026-08-22", authoritative: true },
];

const source = (id: string) => GLOBAL_SOURCES.find((item) => item.id === id)!;

const IFRS_2026: RegulatoryFramework = {
  id: "ifrs-2026", name: "IFRS Accounting Standards", family: "IFRS", version: "Issued 2026", effectiveFrom: "2026-01-01",
  scope: ["listed_entities", "public_interest_entities", "entities_required_by_jurisdiction"], sourceIds: ["ifrs-issued-2026"],
  rules: [
    { id: "ifrs-2026-financial-statements", topic: "financial_statements", statement: "Appliquer les IFRS Accounting Standards applicables à l'entité et à la période de reporting; vérifier les dispositions locales d'adoption ou d'incorporation.", effectiveFrom: "2026-01-01", priority: 100, sourceIds: ["ifrs-issued-2026"] },
    { id: "ifrs-2026-version-control", topic: "version", statement: "La version à appliquer dépend de la date de reporting et des dispositions d'entrée en vigueur des normes et amendements.", effectiveFrom: "2026-01-01", priority: 100, sourceIds: ["ifrs-issued-2026"] },
  ],
};

const IPSAS_2026: RegulatoryFramework = {
  id: "ipsas-2026", name: "International Public Sector Accounting Standards", family: "IPSAS", version: "2026 Handbook", effectiveFrom: "2026-01-31",
  scope: ["central_government", "local_government", "public_sector_entities"], sourceIds: ["ipsas-handbook-2026"],
  rules: [{ id: "ipsas-2026-public-sector", topic: "public_sector_reporting", statement: "Pour une entité publique adoptant les IPSAS, utiliser le corpus IPSAS applicable à la date de reporting et distinguer les exigences de comptabilité d'exercice des règles budgétaires nationales.", effectiveFrom: "2026-01-31", priority: 100, sourceIds: ["ipsas-handbook-2026"] }],
};

const US_GAAP_2026: RegulatoryFramework = {
  id: "us-gaap-2026", name: "US GAAP — FASB Accounting Standards Codification", family: "US_GAAP", version: "ASC current", effectiveFrom: "2026-01-01",
  scope: ["nongovernmental_entities", "sec_registrants_subject_to_sec_rules"], sourceIds: ["fasb-standards"],
  rules: [{ id: "us-gaap-authoritative-source", topic: "authoritative_source", statement: "Pour les entités non gouvernementales américaines, la FASB Accounting Standards Codification constitue la source faisant autorité, sous réserve des règles SEC applicables aux registrants.", effectiveFrom: "2026-01-01", priority: 100, sourceIds: ["fasb-standards"] }],
};

const OHADA_2018: RegulatoryFramework = {
  id: "ohada-audcif-2018", name: "AUDCIF / SYSCOHADA révisé", family: "OHADA_SYSCOHADA", version: "AUDCIF adopté 2017, entrée en vigueur 2018/2019", effectiveFrom: "2018-01-01",
  scope: ["OHADA_member_states", "personal_accounts", "consolidated_accounts", "combined_accounts"], sourceIds: ["ohada-audcif"],
  rules: [
    { id: "ohada-personal-accounts", topic: "personal_accounts", statement: "Le SYSCOHADA révisé constitue le référentiel comptable OHADA pour les comptes personnels des entités, sous réserve des régimes comptables sectoriels et de la comptabilité publique.", effectiveFrom: "2018-01-01", priority: 100, sourceIds: ["ohada-audcif"] },
    { id: "ohada-ifrs-capital-market", topic: "capital_markets", statement: "Les entités visées par les obligations OHADA relatives aux marchés de capitaux peuvent devoir produire des états financiers IFRS en plus des états SYSCOHADA ou du référentiel sectoriel applicable.", effectiveFrom: "2019-01-01", priority: 110, sourceIds: ["ohada-audcif"] },
  ],
};

const OHADA_NPO_2024: RegulatoryFramework = {
  id: "ohada-sycebnl-2024", name: "SYCEBNL", family: "OHADA_SYSCOHADA", version: "Acte uniforme 2022, entrée en vigueur 2024", effectiveFrom: "2024-01-01",
  scope: ["nonprofit_entities_in_OHADA"], sourceIds: ["ohada-sycebnl"],
  rules: [{ id: "ohada-npo-sycebnl", topic: "nonprofit", statement: "Les entités à but non lucratif relevant de l'OHADA appliquent le SYCEBNL sauf lorsqu'elles relèvent de la comptabilité publique, d'un régime particulier ou de dispositions nationales spécifiques.", effectiveFrom: "2024-01-01", priority: 120, sourceIds: ["ohada-sycebnl"] }],
};

const FR_PCG_2026: RegulatoryFramework = {
  id: "fr-pcg-2026", name: "Plan comptable général français", family: "PCG", version: "Recueil PCG 1er janvier 2026", effectiveFrom: "2026-01-01",
  scope: ["french_entities_subject_to_pcg"], sourceIds: ["fr-anc-pcg-2026"],
  rules: [{ id: "fr-pcg-2026", topic: "general_accounting", statement: "Utiliser le recueil des normes comptables françaises applicable au 1er janvier 2026, en vérifiant les règlements sectoriels de l'ANC et les dispositions légales particulières.", effectiveFrom: "2026-01-01", priority: 100, sourceIds: ["fr-anc-pcg-2026"] }],
};

const HAITI_PUBLIC_BANKING: RegulatoryFramework = {
  id: "ht-brh-central-bank", name: "Référentiel comptable de la Banque de la République d'Haïti", family: "BANKING", version: "BRH — référentiel propre à la banque centrale", effectiveFrom: "1979-08-17",
  scope: ["central_bank"], sourceIds: ["haiti-brh-financials"],
  rules: [{ id: "ht-brh-central-bank-accounting", topic: "central_bank_accounting", statement: "Pour la BRH, ne pas substituer automatiquement IFRS ou le PCG : vérifier le plan comptable et les règles spécifiques résultant de sa loi organique et de ses prescriptions comptables.", effectiveFrom: "1979-08-17", priority: 130, sourceIds: ["haiti-brh-financials"] }],
};

const OHADA_COUNTRIES = [
  ["BJ", "Bénin"], ["BF", "Burkina Faso"], ["CM", "Cameroun"], ["CF", "République centrafricaine"], ["KM", "Comores"], ["CG", "Congo"], ["CI", "Côte d'Ivoire"], ["GA", "Gabon"], ["GN", "Guinée"], ["GQ", "Guinée équatoriale"], ["ML", "Mali"], ["NE", "Niger"], ["SN", "Sénégal"], ["TD", "Tchad"], ["TG", "Togo"], ["CD", "République démocratique du Congo"],
] as const;

function makeProfile(countryCode: string, countryName: string, frameworks: RegulatoryFramework[], extraSources: RegulatorySource[] = []): JurisdictionProfile {
  return { countryCode, countryName, jurisdictionId: `${countryCode.toLowerCase()}-national`, authorityLevel: "national", frameworks, sources: [...GLOBAL_SOURCES, ...extraSources], coverage: "verified", lastVerified: "2026-08-22" };
}

export const REGULATORY_REGISTRY: JurisdictionProfile[] = [
  ...OHADA_COUNTRIES.map(([code, name]) => makeProfile(code, name, [OHADA_2018, OHADA_NPO_2024, IPSAS_2026])),
  makeProfile("FR", "France", [FR_PCG_2026, IFRS_2026, IPSAS_2026]),
  makeProfile("US", "États-Unis", [US_GAAP_2026, IFRS_2026, IPSAS_2026]),
  makeProfile("HT", "Haïti", [IFRS_2026, IPSAS_2026, HAITI_PUBLIC_BANKING]),
  makeProfile("GB", "Royaume-Uni", [IFRS_2026, IPSAS_2026]),
  makeProfile("CA", "Canada", [IFRS_2026, IPSAS_2026]),
  makeProfile("AU", "Australie", [IFRS_2026, IPSAS_2026]),
  makeProfile("NZ", "Nouvelle-Zélande", [IFRS_2026, IPSAS_2026]),
  makeProfile("ZA", "Afrique du Sud", [IFRS_2026, IPSAS_2026]),
  makeProfile("NG", "Nigeria", [IFRS_2026, IPSAS_2026]),
  makeProfile("KE", "Kenya", [IFRS_2026, IPSAS_2026]),
  makeProfile("GH", "Ghana", [IFRS_2026, IPSAS_2026]),
  makeProfile("EG", "Égypte", [IFRS_2026, IPSAS_2026]),
  makeProfile("MA", "Maroc", [IFRS_2026, IPSAS_2026]),
  makeProfile("TN", "Tunisie", [IFRS_2026, IPSAS_2026]),
  makeProfile("DE", "Allemagne", [IFRS_2026, IPSAS_2026]),
  makeProfile("ES", "Espagne", [IFRS_2026, IPSAS_2026]),
  makeProfile("IT", "Italie", [IFRS_2026, IPSAS_2026]),
  makeProfile("NL", "Pays-Bas", [IFRS_2026, IPSAS_2026]),
  makeProfile("CH", "Suisse", [IFRS_2026, IPSAS_2026]),
  makeProfile("BR", "Brésil", [IFRS_2026, IPSAS_2026]),
  makeProfile("MX", "Mexique", [IFRS_2026, IPSAS_2026]),
  makeProfile("IN", "Inde", [IFRS_2026, IPSAS_2026]),
  makeProfile("JP", "Japon", [IFRS_2026, IPSAS_2026]),
  makeProfile("KR", "Corée du Sud", [IFRS_2026, IPSAS_2026]),
  makeProfile("SG", "Singapour", [IFRS_2026, IPSAS_2026]),
  makeProfile("CN", "Chine", [IFRS_2026, IPSAS_2026]),
  makeProfile("AE", "Émirats arabes unis", [IFRS_2026, IPSAS_2026]),
  makeProfile("SA", "Arabie saoudite", [IFRS_2026, IPSAS_2026]),
];

const PUBLIC_SECTORS = new Set(["government", "public", "state", "administration", "ministry", "municipality", "public_entity", "central_bank"]);

export function getJurisdiction(countryCode?: string): JurisdictionProfile | undefined {
  return REGULATORY_REGISTRY.find((profile) => profile.countryCode === countryCode?.toUpperCase());
}

export function resolveRegulatoryFramework(params: { countryCode?: string; entityType?: string; sector?: string; reportingPurpose?: RegulatoryResolution["reportingPurpose"]; asOfDate?: string }): RegulatoryResolution {
  const countryCode = params.countryCode?.toUpperCase() || "";
  const profile = getJurisdiction(countryCode);
  const asOfDate = params.asOfDate || new Date().toISOString().slice(0, 10);
  const entity = (params.entityType || "company").toLowerCase();
  const purpose = params.reportingPurpose || (PUBLIC_SECTORS.has(entity) || PUBLIC_SECTORS.has((params.sector || "").toLowerCase()) ? "public_sector" : "financial_reporting");
  const warnings: string[] = [];

  if (!profile) {
    return { countryCode, jurisdictionId: `${countryCode.toLowerCase() || "unknown"}-unresolved`, entityType: entity, sector: params.sector, reportingPurpose: purpose, asOfDate, frameworks: [], sources: GLOBAL_SOURCES, confidence: "low", warnings: ["Juridiction non enregistrée : aucune règle nationale ne doit être inventée. Ajouter une fiche pays validée avant de conclure."] };
  }

  let frameworks = profile.frameworks.filter((framework) => framework.effectiveFrom <= asOfDate && (!framework.effectiveTo || framework.effectiveTo >= asOfDate));
  if (purpose === "public_sector") frameworks = frameworks.filter((framework) => framework.family === "IPSAS" || framework.family === "PUBLIC_ACCOUNTING" || framework.family === "BANKING" || framework.family === "OHADA_SYSCOHADA");
  if (purpose === "tax") frameworks = frameworks.filter((framework) => framework.family === "TAX");
  if (purpose === "banking") frameworks = frameworks.filter((framework) => framework.family === "BANKING" || framework.family === "IFRS" || framework.family === "NATIONAL_GAAP");
  if (!frameworks.length) warnings.push("Aucun référentiel spécifique à cette combinaison n'est actuellement enregistré; recherche d'une source nationale nécessaire.");
  if (profile.coverage !== "verified") warnings.push("La fiche juridiction nécessite une revue avant usage professionnel.");

  return { countryCode, jurisdictionId: profile.jurisdictionId, entityType: entity, sector: params.sector, reportingPurpose: purpose, asOfDate, frameworks, sources: [...profile.sources], confidence: profile.coverage === "verified" ? "high" : "medium", warnings };
}

export function explainResolution(resolution: RegulatoryResolution): string {
  const names = resolution.frameworks.map((framework) => `${framework.name} (${framework.version})`).join(", ");
  return `Juridiction ${resolution.jurisdictionId} — référentiels retenus à la date ${resolution.asOfDate}: ${names || "aucun référentiel national confirmé"}.`;
}

export const REGULATORY_GLOBAL_FRAMEWORKS = { IFRS_2026, IPSAS_2026, US_GAAP_2026, OHADA_2018, OHADA_NPO_2024, FR_PCG_2026 };
export const REGULATORY_SOURCE_INDEX = Object.fromEntries(GLOBAL_SOURCES.map((item) => [item.id, source(item.id)]));
