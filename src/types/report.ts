export type FilterPeriod =
  | "semaine"
  | "mois"
  | "trimestre"
  | "semestre"
  | "annee"
  | "global";

export type CurrencyCode = "USD" | "EUR" | "HTG";
export type SourceType = "TEXT" | "VOICE_NOTE" | "OCR_RECEIPT";
export type AnomalyBadge = "NORMAL" | "HIGH_EXPENDITURE" | "DUPLICATE_RISK";

export interface ReportItem {
  id: string;
  report_id: string;
  user_id?: string;
  date_complete: string;
  jour: number;
  mois: string;
  annee: number;
  semaine_numero: number;
  trimestre: "Q1" | "Q2" | "Q3" | "Q4";
  semestre: "S1" | "S2";
  type: string;
  categorie: string;
  description: string;
  quantite: number;
  prix_unitaire: number;
  montant_total: number;
  currency_original: CurrencyCode;
  exchange_rate: number;
  montant_converted_usd: number;
  anomaly_badge: AnomalyBadge;
  anomaly_explanation?: string;
  source_type: SourceType;
  created_at: string;
  synced?: boolean;
}

export interface ReportSession {
  id: string;
  user_id?: string;
  title: string;
  period_group: FilterPeriod;
  currency_reference: CurrencyCode;
  executive_summary?: string;
  created_at: string;
  synced?: boolean;
}

export interface ReportSummary {
  totalVentes: number;
  totalDepenses: number;
  soldeNet: number;
}

export type MachineState = "idle" | "processing" | "parsing" | "ready" | "error";
