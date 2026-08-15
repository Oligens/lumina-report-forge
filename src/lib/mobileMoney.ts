import type { CurrencyCode } from "@/types/report";
import type {
  MMAdjustment,
  MMCashCount,
  MMComputedRow,
  MMSettings,
  MMTotals,
  MMTransaction,
} from "@/types/mobileMoney";

const SETTINGS_KEY = "scarwrite_mm_settings";
const TX_KEY = "scarwrite_mm_transactions";
const ADJ_KEY = "scarwrite_mm_adjustments";
const COUNT_KEY = "scarwrite_mm_cashcounts";

export const DEFAULT_MM_SETTINGS: MMSettings = {
  base_currency: "HTG",
  usd_rate: 132,
  opening_cash_base: 0,
  opening_cash_usd: 0,
  opening_wallet_base: 0,
  opening_wallet_usd: 0,
  default_commission_pct: 2,
};

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export const loadMMSettings = () => read<MMSettings>(SETTINGS_KEY, DEFAULT_MM_SETTINGS);
export const saveMMSettings = (settings: MMSettings) => write(SETTINGS_KEY, settings);
export const loadMMTransactions = () => read<MMTransaction[]>(TX_KEY, []);
export const saveMMTransactions = (rows: MMTransaction[]) => write(TX_KEY, rows);
export const loadMMAdjustments = () => read<MMAdjustment[]>(ADJ_KEY, []);
export const saveMMAdjustments = (rows: MMAdjustment[]) => write(ADJ_KEY, rows);
export const loadMMCashCounts = () => read<MMCashCount[]>(COUNT_KEY, []);
export const saveMMCashCounts = (rows: MMCashCount[]) => write(COUNT_KEY, rows);

/** Convertit un montant vers la devise de base (USD -> base au taux du jour). */
export function toBase(amount: number, currency: CurrencyCode, settings: MMSettings): number {
  if (currency === settings.base_currency) return amount;
  if (currency === "USD") return amount * (settings.usd_rate || 1);
  if (settings.base_currency === "USD") return amount / (settings.usd_rate || 1);
  // devise tierce : passage par USD est indisponible, on retourne tel quel
  return amount;
}

export function estimateCommission(montant: number, settings: MMSettings): number {
  return Math.round(((montant * (settings.default_commission_pct || 0)) / 100) * 100) / 100;
}

/**
 * Applique les règles strictes d'impact de caisse.
 * DEPOT  : cash += montant + frais client ; wallet += -montant + commission ; honoraire = frais + commission
 * RETRAIT: cash -= montant ; wallet += montant + commission ; honoraire = commission
 */
export function computeMMRows(
  transactions: MMTransaction[],
  adjustments: MMAdjustment[],
  settings: MMSettings,
): { rows: MMComputedRow[]; totals: MMTotals } {
  const openingCash =
    settings.opening_cash_base + toBase(settings.opening_cash_usd, "USD", settings);
  const openingWallet =
    settings.opening_wallet_base + toBase(settings.opening_wallet_usd, "USD", settings);

  const sorted = [...transactions].sort(
    (a, b) => a.date.localeCompare(b.date) || a.created_at.localeCompare(b.created_at),
  );

  let cash = openingCash;
  let wallet = openingWallet;
  let honoraires = 0;
  let volumeDepots = 0;
  let volumeRetraits = 0;

  const rows: MMComputedRow[] = sorted.map((tx) => {
    const montant_base = toBase(tx.montant, tx.currency, settings);
    const frais_client_base = toBase(tx.frais_client, tx.currency, settings);
    const commission_base = toBase(tx.commission_operateur, tx.currency, settings);

    let impact_cash: number;
    let impact_wallet: number;
    let honoraire_net: number;

    if (tx.operation === "DEPOT") {
      impact_cash = montant_base + frais_client_base;
      impact_wallet = -montant_base + commission_base;
      honoraire_net = frais_client_base + commission_base;
      volumeDepots += montant_base;
    } else {
      impact_cash = -montant_base;
      impact_wallet = montant_base + commission_base;
      honoraire_net = commission_base;
      volumeRetraits += montant_base;
    }

    cash += impact_cash;
    wallet += impact_wallet;
    honoraires += honoraire_net;

    return {
      ...tx,
      montant_base,
      frais_client_base,
      commission_base,
      impact_cash,
      impact_wallet,
      honoraire_net,
      solde_cash: cash,
      solde_wallet: wallet,
    };
  });

  // Ajustements de clôture : la commission réelle remplace l'estimation du jour/service.
  let ajustementsTotal = 0;
  for (const adj of adjustments) {
    const estimated = rows
      .filter((row) => row.date === adj.date && row.service === adj.service)
      .reduce((sum, row) => sum + row.commission_base, 0);
    const reelle = toBase(adj.commission_reelle, adj.currency, settings);
    ajustementsTotal += reelle - estimated;
  }
  wallet += ajustementsTotal;
  honoraires += ajustementsTotal;

  return {
    rows,
    totals: {
      cashActive: cash,
      walletActive: wallet,
      honorairesNets: honoraires,
      volumeDepots,
      volumeRetraits,
      ajustementsTotal,
    },
  };
}

export function formatBase(amount: number, settings: MMSettings): string {
  return `${(Number(amount) || 0).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${settings.base_currency}`;
}
