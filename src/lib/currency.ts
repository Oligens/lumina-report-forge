import type { CurrencyCode } from "@/types/report";

export const CURRENCIES: CurrencyCode[] = ["USD", "EUR", "HTG"];

/** Fallback rates to USD used while offline. */
const FALLBACK_RATES: Record<CurrencyCode, number> = {
  USD: 1,
  EUR: 1.08,
  HTG: 0.0076,
};

let cache: { rates: Record<CurrencyCode, number>; at: number } | null = null;

/** Rates expressed as: 1 unit of currency = X USD. */
export async function getRatesToUSD(): Promise<Record<CurrencyCode, number>> {
  if (cache && Date.now() - cache.at < 1000 * 60 * 60) return cache.rates;
  try {
    const response = await fetch(
      "https://api.frankfurter.app/latest?from=USD&to=EUR",
    );
    if (!response.ok) throw new Error("rates unavailable");
    const json = (await response.json()) as { rates?: { EUR?: number } };
    const eurPerUsd = json.rates?.EUR;
    const rates: Record<CurrencyCode, number> = {
      USD: 1,
      EUR: eurPerUsd ? 1 / eurPerUsd : FALLBACK_RATES.EUR,
      HTG: FALLBACK_RATES.HTG,
    };
    cache = { rates, at: Date.now() };
    return rates;
  } catch {
    return FALLBACK_RATES;
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
