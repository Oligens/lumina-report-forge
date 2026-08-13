import type {
  AnomalyBadge,
  CurrencyCode,
  FilterPeriod,
  ReportItem,
  ReportSummary,
  SourceType,
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
    const cleaned = value
      .replace(/[^\d.,-]/g, "")
      .replace(/\s/g, "")
      .replace(",", ".");
    const parsed = Number.parseFloat(cleaned);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

/** Normalizes raw AI rows into fully enriched, currency-converted report items. */
export function normalizeRows(
  rawRows: unknown[],
  options: {
    reportId: string;
    sourceType: SourceType;
    fallbackCurrency: CurrencyCode;
    ratesToUsd: Record<CurrencyCode, number>;
  },
): ReportItem[] {
  return rawRows.map((raw, index) => {
    const source = (raw ?? {}) as Record<string, unknown>;
    const rawDate = (source["date_complete"] ?? source["date"]) as string | undefined;
    const parsedDate = rawDate ? new Date(rawDate) : null;
    const dateObj =
      parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate : new Date();

    const monthIndex = dateObj.getMonth();
    const quantite = source["quantite"] === undefined ? 1 : toNumber(source["quantite"]) || 1;
    const prix_unitaire = toNumber(source["prix_unitaire"]);
    const montant_total = toNumber(source["montant_total"]) || quantite * prix_unitaire;

    const currencyRaw = String(source["currency_original"] ?? options.fallbackCurrency)
      .toUpperCase()
      .trim();
    const currency_original: CurrencyCode = (["USD", "EUR", "HTG"] as const).includes(
      currencyRaw as CurrencyCode,
    )
      ? (currencyRaw as CurrencyCode)
      : options.fallbackCurrency;
    const exchange_rate = options.ratesToUsd[currency_original] || 1;

    return {
      id:
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}_${index}`,
      report_id: options.reportId,
      date_complete: dateObj.toISOString().split("T")[0]!,
      jour: dateObj.getDate(),
      mois: MOIS_NOMS[monthIndex]!,
      annee: dateObj.getFullYear(),
      semaine_numero: isoWeek(dateObj),
      trimestre: monthIndex < 3 ? "Q1" : monthIndex < 6 ? "Q2" : monthIndex < 9 ? "Q3" : "Q4",
      semestre: monthIndex < 6 ? "S1" : "S2",
      type: String(source["type"] ?? "Autre").trim(),
      categorie: String(source["categorie"] ?? "Général"),
      description: String(source["description"] ?? ""),
      quantite,
      prix_unitaire,
      montant_total,
      currency_original,
      exchange_rate,
      montant_converted_usd: montant_total * exchange_rate,
      anomaly_badge: "NORMAL",
      source_type: options.sourceType,
      created_at: new Date().toISOString(),
    };
  });
}

/** Premium #1 — statistical anomaly + duplicate audit across the whole session. */
export function applyAnomalyGuard(items: ReportItem[]): ReportItem[] {
  const amounts = items.map((item) => item.montant_converted_usd);
  const mean = amounts.length
    ? amounts.reduce((sum, value) => sum + value, 0) / amounts.length
    : 0;
  const variance = amounts.length
    ? amounts.reduce((sum, value) => sum + (value - mean) ** 2, 0) / amounts.length
    : 0;
  const stdDev = Math.sqrt(variance);

  const seen = new Map<string, number>();

  return items.map((item) => {
    let badge: AnomalyBadge = "NORMAL";
    let explanation: string | undefined;

    const key = `${item.date_complete}|${item.description.toLowerCase().trim()}|${item.montant_total}`;
    const count = (seen.get(key) ?? 0) + 1;
    seen.set(key, count);

    if (
      stdDev > 0 &&
      Math.abs(item.montant_converted_usd - mean) > 2.5 * stdDev
    ) {
      badge = "HIGH_EXPENDITURE";
      explanation = `Écart anormal : montant à plus de 2,5 écarts-types de la moyenne de la session (${mean.toFixed(2)} USD).`;
    }
    if (count > 1) {
      badge = "DUPLICATE_RISK";
      explanation = "Risque de doublon : une écriture identique existe déjà dans la session.";
    }

    const next: ReportItem = { ...item, anomaly_badge: badge };
    if (explanation) next.anomaly_explanation = explanation;
    else delete next.anomaly_explanation;
    return next;
  });
}

export function computeSummary(items: ReportItem[]): ReportSummary {
  let totalVentes = 0;
  let totalDepenses = 0;
  for (const item of items) {
    const amount = Number(item.montant_converted_usd) || 0;
    if (item.type.toLowerCase().includes("vente")) totalVentes += amount;
    else totalDepenses += amount;
  }
  return { totalVentes, totalDepenses, soldeNet: totalVentes - totalDepenses };
}

export function groupKeyFor(item: ReportItem, period: FilterPeriod): string {
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

export const PERIOD_LABELS: { key: FilterPeriod; label: string }[] = [
  { key: "semaine", label: "Semaine" },
  { key: "mois", label: "Mois" },
  { key: "trimestre", label: "Trimestre" },
  { key: "semestre", label: "Semestre" },
  { key: "annee", label: "Année" },
  { key: "global", label: "Tout d'un coup" },
];
