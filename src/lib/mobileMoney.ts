import type { CurrencyCode } from "@/types/report";
import type { MMAdjustment, MMCashCount, MMComputedRow, MMSettings, MMTotals, MMTransaction, MMServiceBalance } from "@/types/mobileMoney";

const SETTINGS_KEY = "scarwrite_mm_settings";
const TX_KEY = "scarwrite_mm_transactions";
const ADJ_KEY = "scarwrite_mm_adjustments";
const COUNT_KEY = "scarwrite_mm_cashcounts";

export const DEFAULT_MM_SETTINGS: MMSettings = {
  base_currency: "HTG", usd_rate: 132, default_commission_pct: 2,
  services: ["MonCash", "Natcash", "Western Union", "MoneyGram", "Ria", "CAM Transfer"].map(service => ({ service, opening_cash_base: 0, opening_cash_usd: 0, opening_wallet_base: 0, opening_wallet_usd: 0 })),
};
function read<T>(key: string, fallback: T): T { if (typeof window === "undefined") return fallback; const raw = window.localStorage.getItem(key); if (!raw) return fallback; try { return JSON.parse(raw) as T; } catch { return fallback; } }
function write(key: string, value: unknown) { if (typeof window !== "undefined") window.localStorage.setItem(key, JSON.stringify(value)); }
export const loadMMSettings = (): MMSettings => {
  const raw = read<MMSettings>(SETTINGS_KEY, DEFAULT_MM_SETTINGS);
  if (raw.services?.length) return raw;
  const legacy: MMServiceBalance = { service: "MonCash", opening_cash_base: raw.opening_cash_base ?? 0, opening_cash_usd: raw.opening_cash_usd ?? 0, opening_wallet_base: raw.opening_wallet_base ?? 0, opening_wallet_usd: raw.opening_wallet_usd ?? 0 };
  return { ...DEFAULT_MM_SETTINGS, ...raw, services: [legacy, ...DEFAULT_MM_SETTINGS.services.filter(s => s.service !== "MonCash")] };
};
export const saveMMSettings = (settings: MMSettings) => write(SETTINGS_KEY, settings);
export const loadMMTransactions = () => read<MMTransaction[]>(TX_KEY, []);
export const saveMMTransactions = (rows: MMTransaction[]) => write(TX_KEY, rows);
export const loadMMAdjustments = () => read<MMAdjustment[]>(ADJ_KEY, []);
export const saveMMAdjustments = (rows: MMAdjustment[]) => write(ADJ_KEY, rows);
export const loadMMCashCounts = () => read<MMCashCount[]>(COUNT_KEY, []);
export const saveMMCashCounts = (rows: MMCashCount[]) => write(COUNT_KEY, rows);
export function toBase(amount: number, currency: CurrencyCode, settings: MMSettings): number {
  if (currency === settings.base_currency) return amount;
  if (currency === "USD") return amount * (settings.usd_rate || 1);
  if (settings.base_currency === "USD") return amount / (settings.usd_rate || 1);
  return amount;
}
export function estimateCommission(montant: number, settings: MMSettings): number { return Math.round(((montant * (settings.default_commission_pct || 0)) / 100) * 100) / 100; }
function openingFor(service: string, settings: MMSettings) { const s = settings.services.find(x => x.service === service) ?? { service, opening_cash_base: 0, opening_cash_usd: 0, opening_wallet_base: 0, opening_wallet_usd: 0 }; return { cash: s.opening_cash_base + toBase(s.opening_cash_usd, "USD", settings), wallet: s.opening_wallet_base + toBase(s.opening_wallet_usd, "USD", settings) }; }
export function computeMMRows(transactions: MMTransaction[], adjustments: MMAdjustment[], settings: MMSettings): { rows: MMComputedRow[]; totals: MMTotals } {
  const state = new Map<string, { cash: number; wallet: number; revenue: number; deposits: number; withdrawals: number }>();
  for (const s of settings.services) { const o = openingFor(s.service, settings); state.set(s.service, { cash: o.cash, wallet: o.wallet, revenue: 0, deposits: 0, withdrawals: 0 }); }
  const sorted = [...transactions].sort((a,b) => a.date.localeCompare(b.date) || a.created_at.localeCompare(b.created_at));
  const rows: MMComputedRow[] = sorted.map(tx => {
    if (!state.has(tx.service)) { const o = openingFor(tx.service, settings); state.set(tx.service, { cash:o.cash, wallet:o.wallet, revenue:0, deposits:0, withdrawals:0 }); }
    const s = state.get(tx.service)!; const amount = toBase(tx.montant, tx.currency, settings); const fee = toBase(tx.frais_client, tx.currency, settings); const commission = toBase(tx.commission_operateur, tx.currency, settings);
    let cashImpact: number, walletImpact: number, revenue: number;
    if (tx.operation === "DEPOT") { cashImpact = amount + fee; walletImpact = -amount + commission; revenue = fee + commission; s.deposits += amount; }
    else { cashImpact = -amount; walletImpact = amount + commission; revenue = commission; s.withdrawals += amount; }
    s.cash += cashImpact; s.wallet += walletImpact; s.revenue += revenue;
    return { ...tx, montant_base: amount, frais_client_base: fee, commission_base: commission, impact_cash: cashImpact, impact_wallet: walletImpact, honoraire_net: revenue, solde_cash: s.cash, solde_wallet: s.wallet };
  });
  let adjustmentsTotal = 0;
  for (const adj of adjustments) { const relevant = rows.filter(r => r.date === adj.date && r.service === adj.service); const estimated = relevant.reduce((n,r) => n + r.commission_base, 0); const actual = toBase(adj.commission_reelle, adj.currency, settings); const delta = actual - estimated; const s = state.get(adj.service); if (s) { s.wallet += delta; s.revenue += delta; } adjustmentsTotal += delta; }
  const byService = [...state.entries()].map(([service,s]) => ({ service, cashActive:s.cash, walletActive:s.wallet, honorairesNets:s.revenue, volumeDepots:s.deposits, volumeRetraits:s.withdrawals }));
  return { rows, totals: { cashActive: byService.reduce((n,s)=>n+s.cashActive,0), walletActive: byService.reduce((n,s)=>n+s.walletActive,0), honorairesNets: byService.reduce((n,s)=>n+s.honorairesNets,0), volumeDepots: byService.reduce((n,s)=>n+s.volumeDepots,0), volumeRetraits: byService.reduce((n,s)=>n+s.volumeRetraits,0), ajustementsTotal: adjustmentsTotal, byService } };
}
export function formatBase(amount: number, settings: MMSettings): string { return `${(Number(amount)||0).toLocaleString("fr-FR",{minimumFractionDigits:2,maximumFractionDigits:2})} ${settings.base_currency}`; }
