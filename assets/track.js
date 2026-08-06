/* Tai Motion — site-wide ad-click capture (funnel).
 * The Meta ad click lands on the marketing URL with an `fbclid` query param.
 * flow.js (window.FLOW) isn't loaded on the landing page or quiz, so capture
 * lives here and runs on every funnel page. Persists the first `fbclid` seen
 * (+ unix-seconds timestamp) into its OWN dedicated localStorage key —
 * "ctc_fbc" — completely independent of ctc_quiz_session, because the quiz
 * wholesale-resets ctc_quiz_session on `quiz.html?start=1` and would wipe the
 * click id before checkout. Never clobbers other keys.
 */
(function () {
  try {
    var fbclid = new URLSearchParams(location.search).get("fbclid");
    if (!fbclid) return;
    var KEY = "ctc_fbc";
    var s;
    try {
      var raw = localStorage.getItem(KEY);
      var o = JSON.parse(raw);
      s = (o && typeof o === "object") ? o : {};
    } catch (e) { s = {}; }
    if (s.fbclid) return;                       // keep the first click only
    s.fbclid = fbclid;
    // Click time in SECONDS. Meta's _fbc creationTime is milliseconds — that conversion lives in
    // buildFbc (supabase/functions/_shared/meta-capi.ts), at the Meta boundary. Don't switch this
    // to ms without reading that function: it accepts either, but seconds is the internal unit.
    s.fbclid_t = Math.floor(Date.now() / 1000);
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch (e) { /* never block the page on tracking */ }
})();
