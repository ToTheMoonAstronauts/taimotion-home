// In-app guide purchase for existing members.
// Authorized by the member's Supabase session (JWT) — no post-checkout token needed.
// Charges the saved card off-session; if that needs a card/authentication it returns a
// clientSecret so the app can show a Stripe payment popup. Records the entitlement.
import Stripe from 'npm:stripe@17';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { APP_OFFERS, minorToMajor, normalizeCurrency, type Currency } from '../_shared/currency.ts';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20' });
const PK = 'pk_live_51TpRX53x0B891G8VIlyjEN9DwOc4Zf89PRG0h9J7nVvd2JoGN10ZYU40Mx92DMnzNT6zzg29WQgGF8uYkjfSCCUc00ckMJziF1';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });

// which group bundle covers a single guide (so bundle owners aren't charged for singles)
const GROUP_OF: Record<string, string> = {
  'guide_joint-mobility': 'essential_guides', 'guide_breathing': 'essential_guides',
  'guide_nutrition': 'essential_guides', 'guide_desserts': 'essential_guides',
  'guide_sleep': 'all_guides', 'guide_eating': 'all_guides', 'guide_aging': 'all_guides',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const body = await req.json();
    const key = (body.item || body.bundle) as string;
    const cfg = APP_OFFERS[key];
    if (!cfg) return json({ status: 'error', error: 'unknown item' }, 400);

    // verify the member's session
    const authHeader = req.headers.get('Authorization') || '';
    const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }, auth: { persistSession: false },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ status: 'error', error: 'not signed in' }, 401);

    const svc = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });

    // already owns it? never double-charge (owns the item directly, OR owns the group bundle that includes it)
    const { data: pays } = await svc.from('payments').select('kind,amount,currency').eq('user_id', user.id);
    const kinds = new Set((pays || []).map((p) => p.kind));
    const groupBundle = GROUP_OF[key];
    if (kinds.has('upsell:' + cfg.grant) || (groupBundle && kinds.has('upsell:' + groupBundle)))
      return json({ status: 'already_owned', upsell_id: cfg.grant });

    const { data: urow } = await svc.from('users').select('stripe_customer_id').eq('id', user.id).maybeSingle();
    const customerId = urow?.stripe_customer_id as string | undefined;
    if (!customerId) return json({ status: 'error', error: 'no billing account on file' }, 400);

    // Currency follows the member's last initial payment or active sub (keeps billing coherent).
    let currency: Currency = 'usd';
    const initial = (pays || []).find((p) => p.kind === 'initial');
    if (initial?.currency) currency = normalizeCurrency(initial.currency);
    else {
      try {
        const subs = await stripe.subscriptions.list({ customer: customerId, status: 'active', limit: 1 });
        const cur = subs.data[0]?.items?.data?.[0]?.price?.currency;
        if (cur) currency = normalizeCurrency(cur);
      } catch (_) { /* default usd */ }
    }

    // TEST MODE: members whose initial charge was small (test promo — $2 test price) pay $1 USD.
    const isTest = initial != null && Number(initial.amount) <= 2;
    const amount = isTest ? 100 : (cfg.amounts[currency] ?? cfg.amounts.usd);
    const chargeCurrency: Currency = isTest ? 'usd' : currency;
    const meta: Record<string, string> = { user_id: user.id, upsell_id: cfg.grant, currency: chargeCurrency };
    if (isTest) meta.test = '1';

    const cust = await stripe.customers.retrieve(customerId) as Stripe.Customer;
    let pm = cust.invoice_settings?.default_payment_method as string | undefined;
    if (!pm) {
      const list = await stripe.paymentMethods.list({ customer: customerId, type: 'card', limit: 1 });
      pm = list.data[0]?.id;
    }

    // no card on file -> hand the app a PaymentIntent to collect one (popup)
    if (!pm) {
      const pi = await stripe.paymentIntents.create({
        amount, currency: chargeCurrency, customer: customerId, setup_future_usage: 'off_session',
        automatic_payment_methods: { enabled: true }, metadata: meta,
      });
      return json({ status: 'requires_action', clientSecret: pi.client_secret, pk: PK, upsell_id: cfg.grant, currency: chargeCurrency });
    }

    // charge the saved card off-session
    const pi = await stripe.paymentIntents.create({
      amount, currency: chargeCurrency, customer: customerId, payment_method: pm,
      off_session: true, confirm: true, metadata: meta,
    });

    if (pi.status === 'succeeded') {
      // Capture the charge's receipt_url so the app can link a receipt (the PI object alone doesn't carry it).
      let receipt_url: string | null = null;
      try {
        const chId = (pi.latest_charge as string) || null;
        if (chId) receipt_url = (await stripe.charges.retrieve(chId)).receipt_url ?? null;
      } catch (_) { /* receipt optional */ }
      await svc.from('payments').upsert({
        id: pi.id, user_id: user.id,
        amount: minorToMajor(amount, chargeCurrency), currency: chargeCurrency,
        kind: 'upsell:' + cfg.grant, status: 'succeeded', raw: { ...(pi as unknown as Record<string, unknown>), receipt_url },
      }, { onConflict: 'id', ignoreDuplicates: true });
      return json({ status: 'accepted', upsell_id: cfg.grant, currency: chargeCurrency });
    }
    if (pi.status === 'requires_action')
      return json({ status: 'requires_action', clientSecret: pi.client_secret, pk: PK, upsell_id: cfg.grant });
    return json({ status: 'failed' });
  } catch (e) {
    const err = e as Stripe.errors.StripeError & { payment_intent?: Stripe.PaymentIntent };
    if (err?.payment_intent?.client_secret)
      return json({ status: 'requires_action', clientSecret: err.payment_intent.client_secret, pk: PK });
    return json({ status: 'failed', error: String(err?.message || err) }, 200);
  }
});
