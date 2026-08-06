// Lead-recovery emails (abandoned checkout). SEPARATE, additive service — only reads
// quiz_sessions/users and writes email_sends/email_suppressions. Never touches checkout/subs.
// Cron-triggered hourly. Safety-gated: sends nothing unless LEAD_EMAILS_ENABLED=1 AND a
// BUSINESS_ADDRESS is set (CAN-SPAM). ?dry=1 returns due counts without sending.
// Sequence (timing lives in the due_lead_emails RPC): step 1 "plan saved" at 1h,
// step 2 "value stack" at 24h, step 3 free guide (buyers 30min / non-buyers 48h soft close),
// step 4 gentle re-engagement at 30 days. Steps are send-slots, not send order.
// BILINGUAL: renders EN or ES from the lead's locale (quiz_sessions.locale, via the RPC).
// English copy is unchanged from the original; Spanish is a LatAm formal (usted) translation.
import { createClient } from 'jsr:@supabase/supabase-js@2';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type, x-cron-key', 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS' };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });

const SB_URL = Deno.env.get('SUPABASE_URL')!;
const svc = createClient(SB_URL, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
const RESEND = Deno.env.get('RESEND_API_KEY') || '';
const ENABLED = Deno.env.get('LEAD_EMAILS_ENABLED') === '1';
const ADDRESS = (Deno.env.get('BUSINESS_ADDRESS') || '').trim();
const UNSUB_SECRET = Deno.env.get('UNSUB_SECRET') || 'dev';
const CRON_KEY = Deno.env.get('CRON_KEY') || '';
const FUNNEL = 'https://taimotion.com';
const esc = (s: string) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const b64url = (s: string) => btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

type Loc = 'en' | 'es';
const isEs = (l?: string | null): Loc => (l === 'es' ? 'es' : 'en');
// ES pages live under the /es/ subpath; EN stays at the root.
const funnelBase = (loc: Loc) => (loc === 'es' ? FUNNEL + '/es' : FUNNEL);

// Attribution: every CTA carries utm_campaign=step-N so returns are visible in analytics.
const withUtm = (url: string, step: number) =>
  url + (url.includes('?') ? '&' : '?') + `utm_source=lead-email&utm_medium=email&utm_campaign=step-${step}`;

// Personalization from quiz_sessions (via due_lead_emails RPC). Name is only used when it
// looks like a plain given name — quiz free-text can contain anything.
const firstName = (name?: string | null) => {
  const n = String(name || '').trim().split(/\s+/)[0] || '';
  return /^[\p{L}][\p{L}'-]{1,19}$/u.test(n) ? n : '';
};
const FOCUS_LABELS: Record<Loc, Record<string, string>> = {
  en: {
    lose_weight: 'gentle weight loss',
    feel_healthier: 'feeling healthier day to day',
    lower_stress: 'a calmer mind',
    memory_focus: 'memory and focus',
  },
  es: {
    lose_weight: 'una pérdida de peso suave',
    feel_healthier: 'sentirse más sana en el día a día',
    lower_stress: 'una mente más tranquila',
    memory_focus: 'la memoria y la concentración',
  },
};
const FOCUS_DEFAULT: Record<Loc, string> = {
  en: 'balance, mobility and a calmer mind',
  es: 'equilibrio, movilidad y una mente más tranquila',
};
function focusPhrase(focus: string[] | null | undefined, loc: Loc) {
  const parts = (focus || []).map((f) => FOCUS_LABELS[loc][f]).filter(Boolean).slice(0, 3);
  if (!parts.length) return FOCUS_DEFAULT[loc];
  if (parts.length === 1) return parts[0];
  const conj = loc === 'es' ? ' y ' : ' and ';
  return parts.slice(0, -1).join(', ') + conj + parts[parts.length - 1];
}

async function sign(msg: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(UNSUB_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(msg.toLowerCase()));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}

const FOOTER: Record<Loc, (unsubUrl: string) => string> = {
  en: (u) => `You're receiving this because you started a plan at taimotion.com. <a href="${u}" style="color:#8a8172">Unsubscribe</a>`,
  es: (u) => `Recibe este correo porque comenzó un plan en taimotion.com. <a href="${u}" style="color:#8a8172">Darse de baja</a>`,
};
function shell(inner: string, unsubUrl: string, loc: Loc) {
  return `<!doctype html><html lang="${loc}"><body style="margin:0;background:#f6f2ea;padding:24px 0;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
  <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fffdf9;border-radius:16px;overflow:hidden;box-shadow:0 2px 14px rgba(60,50,30,.08)">
    <tr><td style="background:#3f7a52;padding:22px 28px"><span style="color:#fff;font-size:20px;font-weight:700">Tai&nbsp;Motion</span></td></tr>
    <tr><td style="padding:26px 28px 8px;font-size:16px;color:#2c2417;line-height:1.6">${inner}</td></tr>
  </table>
  <div style="color:#b3ab98;font-size:12px;margin-top:14px;line-height:1.6;max-width:520px;text-align:center">
    Tai&nbsp;Motion · ${esc(ADDRESS)}<br>
    ${FOOTER[loc](unsubUrl)}</div>
  </td></tr></table></body></html>`;
}
function cta(url: string, label: string) {
  return `<div style="margin:22px 0"><a href="${url}" style="display:inline-block;background:#3f7a52;color:#fff;text-decoration:none;font-weight:600;font-size:16px;padding:13px 26px;border-radius:12px">${label}</a></div>`;
}
const WARM: Record<Loc, string> = {
  en: 'Warmly,<br>The Tai Motion team',
  es: 'Un cordial saludo,<br>El equipo de Tai Motion',
};
function buildEmail(step: number, resumeUrl: string, unsubUrl: string, loc: Loc, name?: string | null, focus?: string[] | null) {
  const resume = withUtm(resumeUrl, step);
  const fn = firstName(name);
  const goals = esc(focusPhrase(focus, loc));
  const warm = WARM[loc];
  if (loc === 'es') {
    const hi = fn ? `Hola, ${esc(fn)}:` : 'Hola:';
    if (step === 1) {
      return {
        subject: 'Su plan suave está guardado 🌿',
        html: shell(
          `<p>${hi}</p>
           <p>Su plan personalizado de Tai Chi en silla está listo, creado a partir de las respuestas que nos dio, con especial atención a <b>${goals}</b>. Movimiento suave, sentada, solo unos minutos al día.</p>
           <p>Buenas noticias: <b>su precio de introducción sigue reservado</b> — un ahorro real en su primer plan — pero solo podemos mantenerlo reservado durante poco tiempo.</p>
           ${cta(resume, 'Terminar de configurar mi plan')}
           <p style="color:#6b6250">Puede cancelar cuando quiera, en un par de clics.</p>
           <p style="color:#6b6250">${warm}</p>`, unsubUrl, loc),
      };
    }
    if (step === 3) {
      return {
        subject: 'Un pequeño regalo para usted: su guía gratuita de Tai Chi en silla 🌿',
        html: shell(
          `<p>${hi}</p>
           <p>Sin ningún compromiso: sea o no el momento adecuado, queríamos enviarle la guía en PDF imprimible gratuita de <b>Tai Chi en silla</b> que le prometimos. Es suya para siempre.</p>
           ${cta(withUtm(funnelBase(loc) + '/free-chair-guide', step), 'Obtener mi guía gratuita')}
           <p>Una rutina suave en silla, imprimible, que puede empezar hoy mismo, sin ningún compromiso.</p>
           <p style="color:#6b6250">Y cuando esté lista para el programa completo de Tai Chi en silla, <a href="${resume}" style="color:#3f7a52">su plan sigue guardado</a>.</p>
           <p style="color:#6b6250">${warm}</p>`, unsubUrl, loc),
      };
    }
    if (step === 4) {
      return {
        subject: 'Su plan sigue aquí, cuando usted quiera 🌿',
        html: shell(
          `<p>${hi}</p>
           <p>Han pasado unas semanas desde que creó su plan de Tai Chi en silla con nosotros, así que queríamos saludarla — con calma, sin prisa y sin ninguna presión.</p>
           <p>Su plan sigue guardado, centrado en <b>${goals}</b>, y solo necesita unos minutos al día para empezar. Muchas personas descubren que el segundo intento es el que funciona.</p>
           ${cta(resume, 'Echar otro vistazo')}
           <p style="color:#6b6250">Y si este no es el mejor momento, no pasa nada — puede darse de baja más abajo y no volveremos a escribirle.</p>
           <p style="color:#6b6250">${warm}</p>`, unsubUrl, loc),
      };
    }
    return {
      subject: 'Sigue siendo suyo: esto es todo lo que le espera dentro',
      html: shell(
        `<p>${hi}</p>
         <p>Su plan sigue guardado a su <b>precio de introducción</b> — creado en torno a <b>${goals}</b>. Y es más que unos cuantos ejercicios — esto es lo que le espera al unirse:</p>
         <ul style="padding-left:20px;color:#2c2417">
           <li><b>Tai Chi en silla personalizado</b> — sesiones fáciles de seguir, a su nivel</li>
           <li><b>Un plan de nutrición personalizado</b> — comidas sencillas y suaves pensadas para usted</li>
           <li><b>Lecciones de la academia y retos guiados</b> — algo cada día para mantenerla motivada</li>
           <li><b>Registros sencillos</b> — agua, equilibrio, estado de ánimo y más, para ver cómo mejora su bienestar</li>
         </ul>
         <p>Todo pensado para cuerpos reales y días reales, por completo a su propio ritmo — además de algunas guías de regalo gratuitas para conservar.</p>
         ${cta(resume, 'Empezar mi plan')}
         <p style="color:#6b6250">Cancele cuando quiera. Y si no es para usted en los primeros 30 días, nuestra política de reembolso la protege.</p>
         <p style="color:#6b6250">${warm}</p>`, unsubUrl, loc),
    };
  }
  // ---- English (unchanged from the original function) ----
  const hi = fn ? `Hi ${esc(fn)},` : 'Hi there,';
  if (step === 1) {
    return {
      subject: 'Your gentle plan is saved 🌿',
      html: shell(
        `<p>${hi}</p>
         <p>Your personalized Chair Tai Chi plan is ready — built from the answers you gave us, with a focus on <b>${goals}</b>. Gentle, seated movement, just a few minutes a day.</p>
         <p>Good news: <b>your introductory price is still held</b> — a real saving on your first plan — but we can only keep it reserved for a little while.</p>
         ${cta(resume, 'Finish setting up my plan')}
         <p style="color:#6b6250">You can cancel anytime, in a couple of clicks.</p>
         <p style="color:#6b6250">${warm}</p>`, unsubUrl, loc),
    };
  }
  if (step === 3) {
    return {
      subject: 'A little gift for you — your free Chair Tai Chi guide 🌿',
      html: shell(
        `<p>${hi}</p>
         <p>No pressure at all — whether or not now's the right time, we wanted to send you the free demo of <b>Chair Tai Chi</b> printable PDF guide we promised. It's yours to keep.</p>
         ${cta(withUtm(funnelBase(loc) + '/free-chair-guide', step), 'Get my free guide')}
         <p>A gentle, printable chair routine you can start today — no strings attached.</p>
         <p style="color:#6b6250">And whenever you're ready for the full chair Tai Chi program, <a href="${resume}" style="color:#3f7a52">your plan is still saved</a>.</p>
         <p style="color:#6b6250">${warm}</p>`, unsubUrl, loc),
    };
  }
  if (step === 4) {
    return {
      subject: 'Your plan is still here, whenever you\'re ready 🌿',
      html: shell(
        `<p>${hi}</p>
         <p>It's been a few weeks since you built your Chair Tai Chi plan with us, so we wanted to check in — gently, no rush and no pressure.</p>
         <p>Your plan is still saved, focused on <b>${goals}</b>, and it only takes a few minutes a day to begin. Many people find the second try is the one that sticks.</p>
         ${cta(resume, 'Take another look')}
         <p style="color:#6b6250">And if now isn't the right season for it, that's completely okay — you can unsubscribe below and we won't write again.</p>
         <p style="color:#6b6250">${warm}</p>`, unsubUrl, loc),
    };
  }
  return {
    subject: 'Still yours — here\'s everything waiting inside',
    html: shell(
      `<p>${hi}</p>
       <p>Your plan is still saved at your <b>introductory price</b> — built around <b>${goals}</b>. And it's more than a few exercises — here's what's waiting when you join:</p>
       <ul style="padding-left:20px;color:#2c2417">
         <li><b>Personalized chair Tai Chi</b> — easy follow-along sessions at your level</li>
         <li><b>A personalized nutrition plan</b> — simple, gentle meals built around you</li>
         <li><b>Academy lessons and guided challenges</b> — a little something each day to keep you going</li>
         <li><b>Simple trackers</b> — water, balance, mood and more, to watch how you feel improve</li>
       </ul>
       <p>All designed for real bodies and real days, entirely at your own pace — plus a few free bonus guides to keep.</p>
       ${cta(resume, 'Start my plan')}
       <p style="color:#6b6250">Cancel anytime. And if it's not for you in the first 30 days, our refund policy has you covered.</p>
       <p style="color:#6b6250">${warm}</p>`, unsubUrl, loc),
  };
}

async function sendOne(to: string, subject: string, html: string) {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST', headers: { 'Authorization': `Bearer ${RESEND}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'Tai Motion <hello@taimotion.com>', to: [to], subject, html }),
  });
  if (!r.ok) console.log('[lead-email] resend ' + r.status + ' ' + (await r.text()));
  return r.ok;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const url = new URL(req.url);

  // Preview mode: send all four emails to a given address so we can eyeball the rendering.
  // Restricted to our own abobinas+*@gmail.com aliases so it can't be used as an open relay.
  // ?lang=es previews the Spanish set.
  const preview = url.searchParams.get('preview');
  if (preview) {
    if (!/^abobinas\+[a-z0-9._+-]*@gmail\.com$/i.test(preview)) return json({ ok: false, error: 'preview restricted to abobinas+ aliases' }, 403);
    const loc = isEs(url.searchParams.get('lang'));
    const resumeUrl = `${funnelBase(loc)}/checkout?resume=preview`;
    const tok = await sign(preview);
    const unsubUrl = `${SB_URL}/functions/v1/lead-unsubscribe?e=${b64url(preview)}&t=${tok}`;
    const previewName = loc === 'es' ? 'María' : 'Mary';
    const results = [];
    for (const step of [1, 2, 3, 4]) {
      const { subject, html } = buildEmail(step, resumeUrl, unsubUrl, loc, previewName, ['lose_weight', 'lower_stress']);
      const ok = await sendOne(preview, `[Preview • ${loc} • email ${step}] ${subject}`, html);
      results.push({ step, subject, ok });
    }
    return json({ preview: preview, locale: loc, results });
  }

  const dry = url.searchParams.get('dry') === '1';
  // cron auth (skip for dry-run introspection which is harmless)
  if (!dry && CRON_KEY && req.headers.get('x-cron-key') !== CRON_KEY) return json({ ok: false, error: 'unauthorized' }, 401);
  if (!dry && !ENABLED) return json({ ok: true, skipped: 'disabled' });
  if (!dry && !ADDRESS) return json({ ok: false, error: 'BUSINESS_ADDRESS not set — refusing to send (CAN-SPAM).' }, 400);

  const out: Record<string, unknown> = { dry, enabled: ENABLED, hasAddress: !!ADDRESS };
  let sent = 0; const sample: string[] = [];
  for (const step of [1, 2, 3, 4]) {
    const { data, error } = await svc.rpc('due_lead_emails', { p_step: step });
    if (error) { out['step' + step] = 'error: ' + error.message; continue; }
    const rows = (data || []) as { quiz_session_id: string; email: string; name?: string | null; focus?: string[] | null; locale?: string | null }[];
    out['step' + step + '_due'] = rows.length;
    if (dry) { rows.slice(0, 5).forEach((r) => sample.push(step + ':' + r.email.replace(/(.).*(@.*)/, '$1***$2'))); continue; }
    for (const row of rows.slice(0, 100)) {
      const { data: ins, error: iErr } = await svc.from('email_sends').insert({ email: row.email, quiz_session_id: row.quiz_session_id, step }).select('id');
      if (iErr || !ins || !ins.length) continue;                 // already sent (unique index) or error → skip
      const loc = isEs(row.locale);
      const resumeUrl = `${funnelBase(loc)}/checkout?resume=${row.quiz_session_id}`;
      const tok = await sign(row.email);
      const unsubUrl = `${SB_URL}/functions/v1/lead-unsubscribe?e=${b64url(row.email)}&t=${tok}`;
      const { subject, html } = buildEmail(step, resumeUrl, unsubUrl, loc, row.name, row.focus);
      const ok = await sendOne(row.email, subject, html);
      if (ok) sent++; else await svc.from('email_sends').delete().eq('id', ins[0].id);   // let it retry next run
    }
  }
  out.sent = sent; if (dry) out.sample = sample;
  return json(out);
});
