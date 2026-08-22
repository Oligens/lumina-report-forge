import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { CurrencyCode, BusinessModel, AccountingStandard } from "@/types/report";
import { buildWorldEconomyPrompt } from "@/lib/worldEconomyAgent";

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
  const system = buildWorldEconomyPrompt(latest);
  const content = await callGateway({ model: "google/gemini-3.5-flash", messages: [{ role: "system", content: system }, { role: "system", content: `Contexte du dossier :\n${data.context}` }, ...data.messages] });
  return { reply: content };
});

export const buildFinancialStatements = createServerFn({ method: "POST" }).inputValidator((data: unknown) => z.object({ context: z.string().min(1).max(60000), transcript: z.string().max(30000).default("") }).parse(data)).handler(async ({ data }) => {
  const content = await callGateway({ model: "google/gemini-3.5-flash", response_format: { type: "json_object" }, messages: [{ role: "system", content: `Tu es un expert-comptable. À partir du profil d'entreprise, du journal comptable et des compléments fournis, produis des états financiers complets conformes à la norme comptable indiquée. Réponds uniquement en JSON strict. Si une information fondamentale manque, complete=false et pose UNE question simple. N'invente aucun chiffre.` }, { role: "user", content: `${data.context}\n\nCompléments du client :\n${data.transcript}` }] });
  return { payload: cleanJson(content) };
});
