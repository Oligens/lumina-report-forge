/**
 * World Economy Agent — multi-expert economic and accounting orchestration.
 * The orchestrator routes each request to specialized domain experts and
 * returns an auditable, source-aware analysis. It does not replace licensed
 * professional advice or local statutory interpretation.
 */

export type ExpertDomain =
  | "general_accounting"
  | "international_accounting_standards"
  | "public_accounting"
  | "general_finance"
  | "international_finance"
  | "audit_assurance"
  | "microeconomics"
  | "macroeconomics"
  | "banking_monetary"
  | "tax_public_revenue"
  | "corporate_finance"
  | "financial_risk"
  | "development_economics"
  | "trade_globalization"
  | "financial_reporting"
  | "forensic_accounting";

export interface ExpertAgent {
  id: ExpertDomain;
  name: string;
  mission: string;
  capabilities: string[];
}

export const WORLD_ECONOMY_EXPERTS: ExpertAgent[] = [
  { id: "general_accounting", name: "Expert Comptabilité Générale", mission: "Comptabilité financière, tenue, clôture, écritures et états financiers pour tout type d'entité.", capabilities: ["journal", "grand livre", "bilan", "compte de résultat", "trésorerie", "consolidation"] },
  { id: "international_accounting_standards", name: "Expert Normes Comptables Internationales", mission: "Comparer et appliquer, selon le contexte, IFRS/IAS, IPSAS, US GAAP, SYSCOHADA, PCG et référentiels nationaux.", capabilities: ["IFRS", "IAS", "IPSAS", "US GAAP", "SYSCOHADA", "PCG", "mapping multi-référentiels"] },
  { id: "public_accounting", name: "Expert Comptabilité Publique Mondiale", mission: "Finances publiques, budget, exécution, dette, patrimoine public et reporting des administrations et entités publiques.", capabilities: ["IPSAS", "budget", "engagement", "liquidation", "ordonnancement", "paiement", "comptes publics"] },
  { id: "general_finance", name: "Expert Finance Générale", mission: "Analyse financière, structure du capital, rentabilité, liquidité, solvabilité et allocation des ressources.", capabilities: ["ratios", "cash-flow", "WACC", "valorisation", "performance"] },
  { id: "international_finance", name: "Expert Finance Internationale", mission: "Marchés internationaux, change, taux, flux de capitaux, balance des paiements et financement transfrontalier.", capabilities: ["FX", "taux", "balance des paiements", "flux de capitaux", "risque pays"] },
  { id: "audit_assurance", name: "Expert Audit & Assurance", mission: "Audit financier, contrôle interne, risques, éléments probants et assurance.", capabilities: ["ISA", "contrôle interne", "matérialité", "tests", "risques", "fraude"] },
  { id: "microeconomics", name: "Expert Microéconomie", mission: "Comportement des agents, marchés, prix, concurrence, production et incitations.", capabilities: ["offre-demande", "élasticité", "coûts", "concurrence", "bien-être"] },
  { id: "macroeconomics", name: "Expert Macroéconomie", mission: "Croissance, inflation, emploi, cycles, politiques budgétaire et monétaire.", capabilities: ["PIB", "inflation", "emploi", "politique monétaire", "politique budgétaire"] },
  { id: "banking_monetary", name: "Expert Banque & Politique Monétaire", mission: "Système bancaire, banques centrales, liquidité, crédit et stabilité financière.", capabilities: ["banques centrales", "réserves", "crédit", "liquidité", "stabilité"] },
  { id: "tax_public_revenue", name: "Expert Fiscalité & Recettes Publiques", mission: "Fiscalité, recettes, dépenses fiscales et analyse des systèmes de prélèvements.", capabilities: ["impôts", "TVA", "fiscalité internationale", "recettes publiques"] },
  { id: "corporate_finance", name: "Expert Finance d'Entreprise", mission: "Décisions d'investissement, financement, dividendes et création de valeur.", capabilities: ["DCF", "CAPEX", "M&A", "dividendes", "structure financière"] },
  { id: "financial_risk", name: "Expert Risques Financiers", mission: "Identification, mesure et mitigation des risques financiers et macro-financiers.", capabilities: ["marché", "crédit", "liquidité", "stress tests", "scénarios"] },
  { id: "development_economics", name: "Expert Économie du Développement", mission: "Pauvreté, développement, productivité, institutions et financement du développement.", capabilities: ["développement", "productivité", "inégalités", "aide", "investissement"] },
  { id: "trade_globalization", name: "Expert Commerce International", mission: "Commerce, chaînes de valeur, compétitivité, tarifs et balance commerciale.", capabilities: ["export", "import", "tarifs", "chaînes de valeur", "compétitivité"] },
  { id: "financial_reporting", name: "Expert Reporting & Analyse Financière", mission: "Lecture, comparaison et production de rapports financiers et indicateurs de gestion.", capabilities: ["KPI", "reporting", "comparatifs", "dashboards", "notes"] },
  { id: "forensic_accounting", name: "Expert Comptabilité Forensique", mission: "Analyse des anomalies, fraudes présumées, incohérences et traçabilité des données.", capabilities: ["fraude", "anomalies", "doublons", "traçabilité", "investigation"] },
];

export const WORLD_ECONOMY_AGENT_SYSTEM_PROMPT = `Tu es WORLD ECONOMY AGENT, l'orchestrateur économique mondial de ScarWrite.

MISSION
Analyser les demandes relatives à l'économie, la comptabilité, la finance, l'audit et les finances publiques avec une approche multi-experte. Tu peux mobiliser plusieurs experts simultanément et produire une synthèse contradictoire, structurée et traçable.

RÈGLES ABSOLUES
1. Identifier le pays/juridiction, période, type d'entité, secteur et référentiel applicable avant de conclure.
2. Ne jamais prétendre qu'un référentiel est universel. Distinguer normes internationales, régionales et nationales.
3. Pour la comptabilité : distinguer IFRS/IAS, IPSAS, US GAAP, SYSCOHADA, PCG et normes locales lorsque pertinent.
4. Pour les administrations publiques : séparer budget, comptabilité budgétaire, comptabilité générale/patrimoniale et reporting selon le système du pays.
5. Pour l'audit : raisonner en risques, assertions, contrôle interne, matérialité et éléments probants; ne jamais certifier un compte sans audit réel.
6. Pour une information actuelle (taux, inflation, PIB, dette, réglementation, normes récemment modifiées), exiger des sources récentes et indiquer la date de référence.
7. Ne jamais inventer une donnée. Si une donnée manque, la signaler explicitement.
8. Distinguer faits, calculs, hypothèses, interprétations et recommandations.
9. Lorsqu'une question touche plusieurs domaines, faire travailler au minimum deux experts et arbitrer leurs conclusions.
10. Fournir les hypothèses et les limites de l'analyse.

FORMAT DE SYNTHÈSE
- Diagnostic
- Experts mobilisés et rôle de chacun
- Analyse technique
- Calculs/indicateurs si applicables
- Divergences ou points de vigilance
- Conclusion
- Sources et date de référence quand des données externes sont utilisées`;

const KEYWORD_ROUTING: Record<ExpertDomain, string[]> = {
  general_accounting: ["comptabilité", "journal", "grand livre", "bilan", "écriture", "clôture"],
  international_accounting_standards: ["ifrs", "ias", "ipsas", "gaap", "syscohada", "pcg", "norme", "référentiel"],
  public_accounting: ["budget", "État", "publique", "public", "ministère", "administration", "dette publique", "ordonnancement"],
  general_finance: ["finance", "rentabilité", "liquidité", "solvabilité", "ratio"],
  international_finance: ["change", "devise", "balance des paiements", "flux de capitaux", "international"],
  audit_assurance: ["audit", "contrôle interne", "fraude", "assurance", "isa", "matérialité"],
  microeconomics: ["microéconomie", "offre", "demande", "élasticité", "concurrence", "prix"],
  macroeconomics: ["macroéconomie", "pib", "inflation", "chômage", "croissance", "récession"],
  banking_monetary: ["banque centrale", "taux directeur", "monnaie", "crédit", "réserves"],
  tax_public_revenue: ["fiscalité", "impôt", "tva", "recettes", "taxe"],
  corporate_finance: ["valorisation", "wacc", "dcf", "investissement", "dividende", "fusion"],
  financial_risk: ["risque", "stress test", "crédit", "marché", "liquidité"],
  development_economics: ["développement", "pauvreté", "inégalités", "productivité"],
  trade_globalization: ["commerce international", "export", "import", "tarif", "chaîne de valeur"],
  financial_reporting: ["reporting", "kpi", "rapport financier", "analyse financière"],
  forensic_accounting: ["anomalie", "fraude", "doublon", "forensique", "détournement"],
};

export function routeWorldEconomyExperts(query: string): ExpertAgent[] {
  const normalized = query.toLocaleLowerCase("fr-FR");
  const scored = WORLD_ECONOMY_EXPERTS.map((expert) => ({
    expert,
    score: KEYWORD_ROUTING[expert.id].reduce((score, keyword) => score + (normalized.includes(keyword) ? 1 : 0), 0),
  }));
  const selected = scored.filter((entry) => entry.score > 0).sort((a, b) => b.score - a.score).map((entry) => entry.expert);
  return selected.length ? selected.slice(0, 6) : WORLD_ECONOMY_EXPERTS.slice(0, 3);
}

export function buildWorldEconomyPrompt(query: string): string {
  const experts = routeWorldEconomyExperts(query);
  return `${WORLD_ECONOMY_AGENT_SYSTEM_PROMPT}\n\nEXPERTS MOBILISÉS:\n${experts.map((e) => `- ${e.name}: ${e.mission}`).join("\n")}\n\nDEMANDE UTILISATEUR:\n${query}`;
}
