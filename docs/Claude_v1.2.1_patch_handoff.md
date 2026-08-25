# Claude re-audit handoff — v1.2.1 localization, Marinara, and sauce-choice patch

## Comparison target

- Reference: released `main` / tag `v1.2.0`
- Branch under audit: `fix/v1.2.1-i18n-marinara`
- Comparison: <https://github.com/hound83/pizza-dough-calculator/compare/v1.2.0...fix/v1.2.1-i18n-marinara>
- Scope: backward-compatible text, recipe-data, and recipe-customization UI corrections

## Response to the first v1.2.1 audit

The first audit returned **safe and internally consistent**, with one medium recipe-fidelity finding
and two non-blocking coverage notes. All three are adopted:

1. Marinara regains its original separate **5 g EVOO topping**. Five grams, rather than the catalogue
   norm of 3 g, is deliberate: it restores exact recipe-layer parity with v1.2.0 while still removing
   the genuinely duplicated garlic and oregano toppings. The sauce retains its own quantified 1.5%
   EVOO; sauce oil and topping oil are now explicitly modelled and tested as two different layers.
2. Real Chromium now exercises the separate per-ball `#pizzaCustomize` disclosure, not only the
   picker preview.
3. Real Chromium now activates the native disclosure and a sauce choice with the keyboard.

The audit also documented a pre-existing approximately-48-hour deadline edge case. It reproduces on
v1.2.0 and is unrelated to this patch, so it is recorded in `docs/ARCHITECTURE.md` as a separate
follow-up rather than expanding v1.2.1 into a planning change.

## Approved user-visible changes

1. **Complete English interface copy:** `Bloemsoort` and its remaining flour options, the split W270 help text, and the recipe-search clear-label now translate completely. `Parmaham & Burrata` and `Pesto, Parmaham & Burrata` use `Parma ham` in English.
2. **Idiomatic Dutch planning copy:** the short planning labels no longer mix in `same-day` or `room-temperature`. The kneading term remains `windowpane` in Dutch as an explicit owner decision; `vliesjestest` is not introduced.
3. **Distinct Marinara layers without accidental duplication:** the Marinara sauce remains the source for tomatoes, salt, garlic, dried oregano, and its quantified sauce oil. The pizza recipe no longer duplicates garlic or oregano, but deliberately retains its original separate 5 g EVOO topping so deduplication does not flatten the recipe.
4. **Cleaner sauce override:** Complete pizzas shows only the current recipe-recommended or deliberately selected sauce by default. A native `details` disclosure labelled `Andere saus kiezen` / `Choose another sauce` reveals two groups:
   - tomato: San Marzano, Marinara, New York;
   - white/other: Bianca, creamy white, pesto, BBQ.
5. **No sauce catalogue pruning:** all seven sauce definitions and all 92 recipe defaults remain intact. Dough + sauce still shows the full seven-option selector directly because sauce selection is the primary task in that mode.

The application and package version become `1.2.1`. Persistence deliberately remains `pizzaCalcV51` / schema 51 because no saved field or interpretation changes.

## Why the sauces were retained

The catalogue currently maps 51 recipes to San Marzano, 31 to Bianca, three to creamy white sauce, two each to New York, BBQ, and pesto, and one to Marinara. The lower-frequency sauces define those recipes rather than representing redundant variants. Removing them would require recipe remapping and would reduce recipe fidelity. The approved change therefore removes visual competition, not data or capability.

## Interaction contract

- The disclosure is closed after rendering, so seven equal-weight override buttons no longer dominate every recipe view.
- Its summary always exposes the current sauce, quantity, and whether it is the recipe recommendation or an override.
- Opening it exposes exactly two groups and exactly seven choices.
- Choosing a sauce uses the existing override functions. The normal rerender closes the disclosure and updates the summary.
- Native `details` / `summary` provides keyboard interaction without a new event layer or persisted open/closed state.
- Apart from the explicit Marinara finishing-oil correction, sauce inclusion, diameter scaling, quantities, aggregation, shopping output, recipe selection, and explicit picker commit behavior are unchanged.

## Deliberately unchanged

- every dough, DDT, fermentation, yeast, water-temperature, mixer, and AVPN calculation;
- all v1.2.0 thermal constants, solver bounds, and normal-kitchen guidance;
- recipe-to-sauce defaults and the count of 92 recipes / seven sauces;
- the standalone Dough + sauce workflow and its direct selector;
- topping scaling from the immutable 32 cm reference;
- saved user data, storage key, and schema 51;
- the separate anonymous-feedback v1.3.0 candidate.

## Automated evidence

Expected complete result:

```text
15 refactor-structure tests passed
89 bundle regression tests passed
89 source regression tests passed
41 Chromium browser/layout tests passed
```

Focused regressions verify:

- the repaired static, split-node, accessibility, recipe-name, and planning translations;
- literal preservation of `windowpane` and absence of `vliesjestest`;
- Marinara sauce quantities plus exactly one separate 5 g EVOO topping, including 4.4 g sauce oil and 16 g topping oil in the four-pizza 30 cm reference output;
- a complete, duplicate-free partition of all seven sauces into the two approved groups;
- collapsed disclosure markup in both the picker and per-ball customization, in Dutch and English;
- the unchanged seven-option standalone sauce selector;
- real Chromium visibility on both recipe surfaces: alternatives are hidden initially, shown after activating the summary, and collapsed with the new sauce visible after selection;
- keyboard activation of the native summary and a focused sauce choice;
- both standalone and modular publications at all existing responsive viewports.

Run:

```bash
npm ci
npx playwright install chromium
npm test
```

## Candidate integrity hashes

All historical release hashes remain immutable. The v1.2.1 review candidate is pinned separately:

| Artefact | SHA-256 |
|---|---|
| standalone `index.html` | `1dceb735571ddc2fcaf6be85c2df19b1546cd8b7f5d703f220a7b44382acd955` |
| CSS | `7140b86b8e3d0335ea5bc6e88c37e756aabb9713de011ded629c59266cb2df19` |
| combined JavaScript | `dd69b2d1be8f912e15fcb4524642d27ea27a89d29dae2c5e76f00b9f3d0d73cd` |

## Requested independent checks

Please compare the branch with tag `v1.2.0` and verify:

1. English mode no longer exposes the audited Dutch flour, W270, accessibility, or `Parmaham` fragments.
2. Dutch short-schedule guidance is idiomatic and all kneading guidance still says `windowpane`.
3. Marinara gets garlic and oregano only through its sauce, while the separate 5 g EVOO topping is restored and remains distinct from the sauce's own oil.
4. Both Complete-pizza recipe surfaces show one current sauce by default, while the seven overrides remain reachable in the two approved groups.
5. Both disclosure implementations are usable with pointer and keyboard, close after a selection rerender, and remain horizontally contained from 320 through 1280 px.
6. Dough + sauce still exposes all seven choices directly.
7. Sauce selection, inclusion, scaling, aggregation, shopping output, and recipe commit behavior have no unintended changes.
8. The calculation modules and their versioned v1.2.0 numerical outputs remain unchanged.
9. Storage remains schema 51 and existing saved recipes reload without migration or data loss.

## Audit question

Do the audit corrections resolve the Marinara recipe-fidelity finding without reintroducing duplicated garlic or oregano, close both browser-coverage gaps, and preserve the first audit's conclusion that v1.2.1 has no calculation or persistence drift from released v1.2.0?
