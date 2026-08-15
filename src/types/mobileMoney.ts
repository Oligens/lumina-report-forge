import type { CurrencyCode } from "@/types/report";

export type MMService = "MonCash" | "Natcash" | "Western Union" | "MoneyGram" | "CAM" | "Autre";

export const MM_SERVICES: MMService[] = [
  "MonCash",
  "Natcash",
  "Western Union",
  "MoneyGram",
  "CAM",
  "Autre",
];

/** DEPOT = dépôt / transfert sortant · RETRAIT = retrait / réception */
export type MMOperation = "DEPOT" | "RETRAIT";

export interface MMSettings {
  base_currency: CurrencyCode;
  /** 1 USD = X devise de base */
  usd_rate: number;
  /** Soldes de départ */
  opening_cash_base: number;
  opening_cash_usd: number;
  opening_wallet_base: number;
  opening_wallet_usd: number;
  /** Commission opérateur estimée par défaut (% du montant) */
  default_commission_pct: number;
}

export interface MMTransaction {
  id: string;
  date: string; // ISO yyyy-mm-dd
  service: MMService;
  operation: MMOperation;
  /** Montant de la transaction (devise de saisie) */
  montant: number;
  /** Frais encaissés du client en cash (dépôt) */
  frais_client: number;
  /** Commission opérateur créditée / frais reçus sur le wallet */
  commission_operateur: number;
  /** true quand la commission provient de l'estimation par défaut */
  commission_estimee: boolean;
  currency: CurrencyCode;
  note?: string;
  created_at: string;
}

/** Ajustement de clôture : commission réelle communiquée par l'opérateur. */
export interface MMAdjustment {
  id: string;
  date: string;
  service: MMService;
  commission_reelle: number;
  currency: CurrencyCode;
  created_at: string;
}

export interface MMComputedRow extends MMTransaction {
  /** Valeurs converties en devise de base */
  montant_base: number;
  frais_client_base: number;
  commission_base: number;
  impact_cash: number;
  impact_wallet: number;
  honoraire_net: number;
  solde_cash: number;
  solde_wallet: number;
}

export interface MMTotals {
  cashActive: number;
  walletActive: number;
  honorairesNets: number;
  volumeDepots: number;
  volumeRetraits: number;
  ajustementsTotal: number;
}

export interface MMCashCount {
  date: string;
  cash_reel: number;
}
