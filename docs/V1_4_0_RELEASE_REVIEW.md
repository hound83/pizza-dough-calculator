# v1.4.0 release review and notes

## Scope and decision

The user authorized processing the newly committed review and publishing a new live version if it contained no major findings. The actual reviewed branch was `feature/v1.4.0-batch-workflow` at `1f47d468e544d73b528f5844580621afe002540f`: this added Claude's review to the previously tested implementation `4530a90f74bef667440e126873e5e950396e2622`.

[Claude's complete original crosscheck](Claude_v1.4.0_PR14_crosscheck.md) is preserved verbatim. It reports one medium, three low and four minor findings, without a blocking calculation, migration or architectural redesign. All eight are addressed below. This follow-up does not alter physical constants, yeast calculations, mixer durations or rest durations.

## Changes since the reviewed candidate

| Finding | Resolution | Regression evidence |
|---|---|---|
| Medium: clock correction can silently remove a saved batch | Persisted event replay validates chronology without comparing observations to today's device clock. New event entry still rejects future timestamps. | Pure-core test covers active and archived batches, invalid chronology and invalid timestamps; browser reload test turns the clock back five minutes and forward again. |
| Low: oven controls frozen with dough | Stone temperature and preheat minutes remain editable, with the selected oven settings saved in the existing batch recipe. Dough, mixer and requested bake time remain fixed. | Source/bundle regression and browser reload/archive/reopen cases; preheat timestamp and fixed dough/yeast/target checks. |
| Low: validation rendered away from its action | Workshop notices are attached to the originating panel and action, with a status region scrolled into view. | Invalid recipe name, invalid/oversized import and container-bound errors at 320, 390, 760 and 1280 px in source and bundle. |
| Low: stale final-proof proposal on reopening | Opening the disclosure and returning through focus/visibility recomputes time-sensitive proposals. Apply-time checks remain in place. | Same-day clock advance checks on reopening, focus and visibility; overdue checkpoint removes the apply action. |
| Minor: scale difference can show negative zero | Quantize the difference to 0.0001 g and normalize zero; dosing is unchanged. | Pure-core exact-step/floating-point and real-difference cases. |
| Minor: raw JSON parser text leaks into Dutch | Parse errors use the existing localized invalid-recipe message. | Invalid JSON exercised in Dutch and English, with recipe count unchanged. |
| Minor: untracked timestamps called Expected | Untracked timestamps are Planned/Gepland; recorded batch checkpoints Actual/Werkelijk; future tracked times Expected/Verwacht. | Browser coverage checks all three states. |
| Minor: English Bake A/B labels in Dutch | Dutch selectors read Bak A/B; English remains Bake A/B. | Existing mixer comparison browser test extended. |

A minimal `.gitattributes` rule fixes text checkout to LF, making deterministic source/bundle hashes portable to Windows. Historical golden, release and candidate hashes are retained. `tests/baselines/v1.4.0-release.json` pins the new release separately.

## Validation and publication gate

The release gate is `npm test` on GitHub Actions before merging PR #14 to `main`:

| Layer | Cases |
|---|---:|
| Structure and exact bundle reconstruction | 15 |
| Pure calculation/workflow core | 19 |
| Standalone regression | 106 |
| Modular-source regression | 106 |
| Chromium browser/layout | 89 |

Use [PR #14 checks](https://github.com/hound83/pizza-dough-calculator/pull/14/checks) and the associated commit's Actions run as the execution record. The local environment could run the Node suites, but its Chromium download returned a corrupt empty archive; browser results must therefore come from CI, not a claimed local run.

The first release check found two additional browser edge cases: oven edits could miss the 300 ms save debounce on immediate reload, and imported-file notices were not reliably fully inside the viewport after a language switch. Committed active-batch oven changes now save synchronously, and notice scrolling resolves the current status element and centers it immediately. The same browser assertions remain part of the release gate.

The retained browser suite covers schema-51 migration including failed-write recovery, NL/EN, frozen recipe checkpoints, actual-time validation, calendar rollover, and source/bundle layouts at 320, 390, 430, 760, 1024 and 1280 px. Relative bake-day labels use the current local date and refresh after midnight or returning to the page: tomorrow, the day after tomorrow, and in three days each include the correct weekday. A started batch retains its absolute bake date.

Claude's independent reviewed-candidate result was 75/75 browser checks on Windows/Edge and zero numeric differences across 1,008 scenarios against three reference implementations. That is historical evidence for the reviewed candidate, not a claim that Claude independently reran these eight follow-up fixes.

## Release notes

v1.4.0 includes the improved 1.3 planning and all seven workshop additions:

- Fixed batches with actual start, bulk, fridge and bake checkpoints, stored history and resume.
- Explicit remaining-time proposals without changing yeast already in the dough.
- Named dough recipes, comparisons and strictly validated recipe JSON exchange.
- Scale-resolution guidance without silently changing recipe quantities.
- Refrigerator container capacity and placement guidance.
- Mixer profiles and recorded bake observations without automatic recalibration.
- Contextual dough help, Dutch/English support and responsive planning/step controls.

Schema 51 migrates to 52 with preservation of the existing recipe, observations, selected pizzas, progress and log. The old key is removed only after successful storage of the new state. Storage stays local to the browser. Recipe JSON exchanges a recipe; it is not a full backup of batch history and logs.

The generated standalone `index.html` remains usable offline and is the GitHub Pages publication. PR #14 contains the complete 1.3 ancestry, so it can release directly to `main` without publishing a temporary 1.3 site. Anonymous feedback/Cloudflare remains parked. The six separately discussed next-version usability/kitchen proposals and app development are outside this release.
