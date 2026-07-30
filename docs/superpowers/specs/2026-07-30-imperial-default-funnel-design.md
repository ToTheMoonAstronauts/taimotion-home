# Imperial units by default in the onboarding funnel

**Date:** 2026-07-30
**Status:** approved, ready for implementation plan
**Baseline commit:** `bd8fa07` (bounded goal-weight slider + `ld` tick labels)

## Goal

Make US customary units (lb, ft/in) the default measurement system in the quiz
funnel, and render every downstream screen in the user's units — not just the
input fields. Carry the choice into the member app so a US buyer never sees kg.

## Why this is more than a default flip

The funnel has no "unit preference". `rInput` (`app.js:341`) and `rSlider`
(`app.js:410`) each read `S.answers[<screen>_unit] || scr.units[0]`, so today's
default is an accident of array order in `config.js` (`units: ["cm","ft"]`,
`["kg","lb"]` at lines 58, 63, 68).

Meanwhile all display copy is hardcoded metric: `personalize()` substitutes
`{now}`/`{goal}`/`{lose}` with raw kg, and the literal string `kg` appears in
`config.js:77,78,135,185` and `app.js:230,236,242,247,619,753`.

So flipping the array order alone ships a broken funnel: a user enters `180 lb`
and three screens later reads *"We predict you'll hit 82kg by September 12"* and
*"You only have to lose 9 kg."*

Separately, height in `ft` is a **decimal** field (`toCm: v * 30.48`), so 5'9"
must be typed as `5.75`. A US user types `5.9` and silently records 180cm,
corrupting the BMI that the funnel shows back as a trust signal.

## Decisions

| Decision | Choice |
|---|---|
| Scope | Full imperial experience: inputs, all display copy, charts, ft/in entry |
| Default rule | Detect from locale/timezone, not unconditional |
| Height entry | Two fields (ft + in) in imperial; single cm field in metric |
| Write-through | Yes — funnel choice reaches `users.measurement_system` |

**Non-goals:** stone for UK weight; changing `users.measurement_system`'s
`'metric'` column default; any change to the member app's own unit handling
(it already works); imperial anywhere in `taichi_app`.

## Architecture

### 1. One session-level unit system

Add `units` to the session created by `fresh()` (`app.js:22`), holding
`"imperial"` or `"metric"`. It replaces the three per-screen
`S.answers[<screen>_unit]` values. The toggle on any input screen sets it for
every input screen and for all display copy.

`detectUnits()`, in priority order:

1. `?units=imperial|metric` query override. Deterministic for Playwright,
   screenshots and QA — this is what contains the reproducibility cost of
   locale detection.
2. Region from `navigator.language` / `navigator.languages` via `Intl.Locale`.
   Imperial when region is in `IMPERIAL_REGIONS = ["US","GB","LR","MM"]`, a
   single editable constant.
3. When the locale carries no region (bare `"en"`), the IANA zone from
   `Intl.DateTimeFormat().resolvedOptions().timeZone` against US zones:
   `America/New_York`, `America/Chicago`, `America/Denver`,
   `America/Los_Angeles`, `America/Phoenix`, `America/Anchorage`,
   `Pacific/Honolulu`.
4. Otherwise metric.

Resolved once at boot and saved on the session, so it cannot change mid-funnel
and is visible in analytics.

**In-flight sessions:** if a loaded session has no `units` but does have legacy
`_unit` answers, derive `units` from them; otherwise run detection. This keeps
users currently mid-funnel from having their entered values reinterpreted.

### 2. Display layer

A unit descriptor exposing `wLabel` (`"lb"`/`"kg"`), `kgToDisp`, `dispToKg`,
`cmToFtIn`, `ftInToCm`, mirroring the convention `rSlider` already established
(bounds computed in kg, projected into the display unit, canonical answer kept
in kg).

- `personalize()` (`app.js:193`) converts `{now}`, `{goal}`, `{lose}` into
  display units and gains a `{wu}` token for the unit label.
- All 10 hardcoded `kg` sites become `{wu}` / `${wu}`: `config.js:77,78,135,185`
  and `app.js:230,236,242,247,619,753`. `app.js:230` is the projection chart's
  `aria-label` — screen-reader text, easy to miss.
- Weight displays round to whole units. BMI and `{pct}` stay unitless.

**Trap:** `projDate()` / `projMonth()` (`app.js:205-217`) do date arithmetic on
kilograms (`~1 kg per 2 weeks`). They must keep receiving kg. `personalize()`
therefore keeps a separate `loseKg` for date math alongside the display `lose`.
Feeding lb into `projDate` would roughly double every projected date.

### 3. Height input

The height screen renders two numeric fields (ft, in) in imperial and the
existing single cm field in metric. `toCm = ft*30.48 + in*2.54`, rounded.

- Raw entries persist as `S.answers.height_ft` / `S.answers.height_in` so back
  navigation refills; `S.height_cm` stays canonical.
- Inches validate 0–11. The existing canonical 100–220 cm guard and its error
  copy are unchanged.
- Switching the toggle mid-entry **converts** the current value rather than
  clearing it.
- `quiz.css` gains a rule for the side-by-side field pair.

### 4. Goal-weight slider

`rSlider` (`app.js:407`, added in `bd8fa07`) is already imperial-capable — kg
bounds projected through `fromKg`, canonical `S.goal_weight_kg`, feedback in the
active unit. The only change is that line 410 reads `S.units` instead of
`S.answers[scr.id + "_unit"] || scr.units[0]`.

### 5. Write-through to the member app

`users.measurement_system` (`text default 'metric'`) already exists and drives
the member app (`taichi_app/assets/app.js:1260`). The funnel never fed it, so
every buyer starts metric until they find Profile → units.

- Migration: `alter table quiz_sessions add column measurement_system text`.
- `submit-quiz/index.ts` stores it beside `height_cm`/`weight_kg` (lines 29-31).
- `create-subscription/index.ts` copies it into `users` beside the existing
  `height_cm` / `target_weight_kg` copy (lines 87-88).

**To verify during implementation, not assume:** those two fields use an
`urow?.x == null` guard. Because `measurement_system` has a non-null column
default, that guard may never fire. Check when the `users` row is actually
created relative to this copy and pick the correct condition — the intent is
"set from the quiz unless the user has explicitly chosen units themselves".

Per `CLAUDE.md`: `supabase functions download` and diff both functions against
the live deploy **before** editing, and commit deployed code in the same
session. Another session was active in the edge-function tree on 2026-07-30, so
this diff matters more than usual.

### 6. Analytics

`units` goes to `submit-quiz` and is sent as a PostHog property at quiz start
(`analytics.js`), so conversion can be segmented by detected units and
misfiring detection behind Cloudflare is observable. PostHog target is the US
project "Tai Motion" (525048) via the proxy.

## Files touched

| File | Change |
|---|---|
| `assets/app.js` | `detectUnits`, `S.units`, session migration, unit descriptor, `personalize`, `rInput` ft/in, `rSlider` unit read, chart labels |
| `assets/config.js` | 3 input screens, 4 copy strings |
| `assets/quiz.css` | ft/in field pair |
| `assets/analytics.js` | units property |
| `quiz.html`, `quiz-b.html`, `quiz-c.html` | `?v=` bumps on config/app/css |
| `supabase/functions/submit-quiz/index.ts` | persist `measurement_system` |
| `supabase/functions/create-subscription/index.ts` | copy into `users` |
| migration | `quiz_sessions.measurement_system` |

Live versions as of 2026-07-30 are `quiz.css?v=37`, `config.js?v=59`,
`app.js?v=72`; the working tree already carries `38/60/73` from `bd8fa07`.
Re-check what is live before bumping — Cloudflare Pages deploys on push, so
"live" always equals the last pushed commit.

## A/B test interaction

Variant C already cuts `height`, `weight`, `goal_weight` and both projection
screens (`config.js:411`), so this change affects **A and B only**. It is still
a mid-flight change to the quiz-length test running since 2026-07-24, so add a
PostHog annotation at deploy time so the readout accounts for the step change.

## Verification

The funnel has no JS test framework; Deno tests cover only
`supabase/functions/_shared`. So:

1. Playwright pass in both modes via `?units=`, screenshotting height, weight,
   goal weight, both projection screens, and plan-ready.
2. Arithmetic check: 5'9" + 180 lb → BMI 26.6.
3. Toggle round-trip: enter in imperial, switch to metric, confirm the value
   converts rather than clearing or drifting.
4. Legacy-session check: load a session saved before this change and confirm
   entered values are not reinterpreted.
5. One real submit, then read the `quiz_sessions` row back to confirm
   `measurement_system` landed; then a subscription create to confirm it
   reaches `users`.
