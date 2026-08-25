# Claude audit handoff — v1.2.1 localization, Marinara, and sauce-choice patch

## Comparison target

- Reference: released `main` / tag `v1.2.0`
- Branch under audit: `fix/v1.2.1-i18n-marinara`
- Comparison: <https://github.com/hound83/pizza-dough-calculator/compare/v1.2.0...fix/v1.2.1-i18n-marinara>
- Scope: backward-compatible text, recipe-data, and recipe-customization UI corrections

## Approved user-visible changes

1. **Complete English interface copy:** `Bloemsoort` and its remaining flour options, the split W270 help text, and the recipe-search clear-label now translate completely. `Parmaham & Burrata` and `Pesto, Parmaham & Burrata` use `Parma ham` in English.
2. **Idiomatic Dutch planning copy:** the short planning labels no longer mix in `same-day` or `room-temperature`. The kneading term remains `windowpane` in Dutch as an explicit owner decision; `vliesjestest` is not introduced.
3. **One authoritative Marinara composition:** the Marinara sauce remains the source for tomatoes, salt, garlic, dried oregano, and EVOO. The Marinara pizza recipe no longer adds garlic, oregano, and EVOO a second time as toppings, so shopping and ingredient output do not double-count them.
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
- Sauce inclusion, diameter scaling, quantities, aggregation, shopping output, recipe selection, and explicit picker commit behavior are unchanged.

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
37 Chromium browser/layout tests passed
```

Focused regressions verify:

- the repaired static, split-node, accessibility, recipe-name, and planning translations;
- literal preservation of `windowpane` and absence of `vliesjestest`;
- an empty Marinara pizza-topping list while the sauce retains garlic, dried oregano, and EVOO;
- a complete, duplicate-free partition of all seven sauces into the two approved groups;
- collapsed disclosure markup in both the picker and per-ball customization, in Dutch and English;
- the unchanged seven-option standalone sauce selector;
- real Chromium visibility: alternatives are hidden initially, shown after activating the summary, and collapsed with the new sauce visible after selection;
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
| standalone `index.html` | `54f71ca2efe1451207bc1fe5046c00bb0fc1ea82b8697889305f6cf829f75102` |
| CSS | `7140b86b8e3d0335ea5bc6e88c37e756aabb9713de011ded629c59266cb2df19` |
| combined JavaScript | `542fa05379e0ca37f72a18e13d9f57dccac1a5b2784efbb7e7b6046f1af3a890` |

## Requested independent checks

Please compare the branch with tag `v1.2.0` and verify:

1. English mode no longer exposes the audited Dutch flour, W270, accessibility, or `Parmaham` fragments.
2. Dutch short-schedule guidance is idiomatic and all kneading guidance still says `windowpane`.
3. One Marinara pizza produces its aromatics only through the Marinara sauce and does not duplicate them as toppings.
4. Both Complete-pizza recipe surfaces show one current sauce by default, while the seven overrides remain reachable in the two approved groups.
5. The disclosure is usable with pointer and keyboard, closes after a selection rerender, and remains horizontally contained from 320 through 1280 px.
6. Dough + sauce still exposes all seven choices directly.
7. Sauce selection, inclusion, scaling, aggregation, shopping output, and recipe commit behavior have no unintended changes.
8. The calculation modules and their versioned v1.2.0 numerical outputs remain unchanged.
9. Storage remains schema 51 and existing saved recipes reload without migration or data loss.

## Audit question

Is this a safe and internally consistent v1.2.1 patch over released v1.2.0, and do the source, functional, integrity, and Chromium tests adequately prove the translation repairs, Marinara deduplication, retained sauce catalogue, collapsed grouped override, responsive behavior, and absence of calculation or persistence drift?
