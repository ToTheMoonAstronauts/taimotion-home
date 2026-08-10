/* Multi-currency catalog + detection for the Chair Tai Chi funnel.
 * Amounts are Stripe minor units (cents for 2-decimal currencies; whole pesos for clp/cop).
 * Session field: S.currency ("usd"|"eur"|...).
 *
 * Currency is chosen from the visitor's IP country via Cloudflare (/api/geo),
 * not browser language. ?currency= still overrides for QA.
 */
window.TM_CURRENCY = (function () {
  const CURRENCIES = {
    usd: { decimals: 2, code: "USD" },
    eur: { decimals: 2, code: "EUR" },
    gbp: { decimals: 2, code: "GBP" },
    mxn: { decimals: 2, code: "MXN" },
    brl: { decimals: 2, code: "BRL" },
    clp: { decimals: 0, code: "CLP" },
    cop: { decimals: 0, code: "COP" },
  };
  const DEFAULT = "usd";
  const ALLOWED = Object.keys(CURRENCIES);
  const GEO_CACHE_KEY = "tm_ip_country"; // sessionStorage — per tab/session

  // ISO 3166-1 alpha-2 country (from Cloudflare IP geo) -> currency.
  // Unlisted countries fall through to DEFAULT (usd).
  const REGION = {
    US: "usd", GB: "gbp", MX: "mxn", BR: "brl", CL: "clp", CO: "cop",
    EC: "usd", SV: "usd", PA: "usd", PR: "usd",
    AT: "eur", BE: "eur", CY: "eur", DE: "eur", EE: "eur", ES: "eur",
    FI: "eur", FR: "eur", GR: "eur", HR: "eur", IE: "eur", IT: "eur",
    LT: "eur", LU: "eur", LV: "eur", MT: "eur", NL: "eur", PT: "eur",
    SI: "eur", SK: "eur", AD: "eur", MC: "eur", SM: "eur", VA: "eur",
  };

  // Countries whose local currency we NEVER charge in (hyperinflation / unstable).
  // Always USD — do not add VES/ARS/etc. Stripe Prices for these.
  // VE = Venezuela (VES bolívar). Extend here if another currency goes toxic.
  const FORCE_USD_COUNTRIES = {
    VE: true, // Venezuelan bolívar (VES) — hyperinflated, treat as USD
  };

  // Currency codes we refuse even via ?currency= (defense in depth).
  const BLOCKED_CURRENCIES = { ves: true, vef: true };

  // plan_id -> currency -> { intro, regular, weeks } in minor units
  const PLANS = {
    "1w": {
      usd: { intro: 519, regular: 2199, weeks: 1 },
      eur: { intro: 499, regular: 1999, weeks: 1 },
      gbp: { intro: 499, regular: 1799, weeks: 1 },
      mxn: { intro: 9900, regular: 42900, weeks: 1 },
      brl: { intro: 2990, regular: 11990, weeks: 1 },
      clp: { intro: 4990, regular: 19990, weeks: 1 },
      cop: { intro: 19900, regular: 89900, weeks: 1 },
    },
    "4w": {
      usd: { intro: 999, regular: 4995, weeks: 4 },
      eur: { intro: 999, regular: 4499, weeks: 4 },
      gbp: { intro: 899, regular: 3999, weeks: 4 },
      mxn: { intro: 19900, regular: 99900, weeks: 4 },
      brl: { intro: 5490, regular: 26990, weeks: 4 },
      clp: { intro: 9990, regular: 49990, weeks: 4 },
      cop: { intro: 39900, regular: 199900, weeks: 4 },
    },
    "12w": {
      usd: { intro: 1999, regular: 8495, weeks: 12 },
      eur: { intro: 1999, regular: 7999, weeks: 12 },
      gbp: { intro: 1799, regular: 6999, weeks: 12 },
      mxn: { intro: 39900, regular: 169900, weeks: 12 },
      brl: { intro: 10990, regular: 45990, weeks: 12 },
      clp: { intro: 19990, regular: 84990, weeks: 12 },
      cop: { intro: 79900, regular: 339900, weeks: 12 },
    },
  };

  // One-time upsell amounts (minor). Keys match charge-upsell upsell_id.
  const UPSELLS = {
    essential_guides:         { usd: 2599, eur: 2499, gbp: 2299, mxn: 49900, brl: 13990, clp: 24990, cop: 99900 },
    all_guides:               { usd: 3899, eur: 3799, gbp: 3399, mxn: 79900, brl: 20990, clp: 38990, cop: 159900 },
    essential_guides_onetime: { usd: 1899, eur: 1799, gbp: 1599, mxn: 39900, brl: 9990,  clp: 18990, cop: 74900 },
    guide_sleep:              { usd: 1899, eur: 1799, gbp: 1599, mxn: 39900, brl: 9990,  clp: 18990, cop: 74900 },
    guide_eating:             { usd: 1899, eur: 1799, gbp: 1599, mxn: 39900, brl: 9990,  clp: 18990, cop: 74900 },
    guide_aging:              { usd: 1899, eur: 1799, gbp: 1599, mxn: 39900, brl: 9990,  clp: 18990, cop: 74900 },
    vip:                      { usd: 499,  eur: 499,  gbp: 499,  mxn: 9900,  brl: 2490,  clp: 4990,  cop: 19900 },
  };
  // Display "was" prices for marketing strikethrough (minor).
  const UPSELL_WAS = {
    essential_guides: { usd: 7596, eur: 7496, gbp: 6796, mxn: 149600, brl: 41960, clp: 74960, cop: 299600 },
    all_guides:       { usd: 5697, eur: 5397, gbp: 4797, mxn: 119700, brl: 29970, clp: 56970, cop: 224700 },
    vip:              { usd: 1899, eur: 1799, gbp: 1599, mxn: 39900, brl: 9990, clp: 18990, cop: 74900 },
  };

  function normalize(c) {
    const k = String(c || "").toLowerCase();
    return ALLOWED.includes(k) ? k : DEFAULT;
  }
  function meta(c) { return CURRENCIES[normalize(c)] || CURRENCIES[DEFAULT]; }
  function decimals(c) { return meta(c).decimals; }

  function urlOverride() {
    try {
      const q = new URLSearchParams(location.search).get("currency");
      if (!q) return null;
      const k = q.toLowerCase();
      if (BLOCKED_CURRENCIES[k]) return DEFAULT; // never honour VES etc.
      if (ALLOWED.includes(k)) return k;
    } catch (e) { /* ignore */ }
    return null;
  }

  function currencyFromCountry(cc) {
    if (!cc || cc === "XX" || cc === "T1") return DEFAULT; // T1 = Cloudflare tor/unknown
    const r = String(cc).toUpperCase();
    // Explicit blacklist first — even if REGION later gains an entry by mistake.
    if (FORCE_USD_COUNTRIES[r]) return DEFAULT;
    return REGION[r] || DEFAULT;
  }

  function cachedCountry() {
    try { return sessionStorage.getItem(GEO_CACHE_KEY); } catch (e) { return null; }
  }
  function setCachedCountry(cc) {
    try { if (cc) sessionStorage.setItem(GEO_CACHE_KEY, String(cc).toUpperCase()); } catch (e) { /* ignore */ }
  }

  // Sync detect: URL override → cached IP country → usd.
  // Locale/timezone are intentionally NOT used (IP is source of truth).
  function detect() {
    const forced = urlOverride();
    if (forced) return forced;
    const cc = cachedCountry();
    if (cc) return currencyFromCountry(cc);
    return DEFAULT;
  }

  // Fetch Cloudflare edge country once per tab; cache in sessionStorage.
  let _geoPromise = null;
  function resolveFromIp() {
    const forced = urlOverride();
    if (forced) return Promise.resolve(forced);

    const cc = cachedCountry();
    if (cc) return Promise.resolve(currencyFromCountry(cc));

    if (_geoPromise) return _geoPromise;
    _geoPromise = fetch("/api/geo", { credentials: "same-origin" })
      .then(function (r) { return r.ok ? r.json() : { country: "XX" }; })
      .then(function (data) {
        const country = (data && data.country) ? String(data.country).toUpperCase() : "XX";
        setCachedCountry(country);
        return currencyFromCountry(country);
      })
      .catch(function () { return DEFAULT; });
    return _geoPromise;
  }

  // Apply IP currency onto a session. Honours ?currency= and leaves paid sessions alone.
  function applyFromIp(session) {
    if (!session) return resolveFromIp();
    const forced = urlOverride();
    if (forced) {
      session.currency = forced;
      session.currency_source = "url";
      return Promise.resolve(forced);
    }
    if (session.status === "paid" || session.paid) {
      return Promise.resolve(normalize(session.currency || DEFAULT));
    }
    return resolveFromIp().then(function (c) {
      session.currency = c;
      session.currency_source = "ip";
      return c;
    });
  }

  // Format Stripe minor units for display. Uses Intl when available.
  function format(minor, currency) {
    const c = normalize(currency);
    const d = decimals(c);
    const n = Number(minor) || 0;
    const major = d === 0 ? n : n / Math.pow(10, d);
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency", currency: meta(c).code,
        minimumFractionDigits: d, maximumFractionDigits: d,
      }).format(major);
    } catch (e) {
      return meta(c).code + " " + (d === 0 ? String(n) : major.toFixed(d));
    }
  }

  // Major units for analytics / order summary (not for Stripe APIs).
  function toMajor(minor, currency) {
    const d = decimals(currency);
    const n = Number(minor) || 0;
    return d === 0 ? n : n / Math.pow(10, d);
  }

  function plan(planId, currency) {
    const c = normalize(currency);
    const row = (PLANS[planId] && PLANS[planId][c]) || (PLANS[planId] && PLANS[planId][DEFAULT]) || PLANS["4w"][DEFAULT];
    const days = (row.weeks || 1) * 7;
    const perday = Math.round(row.intro / days); // minor units per day, rounded
    return {
      id: planId,
      intro: row.intro,
      regular: row.regular,
      weeks: row.weeks,
      perday: perday,
      name: planId === "1w" ? "1-week plan" : planId === "12w" ? "12-week plan" : "4-week plan",
    };
  }

  function planCards(currency) {
    return ["1w", "4w", "12w"].map((id) => {
      const p = plan(id, currency);
      return {
        id: p.id,
        name: p.name,
        old: format(p.regular, currency),
        intro: format(p.intro, currency),
        perday: format(p.perday, currency),
        popular: id === "4w",
        introMinor: p.intro,
        regularMinor: p.regular,
      };
    });
  }

  function upsellMinor(upsellId, currency) {
    const c = normalize(currency);
    const row = UPSELLS[upsellId];
    if (!row) return null;
    return row[c] != null ? row[c] : row[DEFAULT];
  }
  function upsellWasMinor(upsellId, currency) {
    const c = normalize(currency);
    const row = UPSELL_WAS[upsellId];
    if (!row) return null;
    return row[c] != null ? row[c] : row[DEFAULT];
  }

  // Sync attach (uses IP cache if already fetched). Prefer ensureAsync / applyFromIp on paywall.
  function ensure(session) {
    if (!session) return DEFAULT;
    const forced = urlOverride();
    if (forced) {
      session.currency = forced;
      session.currency_source = "url";
      return forced;
    }
    if (!session.currency || !ALLOWED.includes(session.currency)) {
      session.currency = detect();
      if (!session.currency_source) session.currency_source = cachedCountry() ? "ip" : "default";
    }
    return session.currency;
  }

  // Async ensure: waits for /api/geo when cache is cold. Use on checkout/pay.
  function ensureAsync(session) {
    return applyFromIp(session || {});
  }

  // Kick off geo early so quiz → checkout usually has cache warm.
  resolveFromIp();

  return {
    DEFAULT, ALLOWED, CURRENCIES, PLANS, UPSELLS, REGION,
    FORCE_USD_COUNTRIES, BLOCKED_CURRENCIES,
    normalize, detect, ensure, ensureAsync, applyFromIp, resolveFromIp,
    currencyFromCountry, decimals, format, toMajor,
    plan, planCards, upsellMinor, upsellWasMinor, meta,
  };
})();
