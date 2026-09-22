# v1.4.0 recovery verification — 22 September 2026

## Repository state found before edits

The continuation inspected GitHub directly. `feature/v1.3.0-planning-review` was at `5e8b60f`, including Claude's new review of `02920e4`. `feature/v1.4.0-batch-workflow` was at `cd22159`, already containing the full seven-feature implementation, migration, bilingual UI, responsive tests, documentation and two follow-up repairs. Its complete test gate had passed in [Actions run 35653562870](https://github.com/hound83/pizza-dough-calculator/actions/runs/35653562870).

No feature was reconstructed or removed because the previous chat stopped responding. The original commits remain ancestors of this candidate. The public `main` branch remains released v1.2.1 (`8da4ecb`). Feedback/Cloudflare PR #12 remains parked.

## Completion changes

- Integrated the current 1.3 branch, retaining [Claude's original review](Claude_v1.3.0_PR13_crosscheck.md) and [the six-finding response](V1_3_0_CLAUDE_FOLLOWUP.md).
- Fixed subgram display throughout the calculator and topping steps, including Dutch decimal separators. All 92 catalogue recipes are checked at 30 and 40 cm in both languages.
- Centralized yeast-button state and preserved its explanation across language and display switches. A dose already present keeps its preset. On v1.4, the comparison uses the existing shared dough-quantity core and the active batch itself keeps the button locked even without a recorded temperature.
- Corrected the last fixed short-deadline preparation allowance, the remaining AVPN note identity, and mutable exported yeast-curve points.
- Added real-browser schema-51 migration scenarios for successful replacement, reload and failed storage writes. They preserve exact percentages, diameter, language/display choice, measurements, checked steps, per-ball choices and bake-log notes.
- Expanded the six-width workshop layout scenarios to check and capture both Dutch and English planning and active-batch screens.

## Existing functionality retained

| Feature | Current behavior |
|---|---|
| Batches | Fixed recipe/method, optional retrospective start, close/reopen, stored progress |
| Calendar and phases | Absolute batch bake date, chronological actual checkpoints, visible actual versus expected times, explicit future-only timing edits |
| Dough diagnosis | Bilingual stage/symptom guidance |
| Scale advice | Resolution and dose guidance without silently changing the recipe |
| Mixer observations | Named profiles and copied bake observations; comparison without automatic learning |
| Refrigerator capacity | Box/capacity controls and practical limitations without invented thermal constants |
| Recipe collection | Named recipes, two-plan comparison, bounded JSON import/export excluding personal notes and batch measurements |

The migration remains schema 51 → 52; successful writes precede legacy-key deletion. Malformed new entries are sanitized separately. This is local browser storage, not cross-device synchronization or a full-data backup feature.

## Dynamic weekdays

The existing implementation uses browser-local calendar-day arithmetic. For Monday 21 September 2026 it shows “Morgen – dinsdag”, “Overmorgen – woensdag” and “Over drie dagen – donderdag”, with English equivalents. Labels refresh at midnight, on language changes and on returning to the page. Tests cover calendar boundaries and daylight-saving behavior. An unstarted relative plan stays relative; starting a batch fixes the absolute desired bake timestamp so midnight cannot move it.

## Verification and scope

The required full gate is `npm test`: 15 structure checks, 17 pure-core tests, 105 standalone regressions, 105 source regressions and 75 Chromium checks. The local source and numerical checks run in the recovery environment; the real browser gate runs in GitHub Actions because the local Chromium archive download fails. The PR records the actual final commit and corresponding Actions run; a test definition is not a pass claim.

An independent before/after matrix compares this source to the actual original 1.4 commit `cd22159` across seven presets, four methods, autolyse on/off, three room temperatures, three refrigerator temperatures and two yeast types: **1,008 configurations**. It compares numerical recipe output, yeast advice, fermentation simulation and staged water advice. The matrix passed with **zero numerical differences**. This checks software consistency, not empirical dough-model accuracy.

Historical released and earlier candidate hashes remain in `PRODUCT_GUARDRAILS.md`. The current corrected v1.4 candidate has its own hash record. Kneading times, catalogue definitions, preset values, thermal constants, yeast-activity values and the inclusive ±1 °C room-temperature deadband are retained.

This remains the final **v1.4.0 review candidate**, stacked in draft PR #14 above PR #13. It is not a published release. Neither main nor tags are changed by this work.
