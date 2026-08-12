export type FilterPeriod =
  | "semaine"
  | "mois"
  | "trimestre"
  | "semestre"
  | "annee"
  | "global";

export type ColumnType = "date" | "string" | "number" | "currency";

export interface ReportColumn {
  key: string;
  label: string;
  type: ColumnType;
}

export interface ReportItem {
  id: string;
  date_complete: string; // ISO YYYY-MM-DD
  jour: number;
  mois: string;
  annee: number;
  semaine_numero: number;
  trimestre: "Q1" | "Q2" | "Q3" | "Q4";
  semestre: "S1" | "S2";
  type: "Vente" | "Achat" | "Dépense" | "Autre" | string;
  categorie: string;
  description: string;
  quantite: number;
  prix_unitaire: number;
  montant_total: number;
  statut?: string;
  [key: string]: string | number | undefined;
}

export interface ReportSummary {
  totalVentes: number;
  totalAchats: number;
  totalDepenses: number;
  soldeNette: number;
}

export interface ReportPayload {
  report_title: string;
  currency: string;
  columns: ReportColumn[];
  rows: Record<string, unknown>[];
  summary?: {
    total_income?: number;
    total_expense?: number;
    net_balance?: number;
  };
}

export interface ParsedReport {
  title: string;
  currency: string;
  columns: ReportColumn[];
  items: ReportItem[];
  summary: ReportSummary;
}

export type MachineState = "idle" | "processing" | "parsing" | "ready" | "error";
