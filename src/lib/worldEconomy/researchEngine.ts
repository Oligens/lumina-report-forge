import type { RegulatoryResolution } from "@/lib/regulatory/types";
import type { ConfidenceLevel, EvidenceItem, ResearchSource, ResearchTrace, SourceTier } from "./researchTypes";

const now = () => new Date().toISOString();
const OFFICIAL_HOST_HINTS: Record<string, { publisher: string; tier: SourceTier }> = {
  "ifrs.org": { publisher: "IFRS Foundation", tier: 5 }, "ipsasb.org": { publisher: "IPSASB", tier: 5 }, "fasb.org": { publisher: "FASB", tier: 5 },
  "ohada.org": { publisher: "OHADA", tier: 5 }, "brh.ht": { publisher: "Banque de la République d'Haïti", tier: 5 },
  "impots.gouv.fr": { publisher: "Direction générale des Finances publiques", tier: 5 }, "legifrance.gouv.fr": { publisher: "Légifrance", tier: 5 },
  "imf.org": { publisher: "IMF", tier: 4 }, "worldbank.org": { publisher: "World Bank", tier: 4 }, "bis.org": { publisher: "BIS", tier: 4 }, "oecd.org": { publisher: "OECD", tier: 4 },
};
const sourceId = (url: string) => `src_${encodeURIComponent(url).replace(/%/g, "").slice(0, 32)}`;
function classify(url: string, fallbackPublisher: string, authoritative = false, title = fallbackPublisher): ResearchSource {
  let host = ""; try { host = new URL(url).hostname.replace(/^www\./, ""); } catch { /* invalid source */ }
  const hint = OFFICIAL_HOST_HINTS[host];
  return { id: sourceId(url), title, url, publisher: hint?.publisher ?? fallbackPublisher, tier: hint?.tier ?? (authoritative ? 5 : 3), class: (hint?.tier === 5 || authoritative) ? "official" : "secondary", authoritative: Boolean(hint?.tier === 5 || authoritative), verifiedAt: now(), accessible: true, reason: hint ? "Domaine d'un émetteur/autorité reconnue." : "Source secondaire; autorité à évaluer." };
}
export function regulatorySources(resolution: RegulatoryResolution): ResearchSource[] {
  const unique = new Map<string, ResearchSource>();
  for (const source of resolution.sources) unique.set(source.url, { ...classify(source.url, source.publisher, source.authoritative, source.title), id: source.id, jurisdiction: resolution.countryCode });
  return [...unique.values()];
}
export async function liveWebResearch(query: string): Promise<ResearchSource[]> {
  const apiKey = process.env["TAVILY_API_KEY"]; if (!apiKey) return [];
  try {
    const response = await fetch("https://api.tavily.com/search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ api_key: apiKey, query, search_depth: "advanced", max_results: 10, include_answer: false, include_raw_content: false }) });
    if (!response.ok) return [];
    const payload = (await response.json()) as { results?: { title?: string; url?: string }[] };
    return (payload.results ?? []).filter((result) => result.url).map((result) => classify(result.url!, "Web research", false, result.title || "Résultat de recherche"));
  } catch { return []; }
}
export async function verifySource(source: ResearchSource): Promise<ResearchSource> {
  try { const response = await fetch(source.url, { method: "HEAD", redirect: "follow", signal: AbortSignal.timeout(7000) }); return { ...source, accessible: response.ok, verifiedAt: now(), reason: response.ok ? "URL accessible au moment de la vérification." : `HTTP ${response.status}.` }; }
  catch { return { ...source, accessible: false, verifiedAt: now(), reason: "URL non vérifiable depuis le serveur." }; }
}
export function evidenceForRule(rule: { id: string; statement: string; sourceIds: string[]; effectiveFrom: string }, sources: ResearchSource[]): EvidenceItem {
  const source = sources.find((candidate) => rule.sourceIds.includes(candidate.id)); const verified = Boolean(source?.accessible && source.authoritative);
  return { id: `ev_${rule.id}`, claim: rule.statement, sourceId: source?.id, locator: rule.id, class: source?.authoritative ? "official" : "secondary", confidence: verified ? "high" : source ? "medium" : "unverified", verified };
}
export async function buildResearchTrace(query: string, resolution: RegulatoryResolution): Promise<ResearchTrace> {
  const registrySources = regulatorySources(resolution); const webSources = await liveWebResearch(query); const merged = new Map<string, ResearchSource>();
  for (const source of [...registrySources, ...webSources]) merged.set(source.url, source);
  const verifiedSources = await Promise.all([...merged.values()].slice(0, 20).map(verifySource)); const evidence: EvidenceItem[] = [];
  for (const framework of resolution.frameworks) for (const rule of framework.rules) evidence.push(evidenceForRule(rule, verifiedSources));
  const unresolvedQuestions: string[] = [];
  if (!resolution.countryCode) unresolvedQuestions.push("Pays/juridiction non identifié.");
  if (!resolution.frameworks.length) unresolvedQuestions.push("Aucun référentiel applicable n'a été confirmé.");
  if (!verifiedSources.some((source) => source.authoritative && source.accessible)) unresolvedQuestions.push("Aucune source officielle accessible n'a pu être vérifiée.");
  if (!process.env["TAVILY_API_KEY"]) unresolvedQuestions.push("Recherche web en direct non activée: TAVILY_API_KEY manquante; seules les sources du registre sont utilisées.");
  const high = evidence.filter((item) => item.confidence === "high").length;
  const finalConfidence: ConfidenceLevel = unresolvedQuestions.some((item) => item.includes("Aucune source officielle")) ? "unverified" : high > 2 ? "high" : evidence.length ? "medium" : "low";
  return { query, searchedAt: now(), sources: verifiedSources, evidence, findings: [], unresolvedQuestions, finalConfidence };
}
export function formatEvidenceForModel(trace: ResearchTrace): string {
  const sources = trace.sources.map((source) => `[NIVEAU ${source.tier}/5] ${source.class.toUpperCase()} | ${source.publisher} | ${source.title} | ${source.url} | accessible=${source.accessible} | vérifiée=${source.verifiedAt}`).join("\n");
  const evidence = trace.evidence.map((item) => `[${item.class.toUpperCase()} / ${item.confidence.toUpperCase()}] ${item.claim}${item.sourceId ? ` | source=${item.sourceId}` : ""}${item.locator ? ` | locator=${item.locator}` : ""}`).join("\n");
  return `SOURCES RECHERCHÉES ET VÉRIFIÉES:\n${sources || "Aucune"}\n\nÉVIDENCES RÉGLEMENTAIRES:\n${evidence || "Aucune"}\n\nBLOCAGES:\n${trace.unresolvedQuestions.join("\n") || "Aucun"}\n\nCONFIANCE INITIALE: ${trace.finalConfidence}`;
}
