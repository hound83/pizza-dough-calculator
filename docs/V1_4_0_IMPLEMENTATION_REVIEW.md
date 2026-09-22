# v1.4.0 batch workflow: implementation and reviewer handoff

The user explicitly requested implementation of all seven additional recommendations, rather than another suggestion-only document. This feature candidate builds on `feature/v1.3.0-planning-review` at `02920e4fee5b9e3ab8c5cf02fac229d2b50d573e`. The v1.3.0 branch and its complete original review remain available. The current public release remains v1.2.1; this work does not merge, tag, release or deploy itself.

See also [the recovery verification and Claude follow-up](V1_4_0_RECOVERY_VERIFICATION.md) for the current candidate after the independent v1.3 crosscheck.

## Implemented scope

| Recommendation | Working interface | Persisted result |
|---|---|---|
| Start a real batch | Start in the calculator or workflow; optional retrospective local start time | Frozen dough recipe, mixing method, scale resolution, container assumptions and copied mixer profile |
| Fixed dates and actual phases | Fixed calendar bake target, record-now actions, dated corrections, actual/expected timeline, close/reopen batches | Absolute timestamps, recorded checkpoints, correction history, observations and step progress |
| Diagnose unexpected dough behaviour | Stage and symptom selectors with specific, bilingual guidance | No diagnosis or automatic recipe change |
| Weighable yeast advice | 1 g / 0.1 g / 0.01 g scale selector, nearest scale step, quantization impact, explicit fresh-yeast conversion before mixing | Scale preference; actual recipe dose is never silently rounded to the chosen scale |
| Mixer/hook/batch observations | Named equipment profiles, actual active mixing minutes in the bake log, two-bake comparison | Exact model/hook/programme note, cold route and completed actual phase durations copied into each observation; no automatic learning |
| Practical refrigerator layout | Cold route, comfortable balls per box, available boxes, dough depth, stacking and load | Capacity shortfall and visible thermal-model limitations; no invented container constants |
| Saved recipes and plan comparison | Up to 30 named dough recipes, two-plan comparison, recipe-file export/import | Whitelisted recipe values, no private notes or measurements in the recipe exchange file |

Mixer profiles are limited to 20, batch history to 20 and bake-log entries to the existing 30. These bounds limit storage growth; the interface reports recipe/profile capacity before refusing additional entries. Existing catalogue pizzas and recipe data are unchanged.

## Batch chronology and scientific limits

A new batch started now clears the current measurements and checkmarks. “Already started?” supports a retrospective start and retains the current observations/checkmarks. Closing a batch archives it and makes the calculator editable again. Reopening an archived batch restores its recipe, checkpoints, current measurements and checked steps.

The fixed bake target is stored as an absolute timestamp. Browser-local weekday labels can refresh after midnight without moving that target. Local date/time entry rejects nonexistent spring-forward times. During a repeated autumn wall-clock hour, browser date parsing chooses the first occurrence; the interface recommends the record-now action for the current actual instant.

Checkpoints must be chronological and cannot skip their predecessor. Corrections must remain between already recorded neighbours. Unrecorded checkpoints are forecasts, never silently marked complete. Checkboxes remain task-progress controls; they do not claim a timestamp. No current-clock tick rewrites a completed phase.

For a tracked batch, temperature entry records an observation. The legacy untracked timing optimiser is not allowed to rewrite its history. An explicit proposal can change **unfinished final proof only**, holding the actual bulk/cold durations and recipe dose fixed. It targets the original model's gas integral, not equivalent gluten development, maturation or flavour. It cannot remove already elapsed proof, change the fixed bake target or silently shorten preparation. If an expected earlier phase transition is overdue but unrecorded, the proposal first requires an actual checkpoint or updated current phase duration. Unreachable or already-passed model targets are reported as such. The inclusive ±1 °C all-room-temperature deadband remains intact.

The UI shows the forecast against the fixed requested bake time. A discrepancy is exposed, not compensated by silently cutting rests. Users can explicitly revise unfinished phase durations within the existing product limits. Completed phase durations derive from actual timestamps.

Cooling and warming remain first-order estimates. Container depth, stacking and load are recorded and explained; they do **not** select newly invented thermal coefficients. Scale half-step percentages describe quantization, not certified scale accuracy. Mixer observations do not fit new heat terms or yeast curves.

All existing kneading stages are preserved, including the KitchenAid 9-minute autolyse and 6-minute direct programmes and existing recovery path. A spiral attachment on a planetary KitchenAid remains the KitchenAid method. Programme notes are observations, not replacement machine instructions. See the [v1.3 review](V1_3_0_REVIEW_AND_ROADMAP.md) and [complete original review](Pizza_Calculator_Volledige_Review_2026-09-21.md) for the manufacturer-guidance discrepancy and scientific sources. Exact attachment suitability and physical accuracy still require real observations; this release does not claim to settle them.

## Storage migration and privacy

The schema changes deliberately from `pizzaCalcV51` to `pizzaCalcV52`. The legacy chain now begins with schema 51 and retains migration from versions 50 through 26. Existing scalar inputs, exact percentages, pizza customizations, live measurements, display/language preferences, checkmarks and bake-log entries retain their meaning. New functionality lives in one sanitized `workshop` object.

The legacy key is deleted **only after** writing the migrated state succeeds. A storage failure keeps the previous copy and displays the existing warning. Invalid workshop entries are dropped individually; a malformed active batch does not discard valid saved recipes or profiles. Unknown persisted keys are not treated as arbitrary DOM IDs.

Recipe exchange is explicit JSON download/import, capped at 50 kB. Only the supported format/version and complete bounded dough fields are accepted. Export excludes bake dates, batch history, measurements, log notes, mixer profiles and pizza toppings. Imports become custom profiles, avoiding an arbitrary imported name claiming official AVPN preset identity. This is a recipe exchange file, not a full backup of all local data.

All data stays in the browser's local storage. No account, remote analytics, messaging, feedback endpoint or automatic upload is introduced. The reset confirmation explicitly includes recipes, equipment profiles, batches and logs.

## Code ownership

- `calculation-core.js`: shared baker-percentage and practical-weight arithmetic, extracted without numerical changes in a separate architecture commit.
- `workflow-core.js`: pure recipe validation, serialization, scale/capacity math, batch chronology, timing revisions and final-proof proposal; no DOM, language or persistence access.
- `batch-workflow.js`: frozen recipe adapter, actual batch lifecycle, timeline presentation and delegated events.
- `workshop-tools.js`: recipe collection/comparison, scale/container controls, mixer profiles, bake comparison and symptom guidance.
- `persistence-bootstrap.js`: sole owner of schema 52, migration and bootstrap. Other existing modules remain adapters for their established responsibilities.

There are fifteen classic source modules. The generated standalone bundle still works without runtime dependencies. New interactions use delegated `addEventListener` handlers. New labels and guidance are available in Dutch and English. Numeric typing is not normalized per keystroke.

## Verification

Focused coverage includes pure chronology and rejected transitions, no removal of elapsed proof, the room-temperature deadband, strict recipe import/private-data exclusion, quantization and box capacity, recipe-summary equivalence across all presets/methods/weighing modes, schema migration with write failure, frozen batches across reload, copied mixer observations and non-learning model behaviour.

Real Chromium coverage is defined for both `index.html` and `src/index.html`, including midnight/language/reload, keyboard checkpoint actions, invalid chronological edits, close/reopen, recipe-file download/import, scale and capacity settings, copied mixer logs, and stage/symptom guidance. Both new expanded planning controls and running-batch screens are exercised at 320, 390, 430, 760, 1024 and 1280 px. CI retains screenshots and failure traces. Consult the draft PR's latest Actions result for the execution status; test definitions alone are not a pass claim.

## Review priorities

1. Confirm that no actual checkpoint, frozen recipe dose or fixed calendar target changes through an unrelated form edit, language change, reload or midnight rollover.
2. Inspect temperature proposals against elapsed time and the original gas target, including the honest failure paths; do not interpret them as empirical model validation.
3. Exercise schema-51 migration, unavailable storage and malformed recipe/batch data.
4. Compare original mixing copy and all numerical preset/thermal/yeast constants; no shorter programme is intended.
5. Review expanded mobile controls and bilingual copy, particularly the distinction between planned, expected and recorded times.
