import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { CurrencyCode, BusinessModel, AccountingStandard } from "@/types/report";
import { buildWorldEconomyPrompt, routeWorldEconomyExperts } from "@/lib/worldEconomyAgent";
import { buildResearchTrace, formatEvidenceForModel } from "@/lib/worldEconomy/researchEngine";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

const EXTRACTION_PROMPT = `You are a specialized data-structuring financial analyst AI. Your sole task is to ingest unstructured natural language text containing business records (sales, purchases, expenses, inventory, invoices) and transform them into a clean, normalized JSON array representing a structured table.

Extract and normalize:
- Date/Time (ISO format standard, field date_complete = YYYY-MM-DD)
- Type/Category (Vente, Achat, Dépense, Transfert, Autre)
- Description/Libellé
- Quantité/Unités (Numeric, default 1)
- Prix Unitaire (Numeric)
- Montant Total (Numeric = Quantité * Prix Unitaire if not specified)
- currency_original (USD, EUR or HTG if mentioned)
- Statut/Mode de Paiement (if mentioned, inside description)

Rules:
- Never invent facts, dates, or numbers not present or clearly implied in the text.
- All labels in French.
- Return strictly valid JSON without conversational filler.
- If there are no business records, return {"rows": []}.

Output schema: {"report_title": "string", "currency": "USD|EUR|HTG", "rows": [{"date_complete":"YYYY-MM-DD","type":"string","categorie":"string","description":"string","quantite":0,"prix_unitaire":0,"montant_total":0,"currency_original":"USD"}]}`;

async function callGateway(body: Record<string, unknown>) {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("Moteur IA non configuré.");
  const response = await fetch(GATEWAY, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (response.status === 429) throw new Error("Limite de requêtes atteinte. Réessayez dans un instant.");
  if (response.status === 402) throw new Error("Crédits IA épuisés. Rechargez votre espace de travail.");
  if (!response.ok) throw new Error(`Erreur IA (${response.status}).`);
  const json = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  return (json.choices?.[0]?.message?.content ?? "").trim();
}

function cleanJson(content: string) {
  const cleaned = content.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try { JSON.parse(cleaned); } catch { throw new Error("Réponse IA illisible. Reformulez votre saisie."); }
  return cleaned;
}

export const extractFromText = createServerFn({ method: "POST" }).validator((data) => z.object({
  prompt: z.string().min(1).max(20000), currency: z.string().default("USD"),
  businessModel: z.enum(["SaaS / Abonnement", "Commerce de détail / Restaurant", "Industrie / Manufacturing", "Prestataire de Services", "Société de Conseil", "Organisme à but non lucratif", "Comptabilité Publique"]).default("Prestataire de Services"),
  accountingStandard: z.enum(["SYSCOHADA", "IFRS", "US GAAP", "PCG", "Norme Nationale Locale"]).default("SYSCOHADA"),
}).parse(data)).handler(async ({ data }) => {
  const { buildAccountingPrompt } = await import("@/lib/accountingEngine");
  const accountingPrompt = buildAccountingPrompt(data.prompt, data.businessModel as BusinessModel, data.accountingStandard as AccountingStandard, data.currency as CurrencyCode);
  const content = await callGateway({ model: "google/gemini-3.5-flash", response_format: { type: "json_object" }, messages: [{ role: "system", content: accountingPrompt }] });
  return { payload: cleanJson(content) };
});

export const extractFromReceipt = createServerFn({ method: "POST" }).inputValidator((data: unknown) => z.object({ imageDataUrl: z.string().min(20).max(8_000_000), currency: z.string().default("USD") }).parse(data)).handler(async ({ data }) => {
  const content = await callGateway({ model: "google/gemini-3.5-flash", response_format: { type: "json_object" }, messages: [{ role: "system", content: EXTRACTION_PROMPT }, { role: "user", content: [{ type: "text", text: `Analyse ce reçu / cette facture et extrais chaque ligne. Devise de référence : ${data.currency}.` }, { type: "image_url", image_url: { url: data.imageDataUrl } }] }] });
  return { payload: cleanJson(content) };
});

export const transcribeAudio = createServerFn({ method: "POST" }).inputValidator((data: unknown) => z.object({ audioBase64: z.string().min(20), format: z.string().default("wav") }).parse(data)).handler(async ({ data }) => {
  const content = await callGateway({ model: "google/gemini-3.5-flash", messages: [{ role: "system", content: "Transcris fidèlement la note vocale en français. Retourne uniquement la transcription, sans commentaire." }, { role: "user", content: [{ type: "text", text: "Transcris cet enregistrement." }, { type: "input_audio", input_audio: { data: data.audioBase64, format: data.format } }] }] });
  return { text: content };
});

export const generateExecutiveSummary = createServerFn({ method: "POST" }).inputValidator((data: unknown) => z.object({ ledger: z.string().min(1).max(60000) }).parse(data)).handler(async ({ data }) => {
  const content = await callGateway({ model: "google/gemini-3.5-flash", messages: [{ role: "system", content: "Tu es un directeur financier (CFO). Rédige en français une synthèse décisionnelle de 4 à 6 phrases : tendance du chiffre d'affaires, maîtrise des dépenses, marge et solde net, anomalies détectées, et une recommandation opérationnelle. Base-toi strictement sur les données fournies, n'invente aucun chiffre. Pas de titre, pas de puces." }, { role: "user", content: data.ledger }] });
  return { summary: content };
});

const ACCOUNTANT_PROMPT = `Tu es Assistant Expert-Comptable ScarWrite. Explique les notions comptables en langage simple, adapte les exemples au secteur et au référentiel, ne fabrique aucun chiffre, pose une seule question à la fois si une information manque, et distingue toujours information générale et conseil professionnel local.`;

export const accountantChat = createServerFn({ method: "POST" }).inputValidator((data: unknown) => z.object({ messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() })).max(40), context: z.string().max(30000).default("") }).parse(data)).handler(async ({ data }) => {
  const content = await callGateway({ model: "google/gemini-3.5-flash", messages: [{ role: "system", content: ACCOUNTANT_PROMPT }, { role: "system", content: `Contexte du dossier :\n${data.context}` }, ...data.messages] });
  return { reply: content };
});

export const worldEconomyChat = createServerFn({ method: "POST" }).inputValidator((data: unknown) => z.object({ messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() })).max(40), context: z.string().max(50000).default("") }).parse(data)).handler(async ({ data }) => {
  const latest = data.messages[data.messages.length - 1]?.content ?? "";
  const routing = routeWorldEconomyExperts(latest, data.context);
  const trace = await buildResearchTrace(latest, routing.regulatoryResolution);
  const evidencePack = formatEvidenceForModel(trace);
  const expertFindings = await Promise.all(routing.experts.slice(0, 6).map(async (expert) => {
    const prompt = `${expert.systemPrompt}\n\nMISSION DE VÉRIFICATION: Tu es un expert vérificateur indépendant. Travaille uniquement sur ton domaine. Examine les preuves fournies. Tu dois REFUSER toute conclusion réglementaire si la preuve est insuffisante. Tu dois séparer FACT, SOURCE, CALCUL, ANALYSE et HYPOTHÈSE. Signale explicitement les informations que tu veux qu'un autre expert contrôle.\n\nQUESTION:\n${latest}\n\n${evidencePack}\n\nRéponds en JSON strict avec: expertId, conclusion, facts[], sources[], calculations[], hypotheses[], blockers[], challenges[] et confidence (high|medium|low|unverified).`;
    try {
      const result = await callGateway({ model: "google/gemini-3.5-flash", response_format: { type: "json_object" }, messages: [{ role: "system", content: prompt }] });
      return JSON.parse(cleanJson(result)) as Record<string, unknown>;
    } catch (error) {
      return { expertId: expert.id, conclusion: "Expertise non disponible: aucune conclusion ne peut être validée.", facts: [], sources: [], calculations: [], hypotheses: [], blockers: [error instanceof Error ? error.message : "Erreur expert"], challenges: [], confidence: "unverified" };
    }
  }));

  const reviewPrompt = `Tu es l'ARBITRE / CONTRE-EXPERT de l'Agent Économie Mondiale. Confronte les rapports indépendants ci-dessous. Ne vote pas à la majorité: exige des preuves. Identifie les contradictions, les calculs incompatibles, les référentiels mal appliqués et les affirmations sans source. Si une conclusion importante n'est pas démontrée, marque-la NON VÉRIFIÉE et demande une vérification humaine.\n\nQUESTION:\n${latest}\n\nPREUVES:\n${evidencePack}\n\nRAPPORTS DES EXPERTS:\n${JSON.stringify(expertFindings)}\n\nRetourne JSON strict: {"validatedClaims":[],"rejectedClaims":[],"conflicts":[],"requiredChecks":[],"confidence":"high|medium|low|unverified"}.`;
  const review = JSON.parse(cleanJson(await callGateway({ model: "google/gemini-3.5-flash", response_format: { type: "json_object" }, messages: [{ role: "system", content: reviewPrompt }] })));

  const finalPrompt = `${buildWorldEconomyPrompt(latest)}\n\nTU ES LE SYNTHÉTISEUR FINAL. Tu ne peux utiliser que les éléments validés par l'arbitre ou explicitement présentés comme hypothèses. Ne transforme jamais une hypothèse en fait. Chaque affirmation réglementaire doit pouvoir être reliée à une source. Si la preuve manque, écris clairement « NON VÉRIFIÉ ».\n\nTRACE DE RECHERCHE:\n${evidencePack}\n\nEXPERTS:\n${JSON.stringify(expertFindings)}\n\nARBITRAGE:\n${JSON.stringify(review)}\n\nStructure obligatoire:\n1. Résumé exécutif\n2. Faits vérifiés\n3. Juridiction et référentiel\n4. Analyse par domaine\n5. Calculs\n6. Désaccords et contre-vérifications\n7. Incertitudes / données manquantes\n8. Conclusion validée ou NON VÉRIFIÉE\n9. Recommandations\n10. Sources et date de vérification\n11. Niveau de confiance global.\n\nCatégories à afficher: SOURCE OFFICIELLE, SOURCE SECONDAIRE, ANALYSE DE L'AGENT, HYPOTHÈSE.`;
  const reply = await callGateway({ model: "google/gemini-3.5-flash", messages: [{ role: "system", content: finalPrompt }, { role: "user", content: latest }] });
  return { reply, trace: { ...trace, findings: expertFindings.map((finding) => ({ expertId: String(finding.expertId ?? "unknown"), conclusion: String(finding.conclusion ?? ""), evidence: [], confidence: (finding.confidence as "high" | "medium" | "low" | "unverified") ?? "unverified", blockers: Array.isArray(finding.blockers) ? finding.blockers.map(String) : [], disagreements: Array.isArray(finding.challenges) ? finding.challenges.map(String) : [] })), finalConfidence: (review.confidence as "high" | "medium" | "low" | "unverified") ?? trace.finalConfidence }, routing: { experts: routing.experts.map((expert) => expert.id), reasons: routing.reasons } };
});

export const buildFinancialStatements = createServerFn({ method: "POST" }).inputValidator((data: unknown) => z.object({ context: z.string().min(1).max(60000), transcript: z.string().max(30000).default("") }).parse(data)).handler(async ({ data }) => {
  const content = await callGateway({ model: "google/gemini-3.5-flash", response_format: { type: "json_object" }, messages: [{ role: "system", content: `Tu es un expert-comptable. À partir du profil d'entreprise, du journal comptable et des compléments fournis, produis des états financiers complets conformes à la norme comptable indiquée. Réponds uniquement en JSON strict. Si une information fondamentale manque, complete=false et pose UNE question simple. N'invente aucun chiffre.` }, { role: "user", content: `${data.context}\n\nCompléments du client :\n${data.transcript}` }] });
  return { payload: cleanJson(content) };
});