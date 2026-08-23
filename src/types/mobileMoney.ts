import type { CurrencyCode } from "@/types/report";

export type MMService = string;
export const MM_SERVICES = ["MonCash", "Natcash", "Western Union", "MoneyGram", "Ria", "CAM Transfer"] as MMService[];
export type MMOperation = "DEPOT" | "RETRAIT";

export interface MMServiceBalance {
  service: MMService;
  opening_cash_base: number;
  opening_cash_usd: number;
  opening_wallet_base: number;
  opening_wallet_usd: number;
}
export interface MMSettings {
  base_currency: CurrencyCode;
  usd_rate: number;
  services: MMServiceBalance[];
  default_commission_pct: number;
  opening_cash_base?: number;
  opening_cash_usd?: number;
  opening_wallet_base?: number;
  opening_wallet_usd?: number;
}
export interface MMTransaction {
  id: string; date: string; service: MMService; operation: MMOperation; montant: number;
  frais_client: number; commission_operateur: number; commission_estimee: boolean;
  currency: CurrencyCode; note?: string; created_at: string;
}
export interface MMAdjustment { id: string; date: string; service: MMService; commission_reelle: number; currency: CurrencyCode; created_at: string; }
export interface MMComputedRow extends MMTransaction {
  montant_base: number; frais_client_base: number; commission_base: number;
  impact_cash: number; impact_wallet: number; honoraire_net: number;
  solde_cash: number; solde_wallet: number;
}
export interface MMServiceTotals { service: MMService; cashActive: number; walletActive: number; honorairesNets: number; volumeDepots: number; volumeRetraits: number; }
export interface MMTotals { cashActive: number; walletActive: number; honorairesNets: number; volumeDepots: number; volumeRetraits: number; ajustementsTotal: number; byService: MMServiceTotals[]; }
export interface MMCashCount { date: string; cash_reel: number; service?: MMService; }
