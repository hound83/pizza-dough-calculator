# Application architecture

## Design goals

This architecture makes golden v1.0.0 easier to maintain without changing product behavior. It therefore has five hard constraints:

1. Tag `v1.0.0` remains the immutable functional reference; `main` may advance through behavior-equivalent architecture and documentation changes.
2. The shipped application requires no framework, package dependency, transpiler, or production build at runtime.
3. GitHub Pages serves the generated standalone root `index.html` directly.
4. Maintainable sources live under `src/`; eleven classic browser scripts load there in a fixed order.
5. Historical v1.0.0 hashes remain immutable evidence. Approved feature versions may change the current bundle with focused regression coverage and an explicit migration path.

Classic scripts are a deliberate intermediate architecture. They preserve the existing inline HTML handlers and shared global lexical runtime without rewriting hundreds of calls at once. Fixed load order and ownership tests make this shared runtime explicit instead of merely implicit.

## Distribution model

`src/` is the source of truth for application code. `tools/bundle.js` reads `src/index.html`, inlines the stylesheet and the eleven scripts without changing their bytes, and writes the standalone root `index.html`. The generated root file is committed so GitHub Pages and downloaded offline use require no build step.

```text
src/index.html + src/assets/css/app.css + src/assets/js/*.js
                              │
                       tools/bundle.js
                              │
                              ▼
                   index.html (standalone)
```

`npm run check:bundle` fails if the committed distribution differs from a fresh source reconstruction.

## Load order and responsibilities

| Order | File | Owned responsibility |
|---:|---|---|
| 1 | `foundation.js` | safe browser-storage wrapper, numeric fields, global UI state, and product version |
| 2 | `translations.js` | static Dutch/English dictionary and targeted additions |
| 3 | `i18n.js` | translation engine, language switching, and localized text helpers |
| 4 | `catalog.js` | yeast, flour, dough-style, sauce, temperature, ingredient, and pizza data |
| 5 | `pizza-picker.js` | per-ball customizations, filters, search, modal controls, and explicit picker selection |
| 6 | `dough-fermentation.js` | baker's percentages, ball sizing, thermal model, yeast advice, presets, and main update cycle |
| 7 | `sauce-recipes.js` | sauce aggregation, recipe summaries, pizza customization, and kneading instructions |
| 8 | `fermentation-live.js` | DDT/water advice, live temperature corrections, solver, and checkable fermentation steps |
| 9 | `planning-shopping.js` | deadline planning, timeline, shopping, oven advice, copy output, and ingredients modal |
| 10 | `navigation-logbook.js` | wizard navigation, app modes, recipe copying, and dough-log presentation |
| 11 | `persistence-bootstrap.js` | schema-50 persistence/migration, event registration, and the sole `DOMContentLoaded` bootstrap |

The order is a contract: later modules may use functions and state from earlier modules. Function declarations may also call later-loaded functions after user interaction, because all eleven scripts have loaded before the user can operate the application.

## Ownership rules

- Only `persistence-bootstrap.js` owns `SAVE_KEY`, `SAVE_VERSION`, migration, and `DOMContentLoaded`.
- Only `foundation.js` owns `APP_VERSION`, language state, and generic DOM/numeric helpers; dictionary data and the translation engine have separate owners.
- Recipe and ingredient data belong in `catalog.js`; picker interaction belongs in `pizza-picker.js`.
- `dough-fermentation.js` contains dough and fermentation calculations **and** their form orchestration. Extracting a DOM-independent calculation core is a separate architecture step; this refactor only relocates existing code.
- `src/index.html` owns structure and script order only; presentation belongs in `src/assets/css/app.css`.
- `navigation-logbook.js` owns the independent Basic/Full display state. This state controls visibility only and must never rewrite recipe values.
- Remaining inline handlers form the existing public browser API. New interactions should use `addEventListener` in the owning module.

## Behavioral equivalence

`tests/test_refactor_structure.js` keeps three historical golden hashes documented as immutable v1.0.0 release evidence:

| Artefact | SHA-256 |
|---|---|
| v1.0.0 single-file source | `7045421500a5497ca403699a2297c2ad8fa3e53f81f053300e8abdd84630cf3f` |
| v1.0.0 CSS | `262e12b5356f5a50c63aa7cd7249b3c5c8b101d8954f076de1360efbc222b896` |
| v1.0.0 JavaScript | `2897bfe7eda16d93c872d49f4dc8256f99549defe1927688903009f2a98483e7` |

The current feature bundle is no longer expected to equal the historical hashes. The test reconstructs the current standalone file exactly from `src/`, keeps the historical hashes documented, pins the current explicitly approved v1.1.0 standalone/CSS/JavaScript candidate baseline, and validates JavaScript parsing, module order, unique HTML IDs, all inline-handler functions, exclusive persistence/bootstrap ownership, and the committed bundle.

`tests/test_v50.js` runs all 71 functional regressions against both the modular source and the standalone bundle. Mixer-specific coverage protects the bilingual staged KitchenAid and Kenwood guidance, the separate 30-minute cold-autolyse and 20-minute hydration-rest paths, the full hand/machine preparation-time matrix, exact two-minute KitchenAid speed-2 stage, rested-windowpane recovery without extra machine time, and displayed reserve-water portions that exactly sum to the displayed total. Basic-mode coverage distinguishes ordinary recipe inputs from intentional technical overrides.

`tests/browser/refactor.spec.js` runs 29 Chromium checks. One infrastructure contract protects the implicit `/favicon.ico` request made by full Chromium. The remaining checks cover the standalone bundle and modular source: six viewport widths (320, 390, 430, 760, 1024, and 1280 px) verify initialization, page/console/request failures, and horizontal fit, while focused checks protect the Basic/Full contract, ordinary Basic input, explicit yeast-advice application, persistence, and migration. The three phone sizes additionally protect the full-height single-pane recipe catalogue, non-autofocused search, the horizontally scrollable filter row, the catalogue-to-customization transition, back navigation, modal fit, and explicit click selection that cannot be changed by hover.

Playwright is a development-only dependency. It is not bundled into `index.html`, loaded by the application, or required by GitHub Pages and offline users.

## Change workflow

1. Identify the module that owns the behavior.
2. Add a focused regression test before fixing a bug or adding a feature.
3. Edit source files under `src/` and run `npm run bundle`.
4. Run `npm test`; use `npm run test:fast` only when intentionally skipping the local browser layer during intermediate work.
5. Do not automatically update golden hashes after an intentional behavioral change; first document why the branch is no longer behavior-neutral and establish the reviewed new baseline.
6. Test layout, keyboard behavior, and native browser signals in Chromium at the relevant viewports.

## Deliberate follow-ups

ES modules, removal of the remaining inline handlers, and extraction of a DOM-independent calculation core may be valuable later, but each is a separate architecture step. They change name resolution, coupling, or the public browser API and must not be hidden in unrelated feature work. The remaining low-severity accessibility improvement from the golden audit is also a separate follow-up.
