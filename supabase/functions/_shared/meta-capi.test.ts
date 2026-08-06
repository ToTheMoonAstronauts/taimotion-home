import { assertEquals, assert } from 'jsr:@std/assert@1';
import { sha256Hex, buildFbc, normalizeFbc, buildPurchasePayload, buildLeadPayload, buildUpsellPurchasePayload, sendPurchase, sendLead, sendUpsellPurchase } from './meta-capi.ts';

Deno.test('buildLeadPayload assembles a Lead event without custom_data', () => {
  const body = buildLeadPayload({
    eventId: 'lead_abc', emailHash: 'HASH', fbc: 'fb.1.1700000000000.X',
    clientIp: '1.2.3.4', clientUserAgent: 'UA',
    eventSourceUrl: 'https://taimotion.com/quiz.html', eventTime: 1700000001,
  });
  const ev = (body.data as any[])[0];
  assertEquals(ev.event_name, 'Lead');
  assertEquals(ev.event_id, 'lead_abc');
  assertEquals(ev.event_time, 1700000001);
  assertEquals(ev.action_source, 'website');
  assertEquals(ev.event_source_url, 'https://taimotion.com/quiz.html');
  assertEquals(ev.user_data.em, ['HASH']);
  assertEquals(ev.user_data.client_ip_address, '1.2.3.4');
  assertEquals(ev.user_data.client_user_agent, 'UA');
  assertEquals(ev.user_data.fbc, 'fb.1.1700000000000.X');
  assert(!('custom_data' in ev));
  assert(!('test_event_code' in body));
});

Deno.test('buildLeadPayload includes test_event_code and defaults the source url', () => {
  const body = buildLeadPayload({ eventId: 'lead_1' }, 'TEST123');
  const ev = (body.data as any[])[0];
  assertEquals(body.test_event_code, 'TEST123');
  assertEquals(ev.user_data, {});
  assertEquals(ev.event_source_url, 'https://taimotion.com/');
});

Deno.test('sendLead no-ops (no fetch) when credentials are missing', async () => {
  const prevPixel = Deno.env.get('META_PIXEL_ID');
  const prevToken = Deno.env.get('META_CAPI_TOKEN');
  Deno.env.delete('META_PIXEL_ID');
  Deno.env.delete('META_CAPI_TOKEN');
  try {
    let called = false;
    const fake: typeof fetch = async () => { called = true; return new Response('{}'); };
    await sendLead({ eventId: 'lead_1', email: 'a@b.com' }, fake);
    assertEquals(called, false);
  } finally {
    if (prevPixel === undefined) Deno.env.delete('META_PIXEL_ID'); else Deno.env.set('META_PIXEL_ID', prevPixel);
    if (prevToken === undefined) Deno.env.delete('META_CAPI_TOKEN'); else Deno.env.set('META_CAPI_TOKEN', prevToken);
  }
});

Deno.test('sha256Hex matches the known SHA-256("abc") vector', async () => {
  assertEquals(await sha256Hex('abc'),
    'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
});

// Meta's creationTime is UNIX MILLISECONDS. Emitting the click time in seconds made every
// click read as ~20 Jan 1970, which Events Manager reported as "creationTime is dated before
// the click ID was created" across ~half of all Purchase events.
Deno.test('buildFbc emits creationTime in milliseconds and returns null without fbclid', () => {
  assertEquals(buildFbc('AbC123', 1700000000), 'fb.1.1700000000000.AbC123');
  assertEquals(buildFbc('AbC123', '1700000000'), 'fb.1.1700000000000.AbC123');
  assertEquals(buildFbc(null, 1700000000), null);
  assertEquals(buildFbc('', 1700000000), null);
});

Deno.test('buildFbc passes a click time that is already in milliseconds through unchanged', () => {
  assertEquals(buildFbc('AbC123', 1700000000000), 'fb.1.1700000000000.AbC123');
  assertEquals(buildFbc('AbC123', '1700000000000'), 'fb.1.1700000000000.AbC123');
});

Deno.test('buildFbc falls back to now, in milliseconds, when the click time is unusable', () => {
  for (const bad of [undefined, null, 0, NaN, 'not-a-number']) {
    const fbc = buildFbc('AbC123', bad as number | string | null | undefined)!;
    const t = Number(fbc.split('.')[2]);
    assert(t > 1.7e12 && t < 1e13, `expected a ms timestamp, got ${t} from ${fbc}`);
  }
});

// Pre-fix fbc strings are baked into live Stripe subscription / PaymentIntent metadata and get
// replayed by the webhook (and copied onto upsells), so repair them at the send boundary too.
Deno.test('normalizeFbc upgrades a seconds creationTime and leaves a valid one alone', () => {
  assertEquals(normalizeFbc('fb.1.1700000000.AbC123'), 'fb.1.1700000000000.AbC123');
  assertEquals(normalizeFbc('fb.1.1700000000000.AbC123'), 'fb.1.1700000000000.AbC123');
  assertEquals(normalizeFbc('fb.2.1700000000.AbC.123'), 'fb.2.1700000000000.AbC.123'); // dots in id
  assertEquals(normalizeFbc(null), null);
  assertEquals(normalizeFbc('garbage'), 'garbage');   // unknown shape passes through untouched
});

Deno.test('payload builders repair a seconds-based fbc supplied by a caller', () => {
  const lead = (buildLeadPayload({ eventId: 'lead_1', fbc: 'fb.1.1700000000.X' })
    .data as any[])[0];
  assertEquals(lead.user_data.fbc, 'fb.1.1700000000000.X');
  const purchase = (buildPurchasePayload(
    { eventId: 'in_1', value: 1, currency: 'usd', fbc: 'fb.1.1700000000.X' }).data as any[])[0];
  assertEquals(purchase.user_data.fbc, 'fb.1.1700000000000.X');
  const upsell = (buildUpsellPurchasePayload(
    { eventId: 'pi_1', value: 1, currency: 'usd', fbc: 'fb.1.1700000000.X' }).data as any[])[0];
  assertEquals(upsell.user_data.fbc, 'fb.1.1700000000000.X');
});

Deno.test('buildPurchasePayload assembles the event and omits empty user_data fields', () => {
  const body = buildPurchasePayload({
    eventId: 'in_123', emailHash: 'HASH', value: 5.19, currency: 'usd',
    fbc: 'fb.1.1700000000000.X', clientIp: '1.2.3.4', clientUserAgent: 'UA',
    eventSourceUrl: 'https://taimotion.com/pay.html', eventTime: 1700000001,
  });
  const ev = (body.data as any[])[0];
  assertEquals(ev.event_name, 'Purchase');
  assertEquals(ev.event_id, 'in_123');
  assertEquals(ev.event_time, 1700000001);
  assertEquals(ev.action_source, 'website');
  assertEquals(ev.event_source_url, 'https://taimotion.com/pay.html');
  assertEquals(ev.user_data.em, ['HASH']);
  assertEquals(ev.user_data.client_ip_address, '1.2.3.4');
  assertEquals(ev.user_data.client_user_agent, 'UA');
  assertEquals(ev.user_data.fbc, 'fb.1.1700000000000.X');
  assertEquals(ev.custom_data, { value: 5.19, currency: 'usd' });
  assert(!('test_event_code' in body));
});

Deno.test('buildPurchasePayload includes test_event_code when provided and drops empty fields', () => {
  const body = buildPurchasePayload(
    { eventId: 'pi_1', value: 9.99, currency: 'usd' }, 'TEST123');
  const ev = (body.data as any[])[0];
  assertEquals(body.test_event_code, 'TEST123');
  assertEquals(ev.user_data, {});             // no email/ip/ua/fbc supplied
  assertEquals(ev.event_source_url, 'https://taimotion.com/');
});

Deno.test('sendPurchase no-ops (no fetch) when credentials are missing', async () => {
  const prevPixel = Deno.env.get('META_PIXEL_ID');
  const prevToken = Deno.env.get('META_CAPI_TOKEN');
  Deno.env.delete('META_PIXEL_ID');
  Deno.env.delete('META_CAPI_TOKEN');
  try {
    let called = false;
    const fake: typeof fetch = async () => { called = true; return new Response('{}'); };
    await sendPurchase({ eventId: 'in_1', email: 'a@b.com', value: 1, currency: 'usd' }, fake);
    assertEquals(called, false);
  } finally {
    if (prevPixel === undefined) Deno.env.delete('META_PIXEL_ID'); else Deno.env.set('META_PIXEL_ID', prevPixel);
    if (prevToken === undefined) Deno.env.delete('META_CAPI_TOKEN'); else Deno.env.set('META_CAPI_TOKEN', prevToken);
  }
});

Deno.test('sendPurchase posts to the graph endpoint with a hashed email', async () => {
  const prevPixel = Deno.env.get('META_PIXEL_ID');
  const prevToken = Deno.env.get('META_CAPI_TOKEN');
  const prevTestCode = Deno.env.get('META_TEST_EVENT_CODE');
  Deno.env.set('META_PIXEL_ID', '999');
  Deno.env.set('META_CAPI_TOKEN', 'tok');
  Deno.env.delete('META_TEST_EVENT_CODE');
  try {
    let seenUrl = ''; let seenBody: any = null;
    const fake: typeof fetch = async (url, init) => {
      seenUrl = String(url); seenBody = JSON.parse(String((init as RequestInit).body));
      return new Response('{"events_received":1}', { status: 200 });
    };
    await sendPurchase({ eventId: 'in_9', email: 'Test@Example.com', value: 5.19, currency: 'usd' }, fake);
    assert(seenUrl.includes('/v21.0/999/events'));
    assert(seenUrl.includes('access_token=tok'));
    const em = seenBody.data[0].user_data.em[0];
    assertEquals(em, await sha256Hex('test@example.com'));   // normalized + hashed
  } finally {
    if (prevPixel === undefined) Deno.env.delete('META_PIXEL_ID'); else Deno.env.set('META_PIXEL_ID', prevPixel);
    if (prevToken === undefined) Deno.env.delete('META_CAPI_TOKEN'); else Deno.env.set('META_CAPI_TOKEN', prevToken);
    if (prevTestCode === undefined) Deno.env.delete('META_TEST_EVENT_CODE'); else Deno.env.set('META_TEST_EVENT_CODE', prevTestCode);
  }
});

// Upsells are NOT acquisitions: they must never land on the Purchase event, or Ads Manager
// counts one customer as two-to-four purchases and cost-per-purchase reads low.
Deno.test('buildUpsellPurchasePayload uses the UpsellPurchase event name, not Purchase', () => {
  const body = buildUpsellPurchasePayload({
    eventId: 'pi_up1', emailHash: 'HASH', value: 25.99, currency: 'usd',
    eventSourceUrl: 'https://taimotion.com/upsell1.html', eventTime: 1700000001,
  });
  const ev = (body.data as any[])[0];
  assertEquals(ev.event_name, 'UpsellPurchase');
  assertEquals(ev.event_id, 'pi_up1');
  assertEquals(ev.action_source, 'website');
  assertEquals(ev.event_source_url, 'https://taimotion.com/upsell1.html');
  assertEquals(ev.user_data.em, ['HASH']);
  assertEquals(ev.custom_data, { value: 25.99, currency: 'usd' });   // revenue still reported
});

Deno.test('sendUpsellPurchase posts an UpsellPurchase event with a hashed email', async () => {
  const prevPixel = Deno.env.get('META_PIXEL_ID');
  const prevToken = Deno.env.get('META_CAPI_TOKEN');
  const prevTestCode = Deno.env.get('META_TEST_EVENT_CODE');
  Deno.env.set('META_PIXEL_ID', '999');
  Deno.env.set('META_CAPI_TOKEN', 'tok');
  Deno.env.delete('META_TEST_EVENT_CODE');
  try {
    let seenBody: any = null;
    const fake: typeof fetch = async (_url, init) => {
      seenBody = JSON.parse(String((init as RequestInit).body));
      return new Response('{"events_received":1}', { status: 200 });
    };
    await sendUpsellPurchase({ eventId: 'pi_up9', email: 'Test@Example.com', value: 25.99, currency: 'usd' }, fake);
    assertEquals(seenBody.data[0].event_name, 'UpsellPurchase');
    assertEquals(seenBody.data[0].custom_data, { value: 25.99, currency: 'usd' });
    assertEquals(seenBody.data[0].user_data.em[0], await sha256Hex('test@example.com'));
  } finally {
    if (prevPixel === undefined) Deno.env.delete('META_PIXEL_ID'); else Deno.env.set('META_PIXEL_ID', prevPixel);
    if (prevToken === undefined) Deno.env.delete('META_CAPI_TOKEN'); else Deno.env.set('META_CAPI_TOKEN', prevToken);
    if (prevTestCode === undefined) Deno.env.delete('META_TEST_EVENT_CODE'); else Deno.env.set('META_TEST_EVENT_CODE', prevTestCode);
  }
});

Deno.test('sendUpsellPurchase no-ops (no fetch) when credentials are missing', async () => {
  const prevPixel = Deno.env.get('META_PIXEL_ID');
  const prevToken = Deno.env.get('META_CAPI_TOKEN');
  Deno.env.delete('META_PIXEL_ID');
  Deno.env.delete('META_CAPI_TOKEN');
  try {
    let called = false;
    const fake: typeof fetch = async () => { called = true; return new Response('{}'); };
    await sendUpsellPurchase({ eventId: 'pi_up1', email: 'a@b.com', value: 25.99, currency: 'usd' }, fake);
    assertEquals(called, false);
  } finally {
    if (prevPixel === undefined) Deno.env.delete('META_PIXEL_ID'); else Deno.env.set('META_PIXEL_ID', prevPixel);
    if (prevToken === undefined) Deno.env.delete('META_CAPI_TOKEN'); else Deno.env.set('META_CAPI_TOKEN', prevToken);
  }
});

Deno.test('sendPurchase uses META_API_VERSION override in the graph URL', async () => {
  const prevPixel = Deno.env.get('META_PIXEL_ID');
  const prevToken = Deno.env.get('META_CAPI_TOKEN');
  const prevVer = Deno.env.get('META_API_VERSION');
  Deno.env.set('META_PIXEL_ID', '999');
  Deno.env.set('META_CAPI_TOKEN', 'tok');
  Deno.env.set('META_API_VERSION', 'v18.0');
  try {
    let seenUrl = '';
    const fake: typeof fetch = async (url) => {
      seenUrl = String(url);
      return new Response('{"events_received":1}', { status: 200 });
    };
    await sendPurchase({ eventId: 'in_18', email: 'a@b.com', value: 1, currency: 'usd' }, fake);
    assert(seenUrl.includes('/v18.0/'));
  } finally {
    if (prevPixel === undefined) Deno.env.delete('META_PIXEL_ID'); else Deno.env.set('META_PIXEL_ID', prevPixel);
    if (prevToken === undefined) Deno.env.delete('META_CAPI_TOKEN'); else Deno.env.set('META_CAPI_TOKEN', prevToken);
    if (prevVer === undefined) Deno.env.delete('META_API_VERSION'); else Deno.env.set('META_API_VERSION', prevVer);
  }
});
