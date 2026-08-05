// Meta Conversions API sender for server-side Purchase and Lead events.
// Fire-and-log: this module must never throw into the payment path.

export interface LeadInput {
  eventId: string;
  emailHash?: string | null;      // already normalized + hashed
  fbc?: string | null;
  clientIp?: string | null;
  clientUserAgent?: string | null;
  eventSourceUrl?: string | null;
  eventTime?: number;             // unix seconds
}

export interface PurchaseInput extends LeadInput {
  value: number;
  currency: string;
}

// Hex SHA-256 of a string (used for email hashing).
export async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0')).join('');
}

// _fbc is `fb.<subdomainIndex>.<creationTime>.<fbclid>` and Meta reads creationTime as UNIX
// MILLISECONDS. We carry click time in SECONDS internally (track.js -> fbclid_t -> here), so the
// unit conversion belongs here, at the Meta boundary. Sending seconds dated every click to
// ~20 Jan 1970, which Events Manager reported as "creationTime is dated before the click ID was
// created" against roughly half of all Purchase events.
// 1e11 separates the two units unambiguously: as seconds it is the year 5138, as ms it is 1973 —
// no real click time can sit on the wrong side of it.
const MS_CUTOFF = 1e11;

function toMillis(t: number): number {
  return Math.round(t < MS_CUTOFF ? t * 1000 : t);
}

// Build the _fbc value from an ad-click id. Null when fbclid is absent.
export function buildFbc(
  fbclid?: string | null,
  clickTimeSec?: number | string | null,
): string | null {
  if (!fbclid) return null;
  const n = typeof clickTimeSec === 'string' ? Number(clickTimeSec) : clickTimeSec;
  const t = (typeof n === 'number' && Number.isFinite(n) && n > 0) ? toMillis(n) : Date.now();
  return `fb.1.${t}.${fbclid}`;
}

// Repair an already-assembled fbc whose creationTime is in seconds. Callers hand us fbc strings
// that were built and stored long before this send — Stripe subscription and PaymentIntent
// metadata (replayed by the webhook, and copied onto every upsell charge) still holds pre-fix
// values. Anything that isn't a recognisable fbc passes through untouched rather than being
// dropped: a malformed fbc is Meta's problem to ignore, a missing one costs us attribution.
export function normalizeFbc(fbc?: string | null): string | null {
  if (!fbc) return null;
  const m = /^(fb\.\d+)\.(\d+)\.(.+)$/.exec(fbc);   // fbclid may itself contain dots
  if (!m) return fbc;
  const t = Number(m[2]);
  if (!Number.isFinite(t) || t <= 0) return fbc;
  return `${m[1]}.${toMillis(t)}.${m[3]}`;
}

// Pure builders for the Graph API request body. No env, no I/O — fully testable.
function buildEventPayload(
  eventName: string,
  input: LeadInput,
  customData: Record<string, unknown> | null,
  testEventCode?: string | null,
): Record<string, unknown> {
  const user_data: Record<string, unknown> = {};
  if (input.emailHash) user_data.em = [input.emailHash];
  if (input.clientIp) user_data.client_ip_address = input.clientIp;
  if (input.clientUserAgent) user_data.client_user_agent = input.clientUserAgent;
  if (input.fbc) user_data.fbc = normalizeFbc(input.fbc);
  const event: Record<string, unknown> = {
    event_name: eventName,
    event_id: input.eventId,
    event_time: input.eventTime ?? Math.floor(Date.now() / 1000),
    action_source: 'website',
    event_source_url: input.eventSourceUrl || 'https://taimotion.com/',
    user_data,
  };
  if (customData) event.custom_data = customData;
  const body: Record<string, unknown> = { data: [event] };
  if (testEventCode) body.test_event_code = testEventCode;
  return body;
}

export function buildPurchasePayload(
  input: PurchaseInput,
  testEventCode?: string | null,
): Record<string, unknown> {
  return buildEventPayload('Purchase', input,
    { value: input.value, currency: input.currency }, testEventCode);
}

// An upsell is an add-on bought by an EXISTING customer, not a new acquisition, so it must not
// use the Purchase event: Meta counts every Purchase, and one buyer taking base + two upsells
// would read as three purchases (inflated conversions, understated cost-per-purchase). Revenue
// still ships in custom_data, so a Custom Conversion on UpsellPurchase reports upsell $ and AOV.
export function buildUpsellPurchasePayload(
  input: PurchaseInput,
  testEventCode?: string | null,
): Record<string, unknown> {
  return buildEventPayload('UpsellPurchase', input,
    { value: input.value, currency: input.currency }, testEventCode);
}

export function buildLeadPayload(
  input: LeadInput,
  testEventCode?: string | null,
): Record<string, unknown> {
  return buildEventPayload('Lead', input, null, testEventCode);
}

interface SendArgs {
  eventId: string; email?: string | null;
  fbc?: string | null; clientIp?: string | null; clientUserAgent?: string | null;
  eventSourceUrl?: string | null; eventTime?: number;
}

// Send an event to Meta. Reads env for credentials; no-ops when unconfigured.
async function sendEvent(
  build: (input: LeadInput, testCode: string | null) => Record<string, unknown>,
  args: SendArgs,
  fetchImpl: typeof fetch,
): Promise<void> {
  try {
    const pixelId = Deno.env.get('META_PIXEL_ID');
    const token = Deno.env.get('META_CAPI_TOKEN');
    if (!pixelId || !token) {
      console.log('[capi] skipped: META_PIXEL_ID/META_CAPI_TOKEN not set');
      return;
    }
    const ver = Deno.env.get('META_API_VERSION') || 'v21.0';
    const testCode = Deno.env.get('META_TEST_EVENT_CODE') || null;
    const emailHash = args.email ? await sha256Hex(args.email.trim().toLowerCase()) : null;
    const { email: _email, ...rest } = args;
    const body = build({ ...rest, emailHash }, testCode);
    const url = `https://graph.facebook.com/${ver}/${pixelId}/events?access_token=${encodeURIComponent(token)}`;
    const r = await fetchImpl(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const txt = await r.text();
    if (!r.ok) console.log(`[capi] non-2xx ${r.status} for ${args.eventId}: ${txt}`);
    else console.log(`[capi] sent ${args.eventId}: ${txt}`);
  } catch (e) {
    console.log(`[capi] error for ${args.eventId}: ${String((e as Error)?.message || e)}`);
  }
}

// Shared plumbing for the money events: threads value/currency onto the chosen payload builder.
function sendValueEvent(
  build: (input: PurchaseInput, testCode: string | null) => Record<string, unknown>,
  args: SendArgs & { value: number; currency: string },
  fetchImpl: typeof fetch,
): Promise<void> {
  return sendEvent(
    (input, testCode) => build({ ...input, value: args.value, currency: args.currency }, testCode),
    args, fetchImpl,
  );
}

export function sendPurchase(
  args: SendArgs & { value: number; currency: string },
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  return sendValueEvent(buildPurchasePayload, args, fetchImpl);
}

export function sendUpsellPurchase(
  args: SendArgs & { value: number; currency: string },
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  return sendValueEvent(buildUpsellPurchasePayload, args, fetchImpl);
}

export function sendLead(
  args: SendArgs,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  return sendEvent(buildLeadPayload, args, fetchImpl);
}
