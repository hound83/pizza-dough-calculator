# v2.0.0 — evening workflow review candidate

> Release update: Michael authorized publication as v2.0.0 after both reviews and the final keyboard-focus correction. See [the release record](V2_0_0_RELEASE.md). Candidate/live-status statements below describe the historical review snapshot.

## Start here

Michael requested the six accepted workflow proposals together in v2.0, without intermediate public releases, with Claude available for review. This candidate starts from released v1.4.1 / main `0674eed4249eb96eb60e4ce931a4508482337a08`. The earlier seven workshop additions and eight resolved Claude 1.4 findings are retained. Review `feature/v2.0-kitchen-workflow` against main in [PR #16](https://github.com/hound83/pizza-dough-calculator/pull/16). Main stays at v1.4.1 until review.

The [complete accepted design](V2_0_0_ACCEPTED_DESIGN.md) is preserved as planning evidence. Its proposed acceptance tests and implementation sequence describe the preparation stage, not executed evidence. This document records the implementation and its limits. The three separate numerical investigations C1–C3 are research proposals, not authorized production recalibration.

## What the six changes deliver

| Proposal | Delivered behavior | Principal owners |
|---|---|---|
| 1. Kitchen and linked progress | Plan opens immediately. Kitchen shows the current run/phase, existing complete mixing guidance and one primary transition. Events update associated phase progress without inventing quality checks. Catch-up supports explicit unknown times, corrections and undo. Optional absolute timers, screen wake lock and calendar export stay in disclosures. | `evening-workflow.js`, `workflow-core.js` |
| 2. Availability | Optional earliest start, dated absences and cleanup time. Checks include active work, fridge moves, shaping, sauce preparation, oven setup/checks and attendance during preheat. Explicit alternatives shift the whole plan; they do not shorten mandatory work or silently change the recipe. | `evening-planning.js`, `evening-core.js` |
| 3. Mixer runs | A user-entered flour/dough capacity creates balanced whole-ball runs. Each has allocated ingredients, its own actual start, history and measurements, and stable ball ownership. One bowl means sequential preparation; the prior run must release it first. | `evening-core.js`, `evening-workflow.js` |
| 4. Baking session | Stable names, toppings and run assignments survive ordering and reload. One oven slot; launch and the run's first-launch checkpoint are recorded together. Current/next pizzas and finishing toppings remain visible. Bake durations and pauses inform separate forecasts. Closing preserves unbaked pizzas. | `evening-core.js`, `evening-workflow.js` |
| 5. Contextual readiness | Existing rested-windowpane and symptom guidance appears beside the relevant phase. Optional post-knead temperature belongs to the selected run. Timers are aids, never evidence of readiness. No automatic extra machine time or fake quality observations. | `evening-workflow.js`, existing instruction/help modules |
| 6. Complete evenings | Local evening templates preserve recipe, modes, sauces, topping choices, order, splitting and equipment. Reuse clears dates, actuals and readings. Sharing previews the exact exported content and omits personal names, programme notes and actual history. Private backups preserve continuity, validate before writing and require one restore confirmation. Missing catalogue entries require explicit replacements. | `evening-planning.js`, `evening-core.js`, `persistence-bootstrap.js` |

Ordinary ingredient-only use requires no tracked evening, guest names, equipment setup or availability entry. Plan and Kitchen remain freely accessible. Optional tools and full legacy instructions stay available in disclosures; the baking queue starts collapsed while mixing. Dutch and English use the same interaction and data model. The visible footer says v2.0.0 on this candidate.

## State and migration

- Schema 53 has one authoritative evening: frozen parent recipe and absolute target, independent run batches, stable pizza records and a selected run. The existing `workshop.batch` is a compatibility alias; persistence does not duplicate that active fact.
- Ordinary recipe inputs stay frozen after starting. Stone temperature and preheat remain editable, are synchronized across run snapshots, and survive archive/reopen.
- Schema 52's active batch becomes one evening/run, retaining actual checkpoints, measurements and progress. Current pizza choices are explicitly marked as legacy provenance. Historical batches do not receive invented toppings; their original checkpoints and measurements can be inspected read-only without interrupting the active evening.
- Legacy keys are removed only after a successful new write and complete recovery. If records are dropped, the UI says so and retains the original storage. Quota failure keeps the old data. Future/corrupt current state is not automatically overwritten.
- A same-origin Web Lock grants one writer for the page lifetime. Another tab can view, but cannot save or reset the writer's state. It takes over after the writer closes and it reloads. Revision checks also detect stale writes. Without Web Locks or writable storage, the UI explains that saving is unavailable; calculation/instructions remain usable.
- Recipe files remain format 1 / 50 kB. Evening templates are format 1 / 250 kB. Private backups are format 1 / 2 MB. Full restore checks chronology, IDs, references, allocation consistency, collection bounds and time zone before replacing storage. Missing recipes in a portable template have an explicit replacement screen; the saved original remains intact.
- Absolute instants remain unchanged on another device/time zone; Kitchen identifies the originating zone. Transfers are snapshots, not synchronization. Continue editing on one device.

## Numerical and scheduling contract

Thermal constants, yeast model, recipe catalogue, kneading/rest durations, AVPN identity, area scaling, product bounds and the inclusive ±1 °C room deadband remain unchanged. The separately proposed phase-aware temperature estimator, measured flour temperature and preparation-fermentation recalibration are not enabled. Numerical tests check software invariants; they do not establish physical accuracy for a particular mixer or refrigerator.

Whole-ball allocation uses largest remainders in displayed weighing units, conserving parent totals, with main and reserved water reconciled within each run. Exact quantities remain available separately. Tiny positive child yeast doses use enough decimals to stay positive and retain a scale-resolution warning. Flour/dough capacities are checked against both exact and displayed loads. A one-ball-over-capacity case is rejected. Runs stay separate through proof; merging them would invalidate their independent history.

Availability retains the existing 54/36/45-minute preparation allowances, including unchanged 30/20-minute rest. Cleanup is extra active work, not an extra fermentation phase. Passive rest can overlap; active tasks and oven attendance are checked. The first version offers whole-plan shifts in 15-minute increments within the next 24 hours. A resource conflict that cannot be solved by shifting remains a conflict: there is no hidden optimizer changing proof times or yeast.

Known actual events anchor downstream forecasts. An unknown checkpoint stays unknown; the remaining-proof solver declines an exact proposal when history is insufficient. Hybrid fridge-out is not relabeled as an observed shaping time. Next-pizza guidance identifies its run and that run's expected baking time, separately from readiness. Oven forecasts use observed baking seconds and gaps independently. “Out of oven” never means “garnished” or “served.”

## Verification and acceptance map

The complete suite is `npm test`: 15 structure checks, 31 pure-core tests, 106 regressions against each publication, and 139 Chromium browser cases. Both source and standalone bundle are tested. Candidate hashes are pinned separately in `tests/baselines/v2.0.0-candidate.json` and `PRODUCT_GUARDRAILS.md`; all historical hashes remain intact.

| Accepted cases | Evidence |
|---|---|
| UX1–UX4, RD2 | New Plan/Kitchen browser flows plus retained complete mixing/help regressions; optional setup stays collapsed |
| UX5–UX7 | Unknown-history/undo, chronology unit checks, split-run reload, and real two-tab writer ownership tests |
| UX8 | Both languages, keyboard transition and no page-level overflow at 320/390/430/760/1024/1280 px; screenshots retained by Actions |
| PL1–PL3 | Active/passive scheduling, cleanup, absence/earliest conflict and explicit fixed-date application checks |
| PL4 | Existing dynamic-weekday/midnight/month/year tests; fixed dates and running dates retained; explicit repeated-hour input handling |
| SP1–SP3 | 1/7/8/24-ball arithmetic, exact/display conservation, tiny-dose and capacity rejection tests; independent run temperatures/checkpoints/reload |
| BK1–BK5 | Stable ordering/names, linked first launch, one oven slot, after-bake toppings after reload, separate gap statistics and unbaked archive |
| RD1, TM1 | Post-knead readings survive transitions/undo; absolute timer survives reload and elapsed time; wake-lock refusal leaves state off |
| SV1–SV4 | Template versus private restore, legacy recipe exchange, missing-template replacement, future-file rejection, schema-52 migration, quota preservation and private-data-free template export |

Manual Chromium preview also exercised Plan → Start dough → post-knead reading → bulk transition → reload → unknown fridge checkpoints → first pizza launch. The full ordinary instructions and unchanged mixer timing remained available during that flow.

The full `npm test` passed on GitHub at code commit `87eb019d6f9707a8b68992f2533c9e2d45f02123`: **15 structure + 31 pure core + 106 bundle + 106 source + 125 Chromium cases**, with no failed cases. [Recorded complete run](https://github.com/hound83/pizza-dough-calculator/actions/runs/35779847214). The preceding sharing/recovery candidate also passed all 125 browser cases. Screenshots are attached to the Actions runs (seven-day retention).

Final follow-ups add a read-only archived-checkpoint view, its schema-52 browser assertion, and a regression for a focused temperature field being repainted before blur: the visible measurement is committed before a phase/run change and survives archiving. Use [the current PR checks](https://github.com/hound83/pizza-dough-calculator/pull/16/checks) to verify the final review HEAD, and the PR description for its final run link. The local fast suite passed as well; local `npm test` reached the browser layer but could not launch the unavailable local Chromium executable. The GitHub job installs Chromium and provides the full-suite evidence.

## Focus for independent review / remaining limits

1. Review the new authoritative evening-to-legacy-batch adapter, especially selecting runs, correcting history, undo and archived reopen. Inspect both saved state and rendered quantities.
2. Exercise a genuine 1.4.1 profile with several saved batches and a restricted-storage browser. The suite covers synthetic real-schema fixtures; it cannot cover every user's private storage.
3. Availability is a conservative whole-plan conflict checker, not a global schedule/recipe optimizer. It assumes one person, one mixing bowl and one oven slot. Check the working-time estimates against a real kitchen session.
4. Browser screenshots emulate viewport widths. Real Safari/iPhone and Android testing, on-screen keyboards, 200% text zoom and device suspension remain manual release checks (UX9 and the device-specific part of TM1). No native app or background alarm is claimed.
5. Repeated-hour parsing and absolute-zone display are implemented; a real transfer between time zones remains a manual check (SV5). Timers require the page to be active for a visible update and do not promise closed-page notifications.
6. C1–C3 remain separate model investigations. Existing legacy temperature readings keep their existing meaning; this candidate does not infer retrospectively measured flour or phase temperatures.

API references for optional browser capabilities: [Web Locks](https://developer.mozilla.org/en-US/docs/Web/API/LockManager/request) and [Screen Wake Lock](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API).

## Review follow-up

The [Claude response](V2_0_0_CLAUDE_FOLLOWUP.md) supersedes the initial UI contract where noted: guarded activation, explicit startup readiness, chronological unknown-time choices and optional Basic readings. Historical successful runs above describe their original snapshots; use the PR checks for the current HEAD.
