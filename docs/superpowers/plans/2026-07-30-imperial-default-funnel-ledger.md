# SDD ledger — plan: docs/superpowers/plans/2026-07-30-imperial-default-funnel.md

Branch: `main` (human partner explicitly authorized working on main)
Baseline: 8e6e052
Static test server: http://localhost:8765 (python3 -m http.server, serving repo root)

Context notes for recovery:
- Another session is concurrently editing `supabase/functions/_shared/meta-capi.ts`,
  `meta-capi.test.ts`, `stripe-webhook/index.ts`. Those must never be staged by us.
- `assets/*.js` has no JS test framework; the spec-approved verification method is
  Playwright against the local static server. This is a deliberate spec decision,
  not missing test coverage.

## HAZARD: BASE contamination on main

The concurrent session commits to `main` between our commits. `git rev-parse HEAD`
recorded before dispatch is NOT a safe review BASE — it can include their commits.
Task 1's first package wrongly included `addaa74` ("Stop counting upsells as Purchases
in the Meta pixel"), theirs not ours. **Always derive the review range from the
implementer's own reported commits** (e.g. `<their-first-commit>^..<their-last>`),
then confirm with `git log --oneline BASE..HEAD` before dispatching a reviewer.

## Task 1

- BASE recorded ca54add; actual own-work range `addaa74..9c129d2` (theirs excluded).
- Implementer: agent `a59c54e51e8c82429` (resume for fix rounds 1-3).
- Task 1: review 1 — spec ❌, quality Needs fixes. 2 Important (both plan-mandated), 2 Minor.
  Important 1: TDZ — `const IMPERIAL_REGIONS`/`IMPERIAL_TZ` declared below the
  `let S = load() || fresh();` call site at app.js:30, so `detectUnits()` threw
  ReferenceError, the Safari-fallback `catch` swallowed it, and it returned "metric"
  for every real first-time visitor. Reviewer verified empirically.
  Important 2: all four test contexts used `?start`, which forces a second `fresh()`
  after the consts initialize — masking the bug. Cold-start coverage added.
- Task 1: ruling on reviewer's ⚠️ (legacy sessions with mixed per-screen units, e.g.
  height_unit "ft" + weight_unit "kg"): NOT a gap. Such sessions were possible under the
  old code, and the migration's `weight_unit || goal_weight_unit || height_unit`
  precedence picks one. Harmless: all stored body values are canonical metric, so no
  number is ever reinterpreted — only which unit the *remaining* screens display, and
  the visitor's next toggle tap corrects it. Weight-first is the right precedence since
  weight and goal weight are the values the projection copy depends on.
- Task 1: minor (deferred): dead `try/catch` around `URLSearchParams(location.search)` —
  URLSearchParams does not throw on malformed query strings per spec. Harmless
  defensiveness; left in place, flagged for the final review to triage.
- Task 1: plan corrected — Step 3 now mandates placement above `fresh()` with the reason,
  and the test matrix now includes the two cold-start contexts.

- Task 1: fix round 1/5 (3 addressed, 0 open; commits 9c129d2..f9cd241)
- Task 1: complete (commits 9c129d2..f9cd241, review clean)

## Task 2
- BASE recorded f9cd241; own-work range `3fdb8a2..c5f3fba` (theirs 3fdb8a2 excluded).
- Implementer: agent `a9ad0d69c4af67af8`.
- Task 2: review 1 — spec ✅, quality Approved. 0 Critical, 0 Important, 2 Minor.
- Task 2: minor (deferred): comment at app.js:404 overstates when the
  `S.answers[scr.id]` fallback is reachable — commit() writes answers and the canonical
  field together, so the fallback only fires before the first valid keystroke. Verbatim
  from the brief; comment inaccuracy only, no functional effect.
- Task 2: minor (deferred): no Playwright check for the weight input's *reverse* round
  trip (81.6 kg → back to lb → still 180?). Reviewer verified by numeric sweep over
  kg 30-200 / lb 50-400 that no drift occurs, so coverage-completeness only.
- Task 2: complete (commits 3fdb8a2..c5f3fba, review clean)

## Task 3
- Own-work range `1132f29..ec4b4f8` (theirs 1132f29 excluded — a revert of their own a5c9307).
- Implementer: agent `a9586f2768defbb81`. Reported DONE_WITH_CONCERNS (duplication concern, invited).
- Task 3: review 1 — spec ✅, quality Approved, but 1 Important (plan-mandated) + 3 Minor.
  Important: `keepVisible(inp, btn)` (app.js:818-822) binds `focus` to only the one input
  it is given and its `{once:true}` blur handler unregisters the shared visualViewport
  resize listener — so tabbing ft→in permanently kills keyboard-open CTA tracking on the
  height screen. Controller verified by reading keepVisible directly. Real mobile
  regression for a 40-80 audience; sent to fix round 1 rather than the human, since
  wiring both fields serves the plan's evident intent (the brief simply omitted it).
- Task 3: ruling on reviewer's ⚠️ (is `toCm`'s "ft" branch still reachable?): NOT a spec
  gap. Confirmed dead for height — `heightFtIn` intercepts every `unit === "ft"` render,
  so only `toCm(v,"cm")` (identity) is live; weight/goal use `toKg`, not `toCm`. A
  pre-change session already stores canonical `S.height_cm`, so nothing re-parses decimal
  feet. Keeping the branch (a plan constraint forbids deleting it) and correcting only the
  misleading comment. Folded into fix round 1.
- Task 3: minor (deferred): no integer guard on ft/in — `5.5` ft is accepted. Numerically
  defensible (5.5 ft with empty inches = 168cm, correct), and rejecting it would trade a
  mild ambiguity for a worse one. Deliberately not fixed.
- Task 3: minor (deferred): `heightFtIn` duplicates `rInput`'s problem/valid/commit closure
  shape and has already diverged twice — (a) `rInput.commit()` writes canonical height when
  `v > 0` even if `problem()` would reject, while `heightFtIn.commit()` writes only when
  fully valid; (b) `heightFtIn` has no `fb` element, so a future `note`/`computeBMI` on the
  height screen would render for cm visitors and silently not for ft/in ones. No defect
  today (config.js height screen has neither). Flagged for the final review to triage.
- Task 3: minor (deferred): comment accuracy on toCm — being fixed in round 1.
- Task 3: fix round 1/5 (2 addressed, 0 open; commits ec4b4f8..5db047c)
- Task 3: minor (deferred, PRE-EXISTING not introduced): `keepVisible` registers the
  visualViewport resize listener at render time rather than on first focus, and only tears
  it down on blur. A re-render that never blurs the input (programmatic paths) accumulates
  listeners. Present identically before this change. The live toggle path is safe — clicking
  a toggle button blurs the input, relatedTarget is the button (outside the set), so teardown
  fires. Flagged for the final review to triage.
- Task 3: complete (commits 1132f29..5db047c, review clean after 1 fix round)

## Task 4
- Own-work range `5db047c..a6dab72`. Implementer: agent `abdc91f33a82e6330` (DONE_WITH_CONCERNS).
- Task 4: review 1 — spec ✅, quality Approved, but 2 Important (both plan-mandated) + 2 Minor.
  Important A: `now`/`goal`/`lose` are each independently rounded from their own kg->lb
  conversion, so the three displayed numbers can fail to add up. Verified: nowKg=50.5,
  goalKg=45.6 renders "111 lb", "101 lb", "lose 11 lb" — 111-101=10, not 11. Customer-visible.
  Important B: `kgToDisp` applies Math.round in the METRIC branch too, so metric copy now
  shows "82kg"/"73kg" where it previously showed raw "81.6kg"/"72.6kg". A behavior change to
  metric display beyond the task's stated scope, and subject to the same add-up mismatch.
  Both originate in the brief's own kgToDisp design, not implementer error. ESCALATED TO HUMAN
  (plan-mandated + product copy judgment on a live funnel with an A/B test running).
- Task 4: ruling on reviewer's ⚠️ (projChart aria-label still hardcodes kg): NOT a gap.
  The plan assigns projChart, chartEl and the rGoals headline to Task 5. Confirmed against
  the plan's Task 5 file list. "No kg in imperial" becomes true funnel-wide after Task 5.
- Task 4: implementer's two DONE_WITH_CONCERNS claims independently verified TRUE by the
  reviewer: (1) `{now}` appears nowhere in config.js — projection_1/projection_2 both use
  `{goal}`, so the brief's "contains 180" example was wrong and the implementer correctly
  tested actual behavior (160 lb) and documented the discrepancy; (2) the PostHog A/B race
  was fixed in the test harness only, no app code touched.
- Task 4: minor (deferred, pre-existing): with no weight data, `{wu}` still substitutes next
  to the "your goal" fallback, rendering "your goallb"/"your goalkg". Pre-dates this task
  (old string was `{goal}kg` with the same fallback).
- Task 4: fix round 1/5 (1 addressed, 0 open; commits a6dab72..7dc7674). Human chose
  "derive lose from the displayed pair" + "keep whole numbers in metric". Re-reviewer
  verified all 3 preservation requirements (projDate gets loseKg, pct stays in kg,
  absent-value guards intact) by direct arithmetic rather than report trust.
- Task 4: complete (commits 5db047c..7dc7674, review clean after 1 fix round)

## COLLISION: concurrent session superseded Task 3 (d2d95b1)
The other session committed `d2d95b1 feat(quiz): height and weight become sliders too`
between our a6dab72 and 7dc7674. All three numeric screens are now `type: "slider"`
(config.js:58,62,65) and ZERO screens use `type: "input"`. Their `sliderSpec()` reads
`S.units` (our Task 1) and its imperial height branch writes canonical `S.height_cm` plus
`S.answers.height_ft`/`height_in` — our Task 3 answer keys. Their own comment: "Imperial
height steps in whole inches but READS as ft+in — one thumb, so the ft/in field pair (and
its focus-juggling) isn't needed here." So they superseded Task 3 deliberately, and it works.
HUMAN DECISIONS 2026-07-30/31:
  (a) Keep their slider; REMOVE our orphaned code -> new Task 3b below.
  (b) Slider bounds (height 140-200cm / 4'7"-6'7", weight 40-159kg / 88-350lb) are FINE as-is.
      Narrower than the old 100-220cm text validation; bounds-as-validation is the design.
Tasks 1, 2, 4 remain load-bearing (their slider depends on S.units). Tasks 5-8 unaffected.

## Task 3b (cleanup created mid-plan after the d2d95b1 collision; human-approved scope)
- Implementers: sonnet agent `a845150091d613377` made the edits but was killed twice by
  529 Overloaded before verifying/committing (Sonnet capacity incident — the safety
  classifier gating Bash/Agent runs on the same model, so the controller was blocked too).
  Finished by opus agent `aad84a276ea5c1467`.
- Controller independently confirmed all six removals by READING the files before letting
  anyone commit — deletions are where a wrong call silently breaks a live funnel.
- Task 3b: complete (commit 0bf3156). All 6 checks pass, 0 console errors across 9 pages.
  Load-bearing checks: imperial height slider still writes S.answers.height_ft/height_in
  from its own set() (proving only rInput's dead copy of the delete went), and the
  goal-weight rInput fallback still renders and commits with weight_kg unset.
- Task 3b: minor (deferred): `rInput`'s imperial-height branch is now internally
  inconsistent — it would prefill String(S.height_cm) under an "ft" label then re-read it
  through toCm(v,"ft"). Unreachable today (only the kg/lb goal-weight fallback enters
  rInput) but a live trap if any height screen ever returns to type:"input". toCm's ft
  branch and rInput's height placeholder/prefill/validation are dead for the same reason.
  Flagged for the final review to triage.
- Task 3b: note — `?step=` runs autotestFill(), which resets the session and always sets
  weight_kg, making the "weight_kg unset" fallback unreachable that way. The implementer
  correctly seeded via window.CTC + reload instead. Useful for future test authoring.

## Task 5
- Task 3b: INTERLEAVING NEAR-MISS, audited and clean. Our agent staged a whole assets/app.js
  that the other session had modified and committed in between (048cc1c "slider delta from
  displayed pair; bump app.js to v=75"). Committing a whole file after someone else edits it
  normally reverts their work silently. Verified it did not: their `extra: (v)` slider-delta
  fix is present in HEAD at app.js:528-530, and their loseKg line at 530. We escaped because
  048cc1c was ALSO deleting ftInToCm/cmToFtIn — both sessions independently found the same
  dead helpers, so the overlapping edits agreed. Only real collision was the one-line toCm
  comment; our wording won, and theirs was wrong anyway ("ft is rInput's live path" — rInput
  is now reached only for goal weight, whose units are kg/lb, so ft is dead either way).
  LESSON: after any concurrent commit to a file we hold uncommitted edits in, audit with
  `git show --stat <theirs>` + grep HEAD for their specific added lines before trusting it.
- Task 3b: the other session ALSO bumped app.js to v=75 in 048cc1c (quiz/quiz-b/quiz-c).
  Task 6's cache-bust step must re-derive from live rather than assuming 38/60/73.
- Task 3b: review — spec ✅, quality Approved. 0 Critical, 0 Important, 2 Minor.
  Notable attribution correction from the reviewer: ftInToCm/cmToFtIn were actually deleted by
  the OTHER session's 048cc1c, not by our 0bf3156 — at our base commit they were already gone,
  leaving 4 dangling call sites inside heightFtIn which our commit removed as a byproduct.
  End state is what was required; only the "who did it" framing was wrong. Reviewer also
  verified keepVisible's revert is byte-identical to the pre-feature code at ec4b4f8^, and
  confirmed the ?step=/autotestFill substitution was NECESSARY (autotestFill unconditionally
  assigns weight_kg, so ?step= provably cannot reach the !S.weight_kg fallback state).
- Task 3b: minor (deferred): the corrected toCm comment says '"cm" is the live path via
  rInput's goal-weight fallback', but that fallback passes "kg"/"lb" and hits the pass-through
  branch — "cm" is shorthand for "the non-ft branch" and could mislead. Cosmetic.
- Task 3b: complete (commit 0bf3156, review clean)

## Task 5
- Implementer: opus agent `afbd30d556573c3ae`. Commit 943ec2b, 47 assertions RED->GREEN.
- TWO DELIBERATE DEVIATIONS from the brief, both to be judged by the reviewer:
  (1) Converts from UNROUNDED canonical kg, not the brief's `Math.round(S.weight_kg)`. Rationale:
      a visitor entering 180 lb (stored 81.6 kg) would read 181 lb in the chart while
      personalize() renders 180 lb in the headline ON THE SAME SCREEN. Mirrors personalize().
  (2) Consequence: projMonth now receives the unrounded kg delta. Claimed no-op in metric
      (slider stores integer kg) and makes the chart month agree with {projdate}.
  Also: chartEl in metric now rounds (82kg vs raw 81.6kg) — consistent with the human's
  earlier "keep whole numbers in metric" decision.
- Six kg sites converted, incl. line 298 (Decrease risk) which the PLAN'S OWN LIST MISSED —
  controller found it while verifying anchors. Plan text should be corrected.
- Task 5: review — spec ✅, quality Approved. 0 Critical, 0 Important, 4 Minor.
  Reviewer independently verified BOTH deviations are CORRECT and that the brief was wrong:
  (1) converting from rounded kg would render 181 lb in the chart vs 180 lb in the headline on
      the SAME screen (Math.round(81.6)=82 -> 181; personalize's unrounded 81.6 -> 180).
      Nothing downstream needed integers; kgToDisp already rounds.
  (2) unrounded loseKg into projMonth is right: projDate/projMonth share the identical body, so
      passing personalize()'s same unrounded delta makes the chart month and {projdate} provably
      equal. Old rounded delta could differ by up to 1 kg = up to 14 days = a month boundary.
      Worked example 81.6/76.2: old 82-76=6 -> 84 days; new 5.4 -> 75.6 days, matching {projdate}.
  Small-delta edges verified safe (loseKg=0 -> (0||4)*2=8 weeks, unchanged; 0.4 -> Math.max floor).
  8 kg literals removed across 6 sites. projMonth byte-identical. Metric render path provably
  unchanged in projChartEl (kgToDisp metric === the removed Math.round).
- Task 5: minor (deferred): no assertion pins the chart month against {projdate}, so a future
  edit could re-round the delta before projMonth and the suite would still pass.
- Task 5: minor (deferred): the metric aria-label assertion builds its expected string from the
  observed month, so no test pins an absolute month for a known kg delta.
- Task 5: minor (deferred): report's "no-op in metric" is slightly overstated — metric canonical
  kg can be fractional via the goal_weight deep-link text-input fallback.
- Task 5: minor (deferred, PRE-EXISTING): on the deep-link path where weight_kg is null but
  goal_weight_kg is set, projChartEl computes loseKg from the 92kg placeholder while
  personalize() returns loseKg=0, so chart month and {projdate} disagree badly. Unchanged by us.
- Task 5: complete (commit 943ec2b, review clean)

## Task 6
!!! PRODUCTION: the other session PUSHED main, carrying Tasks 1/2/3/4 live.
`git merge-base --is-ancestor` confirms 9c129d2, c5f3fba, a6dab72, 7dc7674 are all in
origin/main. Only 0bf3156 (cleanup) and 943ec2b (charts) are still local — main is ahead 2.
Live serves quiz.css?v=39, config.js?v=61, app.js?v=75 (same as tree).
VERIFIED LIVE INCONSISTENCY: live config.js has `{goal}{wu}` (Task 4 copy -> renders "160 lb")
but live app.js still has `${now}kg` in the projection chart aria-label AND in .chartlabels.
So a live imperial visitor reads lb in the headline and kg in the chart ON THE SAME SCREEN.
Our fix for exactly this is 943ec2b — committed, reviewed clean, NOT pushed.
CAVEAT: 943ec2b does NOT bump ?v=, so pushing it alone will not reach returning visitors
holding a cached app.js?v=75. The bump is Task 6 step 4. Escalated to the human.
- Implementer: opus agent `a1d3dd84ddf578bd4`. Commit 7cd75cd (4 files).
- Task 6: review — spec ✅, quality Approved, DEPLOY READINESS: Safe to deploy.
  0 Critical, 0 Important, 8 Minor. Reviewer adversarially tested the gate itself: simulated
  the live kg/lb defect by flipping lb->kg across the real unit-bearing surfaces and confirmed
  the sweep CAUGHT it on all four (goals .chartlabels, goals .chartbox, projection_1 and
  projection_2 .projchart). Also independently re-ran the live curl (39/61/75 confirmed) and
  grepped all three HTML files for version consistency (40/61/76, config correctly unmoved).
- Task 6: minor (deferred) — the report's "no kg renders anywhere in imperial" is literally
  FALSE but the product is correct: the unit toggle legitimately renders a `kg` button in
  imperial (scr.units is ["kg","lb"]). The sweep missed it only by regex accident —
  textContent concatenates adjacent buttons into "kglb" and the (?![a-z]) lookahead kills the
  match. Intended behavior (a toggle must show both units), so "no kg anywhere" was never
  satisfiable; the claim should have been scoped to exclude the switcher.
- Task 6: minor (deferred): `assert(swept === ids.length)` is tautological (swept++ runs
  unconditionally, no continue/break); drift is counted and printed but never asserted; the
  settle wait ends in .catch(() => {}) swallowing an 8s timeout.
- Task 6: minor (deferred): the analytics test forces ?units= in all four contexts, so it never
  exercises the locale-derived branch the property exists to observe. Seam between suites —
  Task 1 covered detectUnits() itself.
- Task 6: minor (deferred): the gate is a per-screen deep-link render sweep, not a click-through
  walk — Continue transitions, commit() and mid-funnel toggling are not exercised here
  (Tasks 2/3 covered those).
- Task 6: minor (deferred): negative control duplicates the sweep's SKIP set and blob logic
  instead of sharing it; identical today, can drift.
- Task 6: complete (commit 7cd75cd, review clean)

## DEPLOYED 2026-08-01 (human-authorized: "finish Task 6, then push once")
Pushed 048cc1c..7cd75cd -> origin/main (0bf3156, 943ec2b, 7cd75cd). Cloudflare rebuilt.
Live verified: quiz.css?v=40, config.js?v=61, app.js?v=76; `units: S.units` present;
projection aria-label and .chartlabels both render ${wu}. The kg/lb mixed-unit defect is CLOSED.
GOTCHA worth remembering: immediately after the rebuild, a plain curl to
/assets/app.js?v=76 still returned the OLD body with `cf-cache-status: EXPIRED`. Cloudflare
caches that path ignoring the query string, so `?v=` busts BROWSER caches (the actual goal for
returning visitors) but not the edge — the edge revalidates on its own etag/max-age=14400.
Confirm a deploy with a cache-bypass fetch (`-H 'Cache-Control: no-cache'` + a random param)
or by diffing `git show origin/main:<file>`, never by a plain curl alone.
Tasks 7-8 (DB + edge functions) remain; they are additive and the funnel works without them.

## Task 7
- Implementer: opus agent `ad250b6a9b4028a32`. Commit ccb2182 (submit-quiz/index.ts only).
- Reconciliation per CLAUDE.md: deployed submit-quiz was byte-identical to git after deno fmt
  on both sides. No drift, nothing to baseline.
- Migration applied: quiz_sessions.measurement_system text, nullable, NO default. Verified.
- Deployed submit-quiz v21 with verify_jwt:false.
- E2E verified on the real sliders: imperial run -> measurement_system='imperial' with
  weight_kg=81.6 / height_cm=170 (entered 180 lb / 5'7"), proving the unit persisted AND
  canonical storage stayed metric. Metric run -> 'metric', weight_kg=82. Adversarial:
  units="IMPERIAL<script>" and omitted units both store null.
- SIDE EFFECT HANDLED BY CONTROLLER: the two email_captured test rows use
  @taimotion-test.invalid. `due_lead_emails` (the live drip's RPC) filters ONLY on
  email_suppressions — there is no test-address exclusion — so both rows would have entered
  the drip at step 1 (~1h after capture) and hard-bounced off the .invalid TLD four times each
  over 30 days. Inserted both into email_suppressions at 06:08Z, before the first send window.
  Rows left in place (not deleted): they are useful fixtures for Task 8 and deleting production
  data is worse than suppressing it.
- Task 7 concern (implementer): the deploy necessarily rebundled the concurrent session's newer
  _shared/meta-capi.ts. Claimed behaviorally inert for submit-quiz (Lead path byte-identical,
  never calls sendPurchase). Worth the reviewer's attention.
- Note: real production sessions from 03:51-04:37Z carry measurement_system=null because they
  predate this deploy — exactly the "null means predates the feature" semantics Task 8 relies on.
- Task 7: review — spec ✅, quality Approved. 0 Critical, 0 Important, 3 Minor.
  Reviewer independently re-verified against LIVE systems rather than the report: live schema
  (text/nullable/no default + exact comment), live function registry (submit-quiz v21, ACTIVE,
  verify_jwt:false), and the actual quiz_sessions rows. Also substantiated the meta-capi
  blast-radius claim by inspection: submit-quiz imports only { buildFbc, sendLead }; the
  concurrent session's new surface (buildUpsellPurchasePayload, sendUpsellPurchase, the
  sendPurchase->sendValueEvent refactor) is never referenced, and sendLead/buildFbc are
  untouched by that refactor. Scratch-tree incident left no residue.
  Confirmed the ternary is TOTAL: undefined resolves to explicit null, so the key is always
  present in `row` and the upsert always writes NULL rather than omitting the column.
- Task 7: complete (commit ccb2182, review clean)

## Task 8
- Implementer: opus agent `a8a2632f088f4f4a2`. Commit 7b20828. Deployed v36, verify_jwt:true.
- Reconciliation: create-subscription deployed == git, md5 byte-identical. No drift.
- E2E: BOTH cases exercised live, not reasoned. Positive — imperial quiz -> TMTEST50 checkout ->
  users.measurement_system='imperial' matching quiz_units, height_cm 175 / target_weight_kg 73
  (canonical metric intact). Negative — set the user to 'metric', re-ran the same checkout with
  newAccount===false, value stayed 'metric'. Two older real rows with quiz_units=null correctly
  kept 'metric', confirming the truthiness check.
- Test email task8-imperial-...@taimotion-test.invalid suppressed; due_lead_emails() returns 0
  matching rows at all 4 steps.
- !!! LIMITATION FLAGGED BY IMPLEMENTER, needs a human decision: an imperial buyer who ABANDONS
  a checkout and returns later keeps 'metric'. The first attempt already created the account
  (resolveUser runs before the users read), so newAccount is false on the retry and the non-null
  column default means it can never be back-filled. This is NOT rare — per taichi-decline-reasons
  and slack-stats, checkout creates the Stripe sub before payment and abandoned carts are common
  (35 incomplete_expired in one week). So a substantial fraction of imperial buyers would still
  land in the member app in kg. Candidate fixes: (a) drop the column default to null so the
  sibling null-guard works; (b) gate on "never had an active subscription" instead of newAccount
  — urow.subscription_status is already selected, and a user who never reached the member app
  cannot have set a preference. ESCALATE.
- !!! CORRECTION to the escalation above: the implementer's self-reported abandoned-cart
  limitation is FACTUALLY WRONG and must not be acted on. resolveUser creates the account on the
  FIRST checkout attempt, and line :93 writes measurement_system on that same call because that
  is exactly when newAccount is true. The abandoner is already 'imperial' from attempt 1; the
  retry's newAccount===false merely declines to rewrite a correct value. Reviewer confirmed
  against live data: 18 of 19 paying users create their account and pay within 0.1 min (same
  request); the one real abandon-and-return converter (41h gap, 2 sub rows) would still have been
  seeded on attempt 1. My earlier "candidate fixes (a)/(b)" would buy nothing — disregard them.
- Task 8: review — spec ✅, quality Approved. 1 Important (report-accuracy + a human decision),
  4 Minor. Reviewer re-downloaded the deployed function and confirmed it is byte-identical to
  git HEAD after deno fmt, so there is no live drift now.
- !!! REAL GAP (human decision, data-only, no code change): 114 `users` rows created BEFORE the
  v36 deploy are permanently 'metric' and can never be back-filled by this code path because the
  column is non-null. 63 of those are incomplete/incomplete_expired — never-paid leads still in
  the drip who, if they convert, land in kilograms. One-time, decaying, fixable with a single
  scoped UPDATE from quiz_sessions.measurement_system where available. ESCALATED.
- Task 8: minor (deferred): the negative test ran on the SAME row after the positive test, so it
  overwrote the positive evidence — no production row now demonstrates the copy working in the
  positive direction. The negative test is also non-discriminating ('metric' post-condition is
  consistent with both a correct decline and a silently failed write, since supabase-js does not
  throw and Promise.all discards results). It does disprove an inverted gate.
- Task 8: minor (deferred): the "two older real rows confirm the truthiness check" claim is
  unsupported — both predate the v36 deploy so they never ran the new line. The null-quiz branch
  is reasoning-only, never exercised.
- Task 8: minor (deferred): Task 7's two-literal whitelist is the ONLY validation — there is no
  CHECK constraint on either measurement_system column, and quiz_sessions has no anon/authenticated
  write policy, so service-role submit-quiz is the sole writer. A CHECK would be defense in depth
  but couples badly: users shares one unchecked UPDATE with stripe_customer_id and
  linked_quiz_session_id, so a violation would silently drop the billing link. Only add with
  error handling on that write.
- Task 8: complete (commit 7b20828, review clean)

## FINAL WHOLE-PLAN REVIEW (opus) — verdict: achieves intent, safe in production
Central claim verified airtight both statically (every canonical write converts first) and
empirically (19 real imperial sessions: weight_kg 47-155, height_cm 122-201, zero out of range).
Cross-surface numeric agreement proved algebraically (conv === kgToDisp, round-trip exact).
- Important 1: a 35-HOUR ROLLOUT GAP no per-task review could see. Funnel assets went live
  ~2026-07-30 19:0x but submit-quiz only deployed 2026-08-01 06:01:27Z. In between S.units was
  set and shipped but the function had no such key, so it was silently dropped. Both tasks were
  individually correct; only the deploy ORDER created the hole.
- Important 2: the plan's Rollout step 3 PostHog annotation was never created (project 525048 has
  zero annotations). Third mid-flight change to the quiz-length A/B/C test without one.

## BACKFILL EXECUTED 2026-08-01 (human-approved)
Dry-run first, twice — the first attempt was wrong two different ways:
  (a) joining on users.linked_quiz_session_id misses users whose marker sits on a DIFFERENT
      session of theirs (pattystewart53@gmail.com: active member, two imperial sessions, neither
      of them her linked one). Correct join is on lower(email) across ALL her sessions.
  (b) SQL three-valued logic: bool_or over all-NULL inputs returns NULL, so `not metric` was NULL
      and filtered every row out — the query returned zero and looked like "nothing to do".
      Needed coalesce(..., false). A dry run is what caught both.
Final rule: flip users at 'metric' where SOME session shows imperial (answers ? 'height_ft', or
legacy weight_unit/goal_weight_unit='lb', or height_unit='ft', or measurement_system='imperial')
and NO session shows an explicit metric choice. Test addresses excluded.
Result: 46 rows updated — 12 active paying members, 31 incomplete_expired, 3 incomplete.
Post-state: active is now 14 imperial / 14 metric (was 2 imperial). Zero wrongly flipped
(has_metric_marker count was 0 in every dry run).
- PostHog annotation created (id 373895, project 525048, 2026-08-01T05:46Z, 📏) — closes the
  final review's Important 2 and the plan's Rollout step 3.
- FIX WAVE (one, per the skill): commit 7ee1436. Removed rInput's dead+broken height branch
  (it prefilled cm under an "ft" label then re-read it through toCm(v,"ft") -> 5334cm ->
  permanent validation dead end). toCm ended with ZERO callers and was deleted; the older
  "keep toCm alive" constraint was obsolete once height stopped flowing through rInput.
  height_ft/height_in KEPT with a corrected comment (write-only imperial-session marker — the
  thing that made this morning's backfill possible). Spec amended in place.
- Fix-wave scoped re-review: all 3 findings ADDRESSED, no new breakage. Re-reviewer independently
  confirmed zero surviving toCm callers, the goal-weight rInput fallback intact end to end, no
  ?v= bump (correct — unreachable-code removal only), and that the spec's cache-bust numbers
  match the three HTML files exactly.
- Out-of-scope, pre-existing (unchanged by us): rInput's commit() persists an out-of-range typed
  goal weight before the validation gates advance. Only reachable via the deep-link fallback.

## PLAN COMPLETE
All 8 tasks + Task 3b + one fix wave. Every task review clean. Final whole-plan review: the
delivered system achieves the spec's intent and is safe in production.
Still unpushed at this point: ccb2182, 7b20828 (both edge functions ALREADY DEPLOYED to Supabase,
so git is behind the deployment until pushed — the exact drift CLAUDE.md warns about) and 7ee1436.
