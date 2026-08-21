# v1.0.0 refactor architecture

## Design goals

This branch makes golden v1.0.0 easier to maintain without changing product behavior. The architecture therefore has five hard constraints:

1. `main` and tag `v1.0.0` remain the frozen reference.
2. The shipped application requires no framework, package dependency, transpiler, or production build at runtime.
3. GitHub Pages serves the generated standalone root `index.html` directly.
4. Maintainable sources live under `src/`; eleven classic browser scripts load there in a fixed order.
5. Recombined CSS and JavaScript must remain byte-for-byte identical to v1.0.0 while this behavior-neutral refactor is under review.

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
- Remaining inline handlers form the existing public browser API. New interactions should use `addEventListener` in the owning module.

## Behavioral equivalence

`tests/test_refactor_structure.js` protects three golden hashes:

| Artefact | SHA-256 |
|---|---|
| v1.0.0 single-file source | `7045421500a5497ca403699a2297c2ad8fa3e53f81f053300e8abdd84630cf3f` |
| v1.0.0 CSS | `262e12b5356f5a50c63aa7cd7249b3c5c8b101d8954f076de1360efbc222b896` |
| v1.0.0 JavaScript | `2897bfe7eda16d93c872d49f4dc8256f99549defe1927688903009f2a98483e7` |

The test concatenates the eleven modules without separators, restores CSS and JavaScript to `src/index.html`, and requires the exact release single-file hash. It also validates JavaScript parsing, module order, unique HTML IDs, all inline-handler functions, exclusive persistence/bootstrap ownership, and the current committed bundle.

`tests/test_v50.js` runs all 64 functional regressions against both the modular source and the standalone bundle.

## Change workflow

1. Identify the module that owns the behavior.
2. Add a focused regression test before fixing a bug or adding a feature.
3. Edit source files under `src/` and run `npm run bundle`.
4. Run `npm test`.
5. Do not automatically update golden hashes after an intentional behavioral change; first document why the branch is no longer behavior-neutral and establish the reviewed new baseline.
6. Test layout, keyboard behavior, and native browser signals in Chromium at the relevant viewports.

## Deliberate follow-ups

ES modules, removal of the remaining inline handlers, and extraction of a DOM-independent calculation core may be valuable later, but each is a separate architecture step. They change name resolution, coupling, or the public browser API and must not be hidden in this mechanical refactor. The planned Basic/Full feature and the remaining low-severity accessibility improvement from the golden audit are similarly out of scope.
