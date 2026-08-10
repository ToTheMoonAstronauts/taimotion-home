/**
 * Cloudflare Pages Function — visitor country from the edge (IP geolocation).
 * GET /api/geo → { country: "DE" }  (ISO 3166-1 alpha-2, or "XX" if unknown)
 *
 * Uses request.cf.country (Cloudflare network) with CF-IPCountry header fallback.
 * No third-party geo API; works only when the site is served through Cloudflare.
 */
export async function onRequestGet(context) {
  const req = context.request;
  const country = (
    (req.cf && req.cf.country) ||
    req.headers.get("CF-IPCountry") ||
    "XX"
  ).toString().toUpperCase();

  return new Response(JSON.stringify({ country }), {
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
