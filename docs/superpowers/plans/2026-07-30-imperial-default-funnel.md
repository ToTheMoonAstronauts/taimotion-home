# Imperial Units by Default — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make US customary units (lb, ft/in) the funnel's default measurement system, render every downstream screen in the visitor's units, and carry the choice into the member app.

**Architecture:** One session-level `S.units` (`"imperial"`/`"metric"`) resolved once at boot from `?units=` → locale region → timezone, replacing three per-screen unit answers. Canonical storage stays metric; units are purely a view concern, converted at render time through a single descriptor object. The choice rides `quiz_sessions.measurement_system` into `users.measurement_system`, which the member app already reads.

**Tech Stack:** Plain browser JS (IIFE, no build step, no bundler, no framework), Supabase Edge Functions (Deno), Postgres. Verification via Playwright against a local static server.

**Spec:** `docs/superpowers/specs/2026-07-30-imperial-default-funnel-design.md`
**Baseline:** `main` @ `987d95c`

## Global Constraints

- **Canonical storage is always metric.** `S.height_cm`, `S.weight_kg`, `S.goal_weight_kg`, `S.bmi` are the only persisted body values. Never store lb or ft in session state or the database.
- **`projDate()` / `projMonth()` always receive kilograms.** Their math is `~1 kg per 2 weeks` (`app.js:205-217`). Passing lb roughly doubles every projected date.
- **Another session is active in this repo.** `supabase/functions/_shared/meta-capi.ts`, `meta-capi.test.ts`, and `stripe-webhook/index.ts` have uncommitted changes that are NOT ours. **Always `git add` explicit paths. Never `git add -A`, `git add .`, or `git commit -a`.**
- **No new dependencies.** No npm packages, no build step. Browser JS must run as-is from `assets/`.
- **Match existing style:** 2-space indent, double quotes in `assets/*.js`, single quotes in edge functions, comments that explain *why* not *what*.
- **Do not touch `taichi_app/`.** Its imperial handling already works.
- **Edge functions (`CLAUDE.md`, mandatory):** before editing, `git fetch` and `supabase functions download <name> --project-ref pixtozeghxwiidpnloih`, `deno fmt` both sides, and diff **logic** not formatting. If deployed differs from git, commit the deployed logic as baseline FIRST. After deploying, commit the deployed code in the same session.
- **Supabase project ref:** `pixtozeghxwiidpnloih`.
- **Nothing goes live until pushed.** Cloudflare Pages deploys on `git push`. Do not push without the user saying so.

## Test Setup (used by every funnel task)

Serve the funnel statically from the repo root:

```bash
cd /Users/mintarasgrinius/Documents/taichi/taichi && python3 -m http.server 8765
```

Local URLs use the `.html` suffix (clean URLs are a Cloudflare Pages rewrite, absent locally):
`http://localhost:8765/quiz.html?units=imperial`

Browser work uses the **playwright-skill**. Detection tests require per-context `locale` and `timezoneId`. Every test navigates with `?start` first to guarantee a fresh session, since a stale `localStorage` session would mask detection.

To reach a body-metrics screen quickly, `assets/testbar.js` supports `?step=N`; screens can also be reached by answering through. Prefer driving `S` directly for setup where a test only asserts rendering:

```js
await page.evaluate(() => {
  const s = window.CTC.get();
  s.weight_kg = 81.6; s.goal_weight_kg = 72.6; s.height_cm = 175; s.units = "imperial";
  window.CTC.saveSession();
});
```

## File Structure

| File | Responsibility |
|---|---|
| `assets/app.js` | Unit detection, `S.units`, unit descriptor, all render-time conversion |
| `assets/config.js` | Screen definitions + copy with `{wu}` tokens |
| `assets/quiz.css` | ft/in field pair styling |
| `quiz.html`, `quiz-b.html`, `quiz-c.html` | `?v=` cache-bust only |
| `supabase/functions/submit-quiz/index.ts` | Persist `measurement_system` |
| `supabase/functions/create-subscription/index.ts` | Copy into `users` |
| Postgres | `quiz_sessions.measurement_system` column |

`app.js` is a single 950-line IIFE. It is already organised as one render function per screen type; the new code follows that grain (helpers near the other helpers at lines 40-57, detection near the boot block at 59-75). Do not restructure it.

---

### Task 1: Unit system core — detection, `S.units`, legacy migration

**Files:**
- Modify: `assets/app.js:22-31` (`fresh()`, `window.CTC`), `assets/app.js:54-57` (helpers), `assets/app.js:59-65` (boot)

**Interfaces:**
- Consumes: nothing (first task)
- Produces:
  - `S.units` — `"imperial" | "metric"`, always set after boot
  - `detectUnits(): "imperial" | "metric"`
  - `IMPERIAL_REGIONS: string[]`
  - `window.CTC.get().units` — readable from Playwright

- [ ] **Step 1: Write the failing test**

Using the playwright-skill, create a check with four contexts. Each navigates to
`http://localhost:8765/quiz.html?start` (plus the query noted) and evaluates
`() => window.CTC.get().units`:

| Context | URL | Expected |
|---|---|---|
| `locale: "lt-LT"`, `timezoneId: "Europe/Vilnius"` | `?start&units=imperial` | `"imperial"` |
| `locale: "en-US"`, `timezoneId: "America/New_York"` | `?start&units=metric` | `"metric"` |
| `locale: "en-US"`, `timezoneId: "America/New_York"` | `?start` | `"imperial"` |
| `locale: "lt-LT"`, `timezoneId: "Europe/Vilnius"` | `?start` | `"metric"` |

- [ ] **Step 2: Run it to verify it fails**

Expected: all four fail with `units` being `undefined` — the field does not exist yet.

- [ ] **Step 3: Add the detection helpers**

Insert after `bmiCategory` (currently `app.js:57`):

```js
  // ---- measurement system ----
  // Imperial is the default for US-shaped visitors; the funnel's audience is majority US.
  // Regions where lb/ft is what people actually think in. GB is included deliberately: UK
  // visitors read lb far more naturally than kg (stone is not offered — one unit per system).
  const IMPERIAL_REGIONS = ["US", "GB", "LR", "MM"];
  const IMPERIAL_TZ = ["America/New_York", "America/Chicago", "America/Denver",
    "America/Los_Angeles", "America/Phoenix", "America/Anchorage", "Pacific/Honolulu"];
  // Resolved ONCE per session and stored on S: a mid-funnel flip would reinterpret values the
  // visitor already entered. ?units= wins so screenshots, Playwright and QA are reproducible —
  // locale detection alone makes session replays impossible to reproduce deliberately.
  function detectUnits() {
    try {
      const q = new URLSearchParams(location.search).get("units");
      if (q === "imperial" || q === "metric") return q;
    } catch (e) { /* malformed query string: fall through to locale */ }
    try {
      const langs = navigator.languages && navigator.languages.length
        ? navigator.languages : [navigator.language];
      for (const l of langs) {
        if (!l) continue;
        // "en-US" -> "US". Intl.Locale also resolves "en-Latn-US" and likelySubtags.
        const r = (new Intl.Locale(l)).region;
        if (r) return IMPERIAL_REGIONS.includes(r) ? "imperial" : "metric";
      }
    } catch (e) { /* no Intl.Locale (old Safari): fall through to timezone */ }
    try {
      if (IMPERIAL_TZ.includes(Intl.DateTimeFormat().resolvedOptions().timeZone)) return "imperial";
    } catch (e) { /* no Intl at all: metric */ }
    return "metric";
  }
```

- [ ] **Step 4: Add `units` to the session shape**

In `fresh()` (`app.js:26-28`), add `units` to the returned object — put it on the line with the body metrics:

```js
      age_band: null, answers: {}, index: 0, email: null, name: null,
      units: detectUnits(),
      height_cm: null, weight_kg: null, goal_weight_kg: null, bmi: null,
```

- [ ] **Step 5: Resolve units for sessions loaded from localStorage**

Immediately after the `?start`/`?fresh`/`?new` block (currently ends `app.js:65`), add:

```js
  // Sessions saved before the unit system existed carry per-screen unit answers instead of
  // S.units. Derive from those rather than re-detecting: re-detecting could flip a visitor
  // who already entered kg into imperial and silently reinterpret their numbers.
  if (!S.units) {
    const legacy = S.answers.weight_unit || S.answers.goal_weight_unit || S.answers.height_unit;
    S.units = legacy ? (legacy === "lb" || legacy === "ft" ? "imperial" : "metric") : detectUnits();
    save();
  }
```

- [ ] **Step 6: Run the test to verify it passes**

All four contexts return the expected value. If context 3 returns `"metric"`, the
`?start` reset is running after detection — check ordering.

- [ ] **Step 7: Commit**

```bash
git add assets/app.js
git commit -m "feat(quiz): session-level measurement system with locale detection"
```

---

### Task 2: Input screens read `S.units`

**Files:**
- Modify: `assets/app.js:339-400` (`rInput`), `assets/app.js:407-411` (`rSlider`)

**Interfaces:**
- Consumes: `S.units` (Task 1)
- Produces:
  - `unitFor(scr): string` — the label for a screen's active unit (`"lb"`, `"kg"`, `"cm"`, `"ft"`)
  - `setUnits(sys)` — writes `S.units` and saves
  - Removes all reads/writes of `S.answers[scr.id + "_unit"]`

- [ ] **Step 1: Write the failing test**

Serve, then in one imperial context (`?start&units=imperial`) drive to the weight
screen and assert:

```js
// toggle: the imperial option is the active one
await page.evaluate(() => document.querySelector(".unit-toggle .on").textContent)  // "lb"
```

Then type `180`, click the `kg` toggle button, and assert both:

```js
await page.evaluate(() => document.querySelector(".field input").value)   // "81.6"
await page.evaluate(() => window.CTC.get().weight_kg)                    // 81.6
await page.evaluate(() => window.CTC.get().units)                        // "metric"
```

Then continue to the goal-weight slider and assert its readout unit is `kg`
(proving the choice crossed screens):

```js
await page.evaluate(() => document.querySelector(".sl-u").textContent)    // "kg"
```

- [ ] **Step 2: Run it to verify it fails**

Expected failures: the active toggle is `kg` not `lb` (array order still decides), the
value clears rather than converting on switch, and the slider's unit is independent
of the weight screen's.

- [ ] **Step 3: Add the unit accessors**

Next to `detectUnits` (after the block added in Task 1):

```js
  // A screen declares its two unit labels metric-first (units: ["kg","lb"]); which one is live
  // is a session property, not a per-screen one, so every screen and all downstream copy agree.
  function unitFor(scr) { return S.units === "imperial" ? scr.units[1] : scr.units[0]; }
  function setUnits(sys) { S.units = sys; save(); }
```

- [ ] **Step 4: Rewrite `rInput`'s unit handling**

Replace `app.js:341` and the toggle loop at `344-348`:

```js
    let unit = unitFor(scr);
    const wrap = el("div", "inputwrap");
    const tog = el("div", "unit-toggle");
    scr.units.forEach((u, i) => {
      const b = el("button", u === unit ? "on" : "", u);
      // Convert the value in place instead of clearing it: the canonical answer is already in
      // metric, so re-rendering from S is both simpler and drift-free.
      b.onclick = () => {
        if (u === unit) return;
        setUnits(i === 1 ? "imperial" : "metric");
        rInput(scr, (root.innerHTML = "", root));
      };
      tog.appendChild(b);
    });
```

- [ ] **Step 5: Make the field re-render from canonical state**

Replace `app.js:353` (`inp.value = S.answers[scr.id] || "";`) so a unit switch repaints
the converted number:

```js
    // Derive from the canonical metric value so a unit switch converts rather than clears.
    // S.answers[scr.id] is only a fallback for a value typed but not yet committed.
    inp.value = (() => {
      const kg = scr.field === "weight" ? S.weight_kg : scr.field === "goal_weight" ? S.goal_weight_kg : null;
      if (kg != null) return String(unit === "lb" ? Math.round(kg * 2.20462) : Math.round(kg * 10) / 10);
      if (scr.field === "height" && S.height_cm != null) return String(S.height_cm);
      return S.answers[scr.id] || "";
    })();
```

- [ ] **Step 6: Point `rSlider` at the session unit**

Replace `app.js:410` and its toggle loop (the `scr.units.forEach` immediately below it):

```js
    let unit = unitFor(scr);
```

and inside that forEach, replace the `b.onclick` body with:

```js
      b.onclick = () => {
        if (u === unit) return;
        setUnits(i === 1 ? "imperial" : "metric");
        root.innerHTML = ""; rSlider(scr, root);
      };
```

changing the callback signature to `scr.units.forEach((u, i) => {`. Also delete the
`S.answers[scr.id + "_unit"] = unit;` line inside `rSlider`'s `commit()` — the unit is
no longer a per-screen answer.

- [ ] **Step 7: Run the test to verify it passes**

All four assertions pass, including the slider inheriting `kg`.

- [ ] **Step 8: Commit**

```bash
git add assets/app.js
git commit -m "feat(quiz): input screens and slider read the session unit system"
```

---

### Task 3: Feet + inches height entry

**Files:**
- Modify: `assets/app.js:339-400` (`rInput` height branch), `assets/app.js:54` (`toCm`)
- Modify: `assets/quiz.css` (after the `.field` rules, near line 160)

**Interfaces:**
- Consumes: `unitFor`, `setUnits` (Task 2)
- Produces:
  - `ftInToCm(ft, inch): number`
  - `cmToFtIn(cm): {ft: number, inch: number}`
  - `S.answers.height_ft`, `S.answers.height_in` — raw entries for back-navigation

- [ ] **Step 1: Write the failing test**

In an imperial context on the height screen, fill `5` and `9`, then assert:

```js
await page.evaluate(() => window.CTC.get().height_cm)   // 175
```

Then set weight to 180 lb and assert the BMI feedback text contains `26.6`.
Then assert an out-of-range inches value is rejected:

```js
// with ft=5, in=13 the Continue button stays disabled and an error shows
await page.evaluate(() => document.querySelector(".input-err").textContent)  // non-empty
```

Then navigate back and forward and assert both fields still read `5` and `9`.

- [ ] **Step 2: Run it to verify it fails**

Expected: only one input exists on the height screen; filling it with `5` yields
`height_cm` 152 (5 × 30.48), not 175.

- [ ] **Step 3: Add the height conversions**

Replace `app.js:54` (`toCm`) with:

```js
  // Height is entered as ft + in (never decimal feet): a visitor typing 5.9 for 5'9" would
  // silently record 180cm and corrupt the BMI shown back to them as a trust signal.
  function ftInToCm(ft, inch) { return Math.round(((+ft || 0) * 12 + (+inch || 0)) * 2.54); }
  function cmToFtIn(cm) {
    const total = Math.round((+cm || 0) / 2.54);
    return { ft: Math.floor(total / 12), inch: total % 12 };
  }
  function toCm(v, u) { return u === "ft" ? Math.round(v * 30.48) : v; }   // metric path + legacy decimal-ft sessions
```

- [ ] **Step 4: Render the dual field in `rInput`**

In `rInput`, immediately after `wrap.appendChild(tog);` (currently `app.js:349`), add
an early imperial-height branch that renders two fields and returns. Insert:

```js
    // Imperial height is the one screen with two inputs; every other field is a single number.
    if (scr.field === "height" && unit === "ft") return heightFtIn(scr, wrap, root);
```

Then add `heightFtIn` as a sibling function immediately after `rInput` closes
(currently after `app.js:400`):

```js
  // ft + in height entry. Canonical S.height_cm is written on every keystroke; the raw ft/in
  // pair is kept in answers so back-navigation refills exactly what was typed.
  function heightFtIn(scr, wrap, root) {
    const pair = el("div", "field-pair");
    const mk = (ph, lbl, val) => {
      const f = el("div", "field");
      const i = el("input"); i.type = "number"; i.inputMode = "numeric";
      i.placeholder = ph; i.value = val;
      f.appendChild(i); f.appendChild(el("span", "u", lbl));
      pair.appendChild(f);
      return i;
    };
    const saved = S.height_cm ? cmToFtIn(S.height_cm) : { ft: "", inch: "" };
    const ftIn = mk("5", "ft", S.answers.height_ft ?? (saved.ft || ""));
    const inIn = mk("9", "in", S.answers.height_in ?? (saved.inch === "" ? "" : saved.inch));
    wrap.appendChild(pair);
    const err = el("div", "input-err"); err.style.display = "none"; wrap.appendChild(err);
    root.appendChild(wrap);

    function problem() {
      const ft = parseFloat(ftIn.value), inch = inIn.value === "" ? 0 : parseFloat(inIn.value);
      if (!(ft > 0)) return "";
      if (!(inch >= 0 && inch <= 11)) return "Inches should be between 0 and 11";
      const cm = ftInToCm(ft, inch);
      if (cm < 100 || cm > 220) return "Check Your height value";
      return "";
    }
    function valid() { return parseFloat(ftIn.value) > 0 && !problem(); }
    function showErr() { const p = problem(); err.textContent = p; err.style.display = p ? "block" : "none"; }
    function commit() {
      if (valid()) {
        S.answers.height_ft = ftIn.value;
        S.answers.height_in = inIn.value;
        S.answers[scr.id] = String(ftInToCm(ftIn.value, inIn.value));
        S.height_cm = ftInToCm(ftIn.value, inIn.value);
        S.bmi = bmi(); save();
      }
    }
    const btn = inlineCta("Continue", () => { commit(); showErr(); if (valid()) go(1); }, !valid());
    const onIn = () => { commit(); showErr(); btn.disabled = !valid(); };
    ftIn.oninput = onIn; inIn.oninput = onIn;
    [ftIn, inIn].forEach(i => {
      i.onkeydown = (e) => { if (e.key === "Enter") { commit(); showErr(); if (valid()) go(1); } };
    });
    keepVisible(ftIn, btn);
    setTimeout(() => ftIn.focus(), 50);
  }
```

- [ ] **Step 5: Clear the ft/in answers when switching to metric**

In `rInput`'s toggle `onclick` (Task 2, Step 4), before the re-render, add:

```js
        if (scr.field === "height") { delete S.answers.height_ft; delete S.answers.height_in; }
```

so a metric switch repaints from `S.height_cm` rather than stale raw entries.

- [ ] **Step 6: Style the pair**

Add to `assets/quiz.css` after the `.field` rules:

```css
/* ft + in entry: two equal fields so neither reads as the primary one */
.field-pair{display:grid;grid-template-columns:1fr 1fr;gap:12px;max-width:360px;margin:0 auto}
.field-pair .field{margin:0}
```

- [ ] **Step 7: Run the test to verify it passes**

`height_cm` is 175, BMI reads 26.6, inches 13 errors, back-navigation refills 5 and 9.

- [ ] **Step 8: Commit**

```bash
git add assets/app.js assets/quiz.css
git commit -m "feat(quiz): ft+in height entry replaces decimal feet"
```

---

### Task 4: Unit-aware display copy

**Files:**
- Modify: `assets/app.js:193-201` (`personalize`)
- Modify: `assets/config.js:77,78,135,185`

**Interfaces:**
- Consumes: `S.units` (Task 1)
- Produces:
  - `wLabel(): "lb" | "kg"`
  - `kgToDisp(kg): number`
  - `{wu}` token available in every `personalize()`-rendered string

- [ ] **Step 1: Write the failing test**

Seed a session (weight 81.6 kg, goal 72.6 kg, height 175 cm) in both unit modes and
drive to `projection_2`. Assert:

```js
// imperial
await page.evaluate(() => document.querySelector("h1.q").textContent)
// contains "180" and "lb", and does NOT contain "kg"
```

Then the trap test — the projected date must be identical in both modes for the same
underlying kilograms:

```js
await page.evaluate(() => document.querySelector("h1.q").textContent.match(/by (\w+ \d+)/)[1])
// imperial result === metric result
```

- [ ] **Step 2: Run it to verify it fails**

Expected: imperial shows `73kg`, and once `{lose}` is naively converted the imperial
date lands ~2× further out than the metric one.

- [ ] **Step 3: Add the display helpers**

Next to `unitFor` (Task 2):

```js
  function wLabel() { return S.units === "imperial" ? "lb" : "kg"; }
  function kgToDisp(kg) { return S.units === "imperial" ? Math.round(kg * 2.20462) : Math.round(kg); }
```

- [ ] **Step 4: Make `personalize` unit-aware**

Replace the body of `personalize` (`app.js:193-201`) from the `const now` line down:

```js
    const nowKg = S.weight_kg || 0, goalKg = S.goal_weight_kg || 0;
    const loseKg = nowKg && goalKg ? Math.max(0, nowKg - goalKg) : 0;
    // projDate does its arithmetic in kg (~1kg / 2 weeks), so it gets loseKg — never the
    // display value. Feeding it pounds would roughly double every projected date.
    const now = nowKg ? kgToDisp(nowKg) : 0, goal = goalKg ? kgToDisp(goalKg) : 0;
    const lose = loseKg ? kgToDisp(loseKg) : 0;
    const pct = nowKg && loseKg ? Math.round((loseKg / nowKg) * 100) : 0;
    return t.replace(/\{decade\}/g, decade).replace(/\{genderPlural\}/g, gp).replace(/\{name\}/g, S.name || "")
      .replace(/\{goal\}/g, goal || "your goal").replace(/\{now\}/g, now || "")
      .replace(/\{lose\}/g, lose).replace(/\{pct\}/g, pct)
      .replace(/\{wu\}/g, wLabel()).replace(/\{projdate\}/g, projDate(loseKg));
```

- [ ] **Step 5: Tokenize the config copy**

Four edits in `assets/config.js`:

- line 77: `{goal}kg</span> by {projdate}` → `{goal}{wu}</span> by {projdate}`
- line 78: `"You only have to lose {lose} kg"` → `"You only have to lose {lose} {wu}"`
- line 135: `**{goal} kg** goal!` → `**{goal} {wu}** goal!`
- line 185: `{goal}kg</span> by {projdate}` → `{goal}{wu}</span> by {projdate}`

- [ ] **Step 6: Run the test to verify it passes**

Imperial reads `180 lb` with no `kg` anywhere; both modes produce the same date.

- [ ] **Step 7: Commit**

```bash
git add assets/app.js assets/config.js
git commit -m "feat(quiz): unit-aware projection and goal copy via {wu} token"
```

---

### Task 5: Charts and the plan-ready headline

**Files:**
- Modify: `assets/app.js:218-251` (`projChart`), `assets/app.js:607-620` (`chartEl`), `assets/app.js:752-754` (`rGoals`)

**Interfaces:**
- Consumes: `kgToDisp`, `wLabel` (Task 4)
- Produces: nothing new

- [ ] **Step 1: Write the failing test**

Seeded imperial session, on `projection_1`:

```js
await page.evaluate(() => document.querySelector(".projchart svg").getAttribute("aria-label"))
// contains "180lb" and "160lb", not "kg"
await page.evaluate(() => document.querySelector(".projchart").textContent.includes("kg"))  // false
```

On the goals screen:

```js
await page.evaluate(() => document.querySelector(".chartlabels").textContent)  // contains "lb", not "kg"
await page.evaluate(() => document.querySelector("h1.q").textContent)          // contains "lb"
```

- [ ] **Step 2: Run it to verify it fails**

Expected: every label still ends in `kg`.

- [ ] **Step 3: Convert `projChart`**

Replace `app.js:218-221`:

```js
    const nowKg = Math.round(S.weight_kg || 92);
    const goalKg = Math.round(S.goal_weight_kg || Math.round(nowKg * 0.85));
    const loseKg = Math.max(0, nowKg - goalKg);
    const month = projMonth(loseKg);                    // kg in, per the global constraint
    const wu = wLabel();
    const now = kgToDisp(nowKg), goal = kgToDisp(goalKg), lose = kgToDisp(loseKg);
```

Then in the template literal, append `${wu}` where `kg` is hardcoded — lines 230
(both occurrences in `aria-label`), 236, 242, 247. Example for 230:

```js
    <svg viewBox="18 0 306 200" width="100%" role="img" aria-label="Projected weight from ${now}${wu} to ${goal}${wu} by ${month}">
```

- [ ] **Step 4: Convert `chartEl`**

Replace `app.js:608`:

```js
    const nowKg = S.weight_kg || 78, goalKg = S.goal_weight_kg || Math.round((S.weight_kg || 78) * 0.85);
    const wu = wLabel(), now = kgToDisp(nowKg), goal = kgToDisp(goalKg);
```

and line 619:

```js
      <div class="chartlabels"><span>Now · ${now}${wu}</span><span>Goal · ${goal}${wu}</span></div>`;
```

- [ ] **Step 5: Convert the plan-ready headline**

`app.js:753` — replace `{goal}kg` with `{goal}{wu}`:

```js
      ? `${S.name ? S.name + ", reach" : "Reach"} your goal of <span class='hl'>{goal}{wu}</span> by {projdate}`
```

- [ ] **Step 6: Run the test to verify it passes**

No `kg` renders anywhere in imperial mode. Re-run the metric context to confirm it
still reads `kg` — this task is where a wrong default silently makes metric wrong too.

- [ ] **Step 7: Commit**

```bash
git add assets/app.js
git commit -m "feat(quiz): unit-aware projection charts and plan-ready headline"
```

---

### Task 6: Analytics property + cache-bust

**Files:**
- Modify: `assets/app.js:173` (`quiz_start` props)
- Modify: `quiz.html:53-54`, `quiz-b.html:54-55`, `quiz-c.html:54-55` (only if needed — see Step 3)

**Interfaces:**
- Consumes: `S.units` (Task 1)
- Produces: `units` on the `quiz_start` event

- [ ] **Step 1: Write the failing test**

Fresh imperial context, then:

```js
await page.evaluate(() => window.dataLayer.find(e => e.event === "tm_quiz_start").tm_props.units)  // "imperial"
```

- [ ] **Step 2: Run it to verify it fails**

Expected: `undefined`.

- [ ] **Step 3: Add the property**

`app.js:173` — add `units: S.units` to the `quiz_start` props only (not `quiz_step`,
which fires on every screen and would multiply the payload for no extra signal):

```js
TM.track("quiz_start", { variant: VARIANT, units: S.units });
```

- [ ] **Step 4: Check whether a cache-bust bump is needed**

```bash
curl -sL https://taimotion.com/quiz | grep -oE 'assets/(config|app|quiz)\.(js|css)\?v=[0-9]+'
```

As of 2026-07-30 live is `quiz.css?v=37`, `config.js?v=59`, `app.js?v=72`, while the
tree already carries `38/60/73` from `bd8fa07` — which was never deployed. If the curl
still shows `37/59/72`, **no bump is needed**: the pending `38/60/73` has not shipped
and will carry these changes. If it shows `38/60/73`, someone pushed in the meantime —
bump all three to `39/61/74` in all three quiz HTML files.

- [ ] **Step 5: Run the test to verify it passes**

`units` is `"imperial"`. Also confirm the metric context reports `"metric"`.

- [ ] **Step 6: Full-funnel regression pass**

Before committing, walk variants A, B and C end to end in imperial and A in metric.
Confirm: no `kg` in imperial, no `lb` in metric, variant C never renders a body-metrics
or projection screen, and no console errors in any run.

- [ ] **Step 7: Commit**

```bash
git add assets/app.js
# add the HTML files too, only if Step 4 required a bump
git commit -m "feat(quiz): report detected unit system on quiz_start"
```

---

### Task 7: Persist `measurement_system` on the quiz session

**Files:**
- Modify: `supabase/functions/submit-quiz/index.ts:21-39`
- Postgres: `quiz_sessions`

**Interfaces:**
- Consumes: `S.units` (Task 1), sent by the existing `API.submitQuiz(...S)` call at `app.js:642`
- Produces: `quiz_sessions.measurement_system` — `text`, nullable, `'imperial' | 'metric' | null`

- [ ] **Step 1: Reconcile git against the live deploy (mandatory, `CLAUDE.md`)**

```bash
git fetch
cd /Users/mintarasgrinius/Documents/taichi/taichi/supabase/functions
supabase functions download submit-quiz --project-ref pixtozeghxwiidpnloih
deno fmt submit-quiz/index.ts
```

Diff **logic** against git, ignoring formatting (the download is a transpiled eszip
bundle — types stripped, reformatted). If the deployed logic differs, commit the
deployed version as the baseline BEFORE editing. Do not skip this: another session was
editing sibling functions on 2026-07-30.

- [ ] **Step 2: Add the column**

Apply via the Supabase MCP `apply_migration` tool (this repo has no `migrations/`
directory — schema is applied directly), name `add_quiz_sessions_measurement_system`:

```sql
alter table public.quiz_sessions add column if not exists measurement_system text;

comment on column public.quiz_sessions.measurement_system is
  'Unit system the visitor took the quiz in (imperial|metric). Copied into users.measurement_system at checkout so the member app matches the funnel. Null for sessions predating 2026-07-30.';
```

Nullable with no default on purpose: null distinguishes "predates this feature" from a
real choice, which the `create-subscription` copy in Task 8 relies on.

- [ ] **Step 3: Verify the column exists**

```sql
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema='public' and table_name='quiz_sessions' and column_name='measurement_system';
```

Expected: one row, `text`, `YES`, null default.

- [ ] **Step 4: Persist it in the function**

In the `row` object (`submit-quiz/index.ts:21-39`), after `bmi`:

```ts
      measurement_system: s.units === "imperial" || s.units === "metric" ? s.units : null,
```

Validating against the two literals keeps an arbitrary client-supplied string out of a
column the member app reads.

- [ ] **Step 5: Deploy**

```bash
cd /Users/mintarasgrinius/Documents/taichi/taichi
supabase functions deploy submit-quiz --no-verify-jwt --project-ref pixtozeghxwiidpnloih
```

`--no-verify-jwt` is required — see `supabase/functions/README.md:58`.

- [ ] **Step 6: Verify end to end**

Complete a quiz through email capture in an imperial context against the **local**
server (it posts to the real edge function), then:

```sql
select id, measurement_system, weight_kg, goal_weight_kg, height_cm, created_at
from quiz_sessions order by created_at desc limit 3;
```

Expected: newest row has `measurement_system = 'imperial'` and metric body values
(e.g. `weight_kg` 81.6, not 180).

- [ ] **Step 7: Commit**

```bash
git add supabase/functions/submit-quiz/index.ts
git commit -m "feat(submit-quiz): persist the funnel's measurement system"
```

Committing the deployed code in the same session is required by `CLAUDE.md`.

---

### Task 8: Carry the unit system into `users`

**Files:**
- Modify: `supabase/functions/create-subscription/index.ts:51`, `:80-88`

**Interfaces:**
- Consumes: `quiz_sessions.measurement_system` (Task 7)
- Produces: `users.measurement_system` populated at checkout

- [ ] **Step 1: Reconcile git against the live deploy (mandatory, `CLAUDE.md`)**

```bash
git fetch
cd /Users/mintarasgrinius/Documents/taichi/taichi/supabase/functions
supabase functions download create-subscription --project-ref pixtozeghxwiidpnloih
deno fmt create-subscription/index.ts
```

Diff logic, not formatting. Reconcile first if they differ.

- [ ] **Step 2: Select the column from the quiz row**

`create-subscription/index.ts:51` — add `measurement_system` to the select list:

```ts
    const { data: quiz } = await db.from('quiz_sessions').select('id,email,name,gender,age_band,height_cm,goal_weight_kg,measurement_system').eq('id', quiz_session_id).maybeSingle();
```

- [ ] **Step 3: Copy it using `newAccount`, not a null check**

The spec flagged this as needing verification; it is now resolved. The sibling fields
use `if (urow?.x == null && ...)`, but `users.measurement_system` is
`text default 'metric'`, and `resolveUser()` (line 57) creates the row *before* `urow`
is fetched (line 69-70). So a brand-new user always reads `'metric'`, never null, and a
null guard would never fire. Use the `newAccount` flag already destructured at line 57 —
a just-created account is exactly "has never expressed a preference".

After line 88 (the `target_weight_kg` copy), add:

```ts
    // measurement_system has a non-null column default ('metric'), so the null-guard pattern
    // used above can never fire for it. newAccount is the real signal: only adopt the quiz's
    // units for an account created by this checkout — never override units an existing member
    // has chosen in Profile settings.
    if (newAccount && quiz.measurement_system) updates.measurement_system = quiz.measurement_system;
```

- [ ] **Step 4: Deploy**

```bash
cd /Users/mintarasgrinius/Documents/taichi/taichi
supabase functions deploy create-subscription --project-ref pixtozeghxwiidpnloih
```

No `--no-verify-jwt` — this one deploys with `verify_jwt` on (`README.md:55`).

- [ ] **Step 5: Verify with a test checkout**

Run a checkout using the `TMTEST50` test-promo flow (`create-subscription` routes it to
the $0.50 test price) from an imperial quiz with a fresh email, then:

```sql
select u.email, u.measurement_system, u.height_cm, u.target_weight_kg, q.measurement_system as quiz_units
from users u join quiz_sessions q on q.id = u.linked_quiz_session_id
order by u.created_at desc limit 3;
```

Expected: newest row has `measurement_system = 'imperial'` matching `quiz_units`.

- [ ] **Step 6: Confirm the member app honours it**

Log into `taichi_app` as that user and confirm weights render in lb without touching
Profile settings — this is the gap the whole write-through exists to close.

- [ ] **Step 7: Commit**

```bash
git add supabase/functions/create-subscription/index.ts
git commit -m "feat(create-subscription): seed users.measurement_system from the quiz"
```

---

## Self-Review

**Spec coverage:** §1 session-level units → Task 1; §2 display layer → Tasks 4-5; §3
height ft/in → Task 3; §4 slider unit read → Task 2 Step 6; §5 write-through → Tasks
7-8; §6 analytics → Task 6; cache-bust → Task 6 Step 4; A/B annotation → Rollout below.

**Resolved from the spec:** the `create-subscription` guard question (Task 8 Step 3) —
`newAccount`, because the column's non-null default makes the null-guard pattern dead.

**Naming consistency:** `unitFor`, `setUnits`, `wLabel`, `kgToDisp`, `ftInToCm`,
`cmToFtIn`, `detectUnits`, `IMPERIAL_REGIONS`, `IMPERIAL_TZ` are each defined once
(Tasks 1-4) and used with those exact names thereafter. `toKg` and `toCm` are
pre-existing and retained — `toCm` still serves metric plus legacy decimal-ft sessions.

## Rollout

1. Land Tasks 1-6 (funnel assets), then 7-8 (data + edge functions).
2. `git push` only on the user's say-so — that is the Cloudflare Pages deploy.
3. Add a PostHog annotation (US project 525048, "Tai Motion") at deploy time noting the
   imperial default, so the quiz-length A/B/C readout accounts for the step change.
   Variant C is unaffected (it cuts all body-metrics and projection screens), so the
   change is A-and-B only.
4. Watch `quiz_start` `units` distribution for the first hours. A near-100% imperial
   split would mean detection is falling through to the timezone branch behind
   Cloudflare rather than reading locale — the signal the spec added it for.
