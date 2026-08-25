# Product guardrails

## Purpose

These rules record deliberate product decisions in golden v1.0.0. They are not incidental implementation details and must not change during refactoring, cleanup, translation, or test work. A functional change requires explicit approval, a versioning decision, updated regression coverage, and a documented new baseline.

## Invariants

### 1. Yeast is fixed after mixing

The yeast quantity is calculated and chosen before the dough is mixed. A measured dough or refrigerator temperature entered later may adjust advice for the **remaining fermentation phases**, but must never rewrite or retroactively recommend changing the yeast already incorporated into the dough.

### 2. The dough log does not learn automatically

Saved bake results are reference data for the user. They do not automatically modify DDT assumptions, water-temperature guidance, yeast curves, fermentation times, presets, or future recipes. Any future learning feature requires an explicit product decision and transparent user control.

### 3. Room-temperature correction has an inclusive ±1 °C deadband

When measured post-kneading dough temperature differs from the planned final dough temperature by no more than 1 °C, the room-temperature fermentation plan remains unchanged. The deadband prevents false precision and unnecessary schedule churn.

### 4. Product bounds are 24 pizzas and 40 cm

The calculator supports at most 24 pizzas and diameters from 20 through 40 cm. Transient typing must not prematurely prune per-ball recipes or checked steps; normalization happens at the established commit boundary.

### 5. Toppings scale by surface area from 32 cm

Recipe quantities are authored for a 32 cm reference pizza. For diameter `d`, topping and default sauce quantities scale by:

```text
(d / 32)²
```

They do not scale linearly with diameter.

### 6. AVPN rules take precedence inside the AVPN preset

The AVPN midpoint preset is a distinct product contract. Its AVPN-derived dough, time, temperature, and yeast constraints take precedence over generic home-model heuristics. In particular:

- selecting the AVPN preset sets stone temperature to 405 °C;
- selecting a non-AVPN preset preserves the user's current stone temperature;
- the displayed official fresh-yeast range remains distinct from the calculator's practical model advice;
- practical midpoint or phase-split choices must be labelled as such and not presented as exact AVPN prescriptions.

## Golden behavior baseline

The behavior-neutral refactor protects these v1.0.0 hashes:

| Artefact | SHA-256 |
|---|---|
| standalone `index.html` | `7045421500a5497ca403699a2297c2ad8fa3e53f81f053300e8abdd84630cf3f` |
| CSS | `262e12b5356f5a50c63aa7cd7249b3c5c8b101d8954f076de1360efbc222b896` |
| combined JavaScript | `2897bfe7eda16d93c872d49f4dc8256f99549defe1927688903009f2a98483e7` |

When behavior is intentionally changed, do not silently replace these values. First document the approved product change, update or add focused tests, select the correct semantic version, and record the reviewed replacement baseline.

## Released v1.1.0 baseline

These hashes cover the released Basic/Full display modes, mobile recipe-picker repair, Claude audit corrections, and the explicitly approved 30-minute cold-autolyse and revised KitchenAid mixing sequence. They pin the shipped v1.1.0 baseline; the v1.0.0 hashes above remain immutable historical evidence.

| Artefact | SHA-256 |
|---|---|
| standalone `index.html` | `68070de6d4e3fb1f6e154200d04cb4de731659fda676d27fe80f14e811946fff` |
| CSS | `8e08ea9e85fc924fd10d86c19ac85c920bc48caf6bd6267fae71b2e24b0d4052` |
| combined JavaScript | `37851611903633e2baa3d4d6228b74f49c6fc851405ac159735a5a4a9e800761` |

## Released v1.1.1 baseline

These hashes cover the released usability patch: a 30 cm / 220 g default for **My default recipe**, practical percentage-field spinner grids, correct Dutch/English count grammar, and consistent practical dough-ball-weight display. They pin the shipped v1.1.1 baseline without replacing either historical release baseline above.

| Artefact | SHA-256 |
|---|---|
| standalone `index.html` | `3301a58d0fe0b26029877562b30ec4c427b328557f439e6b7649cc8003948951` |
| CSS | `8e08ea9e85fc924fd10d86c19ac85c920bc48caf6bd6267fae71b2e24b0d4052` |
| combined JavaScript | `db8d26918051d97d99a6e60f62da1f4970202097e4a91f1dc0e39a2c12d5a6ac` |

## Released v1.2.0 baseline

These hashes cover the released staged heat-capacity DDT prediction, separate autolyse/direct routes, main versus reserved water, honest solver boundaries with handling guidance retained, normal-kitchen warnings, and version 1.2.0 metadata. They pin the shipped v1.2.0 baseline; all historical release hashes above remain immutable.

| Artefact | SHA-256 |
|---|---|
| standalone `index.html` | `54b48cf9b17af1d60e8c0ab2fe04622013c253567ed21281868f809dcc4b7c41` |
| CSS | `8e08ea9e85fc924fd10d86c19ac85c920bc48caf6bd6267fae71b2e24b0d4052` |
| combined JavaScript | `5de43375deece0f2689217b2d47fe1aa98ed8ac265f990e0a09a981752dd0519` |

## Released v1.2.1 baseline

These hashes cover the released patch over v1.2.0: repaired Dutch/English interface copy, distinct Marinara sauce and finishing-oil layers without duplicated garlic or oregano, and a collapsed grouped sauce override in recipe views. The calculation model, recipe-to-sauce defaults, storage schema, and all seven available sauce types remain unchanged.

| Artefact | SHA-256 |
|---|---|
| standalone `index.html` | `1dceb735571ddc2fcaf6be85c2df19b1546cd8b7f5d703f220a7b44382acd955` |
| CSS | `7140b86b8e3d0335ea5bc6e88c37e756aabb9713de011ded629c59266cb2df19` |
| combined JavaScript | `dd69b2d1be8f912e15fcb4524642d27ea27a89d29dae2c5e76f00b9f3d0d73cd` |

## v1.2.1 localization, Marinara, and sauce-choice contract

- `windowpane` remains the deliberate Dutch and English term. The interface must not replace it with `vliesjestest`.
- English mode translates the flour-type label and options, the complete advanced W270 explanation, the recipe-search clear-label, and the two recipe names containing `Parmaham`.
- Dutch planning labels and the short-schedule warning do not mix in the English terms `same-day` or `room-temperature`.
- The Marinara sauce definition owns its tomatoes, salt, garlic, oregano, and its 1.5% sauce oil. The pizza recipe must not duplicate garlic or oregano, but it deliberately keeps one separate 5 g EVOO topping at the 32 cm catalogue reference. At the 30 cm default, existing area scaling and practical rounding show 4 g per pizza, or 16 g for four pizzas, in addition to the sauce oil.
- All seven sauce types remain valid and available. Their recipe defaults are not remapped or pruned.
- In Complete pizzas, the recipe picker and per-ball customization show only the current recommended or deliberately selected sauce by default. `Andere saus kiezen` / `Choose another sauce` opens a native disclosure containing exactly two groups: tomato (San Marzano, Marinara, New York) and white/other (Bianca, creamy white, pesto, BBQ).
- Choosing an alternative updates the existing per-ball override and returns to the collapsed summary. Apart from the explicit Marinara recipe correction above, the disclosure itself does not change sauce inclusion, quantities, scaling, aggregation, shopping output, or recipe commit behavior.
- In Dough + sauce, sauce selection is the primary task; its standalone selector therefore continues to expose all seven choices directly.
- The disclosure introduces no persisted field and no migration. Storage remains `pizzaCalcV51` / schema 51.
- The v1.2.0 staged DDT calculation modules and their numerical contract remain unchanged.

## Approved v1.3.0 feedback candidate baseline

These hashes cover the integrated v1.3.0 candidate that adds optional anonymous feedback on top of the released v1.2.1 application and preserves its calculation, localization, Marinara, and sauce-choice contracts. They remain provisional until the production Worker endpoint and real end-to-end issue check are complete.

| Artefact | SHA-256 |
|---|---|
| standalone `index.html` | `f481a73b0ea1fdf5df452e790c386d2040addf4bb95bce74d1e7b6b4231b9203` |
| CSS | `cb614bf7107294becbfabe37f0d30409c7b60aea558359cfd9ae6dd6c5a96bee` |
| combined JavaScript | `c36ec45478369dbd8f820045d39b40edf7b3c03033216e76054567b8f390c3ab` |

## v1.1.0 Basic/Full display contract

- Basic and Full are display modes independent of the Dough only, Dough + sauce, and Complete pizzas output modes.
- The Dutch labels are “Basis” and “Uitgebreid”, deliberately distinct from the “Volledige pizza’s” output mode.
- New users start in Basic. Stored v1.0.0/schema-50 users migrate to Full.
- Switching display mode never resets, recalculates, or replaces recipe values.
- Basic shows the preset, pizza count and diameter, relevant temperatures, optional bake deadline, stone temperature, compact yeast guidance, ingredients, warnings, and practical workflow.
- Pizza count, diameter, room temperature, refrigerator temperature, stone temperature, and bake deadline are practical recipe inputs. Editing them never changes the selected preset to Custom.
- Presets continue to own hidden technical values: dough style, baker's percentages, manual yeast type and amount, oil, rounding, autolyse, fermentation method and phase times, flour/W settings, and technical explanations.
- Basic keeps the calculated yeast recommendation and its explicit Apply action visible. Applying it intentionally overrides only the yeast amount, changes the preset to Custom, and is explained next to the action.
- Technical values edited in Full remain intact after switching to Basic. If the preset has become Custom, Basic shows a localized “Custom settings active” badge.
- The chosen display mode is stored in schema 51 under `pizzaCalcV51`; schema 50 is migrated once and then removed.

## v1.1.0 mobile recipe-picker contract

- At phone widths up to 760 px, the picker opens on a full-height recipe catalogue instead of splitting scarce vertical space with the customization preview.
- Tapping a recipe opens its customization pane. The localized back control returns to the catalogue without changing or committing the pending selection.
- Search never receives automatic focus on phone widths, so opening the picker does not summon the on-screen keyboard. Users can still tap search normally.
- Desktop keeps the simultaneous two-column catalogue and preview.
- Only the explicit “Choose pizza” action commits the pending recipe and customization to one or all dough balls.

## v1.1.0 home-mixer guidance contract

- The flour-and-water autolyse always lasts 30 minutes in the refrigerator; batch size does not trigger an automatic room-temperature fallback. The non-autolyse route retains its distinct 20-minute hydration rest with yeast already present.
- Home-mixer times are staged guidance, not automatic targets. Time, dough temperature, mixer load, dough feel, and a rested windowpane check determine when mixing stops.
- Schedule planning reserves 0.9 hours before fermentation whenever autolyse is enabled. Without autolyse it reserves 0.6 hours for a machine method and 0.75 hours for hand kneading.
- With autolyse, the KitchenAid pizza method uses 2 minutes on speed 1 for incorporation, 3 minutes on speed 1 after adding yeast, 2 minutes on speed 1 after adding salt and reserved water, and a 2-minute speed-2 target for final development. Safety and dough-development stop criteria always take precedence.
- Without autolyse, KitchenAid uses 2 minutes on speed 1 for incorporation, retains the 20-minute hydration rest, then uses 2 minutes on speed 1 after adding salt and reserved water and 2 minutes on speed 2 for final development.
- The KitchenAid method never permits a speed above 2 and explicitly discloses that KitchenAid's official yeast-dough guidance specifies speed 2.
- The KitchenAid method stops early when the dough is already developed, becomes glossy or sticky, approaches the selected final dough temperature, or the machine shows clear strain or strong warming.
- After the KitchenAid stages, the dough rests covered for five minutes before a windowpane check. Only if it is still weak, the user performs 6–10 gentle push-fold-turn movements, rests it for another 5–10 minutes, and checks again. This recovery path adds no machine time and the folds are skipped when the dough already has a sufficient windowpane or feels strong and tight.
- When displayed reserved water is divided between yeast and salt additions, the rounded portions must add up exactly to the rounded displayed total.
- Kenwood timing remains model-dependent. The calculator stays within the range represented by Kenwood's own pizza-dough guidance, requires the model-specific manual to take precedence, and offers folds only as an optional correction after a short rest.
- Mixer guidance never changes yeast quantity, baker's percentages, or fermentation calculations.

## v1.1.1 usability patch contract

- Selecting or resetting **My default recipe** uses a 30 cm pizza diameter and its corresponding 220 g target dough-ball weight so it fits comfortably on the calculator's 12-inch peel profile. The other presets retain their own diameters, and topping recipes remain authored against the immutable 32 cm reference before surface-area scaling.
- Previously stored schema-51 recipe values remain intact. In particular, this patch does not silently replace a user's saved 32 cm diameter; reloading the default preset or resetting the calculator intentionally adopts 30 cm.
- Native increment/decrement controls use grids of 0.5 percentage point for hydration, 0.25 for salt, 0.025 for yeast, and 0.25 for olive oil. These grids affect arrow/spinner interaction only: manually typed values and exact preset values retain their existing precision. When an exact value is off-grid, the first native arrow press follows standard browser behavior and aligns it in the chosen direction to the nearest grid point; that first visible delta can therefore be smaller than the nominal step. Subsequent presses use the full grid interval.
- Dynamic count text uses a true singular and plural in both languages, including `1 pizza` / `2 pizza's` and `1 deegbal` / `2 deegballen`, with the corresponding English forms. English time grammar follows the rounded number actually displayed, so a value shown as `1` always uses `hour` rather than `hours`.
- Practical rounding displays the calculated per-ball dough weight as a whole gram everywhere it is shown. With practical rounding disabled, the same shared formatter may show one decimal. Calculations retain their full internal precision in both modes.
- The persistence key and storage schema remain `pizzaCalcV51` / schema 51 because no stored field or interpretation changes.

## v1.2.0 staged water-temperature contract

v1.2.0 replaces the route-blind three-factor DDT rule with a staged, heat-capacity-weighted household model. This is an approved functional change over v1.1.1. It is science-informed and operationally explicit, but it is not a calorimetrically validated claim for every mixer, bowl, batch, or kitchen.

### Intended kitchen envelope

- The calibrated core is room temperature 15–30 °C, refrigerator temperature 2–8 °C, target final dough temperature 20–27 °C, and hydration 55–75%.
- Existing input bounds remain wider for defensive use: room 10–35 °C, refrigerator 0–15 °C, target dough temperature 10–35 °C, and hydration 45–85%.
- Room values below 15 °C or above 30 °C continue to calculate but are labelled outside the normal kitchen validation range. The 10 °C and 35 °C endpoints are robustness checks, not calibration points.
- The practical main-water solver interval is 1–45 °C. An unbracketed target is reported as unattainable with its boundary prediction; it is never silently presented as if the boundary reaches the target. Boundary results keep their applicable handling guidance, including the ice-water instruction at the 1 °C lower boundary.

### Thermal stage order

The advised temperature applies only to the **main water** used in the first mix. The small reserved portion remains covered at room temperature and is added after the rest. The prediction order is fixed:

1. heat-capacity equilibrium of flour at room temperature and main water at the advised temperature;
2. effective first-mix temperature rise;
3. first-order rest exchange for 0.5 hours at refrigerator temperature with autolyse, or 1/3 hour at room temperature without autolyse;
4. heat-capacity equilibrium with reserved water, salt, and oil at room temperature;
5. effective route-specific post-rest temperature rise.

Shared constants are:

| Constant | Value |
|---|---:|
| flour specific heat | 1.850 J/(g·K) |
| water specific heat | 4.186 J/(g·K) |
| salt specific heat | 0.900 J/(g·K) |
| oil specific heat | 2.000 J/(g·K) |
| effective rest tau | 2.27 h |
| refrigerated autolyse | 0.5 h |
| direct hydration rest | 1/3 h |

Salt and oil may legitimately be zero. Thermal helpers validate every part, conserve capacity, and never return `NaN` or `Infinity`. Fermentation simulation and DDT prediction share the same first-order temperature helper, while planning reads the shared rest durations without deriving elapsed preparation time from the thermal equation.

### Effective mixing terms

The production terms are fixed temperature rises at the 880 g / 63% hydration reference recipe. They absorb mixer power, programme wording, bowl coupling, ambient exchange, evaporation, and handling. They are fitted model terms, not fixed energies, measurements, or universal brand properties.

| Method | First mix | Post-rest, autolyse | Post-rest, direct |
|---|---:|---:|---:|
| hand | 0.200 °C | 0.800 °C | 0.800 °C |
| KitchenAid | 1.489 °C | 6.402 °C | 4.168 °C |
| Kenwood | 1.683 °C | 6.252 °C | 4.809 °C |
| spiral mixer | 2.124 °C | 6.796 °C | 4.272 °C |

The three machine/autolyse reference outputs at DDT 24 °C, room 21 °C, refrigerator 4 °C, and the default recipe are continuity anchors: KitchenAid 18.0 °C main water, Kenwood 18.0 °C, and spiral mixer 16.0 °C. The nominal direct outputs (15.9, 14.3, and 14.6 °C respectively) and hand outputs (32.9 °C autolyse, 25.3 °C direct) are versioned model scenarios, not equally precise physical truths.

The spiral-mixer direct term uses the KitchenAid direct/autolyse work ratio of approximately 0.717 because the Pro programme is unspecified. It is the lowest-confidence machine output. The workflow must not be rewritten to imitate KitchenAid merely to make this placeholder appear derived. Hand/autolyse is also low confidence because evaporation and worktop conduction are not separately identified.

No unvalidated batch-size exponent is applied. Exact numerical anchors concern the approximately 880 g reference batch. The existing mixer-capacity warning also explains that water-temperature confidence decreases near mixer capacity or for a materially different batch. A ±30% change in machine heat terms moves advised water by roughly 7–11.5 °C, so whole-degree presentation and the existing post-knead measurement remain mandatory.

### Solver and user guidance

- Once a target is bracketed, bisection converges to a sub-0.01 °C internal bracket. The prediction is affine and strictly increasing in main-water temperature; unachievable metadata is a bracketing result, not a convergence failure.
- At the reference recipe, the room-temperature derivative of advised water is pinned at −0.836 ±0.02 on the autolyse route and −1.106 ±0.02 on the direct route for tau 2.27 h. These pins are method-independent and detect mass-selection, missing-term, and unit errors that fitted point anchors can hide.
- Whole-degree water presentation changes predicted dough temperature by only about ±0.22 °C on the autolyse route and ±0.24 °C on the direct route, within the existing ±1 °C measurement deadband.
- Handling bands follow the whole-degree value shown to the user. At 10–14 °C, guidance says measured cold tap water may be sufficient. Below 10 °C, it explains how to chill with ice, remove remaining ice, and re-weigh the main water. Above 32 °C, it adds a contextual warm-water caution.
- The ≥40 °C yeast-contact warning appears only on the direct route. Hand/autolyse at or above roughly 38 °C instead gets an uncertainty hint and may suggest disabling refrigerated autolyse and recalculating; the app never switches routes automatically or calls the routes equivalent.
- The old statement that refrigerated autolyse may lower the endpoint “further” is prohibited because that phase is already inside the calculation.
- The room-temperature reserve assumption costs less than about 0.25 °C at the reference machine recipes and can approach 1 °C only at warned matrix extremes. Workflow copy therefore explicitly says not to chill the reserve with the main water.
- AVPN's official 16–22 °C water range remains the primary reference in its preset. Nominal agreement with that broad range is a sanity snapshot, not validation or calibration evidence.

### Explicit exclusions

- The yeast activity curve, covered-ball thermal constant, storage key, and schema 51 remain unchanged.
- No new Basic input, batch exponent, calibration UI, automatic learning, box selector, or cold-phase measurement is added.
- Anonymous feedback is not part of the v1.2.0 calculation baseline. It is added separately in v1.3.0.

## v1.3.0 anonymous-feedback contract

- Feedback is an optional online feature. Every calculator, recipe, fermentation, mixer, picker, storage, and offline workflow remains usable when the feedback endpoint, network, Turnstile, Worker, or GitHub is unavailable.
- A person submitting feedback does not need a GitHub account. A secured server-side adapter creates the issue; no GitHub credential or Turnstile secret may appear in source HTML, browser JavaScript, a request response, or committed configuration.
- Feedback is stored as a public GitHub issue. The form must disclose this before submission, has no contact field, and warns against personal information. The server rejects recognizable literal email addresses after Unicode normalization; obfuscated contact details remain the submitter's responsibility and must not be claimed as automatically detected. The modal also discloses that Cloudflare Turnstile is loaded for the anti-bot check and links to Cloudflare's privacy policy.
- The accepted categories are Bug/technical problem, Idea/improvement, Calculation/recipe, and Language/translation. Summary, message, optional reproduction steps, honeypot, language, Turnstile token, and the explicitly opted-in diagnostic object are the complete request contract.
- Safe diagnostics are disabled by default. When enabled, they may contain only app version, interface language, Basic/Full display mode, output mode, wizard page, and viewport. Recipe inputs, ingredient amounts, fermentation values, temperatures, pizza selections, dough-log entries, local storage, user-agent strings, and unexpected keys must never be submitted or persisted.
- Turnstile is loaded only after opening a configured feedback form and its token is always verified server-side with the `pizza_feedback` action and a mandatory expected production hostname. Exact allowed origins, a generous fail-closed per-client request limit before Siteverify, a tighter shared issue limit after successful Turnstile validation and before GitHub, bounded JSON and text sizes, removal of Unicode format controls, neutralized GitHub mentions, inert fenced user text, and safe generic error responses are mandatory backend controls. The per-client limiter may use Cloudflare's request IP only as an ephemeral rate-limit key; it is never added to GitHub or application storage.
- A downloaded `file://` copy never attempts to embed Turnstile. It explains that submission requires the live calculator while preserving all offline calculator behavior.
- Feedback fields are ephemeral and are excluded from `saveState()`. The persistence key and schema remain `pizzaCalcV51` / schema 51 because no recipe state or stored-field interpretation changes.
- The release is not production-ready while the public Turnstile site key or feedback API URL is blank. Before tagging v1.3.0, the deployed Worker, real Turnstile validation, and creation of a disposable end-to-end GitHub issue must be verified, followed by removal or closure of that disposable issue.

## Change checklist

Before changing a rule above:

1. explain the user-visible reason and affected scenarios;
2. identify whether the change is a patch, feature, or breaking change;
3. add a regression test that demonstrates the old and intended behavior;
4. verify Dutch and English output;
5. verify persistence and migration impact;
6. obtain explicit approval before implementation;
7. update this document and the audit handoff.
