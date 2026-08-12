import type {
  ParsedReport,
  ReportColumn,
  ReportItem,
  ReportPayload,
  ReportSummary,
} from "@/types/report";

export const MOIS_NOMS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

export const DEFAULT_COLUMNS: ReportColumn[] = [
  { key: "date_complete", label: "Date", type: "date" },
  { key: "type", label: "Type", type: "string" },
  { key: "categorie", label: "Catégorie", type: "string" },
  { key: "description", label: "Description", type: "string" },
  { key: "quantite", label: "Qté", type: "number" },
  { key: "prix_unitaire", label: "Prix Unitaire", type: "currency" },
  { key: "montant_total", label: "Montant Total", type: "currency" },
];

function isoWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[^\d.,-]/g, "").replace(/\s/g, "").replace(",", ".");
    const parsed = Number.parseFloat(cleaned);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

/**
 * Enrichit et normalise la réponse JSON brute de l'IA : calcule
 * jour / mois / année / semaine / trimestre / semestre et les totaux.
 */
export function parseAIResponse(payload: ReportPayload): ParsedReport {
  const rawRows = Array.isArray(payload?.rows) ? payload.rows : [];

  let totalVentes = 0;
  let totalAchats = 0;
  let totalDepenses = 0;

  const items: ReportItem[] = rawRows.map((raw, index) => {
    const source = raw as Record<string, unknown>;
    const rawDate = (source["date_complete"] ?? source["date"]) as string | undefined;
    const parsedDate = rawDate ? new Date(rawDate) : null;
    const dateObj =
      parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate : new Date();

    const monthIndex = dateObj.getMonth();
    const jour = dateObj.getDate();
    const mois = MOIS_NOMS[monthIndex]!;
    const annee = dateObj.getFullYear();
    const trimestre =
      monthIndex < 3 ? "Q1" : monthIndex < 6 ? "Q2" : monthIndex < 9 ? "Q3" : "Q4";
    const semestre = monthIndex < 6 ? "S1" : "S2";

    const quantite = source["quantite"] === undefined ? 1 : toNumber(source["quantite"]) || 1;
    const prix_unitaire = toNumber(source["prix_unitaire"]);
    const montant_total =
      toNumber(source["montant_total"]) || quantite * prix_unitaire;

    const itemType = String(source["type"] ?? "Autre").trim();
    const lower = itemType.toLowerCase();
    if (lower.includes("vente")) totalVentes += montant_total;
    else if (lower.includes("achat")) totalAchats += montant_total;
    else if (lower.includes("dépense") || lower.includes("depense"))
      totalDepenses += montant_total;

    const extras: Record<string, string | number> = {};
    for (const [key, value] of Object.entries(source)) {
      if (
        [
          "id",
          "date",
          "date_complete",
          "type",
          "categorie",
          "description",
          "quantite",
          "prix_unitaire",
          "montant_total",
        ].includes(key)
      )
        continue;
      if (typeof value === "number" || typeof value === "string") extras[key] = value;
    }

    return {
      ...extras,
      id: String(source["id"] ?? `row_${index}_${Date.now()}`),
      date_complete: dateObj.toISOString().split("T")[0]!,
      jour,
      mois,
      annee,
      semaine_numero: isoWeek(dateObj),
      trimestre,
      semestre,
      type: itemType,
      categorie: String(source["categorie"] ?? "Général"),
      description: String(source["description"] ?? ""),
      quantite,
      prix_unitaire,
      montant_total,
    } as ReportItem;
  });

  const columns =
    Array.isArray(payload?.columns) && payload.columns.length
      ? payload.columns
      : DEFAULT_COLUMNS;

  return {
    title: payload?.report_title || "Rapport",
    currency: payload?.currency || "USD",
    columns,
    items,
    summary: computeSummary(items),
  };
}

export function computeSummary(items: ReportItem[]): ReportSummary {
  let totalVentes = 0;
  let totalAchats = 0;
  let totalDepenses = 0;
  for (const item of items) {
    const lower = String(item.type).toLowerCase();
    const amount = Number(item.montant_total) || 0;
    if (lower.includes("vente")) totalVentes += amount;
    else if (lower.includes("achat")) totalAchats += amount;
    else if (lower.includes("dépense") || lower.includes("depense"))
      totalDepenses += amount;
  }
  return {
    totalVentes,
    totalAchats,
    totalDepenses,
    soldeNette: totalVentes - (totalAchats + totalDepenses),
  };
}

export function groupKeyFor(
  item: ReportItem,
  period: import("@/types/report").FilterPeriod,
): string {
  switch (period) {
    case "semaine":
      return `Semaine ${item.semaine_numero} · ${item.annee}`;
    case "mois":
      return `${item.mois} ${item.annee}`;
    case "trimestre":
      return `${item.trimestre} ${item.annee}`;
    case "semestre":
      return `${item.semestre} ${item.annee}`;
    case "annee":
      return `${item.annee}`;
    default:
      return "Rapport Global";
  }
}

export function formatValue(
  value: unknown,
  type: import("@/types/report").ColumnType,
  currency: string,
): string {
  if (value === null || value === undefined || value === "") return "—";
  if (type === "currency") {
    return `${Number(value).toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} ${currency}`;
  }
  if (type === "number") return Number(value).toLocaleString("fr-FR");
  return String(value);
}
