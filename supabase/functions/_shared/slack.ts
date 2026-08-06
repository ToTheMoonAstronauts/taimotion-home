// Slack business alerts — one Incoming Webhook, per-event formatters.
// Fire-and-log: notifySlack swallows ALL errors. A Slack outage must never fail
// a Stripe webhook (Stripe retries non-2xx) or a user-facing route.
// SLACK_WEBHOOK_URL unset ⇒ silent no-op, so everything runs without Slack.

export async function notifySlack(text: string, fetcher: typeof fetch = fetch): Promise<void> {
  const url = Deno.env.get('SLACK_WEBHOOK_URL');
  if (!url) return;
  try {
    await fetcher(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) });
  } catch (_) { /* never block the caller on Slack */ }
}

const usd = (cents: number, currency: string) => `$${(cents / 100).toFixed(2)} ${currency.toUpperCase()}`;

// ── PostHog replay deep links ───────────────────────────────────────────────
// assets/app.js identifies with the LOWERCASED email (posthog.identify(v.toLowerCase())),
// so a person's distinct_id IS their address — the link resolves with no PostHog API call,
// no personal API key, and nothing added to the critical path.
//
// The recording itself is keyed to the ANONYMOUS distinct_id (person_profiles is
// 'identified_only', so replay starts before identify() fires on the quiz page). That's fine:
// the person page lists recordings across ALL of a person's distinct_ids, and identify()
// merges the anonymous id into the email person — so the email link surfaces the anonymous
// session's replay. #activeTab=sessionRecordings opens that tab; an unrecognised hash just
// falls back to the default tab, so the link can never 404.
const PH_PROJECT = 'https://us.posthog.com/project/525048'; // Monokodas org, US cloud ("Tai Motion")

export function phReplayLink(email: string): string {
  return `${PH_PROJECT}/person/${encodeURIComponent(email.trim().toLowerCase())}#activeTab=sessionRecordings`;
}

// Slack mrkdwn link, or '' when there's no email to key the person page on
// (fmtPaymentFailed's email can be null when the invoice has no customer_email
// and the user lookup misses — never render a link to /person/undefined).
function replaySuffix(email: string | null | undefined): string {
  return email ? ` — <${phReplayLink(email)}|▶︎ Watch replay>` : '';
}

// ── Formatters (pure — no env, no I/O) ──────────────────────────────────────
// Money/churn events come from the Stripe webhook; product events (lead,
// account created) from the app-facing routes. Lead messages are ANONYMOUS —
// never put lead PII in Slack.

export function fmtSubscriptionPaid(kind: 'initial' | 'renewal', email: string, amountCents: number, currency: string, isTest: boolean): string {
  // Text kept identical to the pre-refactor stripe-webhook messages.
  return `:moneybag: *${kind === 'initial' ? 'New subscription' : 'Renewal'}* — ${email} — ${usd(amountCents, currency)}${isTest ? ' _(test)_' : ''}`;
}

export function fmtUpsellPaid(upsellId: string, email: string, amountCents: number, currency: string, isTest: boolean): string {
  return `:heavy_plus_sign: *Upsell:* ${upsellId} — ${email} — ${usd(amountCents, currency)}${isTest ? ' _(test)_' : ''}`;
}

export function fmtCancelScheduled(email: string, planId: string | null | undefined, periodEndSec: number | null | undefined): string {
  const ends = periodEndSec ? ` — ends ${new Date(periodEndSec * 1000).toISOString().slice(0, 10)}` : '';
  return `:x: *Cancel scheduled* — ${email}${planId ? ` — ${planId}` : ''}${ends}`;
}

export function fmtSubscriptionEnded(email: string, planId: string | null | undefined, upsellId?: string | null): string {
  if (upsellId) return `:headstone: *Upsell ended* — ${upsellId} — ${email}`;
  return `:headstone: *Subscription ended* — ${email}${planId ? ` — ${planId}` : ''}`;
}

// The replay pairs with the decline reason, which lives only in funnel_events pay_failed
// props (the invoice.payment_failed payload carries no PI/charge) — the recording shows
// what the card-entry experience actually looked like.
export function fmtPaymentFailed(email: string, amountDueCents: number, currency: string, attemptCount: number): string {
  return `:warning: *Payment failed* — ${email} — ${usd(amountDueCents, currency)} — attempt ${attemptCount}${replaySuffix(email)}`;
}

// amountRefunded is the charge's running total, so partial refunds read '$5.00 of $21.99'.
export function fmtRefund(email: string, amountRefundedCents: number, chargeCents: number, currency: string): string {
  const partial = amountRefundedCents < chargeCents ? ` of ${usd(chargeCents, currency)}` : '';
  return `:money_with_wings: *Refund* — ${email} — ${usd(amountRefundedCents, currency)}${partial}`;
}

// NO LONGER FULLY ANONYMOUS. The visible text is still PII-free (no name, no address), but
// when `email` is passed the replay link embeds it percent-encoded in the URL — so the
// address IS in the Slack payload, just not on screen. Note %40 means a naive
// `!msg.includes('@')` check passes even though the email is present; don't reintroduce one
// and mistake it for proof of anonymity. Omit `email` to keep the alert genuinely anonymous.
export function fmtNewLead(funnel: string | null | undefined, abVariant?: string | null, email?: string | null): string {
  const parts = [funnel || 'quiz', abVariant ? `variant ${abVariant}` : null].filter(Boolean);
  return `:email: *New lead* — quiz email captured (${parts.join(', ')})${replaySuffix(email)}`;
}

export function fmtAccountCreated(email: string): string {
  // "checkout opened": the account is created when the pay page starts a
  // checkout — no payment yet. A 👤 with no following 💰 = abandoned checkout,
  // which is exactly when you want the replay — hence the link.
  return `:bust_in_silhouette: *Account created* (checkout opened, not paid yet) — ${email}${replaySuffix(email)}`;
}
