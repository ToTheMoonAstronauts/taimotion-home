// Multi-currency catalog for edge functions (live Stripe IDs).
// Amounts are Stripe minor units. clp/cop are zero-decimal.

export type Currency = 'usd' | 'eur' | 'gbp' | 'mxn' | 'brl' | 'clp' | 'cop';
export const CURRENCIES: Currency[] = ['usd', 'eur', 'gbp', 'mxn', 'brl', 'clp', 'cop'];
export const DEFAULT_CURRENCY: Currency = 'usd';
// Zero-decimal: minor unit === whole currency unit (no ×100).
export const ZERO_DECIMAL: ReadonlySet<string> = new Set(['clp', 'cop']);

// Hyperinflated / unstable local currencies — never accept as a charge currency.
// VE (VES) is the primary case; client also maps country VE → usd.
const BLOCKED_CURRENCIES = new Set(['ves', 'vef']);

export function normalizeCurrency(c: unknown): Currency {
  const k = String(c || '').toLowerCase();
  if (BLOCKED_CURRENCIES.has(k)) return DEFAULT_CURRENCY;
  return (CURRENCIES as string[]).includes(k) ? (k as Currency) : DEFAULT_CURRENCY;
}

export function decimals(c: string): number {
  return ZERO_DECIMAL.has(normalizeCurrency(c)) ? 0 : 2;
}

/** Convert Stripe minor units to a major-unit number for DB / analytics storage. */
export function minorToMajor(minor: number, currency: string): number {
  const d = decimals(currency);
  return d === 0 ? minor : minor / Math.pow(10, d);
}

export type PlanOffer = { price: string; coupon: string; intro: number; regular: number };

// plan_id -> currency -> Stripe price + intro coupon + display amounts (minor)
export const PLANS: Record<string, Record<Currency, PlanOffer>> = {
  '1w': {
    usd: { price: 'price_1TqChQ3x0B891G8VXfVhEwZ3', coupon: 'fLsSa51J', intro: 519, regular: 2199 },
    eur: { price: 'price_1U2WY73x0B891G8VN1D0G7In', coupon: 'tm_1w_eur_intro', intro: 499, regular: 1999 },
    gbp: { price: 'price_1U2WYM3x0B891G8V4SmCluml', coupon: 'tm_1w_gbp_intro', intro: 499, regular: 1799 },
    mxn: { price: 'price_1U2WYP3x0B891G8VURfPkg3i', coupon: 'tm_1w_mxn_intro', intro: 9900, regular: 42900 },
    brl: { price: 'price_1U2WYR3x0B891G8Voa8pyQxD', coupon: 'tm_1w_brl_intro', intro: 2990, regular: 11990 },
    clp: { price: 'price_1U2WYd3x0B891G8VeuCAXIr0', coupon: 'tm_1w_clp_intro', intro: 4990, regular: 19990 },
    cop: { price: 'price_1U2WYf3x0B891G8VbaDxLSN3', coupon: 'tm_1w_cop_intro', intro: 19900, regular: 89900 },
  },
  '4w': {
    usd: { price: 'price_1TqChS3x0B891G8VAnNFfhdA', coupon: 'RKIibGD8', intro: 999, regular: 4995 },
    eur: { price: 'price_1U2WY83x0B891G8VLYmhtfgN', coupon: 'tm_4w_eur_intro', intro: 999, regular: 4499 },
    gbp: { price: 'price_1U2WYN3x0B891G8VHqvfjiIf', coupon: 'tm_4w_gbp_intro', intro: 899, regular: 3999 },
    mxn: { price: 'price_1U2WYQ3x0B891G8V2FB05hnj', coupon: 'tm_4w_mxn_intro', intro: 19900, regular: 99900 },
    brl: { price: 'price_1U2WYS3x0B891G8VkOqpp3ww', coupon: 'tm_4w_brl_intro', intro: 5490, regular: 26990 },
    clp: { price: 'price_1U2WYe3x0B891G8VLcx21k80', coupon: 'tm_4w_clp_intro', intro: 9990, regular: 49990 },
    cop: { price: 'price_1U2WYg3x0B891G8VOez9Wp7O', coupon: 'tm_4w_cop_intro', intro: 39900, regular: 199900 },
  },
  '12w': {
    usd: { price: 'price_1TqChT3x0B891G8V0FNT81If', coupon: '3sUP0i8K', intro: 1999, regular: 8495 },
    eur: { price: 'price_1U2WY83x0B891G8VRk6RFCdN', coupon: 'tm_12w_eur_intro', intro: 1999, regular: 7999 },
    gbp: { price: 'price_1U2WYO3x0B891G8V4xZs3PJW', coupon: 'tm_12w_gbp_intro', intro: 1799, regular: 6999 },
    mxn: { price: 'price_1U2WYR3x0B891G8VlNrOg9Fp', coupon: 'tm_12w_mxn_intro', intro: 39900, regular: 169900 },
    brl: { price: 'price_1U2WYT3x0B891G8Vzi3c8N6F', coupon: 'tm_12w_brl_intro', intro: 10990, regular: 45990 },
    clp: { price: 'price_1U2WYe3x0B891G8VkqBiyU5V', coupon: 'tm_12w_clp_intro', intro: 19990, regular: 84990 },
    cop: { price: 'price_1U2WYg3x0B891G8VPWhTY6VJ', coupon: 'tm_12w_cop_intro', intro: 79900, regular: 339900 },
  },
};

export type UpsellOffer =
  | { type: 'one_time'; amounts: Record<Currency, number> }
  | { type: 'recurring'; prices: Record<Currency, string> };

// Funnel post-pay upsells. One-time = ad-hoc PI amount; recurring = price id (if used).
export const UPSELLS: Record<string, UpsellOffer> = {
  essential_guides: {
    type: 'one_time',
    amounts: { usd: 2599, eur: 2499, gbp: 2299, mxn: 49900, brl: 13990, clp: 24990, cop: 99900 },
  },
  all_guides: {
    type: 'one_time',
    amounts: { usd: 3899, eur: 3799, gbp: 3399, mxn: 79900, brl: 20990, clp: 38990, cop: 159900 },
  },
  essential_guides_onetime: {
    type: 'one_time',
    amounts: { usd: 1899, eur: 1799, gbp: 1599, mxn: 39900, brl: 9990, clp: 18990, cop: 74900 },
  },
  guide_sleep: {
    type: 'one_time',
    amounts: { usd: 1899, eur: 1799, gbp: 1599, mxn: 39900, brl: 9990, clp: 18990, cop: 74900 },
  },
  guide_eating: {
    type: 'one_time',
    amounts: { usd: 1899, eur: 1799, gbp: 1599, mxn: 39900, brl: 9990, clp: 18990, cop: 74900 },
  },
  guide_aging: {
    type: 'one_time',
    amounts: { usd: 1899, eur: 1799, gbp: 1599, mxn: 39900, brl: 9990, clp: 18990, cop: 74900 },
  },
  vip: {
    type: 'one_time',
    amounts: { usd: 499, eur: 499, gbp: 499, mxn: 9900, brl: 2490, clp: 4990, cop: 19900 },
  },
};

// In-app buy-guides catalog (slightly different from funnel upsells for bundles).
export const APP_OFFERS: Record<string, { amounts: Record<Currency, number>; grant: string }> = {
  essential_guides: {
    grant: 'essential_guides',
    amounts: { usd: 3899, eur: 3799, gbp: 3399, mxn: 79900, brl: 20990, clp: 38990, cop: 159900 },
  },
  all_guides: {
    grant: 'all_guides',
    amounts: { usd: 3899, eur: 3799, gbp: 3399, mxn: 79900, brl: 20990, clp: 38990, cop: 159900 },
  },
  'guide_joint-mobility': {
    grant: 'guide_joint-mobility',
    amounts: { usd: 1899, eur: 1799, gbp: 1599, mxn: 39900, brl: 9990, clp: 18990, cop: 74900 },
  },
  guide_breathing: {
    grant: 'guide_breathing',
    amounts: { usd: 1899, eur: 1799, gbp: 1599, mxn: 39900, brl: 9990, clp: 18990, cop: 74900 },
  },
  guide_nutrition: {
    grant: 'guide_nutrition',
    amounts: { usd: 1899, eur: 1799, gbp: 1599, mxn: 39900, brl: 9990, clp: 18990, cop: 74900 },
  },
  guide_desserts: {
    grant: 'guide_desserts',
    amounts: { usd: 1899, eur: 1799, gbp: 1599, mxn: 39900, brl: 9990, clp: 18990, cop: 74900 },
  },
  guide_sleep: {
    grant: 'guide_sleep',
    amounts: { usd: 1899, eur: 1799, gbp: 1599, mxn: 39900, brl: 9990, clp: 18990, cop: 74900 },
  },
  guide_eating: {
    grant: 'guide_eating',
    amounts: { usd: 1899, eur: 1799, gbp: 1599, mxn: 39900, brl: 9990, clp: 18990, cop: 74900 },
  },
  guide_aging: {
    grant: 'guide_aging',
    amounts: { usd: 1899, eur: 1799, gbp: 1599, mxn: 39900, brl: 9990, clp: 18990, cop: 74900 },
  },
};
