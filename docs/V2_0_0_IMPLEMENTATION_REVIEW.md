# v2.0.0 — evening workflow review candidate

## Authorization and baseline

Michael requested all six accepted workflow proposals in one v2.0, without intermediate public releases, with Claude available for independent review. Implementation starts from released v1.4.1, main `0674eed4249eb96eb60e4ce931a4508482337a08`. Earlier work and the eight resolved Claude 1.4 findings remain intact. This branch is a review candidate; main stays on 1.4.1 until review.

## Product contract

1. Plan and Kitchen are freely accessible workspaces. Ingredient-only use requires no tracked session. Optional detail, availability and equipment tools stay collapsed.
2. One evening owns an immutable dough recipe and target instant, independently tracked mixer runs, and stable pizza records. Recorded transitions also update their corresponding phase progress; a quality check is never inferred. Unknown event times are explicit. Chronology and undo preserve observations.
3. Availability checks reserve one person and one mixer. Preparation retains the existing 54/36/45-minute allowances, including the unchanged 30/20-minute rest. Cleanup is extra work, not extra dough fermentation. Whole-recipe alternatives change the target only with explicit application. Infeasible schedules remain conflicts rather than shortening mandatory work.
4. Whole-ball allocation conserves the calculated parent ingredients. Integer display-unit allocation reconciles every ingredient and main/reserved water; capacities are checked against both exact and displayed quantities. Runs remain separate through proof. One bowl means sequential preparation.
5. A one-slot oven queue records launch/removal and the appropriate run's first launch together. Pizza identity, choices and run ownership survive ordering and reload. Removed pizzas retain their choices and after-bake instructions. Gaps and bake duration are separate forecast observations. Closing retains unbaked pizzas.
6. Readiness guidance reuses the existing rested-windowpane and symptom advice at the current phase. Timers are optional absolute end instants. No timer proves readiness or promises a background alarm.
7. Dough recipe files remain format 1 / 50 kB. Evening templates use their own format 1 / 250 kB; full private backups use format 1 / 2 MB. Shared templates strip names, dates, observations and actual history. Restore validates before replacement, previews contents and requires one explicit confirmation. Failed writes preserve persisted data.
8. Schema 53 migrates real schema-52 state only after successful write. One legacy active batch becomes one run with explicit legacy topping provenance; archived batches do not acquire invented toppings. A browser Web Lock provides a single writer across tabs; stale tabs cannot overwrite actual history. Unsupported locking falls back to an explicitly unsaved session.

## Numerical scope

Thermal constants, yeast model, recipe catalogue, kneading/rest durations, AVPN identity, area scaling, product bounds and the inclusive ±1 °C room deadband remain unchanged. Allocation and scheduling are new deterministic workflow arithmetic. The separately proposed phase-aware temperature estimator, measured flour temperature and preparation-fermentation recalibration remain research proposals; this release does not claim physical validation or quietly enable them.

## Review evidence

Implementation, test results, migration cases, candidate hashes and remaining limitations will be recorded here before handoff. Desktop Chromium viewport checks do not establish real iPhone/Safari or Android device validation.
