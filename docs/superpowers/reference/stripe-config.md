# Stripe Config — Tai Motion (TEST / sandbox)

Created 2026-07-06 via Stripe API (test mode). Secrets (`sk_test`, `whsec`) are NOT stored here — they live only in Supabase function secrets.

## Base plans (Product → recurring Price → one-time intro Coupon)
| Plan | Product | Price (regular) | Coupon (intro once) | First charge → renewal |
|------|---------|-----------------|---------------------|------------------------|
| 1w  | prod_UpmIsciIjAtK8Q | price_1Tq6jrEKxtNHIkyECsS78Flp | pkEtKPXU | $5.19 → $21.99 / week |
| 4w  | prod_UpmIlaaQvnkkuC | price_1Tq6jsEKxtNHIkyEephY6ycG | BBjhT92G | $9.99 → $49.95 / 4 weeks |
| 12w | prod_UpmI1v856lWsNt | price_1Tq6jtEKxtNHIkyE2LbKbfuk | vgeoGVPv | $19.99 → $84.95 / 12 weeks |

## Webhook endpoint
- id: `we_1Tq6loEKxtNHIkyEZVeIgR3Y`  → `https://pixtozeghxwiidpnloih.supabase.co/functions/v1/stripe-webhook`
- events: invoice.paid, customer.subscription.updated, customer.subscription.deleted, payment_intent.succeeded

## Publishable key (safe in frontend — Plan 3 config.js)
`pk_test_51Tq6eVEKxtNHIkyEH26s3Yb09P17pwsgrnl3e8ylSrOGhv2ODsw4mVh2IU3Nycl2vSY9afNCWSD0QHJubdo64Fos00roD8Yf2g`

## Deployed edge functions
- create-subscription (verify_jwt=true) — base checkout
- stripe-webhook (verify_jwt=false) — provisioning source of truth
- charge-upsell — PENDING recurring-upsell model decision (one-time part ready)

## Upsells
- One-time (no Stripe object needed; ad-hoc PaymentIntent): essential_guides_onetime $9.99, guide_sleep/eating/aging $18.99, vip $4.99
- Recurring (needs decision — see plan): essential_guides ("$1.25/day"), all_guides ($38.99)

---

## LIVE mode (acct_1TpRX53x0B891G8V — Lithuania/EUR, charges in USD) — 2026-07-06

| Plan | Price (regular) | Coupon (intro once) |
|------|-----------------|---------------------|
| 1w  | price_1TqChQ3x0B891G8VXfVhEwZ3 | fLsSa51J ($5.19) |
| 4w  | price_1TqChS3x0B891G8VAnNFfhdA | RKIibGD8 ($9.99) |
| 12w | price_1TqChT3x0B891G8V0FNT81If | 3sUP0i8K ($19.99) |

Upsell recurring: essential_guides `price_1TqChU3x0B891G8VCfW94Ywx` ($9.99/mo), all_guides `price_1TqChV3x0B891G8VV8xoImBl` ($19.99/mo).
Webhook: `we_1TqCiK3x0B891G8Vp5SN1kG8` → stripe-webhook (5 events).
Publishable (live): pk_live_51TpRX5…ckMJziF1 (in assets/stripe.js).
Secrets to set in Supabase for go-live: STRIPE_SECRET_KEY=sk_live_…, STRIPE_WEBHOOK_SECRET=whsec_2gKW1g… (live endpoint).

### Promo codes (live)
- `TMTEST50` → coupon `YrTxIPDR` (amount_off $20.99, once) = **1-week plan at $1.00** for testing. (Note: $0.50 was below the EUR-account minimum charge, so it's $1.00.) max_redemptions 50.
- create-subscription accepts `promo_code`; resolves the active Stripe promotion code to its coupon and applies it (replaces the intro coupon). Returns `amount` (cents) for the UI.

---

## LIVE multi-currency (2026-08-09)

Account: `acct_1TpRX53x0B891G8V` (Taimotion). Fixed price table (not FX).  
Currencies: **usd, eur, gbp, mxn, brl, clp, cop**.  
Zero-decimal: **clp, cop** (amounts are whole pesos — do not ×100).  
Lookup keys: `tm_{plan}_{currency}` (plans), `tm_essential_{currency}`, `tm_allguides_{currency}`.  
Intro coupons: id `tm_{plan}_{currency}_intro` (except USD, which keeps legacy coupon ids).

### Products (shared across currencies)
| Plan / product | Product id |
|----------------|------------|
| 1w | `prod_UpsS4V6XVEFGzL` |
| 4w | `prod_UpsSUOoe60Hi4X` |
| 12w | `prod_UpsSuVtnUlPD0Y` |
| Essential Guides (recurring add-on) | `prod_UpsSGiclJHDz3G` |
| All Guides (recurring add-on) | `prod_UpsSc7XRHIz4Rr` |
| Test onboarding $2/wk | `prod_UrI86zaZNAKX5c` → `price_1TrZZ53x0B891G8VBXmnt6vP` (USD only) |

### Base plans — Price (regular) + intro coupon

Display: **intro → regular** (first charge → renewal).

#### USD (legacy — unchanged)
| Plan | Price | Coupon | Intro → regular |
|------|-------|--------|-----------------|
| 1w | `price_1TqChQ3x0B891G8VXfVhEwZ3` | `fLsSa51J` | $5.19 → $21.99 |
| 4w | `price_1TqChS3x0B891G8VAnNFfhdA` | `RKIibGD8` | $9.99 → $49.95 |
| 12w | `price_1TqChT3x0B891G8V0FNT81If` | `3sUP0i8K` | $19.99 → $84.95 |

#### EUR
| Plan | Price | Coupon | Intro → regular |
|------|-------|--------|-----------------|
| 1w | `price_1U2WY73x0B891G8VN1D0G7In` (`tm_1w_eur`) | `tm_1w_eur_intro` | €4.99 → €19.99 |
| 4w | `price_1U2WY83x0B891G8VLYmhtfgN` (`tm_4w_eur`) | `tm_4w_eur_intro` | €9.99 → €44.99 |
| 12w | `price_1U2WY83x0B891G8VRk6RFCdN` (`tm_12w_eur`) | `tm_12w_eur_intro` | €19.99 → €79.99 |

#### GBP
| Plan | Price | Coupon | Intro → regular |
|------|-------|--------|-----------------|
| 1w | `price_1U2WYM3x0B891G8V4SmCluml` (`tm_1w_gbp`) | `tm_1w_gbp_intro` | £4.99 → £17.99 |
| 4w | `price_1U2WYN3x0B891G8VHqvfjiIf` (`tm_4w_gbp`) | `tm_4w_gbp_intro` | £8.99 → £39.99 |
| 12w | `price_1U2WYO3x0B891G8V4xZs3PJW` (`tm_12w_gbp`) | `tm_12w_gbp_intro` | £17.99 → £69.99 |

#### MXN
| Plan | Price | Coupon | Intro → regular |
|------|-------|--------|-----------------|
| 1w | `price_1U2WYP3x0B891G8VURfPkg3i` (`tm_1w_mxn`) | `tm_1w_mxn_intro` | MX$99 → MX$429 |
| 4w | `price_1U2WYQ3x0B891G8V2FB05hnj` (`tm_4w_mxn`) | `tm_4w_mxn_intro` | MX$199 → MX$999 |
| 12w | `price_1U2WYR3x0B891G8VlNrOg9Fp` (`tm_12w_mxn`) | `tm_12w_mxn_intro` | MX$399 → MX$1,699 |

#### BRL
| Plan | Price | Coupon | Intro → regular |
|------|-------|--------|-----------------|
| 1w | `price_1U2WYR3x0B891G8Voa8pyQxD` (`tm_1w_brl`) | `tm_1w_brl_intro` | R$29.90 → R$119.90 |
| 4w | `price_1U2WYS3x0B891G8VkOqpp3ww` (`tm_4w_brl`) | `tm_4w_brl_intro` | R$54.90 → R$269.90 |
| 12w | `price_1U2WYT3x0B891G8Vzi3c8N6F` (`tm_12w_brl`) | `tm_12w_brl_intro` | R$109.90 → R$459.90 |

#### CLP (zero-decimal)
| Plan | Price | Coupon | Intro → regular |
|------|-------|--------|-----------------|
| 1w | `price_1U2WYd3x0B891G8VeuCAXIr0` (`tm_1w_clp`) | `tm_1w_clp_intro` | CLP 4,990 → 19,990 |
| 4w | `price_1U2WYe3x0B891G8VLcx21k80` (`tm_4w_clp`) | `tm_4w_clp_intro` | CLP 9,990 → 49,990 |
| 12w | `price_1U2WYe3x0B891G8VkqBiyU5V` (`tm_12w_clp`) | `tm_12w_clp_intro` | CLP 19,990 → 84,990 |

#### COP (zero-decimal)
| Plan | Price | Coupon | Intro → regular |
|------|-------|--------|-----------------|
| 1w | `price_1U2WYf3x0B891G8VbaDxLSN3` (`tm_1w_cop`) | `tm_1w_cop_intro` | COP 19,900 → 89,900 |
| 4w | `price_1U2WYg3x0B891G8VOez9Wp7O` (`tm_4w_cop`) | `tm_4w_cop_intro` | COP 39,900 → 199,900 |
| 12w | `price_1U2WYg3x0B891G8VPWhTY6VJ` (`tm_12w_cop`) | `tm_12w_cop_intro` | COP 79,900 → 339,900 |

### Recurring upsell Prices (monthly)

| Upsell | USD | EUR | GBP | MXN | BRL | CLP | COP |
|--------|-----|-----|-----|-----|-----|-----|-----|
| essential_guides | `price_1TqChU3x0B891G8VCfW94Ywx` $9.99 | `price_1U2WZg3x0B891G8VSS2KZG76` €9.99 | `price_1U2WZi3x0B891G8VWonZEreA` £8.99 | `price_1U2WZj3x0B891G8VGOZB3mwZ` MX$199 | `price_1U2WZl3x0B891G8Vad84Z9cA` R$54.90 | `price_1U2WZn3x0B891G8VdoPQbDJg` 9990 | `price_1U2WZo3x0B891G8Vlb8syssu` 39900 |
| all_guides | `price_1TqChV3x0B891G8VV8xoImBl` $19.99 | `price_1U2WZh3x0B891G8VmuHMkKpz` €19.99 | `price_1U2WZi3x0B891G8VZbxfuEVm` £17.99 | `price_1U2WZk3x0B891G8VXDwVkNzs` MX$399 | `price_1U2WZm3x0B891G8VAAx02Fim` R$109.90 | `price_1U2WZn3x0B891G8V7kUHhTQy` 19990 | `price_1U2WZp3x0B891G8VrbGL5vvs` 79900 |

### One-time upsell amounts (minor units — ad-hoc PaymentIntent, no Price object)

| Offer | USD | EUR | GBP | MXN | BRL | CLP | COP |
|-------|-----|-----|-----|-----|-----|-----|-----|
| essential_guides (bulk) | 2599 | 2499 | 2299 | 49900 | 13990 | 24990 | 99900 |
| all_guides (bulk) | 3899 | 3799 | 3399 | 79900 | 20990 | 38990 | 159900 |
| essential_guides_onetime / guide_* | 1899 | 1799 | 1599 | 39900 | 9990 | 18990 | 74900 |
| vip | 499 | 499 | 499 | 9900 | 2490 | 4990 | 19900 |

### Display amounts (intro / regular) for client catalog

| Plan | Field | USD | EUR | GBP | MXN | BRL | CLP | COP |
|------|-------|-----|-----|-----|-----|-----|-----|-----|
| 1w | intro | 5.19 | 4.99 | 4.99 | 99 | 29.90 | 4990 | 19900 |
| 1w | regular | 21.99 | 19.99 | 17.99 | 429 | 119.90 | 19990 | 89900 |
| 4w | intro | 9.99 | 9.99 | 8.99 | 199 | 54.90 | 9990 | 39900 |
| 4w | regular | 49.95 | 44.99 | 39.99 | 999 | 269.90 | 49990 | 199900 |
| 12w | intro | 19.99 | 19.99 | 17.99 | 399 | 109.90 | 19990 | 79900 |
| 12w | regular | 84.95 | 79.99 | 69.99 | 1699 | 459.90 | 84990 | 339900 |

### Server map shape (create-subscription)

```
PLANS[plan_id][currency] = { price: 'price_…', coupon: '…' }
// USD coupon ids stay fLsSa51J / RKIibGD8 / 3sUP0i8K
// other currencies: tm_{plan}_{currency}_intro
```

Currency detection (client, session-level, like units): locale region → currency; `?currency=` override; default `usd`.  
CLP/COP: format with 0 fraction digits; all money APIs use minor units as Stripe defines them.

---

## LATAM ads geo expansion (2026-08-10)

Added live Prices + intro coupons for: **pen, crc, gtq, hnl, uyu, bob, pyg**.
Country map covers Meta ads inclusion set:

| Currency | Countries |
|----------|-----------|
| USD | US, EC, PA, PR, SV, **VE**, **AR** (forced), default |
| MXN | MX |
| CLP | CL |
| COP | CO |
| PEN | PE |
| CRC | CR |
| GTQ | GT |
| HNL | HN |
| UYU | UY |
| BOB | BO |
| PYG | PY (zero-decimal) |
| EUR/GBP/BRL | existing |

Lookup keys: `tm_{plan}_{currency}` / coupons `tm_{plan}_{currency}_intro`.
See `supabase/functions/_shared/currency.ts` for price IDs.
