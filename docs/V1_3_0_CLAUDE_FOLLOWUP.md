# v1.3.0 Claude review follow-up — 22 September 2026

The recovery session inspected the actual GitHub branches before changing code. Planning-review was at `5e8b60f961e678b92a89f23bde16182d50ccf4ee`: GPT's `02920e4` implementation followed by Claude's independent review. The existing v1.4 feature branch was at `cd221591c5176a982fc93579ccde4347dea740b0`, with all seven requested features, schema 52, review documentation and a previously passing Actions run already present. Neither branch was reconstructed from chat claims.

Read [Claude's original crosscheck](Claude_v1.3.0_PR13_crosscheck.md) alongside this response. The original is preserved verbatim.

## Findings addressed

| Claude finding | Correction | Regression evidence |
|---|---|---|
| §2.1 subgram floating-point output and Dutch decimal separator | Clean hundredth-gram quantities; shared localized formatter in picker, customization, recipe summaries, ingredient modal and topping steps | Every catalogue recipe at 30 and 40 cm in Dutch and English; browser checks of the four interactive surfaces |
| §2.2 yeast-lock explanation overwritten | One button renderer owns disabled state and text; display-mode rendering uses cached advice state without running the calculation pipeline | Measured dough, both languages, Basic/Full switches and unchanged recipe values |
| §2.3 unnecessary application loses preset | If applying advice produces the same weighed dose at the recipe's existing 0.1/0.01 g resolution, show “Already in your recipe” and keep the preset | Matching default dose is a no-op; a changed room temperature still permits explicit advice application |
| §2.4 fixed 45-minute preparation allowance | Short-deadline card uses shared `prepHours()` | All four methods with and without autolyse |
| §2.5 AVPN identity read from unrelated UI | Water note reads the calculated recipe's `presetKey` | Existing AVPN/DDT regressions retained |
| §2.6 mutable exported yeast curve | Freeze the outer array and every point | Attempted mutation rejected; 21 °C activity remains exactly 1 |

The first, second and fourth regressions were reproduced against the unmodified source before applying fixes. The subgram sweep reproduced Claude's six affected recipes at 30 cm and two at 40 cm, and also caught the same raw-number rendering in workflow steps. All these surfaces now share the formatter.

## Product and version boundaries

This remains the **v1.3.0 candidate**, not a new public release. These are authorized completion fixes to that candidate. The weighed-dose match changes only whether an unnecessary apply action is offered; it never silently changes a percentage, ingredient amount or preset. The existing model, official AVPN range, kneading durations, catalogue entries and schema 51 remain unchanged. Historical release hashes and the original reviewed candidate hash record are preserved; corrected candidate hashes are recorded separately.

Dynamic local weekdays were already implemented correctly. The existing tests cover local dates, midnight, language changes and daylight-saving transitions. Starting a batch with an absolute bake date belongs to the already implemented v1.4 branch.

## Verification

Required gate: `npm test`, covering source and standalone publications. Focused regression counts and the actual GitHub Actions result are recorded in the PR after execution. Browser results must be attributed to the executing environment, not inferred from the existence of test definitions. The local runtime has Playwright 1.62.1 but its Chromium download failed; GitHub Actions executes the browser gate.

The v1.4 candidate receives this branch through an ordinary merge so the original feature commits, Claude review and fixes all remain in its history. Main, tags, production and parked feedback PR #12 remain unchanged.
