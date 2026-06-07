// src/lib/currency.ts
// Simple in-memory cache for exchange rates (TTL: 1 hour)
interface RateCache {
    rates: Record<string, number>;
    fetchedAt: number;
}

let cache: RateCache | null = null;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Fetch latest exchange rates from exchangerate-api.com (free tier).
 * Base currency: USD. Falls back to mock rates if API key is missing.
 */
async function fetchRates(): Promise<Record<string, number>> {
    const apiKey = process.env.EXCHANGE_RATE_API_KEY;

    if (!apiKey) {
        // Mock rates for development — USD base
        return {
            USD: 1,
            EUR: 0.92,
            PLN: 3.96,
            GBP: 0.79,
            CHF: 0.9,
            CZK: 23.1,
        };
    }

    const res = await fetch(
        `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`,
    );
    if (!res.ok) throw new Error(`Exchange rate API error: ${res.status}`);
    const data = (await res.json()) as {
        conversion_rates: Record<string, number>;
    };
    return data.conversion_rates;
}

async function getRates(): Promise<Record<string, number>> {
    const now = Date.now();
    if (cache && now - cache.fetchedAt < CACHE_TTL_MS) {
        return cache.rates;
    }
    const rates = await fetchRates();
    cache = { rates, fetchedAt: now };
    return rates;
}

/**
 * Convert `amount` from `fromCurrency` to `toCurrency`.
 * Returns the converted value rounded to 2 decimal places.
 */
export async function convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
): Promise<number> {
    if (fromCurrency.toUpperCase() === toCurrency.toUpperCase()) return amount;

    const rates = await getRates();
    const fromRate = rates[fromCurrency.toUpperCase()];
    const toRate = rates[toCurrency.toUpperCase()];

    if (!fromRate) throw new Error(`Unknown currency: ${fromCurrency}`);
    if (!toRate) throw new Error(`Unknown currency: ${toCurrency}`);

    // Convert via USD base
    const amountInUSD = amount / fromRate;
    const converted = amountInUSD * toRate;
    return Math.round(converted * 100) / 100;
}

export function isSupportedCurrency(currency: string) {
    return true;
}
