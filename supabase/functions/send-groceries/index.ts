// Sends a member's filtered grocery list as a branded HTML email via Resend.
// Gated by the member's Supabase session (JWT). Recipient comes from the request
// (pre-filled with their own email in the app). Sends from the verified domain.
// BILINGUAL: renders EN or ES. Locale comes from the request body (the app sends
// window.TM_LOCALE), falling back to the member's users.locale. English is unchanged.
import { createClient } from 'jsr:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });

const esc = (s: string) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s || '');

type Loc = 'en' | 'es';
const T: Record<Loc, {
  subject: string; sub: string;
  count: (days: number, items: number) => string;
  happy: string; sit: string; sentFrom: string;
}> = {
  en: {
    subject: 'Your Tai Motion grocery list',
    sub: 'Your grocery list',
    count: (d, i) => `${d} day${d === 1 ? '' : 's'} · ${i} item${i === 1 ? '' : 's'}`,
    happy: 'Happy shopping — everything here matches your Tai&nbsp;Motion meal plan.',
    sit: 'Sit tall, breathe slow, and enjoy your meals. 🌿',
    sentFrom: 'sent from hello@taimotion.com',
  },
  es: {
    subject: 'Su lista de la compra de Tai Motion',
    sub: 'Su lista de la compra',
    count: (d, i) => `${d} día${d === 1 ? '' : 's'} · ${i} artículo${i === 1 ? '' : 's'}`,
    happy: 'Feliz compra — todo esto coincide con su plan de comidas de Tai&nbsp;Motion.',
    sit: 'Siéntese erguida, respire despacio y disfrute de sus comidas. 🌿',
    sentFrom: 'enviado desde hello@taimotion.com',
  },
};

function buildHtml(days: number, items: { amt?: string; name: string }[], loc: Loc) {
  const t = T[loc];
  const rows = items.map((it) => `
    <tr>
      <td style="padding:11px 0;border-bottom:1px solid #eee7db;vertical-align:top;width:26px">
        <span style="display:inline-block;width:16px;height:16px;border:1.5px solid #b7a894;border-radius:4px"></span>
      </td>
      <td style="padding:11px 0;border-bottom:1px solid #eee7db;font-size:16px;color:#2c2417">
        ${it.amt ? `<span style="color:#6b6250;font-weight:600;margin-right:8px">${esc(it.amt)}</span>` : ''}${esc(it.name)}
      </td>
    </tr>`).join('');
  return `<!doctype html><html lang="${loc}"><body style="margin:0;background:#f6f2ea;padding:24px 0;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fffdf9;border-radius:16px;overflow:hidden;box-shadow:0 2px 14px rgba(60,50,30,.08)">
        <tr><td style="background:#3f7a52;padding:22px 28px">
          <span style="color:#fff;font-size:20px;font-weight:700;letter-spacing:.2px">Tai&nbsp;Motion</span>
          <div style="color:#dff0e4;font-size:13px;margin-top:2px">${t.sub}</div>
        </td></tr>
        <tr><td style="padding:26px 28px 8px">
          <div style="font-size:15px;color:#6b6250;margin-bottom:14px">${t.count(days, items.length)}</div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
        </td></tr>
        <tr><td style="padding:20px 28px 30px">
          <div style="font-size:13px;color:#9a917d;line-height:1.5">${t.happy}<br>${t.sit}</div>
        </td></tr>
      </table>
      <div style="color:#b3ab98;font-size:12px;margin-top:14px">Tai&nbsp;Motion · ${t.sentFrom}</div>
    </td></tr></table>
  </body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const authHeader = req.headers.get('Authorization') || '';
    const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }, auth: { persistSession: false },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ ok: false, error: 'unauthorized' }, 401);

    const body = await req.json().catch(() => ({}));
    const to = String(body.to || user.email || '').trim();
    const days = Math.max(1, parseInt(body.days, 10) || 1);
    const items = Array.isArray(body.items) ? body.items.filter((i: any) => i && i.name).slice(0, 300) : [];
    if (!isEmail(to)) return json({ ok: false, error: 'invalid email' }, 400);
    if (!items.length) return json({ ok: false, error: 'empty list' }, 400);

    // Locale: the app sends it in the body; fall back to the member's stored locale.
    let loc: Loc = String(body.locale || '').toLowerCase() === 'es' ? 'es' : 'en';
    if (loc === 'en') {
      try {
        const { data: u } = await userClient.from('users').select('locale').eq('email', to).maybeSingle();
        if (u?.locale === 'es') loc = 'es';
      } catch (_) { /* locale is best-effort; default EN */ }
    }

    const key = Deno.env.get('RESEND_API_KEY');
    if (!key) return json({ ok: false, error: 'email not configured' }, 500);

    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Tai Motion <hello@taimotion.com>',
        to: [to],
        subject: T[loc].subject,
        html: buildHtml(days, items, loc),
      }),
    });
    const txt = await r.text();
    if (!r.ok) { console.log('[resend] ' + r.status + ' ' + txt); return json({ ok: false, error: 'send failed' }, 502); }
    return json({ ok: true });
  } catch (e) {
    return json({ ok: false, error: String((e as Error)?.message || e) }, 500);
  }
});
