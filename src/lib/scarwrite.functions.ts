import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

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
  if (response.status === 429)
    throw new Error("Limite de requêtes atteinte. Réessayez dans un instant.");
  if (response.status === 402)
    throw new Error("Crédits IA épuisés. Rechargez votre espace de travail.");
  if (!response.ok) throw new Error(`Erreur IA (${response.status}).`);
  const json = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return (json.choices?.[0]?.message?.content ?? "").trim();
}

function cleanJson(content: string) {
  const cleaned = content
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  try {
    JSON.parse(cleaned);
  } catch {
    throw new Error("Réponse IA illisible. Reformulez votre saisie.");
  }
  return cleaned;
}

export const extractFromText = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        prompt: z.string().min(1).max(20000),
        currency: z.string().default("USD"),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const content = await callGateway({
      model: "google/gemini-3.5-flash",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: EXTRACTION_PROMPT },
        {
          role: "user",
          content: `Devise de référence : ${data.currency}.\n\n${data.prompt}`,
        },
      ],
    });
    return { payload: cleanJson(content) };
  });

export const extractFromReceipt = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        imageDataUrl: z.string().min(20).max(8_000_000),
        currency: z.string().default("USD"),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const content = await callGateway({
      model: "google/gemini-3.5-flash",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: EXTRACTION_PROMPT },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyse ce reçu / cette facture et extrais chaque ligne. Devise de référence : ${data.currency}.`,
            },
            { type: "image_url", image_url: { url: data.imageDataUrl } },
          ],
        },
      ],
    });
    return { payload: cleanJson(content) };
  });

export const transcribeAudio = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ audioBase64: z.string().min(20), format: z.string().default("wav") }).parse(data),
  )
  .handler(async ({ data }) => {
    const content = await callGateway({
      model: "google/gemini-3.5-flash",
      messages: [
        {
          role: "system",
          content:
            "Transcris fidèlement la note vocale en français. Retourne uniquement la transcription, sans commentaire.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Transcris cet enregistrement." },
            {
              type: "input_audio",
              input_audio: { data: data.audioBase64, format: data.format },
            },
          ],
        },
      ],
    });
    return { text: content };
  });

export const generateExecutiveSummary = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ ledger: z.string().min(1).max(60000) }).parse(data),
  )
  .handler(async ({ data }) => {
    const content = await callGateway({
      model: "google/gemini-3.5-flash",
      messages: [
        {
          role: "system",
          content:
            "Tu es un directeur financier (CFO). Rédige en français une synthèse décisionnelle de 4 à 6 phrases : tendance du chiffre d'affaires, maîtrise des dépenses, marge et solde net, anomalies détectées, et une recommandation opérationnelle. Base-toi strictement sur les données fournies, n'invente aucun chiffre. Pas de titre, pas de puces.",
        },
        { role: "user", content: data.ledger },
      ],
    });
    return { summary: content };
  });

const ACCOUNTANT_PROMPT = `Tu es "Assistant Expert-Comptable ScarWrite", un expert-comptable humain, courtois, professionnel et pédagogue qui accompagne son client en français.
Règles :
- Tu expliques les notions comptables (amortissement, amortissements dérogatoires, créances, stock final, provisions, TVA...) avec des mots simples et un exemple concret adapté au secteur du client (ex: pour un restaurant, un four acheté 5 000 $ amorti sur 5 ans perd 1 000 $ par an).
- Si le client dit "je ne comprends pas" ou pose une question, tu expliques d'abord, puis tu proposes un guidage pas à pas avec de petites questions simples pour calculer ensemble la valeur.
- Tu poses UNE question à la fois, jamais une longue liste.
- Tu ne génères jamais un bilan incomplet : tu réclames poliment les informations manquantes nécessaires à la norme comptable choisie (stock final, amortissements, impôts et taxes, NIF, dettes, capital...).
- Réponses courtes (3 à 6 phrases), chaleureuses, sans jargon inutile.`;

export const accountantChat = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        messages: z
          .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() }))
          .max(40),
        context: z.string().max(30000).default(""),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const content = await callGateway({
      model: "google/gemini-3.5-flash",
      messages: [
        { role: "system", content: ACCOUNTANT_PROMPT },
        { role: "system", content: `Contexte du dossier :\n${data.context}` },
        ...data.messages,
      ],
    });
    return { reply: content };
  });

export const buildFinancialStatements = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        context: z.string().min(1).max(60000),
        transcript: z.string().max(30000).default(""),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const content = await callGateway({
      model: "google/gemini-3.5-flash",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Tu es un expert-comptable. À partir du profil d'entreprise, du journal comptable et des compléments fournis par le client, produis des états financiers complets conformes à la norme comptable indiquée.
Réponds UNIQUEMENT en JSON strict avec cette forme :
{"complete":true|false,"question":"question unique et pédagogue si complete=false",
"bilan":{"actifs_immobilises":[{"libelle":"","montant":0}],"actifs_circulants":[],"passifs":[],"capitaux_propres":[]},
"resultat":{"produits":[],"charges":[],"resultat_exploitation":0,"resultat_financier":0,"resultat_net":0},
"tresorerie":{"exploitation":[],"investissement":[],"financement":[]},
"capitaux":[{"libelle":"","montant":0}],
"notes":["..."],
"comparatif":[{"libelle":"","n":0,"n1":0}]}
Si une information fondamentale manque (stock final, amortissements, impôts, NIF, dettes), mets complete=false et pose UNE question simple et pédagogue. N'invente aucun chiffre.`,
        },
        { role: "user", content: `${data.context}\n\nCompléments du client :\n${data.transcript}` },
      ],
    });
    return { payload: cleanJson(content) };
  });
