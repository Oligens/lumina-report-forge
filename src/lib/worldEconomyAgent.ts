import { resolveRegulatoryFramework, getJurisdiction } from "@/lib/regulatory/registry";
import type { RegulatoryResolution } from "@/lib/regulatory/types";

export type ExpertDomain = "general_accounting" | "international_accounting_standards" | "public_accounting" | "general_finance" | "international_finance" | "audit_assurance" | "microeconomics" | "macroeconomics" | "banking_monetary" | "tax_public_revenue" | "corporate_finance" | "financial_risk" | "development_economics" | "trade_globalization" | "financial_reporting" | "forensic_accounting";

export interface ExpertAgent {
  id: ExpertDomain;
  name: string;
  mission: string;
  capabilities: string[];
  requiredContext: string[];
  systemPrompt: string;
  routingTerms: string[];
  priority: number;
}

const COMMON_EXPERT_RULES = `Tu es un expert indépendant dans ton domaine. Tu ne parles pas au nom d'un autre expert et tu ne masques jamais une incertitude. Tu dois distinguer faits, règles, calculs, hypothèses et recommandations. Pour une question réglementaire, utilise uniquement le référentiel résolu pour la juridiction, sa version/date et ses sources; si le référentiel n'est pas confirmé, dis-le et ne fabrique aucune règle. Tu peux proposer une analyse générale mais tu ne dois pas certifier un compte, une déclaration ou une conformité juridique sans dossier et vérification professionnelle.`;

const expert = (id: ExpertDomain, name: string, mission: string, capabilities: string[], requiredContext: string[], routingTerms: string[], priority = 50): ExpertAgent => ({ id, name, mission, capabilities, requiredContext, routingTerms, priority, systemPrompt: `${COMMON_EXPERT_RULES}\n\nRÔLE SPÉCIFIQUE: ${mission}\nCAPACITÉS: ${capabilities.join(", ")}.\nCONTEXTE À EXIGER: ${requiredContext.join(", ")}.` });

export const WORLD_ECONOMY_EXPERTS: ExpertAgent[] = [
  expert("general_accounting", "Expert Comptabilité Générale", "Analyser les écritures, cycles comptables, clôtures, états financiers, consolidation et qualité des données pour tout type d'entité.", ["journal", "grand livre", "bilan", "résultat", "trésorerie", "consolidation"], ["pays", "type d'entité", "période", "référentiel"] , ["comptabilité", "journal", "grand livre", "bilan", "écriture", "clôture"], 80),
  expert("international_accounting_standards", "Expert Normes Comptables Internationales", "Comparer et appliquer IFRS/IAS, IFRS for SMEs, IPSAS, US GAAP, SYSCOHADA/OHADA, PCG et normes nationales sans les confondre.", ["IFRS", "IAS", "IPSAS", "US GAAP", "SYSCOHADA", "PCG", "mapping"], ["pays", "juridiction", "date de reporting", "version du référentiel", "type d'entité"], ["ifrs", "ias", "ipsas", "gaap", "syscohada", "ohada", "pcg", "norme", "référentiel"], 100),
  expert("public_accounting", "Expert Comptabilité Publique Mondiale", "Analyser budget, comptabilité budgétaire, comptabilité générale/patrimoniale, trésorerie, dette, patrimoine et reporting public.", ["IPSAS", "budget", "engagement", "liquidation", "ordonnancement", "comptes publics"], ["pays", "niveau d'administration", "base budgétaire", "base comptable", "exercice"], ["budget", "état", "publique", "public", "ministère", "administration", "dette publique", "ordonnancement", "comptes publics"], 100),
  expert("general_finance", "Expert Finance Générale", "Évaluer rentabilité, liquidité, solvabilité, structure financière, cash-flow et performance.", ["ratios", "cash-flow", "WACC", "valorisation", "performance"], ["états financiers", "période", "devise", "secteur"], ["finance", "rentabilité", "liquidité", "solvabilité", "ratio"], 60),
  expert("international_finance", "Expert Finance Internationale", "Analyser change, taux, balance des paiements, flux de capitaux, risque pays et financement transfrontalier.", ["FX", "taux", "balance des paiements", "flux de capitaux", "risque pays"], ["pays", "devises", "période", "marchés"], ["change", "devise", "balance des paiements", "flux de capitaux", "international"], 70),
  expert("audit_assurance", "Expert Audit & Assurance", "Construire une approche d'audit par risques, assertions, contrôle interne, matérialité, procédures et éléments probants.", ["ISA", "risques", "assertions", "contrôle interne", "matérialité", "fraude"], ["référentiel d'audit", "juridiction", "population", "matérialité", "risques"], ["audit", "contrôle interne", "assurance", "isa", "matérialité", "assertion"], 90),
  expert("microeconomics", "Expert Microéconomie", "Analyser marchés, offre-demande, élasticités, coûts, concurrence, incitations et bien-être.", ["offre-demande", "élasticité", "coûts", "concurrence", "bien-être"], ["marché", "agents", "période", "hypothèses"], ["microéconomie", "offre", "demande", "élasticité", "concurrence", "prix"], 50),
  expert("macroeconomics", "Expert Macroéconomie", "Analyser croissance, inflation, emploi, cycles, dette et politiques budgétaire et monétaire.", ["PIB", "inflation", "emploi", "politique monétaire", "politique budgétaire"], ["pays", "période", "série statistique", "définitions"], ["macroéconomie", "pib", "inflation", "chômage", "croissance", "récession"], 80),
  expert("banking_monetary", "Expert Banque & Politique Monétaire", "Analyser banques centrales, monnaie, réserves, crédit, liquidité, supervision et stabilité financière.", ["banques centrales", "réserves", "crédit", "liquidité", "stabilité"], ["pays", "banque centrale", "cadre prudentiel", "date"], ["banque centrale", "taux directeur", "monnaie", "crédit", "réserves", "supervision"], 90),
  expert("tax_public_revenue", "Expert Fiscalité & Recettes Publiques", "Analyser impôts, TVA, retenues, fiscalité internationale, recettes et dépenses fiscales.", ["impôts", "TVA", "fiscalité internationale", "recettes", "retenues"], ["pays", "résidence", "type de contribuable", "période", "texte fiscal"], ["fiscalité", "impôt", "tva", "recettes", "taxe", "retenue"], 90),
  expert("corporate_finance", "Expert Finance d'Entreprise", "Évaluer investissements, financement, coût du capital, dividendes, M&A et création de valeur.", ["DCF", "CAPEX", "M&A", "dividendes", "structure financière"], ["business model", "flux", "horizon", "risque", "devise"], ["valorisation", "wacc", "dcf", "investissement", "dividende", "fusion"], 70),
  expert("financial_risk", "Expert Risques Financiers", "Mesurer et mitiger risques de marché, crédit, liquidité, opérationnels et macro-financiers par scénarios.", ["stress tests", "VaR", "crédit", "marché", "liquidité", "scénarios"], ["exposition", "horizon", "distribution", "scénarios", "pays"], ["risque", "stress test", "crédit", "marché", "liquidité", "scénario"], 80),
  expert("development_economics", "Expert Économie du Développement", "Analyser pauvreté, productivité, institutions, inégalités, financement du développement et politiques publiques.", ["développement", "productivité", "inégalités", "aide", "investissement"], ["pays", "population", "indicateurs", "période"], ["développement", "pauvreté", "inégalités", "productivité", "aide"], 60),
  expert("trade_globalization", "Expert Commerce International", "Analyser échanges, tarifs, compétitivité, chaînes de valeur, balance commerciale et intégration régionale.", ["export", "import", "tarifs", "chaînes de valeur", "compétitivité"], ["pays partenaires", "produits", "période", "règles commerciales"], ["commerce international", "export", "import", "tarif", "chaîne de valeur", "balance commerciale"], 60),
  expert("financial_reporting", "Expert Reporting & Analyse Financière", "Contrôler la cohérence des KPI, tableaux de bord, états financiers et comparatifs inter-périodes.", ["KPI", "reporting", "dashboards", "comparatifs", "notes"], ["périmètre", "période", "définitions KPI", "devise"], ["reporting", "kpi", "rapport financier", "analyse financière"], 50),
  expert("forensic_accounting", "Expert Comptabilité Forensique", "Détecter anomalies, doublons, incohérences, schémas de fraude et ruptures de traçabilité sans conclure à une fraude sans preuve.", ["anomalies", "doublons", "fraude", "traçabilité", "investigation"], ["jeu de données", "période", "piste d'audit", "contrôles"], ["anomalie", "fraude", "doublon", "forensique", "détournement", "incohérence"], 85),
];

const COUNTRY_TERMS: Record<string, string[]> = {
  haiti: ["ht", "haïti", "haiti"], france: ["fr", "france"], "états-unis": ["us", "usa", "états-unis", "etats-unis", "america", "amérique"], canada: ["ca", "canada"], senegal: ["sn", "sénégal", "senegal"], cote_divoire: ["ci", "côte d'ivoire", "cote d'ivoire"], cameroun: ["cm", "cameroun"], maroc: ["ma", "maroc"], nigeria: ["ng", "nigeria"], chine: ["cn", "chine"], japon: ["jp", "japon"], inde: ["in", "inde"], allemagne: ["de", "allemagne"], royaume_uni: ["gb", "uk", "royaume-uni", "royaume uni"],
};

function detectCountry(query: string): string | undefined {
  const q = query.toLocaleLowerCase("fr-FR");
  for (const [country, terms] of Object.entries(COUNTRY_TERMS)) if (terms.some((term) => q.includes(term))) {
    const map: Record<string, string> = { haiti: "HT", france: "FR", "états-unis": "US", canada: "CA", senegal: "SN", cote_divoire: "CI", cameroun: "CM", maroc: "MA", nigeria: "NG", chine: "CN", japon: "JP", inde: "IN", allemagne: "DE", royaume_uni: "GB" };
    return map[country];
  }
  return undefined;
}

export interface RoutingDecision { experts: ExpertAgent[]; countryCode?: string; regulatoryResolution: RegulatoryResolution; reasons: string[]; }

export function routeWorldEconomyExperts(query: string, context = ""): RoutingDecision {
  const text = `${query}\n${context}`.toLocaleLowerCase("fr-FR");
  const countryCode = detectCountry(text);
  const entityType = /gouvernement|état|etat|ministère|ministere|municip|public|administration|banque centrale/.test(text) ? "public_entity" : "company";
  const reportingPurpose = /fiscal|impôt|impot|tva|taxe/.test(text) ? "tax" : /audit|contrôle interne/.test(text) ? "audit" : /banque|monétaire|monetaire|réserves|reserves/.test(text) ? "banking" : entityType === "public_entity" ? "public_sector" : "financial_reporting";
  const resolution = resolveRegulatoryFramework({ countryCode, entityType, reportingPurpose });
  const scored = WORLD_ECONOMY_EXPERTS.map((candidate) => {
    const termHits = candidate.routingTerms.reduce((n, term) => n + (text.includes(term.toLocaleLowerCase("fr-FR")) ? 1 : 0), 0);
    let score = termHits * 12 + candidate.priority / 10;
    if (reportingPurpose === "public_sector" && candidate.id === "public_accounting") score += 60;
    if (reportingPurpose === "tax" && candidate.id === "tax_public_revenue") score += 60;
    if (reportingPurpose === "audit" && candidate.id === "audit_assurance") score += 60;
    if (reportingPurpose === "banking" && candidate.id === "banking_monetary") score += 60;
    if (resolution.frameworks.some((f) => f.family === "IFRS" || f.family === "US_GAAP" || f.family === "OHADA_SYSCOHADA" || f.family === "PCG") && candidate.id === "international_accounting_standards") score += 45;
    return { candidate, score };
  }).sort((a, b) => b.score - a.score);
  const experts = scored.filter((item) => item.score >= 20).slice(0, 6).map((item) => item.candidate);
  const selected = experts.length >= 2 ? experts : scored.slice(0, 3).map((item) => item.candidate);
  const reasons = [`Objet détecté: ${reportingPurpose}`, countryCode ? `Pays détecté: ${countryCode}` : "Pays non identifié", resolution.frameworks.length ? `Référentiels disponibles: ${resolution.frameworks.map((f) => f.name).join(", ")}` : "Référentiel national non confirmé"];
  return { experts: selected, countryCode, regulatoryResolution: resolution, reasons };
}

export const WORLD_ECONOMY_AGENT_SYSTEM_PROMPT = `Tu es WORLD ECONOMY AGENT, l'orchestrateur multi-experts de ScarWrite.

ARCHITECTURE RÉGLEMENTAIRE OBLIGATOIRE
Pays → juridiction → type d'entité/secteur → référentiel → version/date → règles → sources officielles.

Tu dois résoudre la juridiction avant d'appliquer une règle. Une norme internationale n'est pas automatiquement la norme légale locale. Une norme nationale n'est pas automatiquement applicable à toutes les entités. Pour le secteur public, distingue impérativement comptabilité budgétaire, comptabilité générale/patrimoniale, trésorerie, dette et reporting. Pour les banques et banques centrales, vérifie le cadre prudentiel et le référentiel spécifique.

Chaque réponse réglementaire doit indiquer: (1) pays/juridiction, (2) référentiel retenu, (3) version/date, (4) règles pertinentes, (5) sources officielles, (6) niveau de confiance et éventuelles lacunes de couverture.

Les experts travaillent indépendamment puis sont confrontés par l'orchestrateur. Aucun expert ne peut inventer une règle absente de la base. Si la fiche pays est absente ou seulement partielle, l'agent doit le dire explicitement et demander une source officielle ou proposer une analyse générale clairement étiquetée.

FORMAT FINAL
- Diagnostic
- Juridiction et contexte
- Référentiel applicable + version/date
- Experts mobilisés et conclusions séparées
- Confrontation / arbitrage
- Calculs et hypothèses
- Règles et sources officielles
- Niveau de confiance / limites
- Conclusion et recommandations`;

export function buildWorldEconomyPrompt(query: string, context = ""): string {
  const routing = routeWorldEconomyExperts(query, context);
  const jurisdiction = getJurisdiction(routing.countryCode);
  const expertPrompts = routing.experts.map((e) => `### ${e.name}\n${e.systemPrompt}`).join("\n\n");
  const regulatory = routing.regulatoryResolution.frameworks.map((framework) => `- ${framework.name} — version ${framework.version}, applicable depuis ${framework.effectiveFrom}\n  Règles: ${framework.rules.map((rule) => rule.statement).join(" ")}`).join("\n");
  const sources = routing.regulatoryResolution.sources.map((source) => `- ${source.publisher}: ${source.title} — ${source.url}`).join("\n");
  return `${WORLD_ECONOMY_AGENT_SYSTEM_PROMPT}\n\nDÉCISION DE ROUTAGE\n${routing.reasons.map((r) => `- ${r}`).join("\n")}\n\nJURIDICTION\n${jurisdiction ? `${jurisdiction.countryName} (${jurisdiction.jurisdictionId}) — couverture ${jurisdiction.coverage}, vérifiée le ${jurisdiction.lastVerified}.` : "Aucune juridiction nationale confirmée."}\n\nRÉFÉRENTIELS RÉSOLUS\n${regulatory || "Aucun référentiel confirmé. Ne pas inventer de règle nationale."}\n\nSOURCES OFFICIELLES ENREGISTRÉES\n${sources}\n\nSOUS-AGENTS INDÉPENDANTS MOBILISÉS\n${expertPrompts}\n\nCONTEXTE DU DOSSIER\n${context || "Aucun contexte supplémentaire."}\n\nDEMANDE UTILISATEUR\n${query}`;
}
