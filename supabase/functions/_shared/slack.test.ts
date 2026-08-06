import { assert, assertEquals } from 'jsr:@std/assert@1';
import {
  fmtAccountCreated, fmtCancelScheduled, fmtNewLead, fmtPaymentFailed, fmtRefund,
  fmtSubscriptionEnded, fmtSubscriptionPaid, fmtUpsellPaid, notifySlack, phReplayLink,
} from './slack.ts';

// The Slack mrkdwn suffix every email-bearing alert now carries, spelled out once so a
// change to the link format fails loudly in one place instead of silently everywhere.
const REPLAY =
  ' — <https://us.posthog.com/project/525048/person/a%40b.com#activeTab=sessionRecordings|▶︎ Watch replay>';

Deno.test('notifySlack no-ops (no fetch) when SLACK_WEBHOOK_URL is unset', async () => {
  const prev = Deno.env.get('SLACK_WEBHOOK_URL');
  Deno.env.delete('SLACK_WEBHOOK_URL');
  try {
    let called = false;
    const fake: typeof fetch = async () => { called = true; return new Response('ok'); };
    await notifySlack('hello', fake);
    assertEquals(called, false);
  } finally {
    if (prev === undefined) Deno.env.delete('SLACK_WEBHOOK_URL'); else Deno.env.set('SLACK_WEBHOOK_URL', prev);
  }
});

Deno.test('notifySlack posts {text} JSON and swallows fetch failures', async () => {
  const prev = Deno.env.get('SLACK_WEBHOOK_URL');
  Deno.env.set('SLACK_WEBHOOK_URL', 'https://hooks.slack.com/services/T/B/x');
  try {
    let seenBody: unknown = null;
    const ok: typeof fetch = async (_url, init) => { seenBody = JSON.parse(String((init as RequestInit).body)); return new Response('ok'); };
    await notifySlack('hi there', ok);
    assertEquals(seenBody, { text: 'hi there' });
    const boom: typeof fetch = () => { throw new Error('network down'); };
    await notifySlack('must not throw', boom); // swallowing = not throwing here
  } finally {
    if (prev === undefined) Deno.env.delete('SLACK_WEBHOOK_URL'); else Deno.env.set('SLACK_WEBHOOK_URL', prev);
  }
});

Deno.test('money/churn formatters match the established channel format', () => {
  assertEquals(fmtSubscriptionPaid('initial', 'a@b.com', 519, 'usd', false),
    ':moneybag: *New subscription* — a@b.com — $5.19 USD');
  assertEquals(fmtSubscriptionPaid('renewal', 'a@b.com', 2199, 'usd', true),
    ':moneybag: *Renewal* — a@b.com — $21.99 USD _(test)_');
  assertEquals(fmtUpsellPaid('all_guides', 'a@b.com', 3899, 'usd', false),
    ':heavy_plus_sign: *Upsell:* all_guides — a@b.com — $38.99 USD');
  assertEquals(fmtCancelScheduled('a@b.com', '4w', 1_800_000_000),
    ':x: *Cancel scheduled* — a@b.com — 4w — ends 2027-01-15');
  assertEquals(fmtSubscriptionEnded('a@b.com', '12w'),
    ':headstone: *Subscription ended* — a@b.com — 12w');
  assertEquals(fmtSubscriptionEnded('a@b.com', null, 'all_guides'),
    ':headstone: *Upsell ended* — all_guides — a@b.com');
  assertEquals(fmtPaymentFailed('a@b.com', 4995, 'usd', 2),
    ':warning: *Payment failed* — a@b.com — $49.95 USD — attempt 2' + REPLAY);
  assertEquals(fmtAccountCreated('a@b.com'),
    ':bust_in_silhouette: *Account created* (checkout opened, not paid yet) — a@b.com' + REPLAY);
  assertEquals(fmtRefund('a@b.com', 2199, 2199, 'usd'),
    ':money_with_wings: *Refund* — a@b.com — $21.99 USD'); // full: no "of" clause
  assertEquals(fmtRefund('a@b.com', 500, 2199, 'usd'),
    ':money_with_wings: *Refund* — a@b.com — $5.00 USD of $21.99 USD'); // partial
});

Deno.test('lead formatter: anonymous without an email, replay link with one', () => {
  // No email argument -> genuinely anonymous, the original guarantee.
  const anon = fmtNewLead('chair-taichi', 'B');
  assertEquals(anon, ':email: *New lead* — quiz email captured (chair-taichi, variant B)');
  assert(!anon.includes('@') && !anon.includes('%40'));
  assertEquals(fmtNewLead(null), ':email: *New lead* — quiz email captured (quiz)');

  // With an email the VISIBLE text is still PII-free, but the address is in the payload,
  // percent-encoded inside the link. Assert both halves so neither can regress unnoticed:
  // a plain `!includes('@')` would pass here and prove nothing.
  const linked = fmtNewLead('chair-taichi', 'B', 'a@b.com');
  assertEquals(linked, ':email: *New lead* — quiz email captured (chair-taichi, variant B)' + REPLAY);
  assert(!linked.includes('@'), 'no raw address on screen');
  assert(linked.includes('a%40b.com'), 'the address IS present, encoded — not anonymous');
});

Deno.test('no replay link when the email is missing', () => {
  // stripe-webhook falls back to a user lookup that can return null, so fmtPaymentFailed
  // must not render a link to /person/undefined.
  const msg = fmtPaymentFailed(null as unknown as string, 4995, 'usd', 2);
  assert(!msg.includes('Watch replay'));
  assert(!msg.includes('posthog.com'));
});

Deno.test('phReplayLink normalises the email into the PostHog person distinct_id', () => {
  // assets/app.js identifies with email.toLowerCase(), so the link must match that exactly
  // or it points at a person page that does not exist.
  assertEquals(phReplayLink('  A@B.com  '),
    'https://us.posthog.com/project/525048/person/a%40b.com#activeTab=sessionRecordings');
  // '+' tags must survive encoding — a raw '+' in a URL path decodes as a space.
  assert(phReplayLink('a+tag@b.com').includes('a%2Btag%40b.com'));
  // Slack's <url|label> syntax breaks on a literal '|' or '>' in the URL; encoding prevents it.
  const weird = phReplayLink('a|b>c@d.com');
  assert(!weird.includes('|') && !weird.includes('>'));
});
