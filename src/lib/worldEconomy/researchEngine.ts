import type { RegulatoryResolution, RegulatorySource } from "@/lib/regulatory/types";
import type { ConfidenceLevel, EvidenceItem, ResearchSource, ResearchTrace, SourceTier } from "./researchTypes";

const now = () => new Date().toISOString();

const OFFICIAL_HOST_HINTS: Record<string, { publisher: string; tier: SourceTier }> = {
  "ifrs.org": { publisher: "IFRS Foundation", tier: 5 },
  "ipsasb.org": { publisher: "IPSASB", tier: 5 },
  "fasb.org": { publisher: "FASB", tier: 5 },
  "ohada.org": { publisher: "OHADA", tier: 5 },
  "brh.ht": { publisher: "Banque de la République d'Haïti", tier: 5 },
  "impots.gouv.fr": { publisher: "Direction générale des Finances publiques", tier: 5 },
  "legifrance.gouv.fr": { publisher: "Légifrance", tier: 5 },
  "imf.org": { publisher: "IMF", tier: 4 },
  "worldbank.org": { publisher: "World Bank", tier: 4 },
  "bis.org": { publisher: "BIS", tier: 4 },
  "oecd.org": { publisher: "OECD", tier: 4 },
};

function classify(url: string, fallbackPublisher: string, authoritative = false): ResearchSource {
  let host = "";
  try { host = new URL(url).hostname.replace(/^www\./, ""); } catch { /* invalid source */ }
  const hint = OFFICIAL_HOST_HINTS[host];
  return {
    id: `src_${Buffer.from(url).toString("base64url").slice(0, 18)}`,
    title: fallbackPublisher,
    url,
    publisher: hint?.publisher ?? fallbackPublisher,
    tier: hint?.tier ?? (authoritative ? 5 : 3),
    class: (hint?.tier === 5 || authoritative) ? "official" : "secondary",
    authoritative: Boolean(hint?.tier === 5 || authoritative),
    verifiedAt: now(),
    accessible: true,
    reason: hint ? "Domaine d'une autorité ou d'un émetteur reconnu." : "Source enregistrée; autorité à confirmer.",
  };
}

export function regulatorySources(resolution: RegulatoryResolution): ResearchSource[] {
  const all: RegulatorySource[] = [...resolution.sources];
  for (const framework of resolution.frameworks) {
    for (const id of framework.sourceIds) {
      const source = all.find((candidate) => candidate.id === id);
      if (source) all.push(source);
    }
  }
  const unique = new Map<string, ResearchSource>();
  for (const source of all) {
    const normalized = classify(source.url, source.publisher, source.authoritative);
    unique.set(source.url, { ...normalized, id: source.id, title: source.title, publisher: source.publisher, jurisdiction: resolution.countryCode, effectiveFrom: undefined });
  }
  return [...unique.values()];
}

export async function verifySource(source: ResearchSource): Promise<ResearchSource> {
  try {
    const response = await fetch(source.url, { method: "HEAD", redirect: "follow", signal: AbortSignal.timeout(7000) });
    return { ...source, accessible: response.ok, verifiedAt: now(), reason: response.ok ? "URL accessible au moment de la vérification." : `HTTP ${response.status}.` };
  } catch {
    return { ...source, accessible: false, verifiedAt: now(), reason: "Impossible de vérifier l'URL depuis le serveur." };
  }
}

export function evidenceForRule(rule: { id: string; statement: string; sourceIds: string[]; effectiveFrom: string }, sources: ResearchSource[]): EvidenceItem {
  const source = sources.find((candidate) => rule.sourceIds.includes(candidate.id));
  const verified = Boolean(source?.accessible && source.authoritative);
  return {
    id: `ev_${rule.id}`,
    claim: rule.statement,
    sourceId: source?.id,
    locator: rule.id,
    class: source?.authoritative ? "official" : "secondary",
    confidence: verified ? "high" : source ? "medium" : "unverified",
    verified,
  };
}

export async function buildResearchTrace(query: string, resolution: RegulatoryResolution): Promise<ResearchTrace> {
  const candidates = regulatorySources(resolution);
  const sources = await Promise.all(candidates.map(verifySource));
  const evidence: EvidenceItem[] = [];
  for (const framework of resolution.frameworks) {
    for (const rule of framework.rules) evidence.push(evidenceForRule(rule, sources));
  }
  const unresolvedQuestions: string[] = [];
  if (!resolution.countryCode) unresolvedQuestions.push("Pays/juridiction non identifié.");
  if (!resolution.frameworks.length) unresolvedQuestions.push("Aucun référentiel applicable n'a été confirmé.");
  if (!sources.some((source) => source.authoritative && source.accessible)) unresolvedQuestions.push("Aucune source officielle accessible n'a pu être vérifiée.");
  const high = evidence.filter((item) => item.confidence === "high").length;
  const finalConfidence: ConfidenceLevel = unresolvedQuestions.length || !sources.length ? "unverified" : high > 2 ? "high" : evidence.length ? "medium" : "low";
  return { query, searchedAt: now(), sources, evidence, findings: [], unresolvedQuestions, finalConfidence };
}

export function formatEvidenceForModel(trace: ResearchTrace): string {
  const sources = trace.sources.map((source) => `[${source.tier}/5] ${source.publisher} — ${source.title} — ${source.url} — accessible=${source.accessible} — vérifiée=${source.verifiedAt}`).join("\n");
  const evidence = trace.evidence.map((item) => `[${item.class}/${item.confidence}] ${item.claim}${item.sourceId ? ` | source=${item.sourceId}` : ""}${item.locator ? ` | locator=${item.locator}` : ""}`).join("\n");
  return `SOURCES VÉRIFIÉES:\n${sources || "Aucune"}\n\nÉVIDENCES RÉGLEMENTAIRES:\n${evidence || "Aucune"}\n\nBLOCAGES:\n${trace.unresolvedQuestions.join("\n") || "Aucun"}\n\nNIVEAU DE CONFIANCE: ${trace.finalConfidence}`;
}
