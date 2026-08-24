# Claude audit handoff — v1.1.1 usability patch

## Comparison target

- Reference: released `main` / tag `v1.1.0`
- Branch under audit: `fix/v1.1.1-usability`
- Comparison: <https://github.com/hound83/pizza-dough-calculator/compare/main...fix/v1.1.1-usability>
- Scope: backward-compatible usability fixes only

## Approved user-visible changes

1. **Peel-friendly default:** selecting or resetting **My default recipe** now chooses 30 cm and its corresponding 220 g target dough-ball weight instead of the former 32 cm / 250 g HTML defaults. Other presets and the 32 cm topping-reference formula are unchanged. An already stored schema-51 recipe, including a saved 32 cm default-preset recipe, remains intact until the user deliberately reloads that preset or resets the calculator.
2. **Practical percentage controls:** native ArrowUp/ArrowDown and spinner controls now use grids of 0.5 percentage point for hydration, 0.25 for salt, 0.025 for yeast, and 0.25 for olive oil. Manually typed values and precise preset values remain accepted. A first native press from an off-grid exact value follows standard browser behavior and aligns in the chosen direction to the nearest grid point; later presses use the full interval.
3. **Localized count grammar:** dynamic Dutch and English output uses real singular and plural forms, including `1 pizza` / `2 pizza's` and `1 deegbal` / `2 deegballen`, plus `1 dough ball` / `2 dough balls`.
4. **One dough-ball display rule:** the per-ball weight in the dough result, workflow, badges, and copied recipe uses one shared formatter. Practical rounding shows whole grams; disabling practical rounding permits one decimal. Internal calculations keep full precision.

The public application and package version become `1.1.1`. Persistence deliberately stays at `pizzaCalcV51` / schema 51 because no saved field or interpretation changed.

## Follow-up decisions from the first independent audit

- The release remains **v1.1.1**, not v1.2.0: this is a backward-compatible correction to the user's standard recipe and its labels, not a new feature family.
- The first native off-grid snap is documented rather than replaced with heavier custom number-input controls. Browser coverage now starts from the untouched 0.17% default yeast value, checks its first alignment to 0.175%, and then checks the full 0.025-point interval to 0.2%.
- English hour pluralization now follows the rounded value actually displayed, repairing reachable output such as `1 hours` in copied live-adjusted recipes.
- The 220 g HTML and preset target is explicitly documented as the derived counterpart of the approved 30 cm default.

## Deliberately unchanged

- mixer stages, autolyse, recovery folds, and preparation-time planning;
- fermentation, yeast, DDT, and live-temperature calculations;
- recipe catalogue data and the mobile recipe-picker contract;
- AVPN behavior and all other product guardrails;
- topping and sauce scaling from the immutable 32 cm recipe reference;
- existing saved recipe values and storage schema 51.

## Automated evidence

Expected complete result:

```text
14 refactor-structure tests passed
75 bundle regression tests passed
75 source regression tests passed
31 Chromium browser/layout tests passed
```

Focused regressions cover:

- 30 cm for the selected default recipe and unchanged dimensions for the other presets;
- preservation and resaving of an existing schema-51 32 cm recipe;
- exact native `step` attributes and real browser ArrowUp/ArrowDown grid interaction from the untouched default recipe;
- preservation of manually typed off-step precision such as 63.05% hydration and 0.176% yeast;
- singular and plural output in Dutch and English across summaries, workflow, shopping/sauce output, timeline, modal, and recipe copy;
- singular English hour output based on the rounded value visible in copied recipe text;
- one shared displayed dough-ball weight across the dough card and workflow.

Run:

```bash
npm ci
npx playwright install chromium
npm test
```

## Candidate integrity hashes

The released v1.0.0 and v1.1.0 hashes remain immutable historical evidence. The review candidate is pinned separately:

| Artefact | SHA-256 |
|---|---|
| standalone `index.html` | `3301a58d0fe0b26029877562b30ec4c427b328557f439e6b7649cc8003948951` |
| CSS | `8e08ea9e85fc924fd10d86c19ac85c920bc48caf6bd6267fae71b2e24b0d4052` |
| combined JavaScript | `db8d26918051d97d99a6e60f62da1f4970202097e4a91f1dc0e39a2c12d5a6ac` |

## Requested independent checks

Please compare the branch with `main` and verify:

1. with clean storage, **My default recipe** opens at 30 cm;
2. a saved v1.1.0/schema-51 recipe at 32 cm reloads as 32 cm without data loss;
3. explicitly reselecting the default preset or resetting intentionally changes that recipe to 30 cm;
4. the four percentage fields follow their documented grids through real keyboard arrows, including the standard first snap from default yeast 0.17% to 0.175% and the following full step to 0.2%;
5. precise manual values remain unchanged after blur and calculation;
6. one and two pizzas produce grammatical count text in both languages, especially the divide-and-shape workflow, and rounded English fermentation time never renders as `1 hours`;
7. practical rounding gives the same whole-gram ball weight in the dough result and workflow, while disabled practical rounding uses the same one-decimal value on both surfaces;
8. both `/index.html` and `/src/index.html` remain error-free at all covered viewports;
9. the repaired mobile recipe picker still opens, scrolls, selects, customizes, and commits correctly;
10. no mixer, fermentation, recipe, AVPN, persistence, or scaling behavior changed unintentionally.

## Audit question

Is this a safe, internally consistent v1.1.1 patch over released v1.1.0, and do the tests adequately prove the new defaults, interaction steps, bilingual grammar, precision preservation, rounding consistency, and storage compatibility?
