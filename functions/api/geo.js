/**
 * Cloudflare Pages Function — visitor country from the edge (IP geolocation).
 * GET /api/geo → { country: "DE", force_usd: false }
 *
 * Uses request.cf.country (Cloudflare network) with CF-IPCountry header fallback.
 * force_usd: countries whose local currency we refuse (e.g. VE / VES hyperinflation).
 */
// Keep in sync with assets/currency.js FORCE_USD_COUNTRIES.
const FORCE_USD_COUNTRIES = { VE: true, AR: true };

export async function onRequestGet(context) {
  const req = context.request;
  const country = (
    (req.cf && req.cf.country) ||
    req.headers.get("CF-IPCountry") ||
    "XX"
  ).toString().toUpperCase();

  const body = {
    country,
    force_usd: !!FORCE_USD_COUNTRIES[country],
  };

  return new Response(JSON.stringify(body), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      // Private: country is per-visitor. Short cache avoids hammering on multi-tab.
      "cache-control": "private, max-age=300",
    },
  });
}

// CORS preflight not needed for same-origin; keep OPTIONS harmless.
export async function onRequestOptions() {
  return new Response(null, { status: 204 });
}
