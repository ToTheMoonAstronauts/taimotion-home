// Multi-currency catalog for edge functions (live Stripe IDs).
// Amounts are Stripe minor units. Zero-decimal: clp, cop, pyg.

export type Currency =
  | 'usd' | 'eur' | 'gbp' | 'mxn' | 'brl' | 'clp' | 'cop'
  | 'pen' | 'crc' | 'gtq' | 'hnl' | 'uyu' | 'bob' | 'pyg';

export const CURRENCIES: Currency[] = [
  'usd', 'eur', 'gbp', 'mxn', 'brl', 'clp', 'cop',
  'pen', 'crc', 'gtq', 'hnl', 'uyu', 'bob', 'pyg',
];
export const DEFAULT_CURRENCY: Currency = 'usd';
// Zero-decimal: minor unit === whole currency unit (no ×100).
export const ZERO_DECIMAL: ReadonlySet<string> = new Set(['clp', 'cop', 'pyg']);

// Hyperinflated / unstable local currencies — never accept as a charge currency.
const BLOCKED_CURRENCIES = new Set(['ves', 'vef', 'ars']);

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
    pen: { price: 'price_1U2omD3x0B891G8VeUOwiLMJ', coupon: 'tm_1w_pen_intro', intro: 1990, regular: 7990 },
    crc: { price: 'price_1U2omF3x0B891G8V8J4qByqY', coupon: 'tm_1w_crc_intro', intro: 270000, regular: 1145000 },
    gtq: { price: 'price_1U2omX3x0B891G8Vf7JczZTP', coupon: 'tm_1w_gtq_intro', intro: 3990, regular: 16990 },
    hnl: { price: 'price_1U2omZ3x0B891G8VnIrlcah6', coupon: 'tm_1w_hnl_intro', intro: 12900, regular: 54900 },
    uyu: { price: 'price_1U2omb3x0B891G8VFGgJv5Lx', coupon: 'tm_1w_uyu_intro', intro: 20900, regular: 87900 },
    bob: { price: 'price_1U2omq3x0B891G8V1BYo1IQR', coupon: 'tm_1w_bob_intro', intro: 3590, regular: 14990 },
    pyg: { price: 'price_1U2oms3x0B891G8VZqzlIEx4', coupon: 'tm_1w_pyg_intro', intro: 39000, regular: 165000 },
  },
  '4w': {
    usd: { price: 'price_1TqChS3x0B891G8VAnNFfhdA', coupon: 'RKIibGD8', intro: 999, regular: 4995 },
    eur: { price: 'price_1U2WY83x0B891G8VLYmhtfgN', coupon: 'tm_4w_eur_intro', intro: 999, regular: 4499 },
    gbp: { price: 'price_1U2WYN3x0B891G8VHqvfjiIf', coupon: 'tm_4w_gbp_intro', intro: 899, regular: 3999 },
    mxn: { price: 'price_1U2WYQ3x0B891G8V2FB05hnj', coupon: 'tm_4w_mxn_intro', intro: 19900, regular: 99900 },
    brl: { price: 'price_1U2WYS3x0B891G8VkOqpp3ww', coupon: 'tm_4w_brl_intro', intro: 5490, regular: 26990 },
    clp: { price: 'price_1U2WYe3x0B891G8VLcx21k80', coupon: 'tm_4w_clp_intro', intro: 9990, regular: 49990 },
    cop: { price: 'price_1U2WYg3x0B891G8VOez9Wp7O', coupon: 'tm_4w_cop_intro', intro: 39900, regular: 199900 },
    pen: { price: 'price_1U2omD3x0B891G8VhG6qfjV4', coupon: 'tm_4w_pen_intro', intro: 3690, regular: 18490 },
    crc: { price: 'price_1U2omF3x0B891G8V9E8Wfb2m', coupon: 'tm_4w_crc_intro', intro: 520000, regular: 2600000 },
    gtq: { price: 'price_1U2omX3x0B891G8V8CPASqvA', coupon: 'tm_4w_gtq_intro', intro: 7990, regular: 38990 },
    hnl: { price: 'price_1U2oma3x0B891G8VSQZn8kGn', coupon: 'tm_4w_hnl_intro', intro: 24900, regular: 124900 },
    uyu: { price: 'price_1U2omc3x0B891G8Vu2E4B8cW', coupon: 'tm_4w_uyu_intro', intro: 39900, regular: 199900 },
    bob: { price: 'price_1U2omr3x0B891G8VD9Ha8oFv', coupon: 'tm_4w_bob_intro', intro: 6990, regular: 34990 },
    pyg: { price: 'price_1U2omt3x0B891G8VzY9OyWO7', coupon: 'tm_4w_pyg_intro', intro: 75000, regular: 375000 },
  },
  '12w': {
    usd: { price: 'price_1TqChT3x0B891G8V0FNT81If', coupon: '3sUP0i8K', intro: 1999, regular: 8495 },
    eur: { price: 'price_1U2WY83x0B891G8VRk6RFCdN', coupon: 'tm_12w_eur_intro', intro: 1999, regular: 7999 },
    gbp: { price: 'price_1U2WYO3x0B891G8V4xZs3PJW', coupon: 'tm_12w_gbp_intro', intro: 1799, regular: 6999 },
    mxn: { price: 'price_1U2WYR3x0B891G8VlNrOg9Fp', coupon: 'tm_12w_mxn_intro', intro: 39900, regular: 169900 },
    brl: { price: 'price_1U2WYT3x0B891G8Vzi3c8N6F', coupon: 'tm_12w_brl_intro', intro: 10990, regular: 45990 },
    clp: { price: 'price_1U2WYe3x0B891G8VkqBiyU5V', coupon: 'tm_12w_clp_intro', intro: 19990, regular: 84990 },
    cop: { price: 'price_1U2WYg3x0B891G8VPWhTY6VJ', coupon: 'tm_12w_cop_intro', intro: 79900, regular: 339900 },
    pen: { price: 'price_1U2omE3x0B891G8Vzkdqk0hL', coupon: 'tm_12w_pen_intro', intro: 7490, regular: 31490 },
    crc: { price: 'price_1U2omG3x0B891G8Vog311KJo', coupon: 'tm_12w_crc_intro', intro: 1040000, regular: 4420000 },
    gtq: { price: 'price_1U2omY3x0B891G8VzLYJqIGr', coupon: 'tm_12w_gtq_intro', intro: 15990, regular: 65990 },
    hnl: { price: 'price_1U2oma3x0B891G8VYRDJHrvh', coupon: 'tm_12w_hnl_intro', intro: 49900, regular: 209900 },
    uyu: { price: 'price_1U2omc3x0B891G8VRtOK8NsL', coupon: 'tm_12w_uyu_intro', intro: 79900, regular: 339900 },
    bob: { price: 'price_1U2omr3x0B891G8VxOaXZLEz', coupon: 'tm_12w_bob_intro', intro: 13990, regular: 58990 },
    pyg: { price: 'price_1U2omt3x0B891G8V8em6zklB', coupon: 'tm_12w_pyg_intro', intro: 150000, regular: 640000 },
  },
};

export type UpsellOffer =
  | { type: 'one_time'; amounts: Record<Currency, number> }
  | { type: 'recurring'; prices: Record<Currency, string> };

const GUIDE = {
  usd: 1899, eur: 1799, gbp: 1599, mxn: 39900, brl: 9990, clp: 18990, cop: 74900,
  pen: 6990, crc: 990000, gtq: 14990, hnl: 46900, uyu: 76900, bob: 12990, pyg: 142000,
} as Record<Currency, number>;

// Funnel post-pay upsells. One-time = ad-hoc PI amount.
export const UPSELLS: Record<string, UpsellOffer> = {
  essential_guides: {
    type: 'one_time',
    amounts: {
      usd: 2599, eur: 2499, gbp: 2299, mxn: 49900, brl: 13990, clp: 24990, cop: 99900,
      pen: 9990, crc: 1350000, gtq: 19990, hnl: 64900, uyu: 104900, bob: 17990, pyg: 195000,
    },
  },
  all_guides: {
    type: 'one_time',
    amounts: {
      usd: 3899, eur: 3799, gbp: 3399, mxn: 79900, brl: 20990, clp: 38990, cop: 159900,
      pen: 14990, crc: 2030000, gtq: 29990, hnl: 96900, uyu: 156900, bob: 26990, pyg: 292000,
    },
  },
  essential_guides_onetime: { type: 'one_time', amounts: { ...GUIDE } },
  guide_sleep: { type: 'one_time', amounts: { ...GUIDE } },
  guide_eating: { type: 'one_time', amounts: { ...GUIDE } },
  guide_aging: { type: 'one_time', amounts: { ...GUIDE } },
  vip: {
    type: 'one_time',
    amounts: {
      usd: 499, eur: 499, gbp: 499, mxn: 9900, brl: 2490, clp: 4990, cop: 19900,
      pen: 1990, crc: 260000, gtq: 3990, hnl: 12900, uyu: 20900, bob: 3490, pyg: 39000,
    },
  },
};

// In-app buy-guides catalog (slightly different from funnel upsells for bundles).
const APP_GUIDE = { ...GUIDE };
const APP_BUNDLE: Record<Currency, number> = {
  usd: 3899, eur: 3799, gbp: 3399, mxn: 79900, brl: 20990, clp: 38990, cop: 159900,
  pen: 14990, crc: 2030000, gtq: 29990, hnl: 96900, uyu: 156900, bob: 26990, pyg: 292000,
};

export const APP_OFFERS: Record<string, { amounts: Record<Currency, number>; grant: string }> = {
  essential_guides: { grant: 'essential_guides', amounts: { ...APP_BUNDLE } },
  all_guides: { grant: 'all_guides', amounts: { ...APP_BUNDLE } },
  'guide_joint-mobility': { grant: 'guide_joint-mobility', amounts: { ...APP_GUIDE } },
  guide_breathing: { grant: 'guide_breathing', amounts: { ...APP_GUIDE } },
  guide_nutrition: { grant: 'guide_nutrition', amounts: { ...APP_GUIDE } },
  guide_desserts: { grant: 'guide_desserts', amounts: { ...APP_GUIDE } },
  guide_sleep: { grant: 'guide_sleep', amounts: { ...APP_GUIDE } },
  guide_eating: { grant: 'guide_eating', amounts: { ...APP_GUIDE } },
  guide_aging: { grant: 'guide_aging', amounts: { ...APP_GUIDE } },
};
