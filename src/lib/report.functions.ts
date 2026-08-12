import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const SYSTEM_PROMPT = `You are a specialized data-structuring financial analyst AI. Your sole task is to ingest unstructured natural language text containing business records (sales, purchases, expenses, inventory, invoices) and transform them into a clean, normalized JSON array representing a structured table.

Extract and normalize:
- Date/Time (ISO format standard, field date_complete = YYYY-MM-DD)
- Type/Category (e.g., Vente, Achat, Dépense, Transfert)
- Description/Libellé
- Quantité/Unités (Numeric, default 1)
- Prix Unitaire (Numeric)
- Montant Total (Numeric = Quantité * Prix Unitaire if not specified)
- Statut/Mode de Paiement (if mentioned)

Rules:
- Never invent facts, dates, or numbers not present or clearly implied in the text.
- Automatically deduce appropriate table columns based on the input context.
- Labels and categories must be in French.
- Return strictly valid JSON in the specified JSON Schema format without conversational filler.
- If the text contains no business records, return empty "rows" and "columns" arrays.

JSON Schema:
{
  "report_title": "String",
  "currency": "String (e.g., USD, EUR, HTG)",
  "columns": [{ "key": "string", "label": "string", "type": "date | string | number | currency" }],
  "rows": [{ "id": "string", "date_complete": "YYYY-MM-DD", "type": "string", "categorie": "string", "description": "string", "quantite": 0, "prix_unitaire": 0, "montant_total": 0, "statut": "string" }],
  "summary": { "total_income": 0, "total_expense": 0, "net_balance": 0 }
}`;

export const generateReport = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ prompt: z.string().min(1).max(20000) }).parse(data),
  )
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI gateway non configurée.");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: data.prompt },
        ],
      }),
    });

    if (response.status === 429)
      throw new Error("Limite de requêtes atteinte. Réessayez dans un instant.");
    if (response.status === 402)
      throw new Error("Crédits IA épuisés. Rechargez votre espace de travail.");
    if (!response.ok) throw new Error(`Erreur IA (${response.status}).`);

    const json = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = json.choices?.[0]?.message?.content ?? "";
    const cleaned = content
      .trim()
      .replace(/^```(?:json)?/i, "")
      .replace(/```$/, "")
      .trim();

    try {
      JSON.parse(cleaned);
    } catch {
      throw new Error("Réponse IA illisible. Reformulez votre texte source.");
    }
    return { payload: cleaned };
  });
