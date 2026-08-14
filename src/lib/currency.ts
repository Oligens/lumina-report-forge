import type { CurrencyCode } from "@/types/report";

export const CURRENCIES: CurrencyCode[] = ["USD", "EUR", "HTG"];

/**
 * Fallback rates used when the live FX endpoint is unreachable (CORS,
 * network, timeout). Expressed as: 1 unit of currency = X USD.
 * USD/EUR = 0.92 · USD/HTG = 132.00 · EUR/HTG = 143.00
 */
export const FALLBACK_RATES: Record<CurrencyCode, number> = {
  USD: 1,
  EUR: 1 / 0.92,
  HTG: 1 / 132,
};

export interface RatesResult {
  rates: Record<CurrencyCode, number>;
  offline: boolean;
}

let cache: { result: RatesResult; at: number } | null = null;

export async function getRatesToUSD(): Promise<RatesResult> {
  if (cache && Date.now() - cache.at < 1000 * 60 * 60) return cache.result;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3000);
  try {
    const response = await fetch(
      "https://api.frankfurter.dev/v1/latest?base=USD&symbols=EUR,HTG",
      { signal: controller.signal },
    );
    if (!response.ok) throw new Error("rates unavailable");
    const json = (await response.json()) as { rates?: Record<string, number> };
    const eurPerUsd = json.rates?.["EUR"];
    const htgPerUsd = json.rates?.["HTG"];
    if (!eurPerUsd) throw new Error("rates incomplete");
    const result: RatesResult = {
      rates: {
        USD: 1,
        EUR: 1 / eurPerUsd,
        HTG: htgPerUsd ? 1 / htgPerUsd : FALLBACK_RATES.HTG,
      },
      offline: false,
    };
    cache = { result, at: Date.now() };
    return result;
  } catch {
    const result: RatesResult = { rates: FALLBACK_RATES, offline: true };
    cache = { result, at: Date.now() };
    return result;
  } finally {
    clearTimeout(timer);
  }
}

export function convert(
  amountUsd: number,
  target: CurrencyCode,
  rates: Record<CurrencyCode, number>,
): number {
  const rate = rates[target] || 1;
  return amountUsd / rate;
}

export function formatMoney(amount: number, currency: CurrencyCode): string {
  return `${amount.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`;
}
