# Imperial units by default in the onboarding funnel

**Date:** 2026-07-30
**Status:** implemented and deployed. Amended after the whole-plan review to
match what shipped — see the *superseded* notes in §Decisions and §Architecture
3/4, and §Lessons carried forward.
**Baseline commit:** `bd8fa07` (bounded goal-weight slider + `ld` tick labels)

> **Reading note on line numbers.** This document originally pinned
> `file:line` references to the baseline commit. `app.js` has since grown to
> ~1025 lines and every one of those pins had rotted. References are now by
> function name, which survives edits; a line number appears only where it
> genuinely helps, and is re-derived as of this amendment.

## Goal

Make US customary units (lb, ft/in) the default measurement system in the quiz
funnel, and render every downstream screen in the user's units — not just the
input fields. Carry the choice into the member app so a US buyer never sees kg.

## Why this is more than a default flip

The funnel has no "unit preference". `rInput` and `rSlider` each read
`S.answers[<screen>_unit] || scr.units[0]`, so today's default is an accident of
array order in `config.js` (`units: ["cm","ft"]`, `["kg","lb"]` on the three
body-metric screens).

Meanwhile all display copy is hardcoded metric: `personalize()` substitutes
`{now}`/`{goal}`/`{lose}` with raw kg, and the literal string `kg` appears in
four `config.js` copy strings and six `app.js` sites.

So flipping the array order alone ships a broken funnel: a user enters `180 lb`
and three screens later reads *"We predict you'll hit 82kg by September 12"* and
*"You only have to lose 9 kg."*

Separately, height in `ft` is a **decimal** field (`toCm: v * 30.48`), so 5'9"
must be typed as `5.75`. A US user types `5.9` and silently records 180cm,
corrupting the BMI that the funnel shows back as a trust signal.

## Decisions

| Decision | Choice |
|---|---|
| Scope | Full imperial experience: body-metric entry, all display copy, charts |
| Default rule | Detect from locale/timezone, not unconditional |
| Height entry | ~~Two fields (ft + in) in imperial; single cm field in metric~~ **Superseded** — a single slider stepping in whole inches, displayed as ft + in. See §3. |
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

A unit descriptor exposing `wLabel` (`"lb"`/`"kg"`) and `kgToDisp`, mirroring the
convention `rSlider` already established (bounds computed in kg, projected into
the display unit, canonical answer kept in kg).

*(As built: `cmToFtIn` / `ftInToCm` were planned here but never needed — the
height slider does the ft/in split inline in its `sliderSpec` branch, and no
other caller wants the conversion. They do not exist in the shipped code.)*

- `personalize()` converts `{now}`, `{goal}`, `{lose}` into display units and
  gains a `{wu}` token for the unit label.
- All 10 hardcoded `kg` sites become `{wu}` / `${wu}`: four copy strings in
  `config.js`, six sites in `app.js`. One of the `app.js` sites is the
  projection chart's `aria-label` — screen-reader text, easy to miss.
- Weight displays round to whole units. BMI and `{pct}` stay unitless.

**Trap:** `projDate()` / `projMonth()` do date arithmetic on kilograms
(`~1 kg per 2 weeks`). They must keep receiving kg. `personalize()` therefore
keeps a separate `loseKg` for date math alongside the display `lose`. Feeding lb
into `projDate` would roughly double every projected date. This is restated as
an invariant in §Lessons carried forward, beside the closely related
displayed-delta rule.

### 3. Height input — **superseded mid-flight by the height slider**

> The original design here was two numeric fields (ft, in) in imperial and the
> existing single cm field in metric, with `toCm = ft*30.48 + in*2.54`, 0–11
> inch validation, and a `quiz.css` rule for the side-by-side pair. It was
> **not** built. While this plan was in flight, a concurrent workstream
> converted all three body-metric screens to sliders; the human accepted that as
> the height solution rather than reverting it. This is a deliberate mid-flight
> design change, not an unimplemented section. What follows is the as-built
> design.

**As built.** `height` is `type: "slider"` in `config.js`, rendered by
`rSlider` from a `sliderSpec()` branch that reads `S.units`:

- **Imperial:** one thumb stepping in **whole inches**, bounds `55–79 in`
  (4'7"–6'7"), *displayed* as "5 ft 9 in" — the readout splits inches into
  `Math.floor(v/12)` ft and `v % 12` in. The end label reads `5'9"` and the
  screen-reader string reads "5 feet 9 inches".
- **Metric:** one thumb in whole cm, bounds `140–200`.
- `S.height_cm` stays canonical (`Math.round(inches * 2.54)`), and the thumb is
  always re-derived from it, so toggling units **converts** rather than clears.

This solves the same trap the two-field design was aimed at — 5'9" cannot be
mistyped as `5.75` or `5.9`, because there is nothing to type. For a 40–80
audience on a phone that is strictly better than two number fields with focus
juggling: no keyboard, no 0–11 inch validation, no error state at all, since the
bounds *are* the validation and every reachable position is legal. The old
100–220 cm guard and its error copy are therefore gone too — unreachable.

`S.answers.height_ft` / `height_in` are still written on the imperial branch and
deleted on the metric one, but they are now **write-only**: the slider re-derives
from `S.height_cm` and nothing reads them back. They are kept deliberately as the
only imperial-session marker in stored data (see §Lessons carried forward).

`quiz.css` did **not** gain a `.field-pair` rule. A field-pair rule was added and
then removed with the two-field design; what the slider needed instead was
`.sl-read .sl-u + .sl-num`, the gap between a unit label and the number that
follows it — i.e. between the "ft" and the "9" of "5 ft 9 in".

### 4. Body-metric sliders

`rSlider` (added in `bd8fa07`) started as the goal-weight renderer and is no
longer goal-weight-only: it now renders **all three** body screens (`height`,
`weight`, `goal_weight`). The per-screen differences — bounds, step unit,
readout markup, canonical getter/setter, feedback line — moved out into
`sliderSpec(scr)`, which returns one descriptor per screen per unit system and
is the single place `S.units` is consulted for these screens.

The mechanism `bd8fa07` established is unchanged: kg (or cm) bounds projected
into the display unit, canonical state metric, thumb re-derived from canonical
state on every render. Only `goal_weight` prefills its default (it is derived
from the weight just given, and the projection screens need `{goal}`/`{lose}`/
`{pct}` to resolve); `height` and `weight` must not, or a midpoint nobody chose
would be indistinguishable from a real answer.

`rInput` survives for one path only — `rSlider`'s goal-weight deep-link fallback,
taken when `goal_weight` is reached without `S.weight_kg` (bounds cannot be
computed). Its units there are always kg/lb. Its height branch was removed in the
review fix wave: it was unreachable, and internally broken besides (it prefilled
cm under an "ft" label and re-read it through `toCm(v, "ft")`, yielding ~5334 cm
and a permanently failing 100–220 guard — an unrecoverable dead-end screen for
any imperial visitor who reached it). `toCm` was deleted with it: zero callers.

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

`units` goes to `submit-quiz` and is sent as a PostHog property at quiz start,
so conversion can be segmented by detected units and misfiring detection behind
Cloudflare is observable. PostHog target is the US project "Tai Motion" (525048)
via the proxy.

*(As built: the property is attached at the `TM.track("quiz_start", …)` call
site in `assets/app.js`, which is where `S.units` is in scope. `analytics.js` is
a generic transport and was never modified.)*

## Files touched

| File | Change |
|---|---|
| `assets/app.js` | `detectUnits`, `S.units`, session migration, `wLabel`/`kgToDisp`, `personalize`, `sliderSpec` unit branches, `rSlider` unit read, chart labels, `quiz_start` `units` property |
| `assets/config.js` | 3 body-metric screens (all now `type: "slider"`), 4 copy strings |
| `assets/quiz.css` | `.sl-read .sl-u + .sl-num` — the gap between a unit label and the number after it in the "5 ft 9 in" readout. *Not* a `.field-pair` rule: that was added for the two-field design and removed with it. |
| `quiz.html`, `quiz-b.html`, `quiz-c.html` | `?v=` bumps on config/app/css |
| `supabase/functions/submit-quiz/index.ts` | persist `measurement_system` |
| `supabase/functions/create-subscription/index.ts` | copy into `users` |
| migration | `quiz_sessions.measurement_system` |

Live versions as of 2026-07-30 are `quiz.css?v=37`, `config.js?v=59`,
`app.js?v=72`; the working tree already carries `38/60/73` from `bd8fa07`.
Re-check what is live before bumping — Cloudflare Pages deploys on push, so
"live" always equals the last pushed commit. (Those numbers were the starting
point, not the end state; after the slider rework and this plan the tree carries
`quiz.css?v=40`, `config.js?v=61`, `app.js?v=76`.)

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
2. Arithmetic check: drag the height slider to the position reading **5 ft 9 in**
   and the weight slider to **180 lb**, then confirm the weight screen's BMI
   feedback reads **26.6**. (Originally written against typed ft/in + lb fields;
   the numbers are unchanged, only the UI is.)
3. Toggle round-trip: enter in imperial, switch to metric, confirm the value
   converts rather than clearing or drifting.
4. Legacy-session check: load a session saved before this change and confirm
   entered values are not reinterpreted.
5. One real submit, then read the `quiz_sessions` row back to confirm
   `measurement_system` landed; then a subscription create to confirm it
   reaches `users`.

## Lessons carried forward

Three things this plan learned the hard way. They outlive the plan and belong
with the design, not in a task log.

### Numeric invariants

**(a) The displayed-delta rule.** A displayed "lose" figure must be derived from
the already-rounded displayed pair, never by rounding the kg delta separately.
Two independent roundings disagree: with `now = 50.5 kg` and `goal = 45.7 kg`,
the pair displays as `111 lb` and `101 lb`, but the 4.8 kg delta is 10.58 lb and
rounds to `11`, so the screen asserts `111 lb − 101 lb = 11 lb`. Compute
`lose = disp(now) − disp(goal)` instead. The goal-weight slider's feedback line
and `personalize()` both follow this, and they must stay in agreement — the same
trap produced a one-unit disagreement *between* those two screens before they
were aligned.

**(b) The `projDate` / `projMonth` kilogram invariant.** Those two do date
arithmetic at roughly 1 kg per 2 weeks, so they must always be handed kilograms,
never display units. `personalize()` keeps a separate `loseKg` alongside the
display `lose` for exactly this. Passing lb would roughly double every projected
date. `{pct}` likewise stays computed off the true kg delta.

These pull in opposite directions and that is the point: **display** derives from
the rounded display pair, **arithmetic** derives from canonical kg. Any new
screen mixing the two has to pick per-value, not per-screen.

### Rollout order: ship the persistence side first

The funnel assets went live roughly **35 hours** before `submit-quiz` did. In
that window `S.units` was correctly detected, set on the session and transmitted
— and silently dropped by an edge function that had no `measurement_system`
column to put it in. 19 imperial sessions and several accounts created from them
lost their unit preference and needed a backfill.

Both changes were individually correct and individually reviewed. Only their
**deploy order** created the gap, and nothing in either change could have caught
it, because neither is wrong on its own.

The rule: when a feature splits across a client and a persistence layer, **ship
the persistence side first**. A column and a writer that accept a field nobody
sends yet are inert; a client that sends a field nobody stores loses data for
every user in the window. Where the split is unavoidable, the interval is a
known data-loss window — size it, and plan the backfill before deploying, not
after noticing.

Related: `S.answers.height_ft` / `height_in` are retained *because of* this
incident. They are write-only, but they are the only marker in stored session
data that identifies an imperial session after the fact, which is what made the
backfill possible and what any future BI query would filter on. Do not garbage-
collect them as dead state.
