# Pizza Dough Calculator v2.1.0 — release handoff

## Decision and boundaries

Michael approved separating the next feature work into v2.1 and v2.2 and explicitly said GO for v2.1. v2.1 is a functional addition to the v2 Plan/Kitchen workflow, not a rewrite. GitHub Pages remains the canonical website, with a generated root `index.html` and eighteen maintainable classic JavaScript modules. There is no self-contained HTML download, backend, account, or new runtime framework.

## Delivered in the v2.1 branch

1. **Share dough recipe by link.** Plan offers *Share dough recipe link*. It exports the existing portable validated dough contract as a URL fragment, with all relevant flour, yeast, hydration, fermentation and method settings, but **not** individual pizzas, toppings, shopping, dates, actual measurements, names, notes or history. The recipient sees a clear preview and must explicitly choose to load the recipe. Invalid links never modify the plan. Loading is disabled during an active tracked evening.
2. **Checkable shopping, in Plan and Kitchen.** The full list includes dough, chosen sauce ingredients and per-pizza toppings; sauce/tomato quantities use the existing aggregation rules. Each row can be checked. When a calculated quantity changes, its old checkmark no longer counts as purchased and the row calls this out. The view is kept in sync between Plan and Kitchen.
3. **Manual purchases.** Add a name, positive quantity and unit (`g`, `kg`, `ml`, `l`, pieces or packages). Edit, remove or check an entry. Manual additions persist locally with their evening; changing an entry resets its purchased checkmark.
4. **Favorite pizza evenings.** A saved evening template can be starred. Favorite shortcuts in Plan reload the recipe, pizza/sausage selections and retained manual shopping, while clearing scheduled dates, observations and purchase checkmarks. The complete template list continues to work without using favorites.
5. **Storage v54.** The app reads the last live schema-53 state and migrates the active evening, history, templates, frozen run data and progress into schema 54. It keeps the older storage key until a successful new write, then cleans it up. Backups produced by v53 remain importable through explicit validation. New `shopping` and `favoriteIds` state are bounded and sanitized.

## Intentionally deferred to v2.2

- Ingredient finder / expanded pizza catalogue exploration.
- A richer baking journal, with additional outcomes and retrospective comparisons.

No changes to dough mathematics, yeast recommendations, staged water temperature calculations, kneading programme, fermentation clocks, or existing checkpoint semantics are authorized by this release.

## Privacy and usage cautions

- The fragment portion of the link is ordinarily processed by the receiving browser rather than submitted as part of the HTTP page request. Someone receiving or retaining the **full URL can nevertheless see the dough settings**; do not treat it as a secret.
- The share link is a snapshot, not live synchronization. Manual shopping is not shared in a dough-only link. Across devices, local shopping and favorites still require the existing explicit private-backup transfer.
- Shopping amounts are practical quantities based on recipes; they do not constitute retail package sizes for every ingredient. If a sauce ingredient lacks a defensible exact amount, it remains listed without an invented quantity.

## Verification protocol

- `npm run bundle` and `npm run check:bundle`: deterministic generated website entry.
- `npm run test:fast`: 15 structure tests, pure-core suite and 108 functional regressions on each of the two site entries, including new v2.1 URL, shopping and migration cases.
- `npm test`: additionally executes 149 Chromium browser/layout cases across the root website entry and source entry, including ten v2.1 interactions (real link import, invalid URL, shopping edits/changes, favorite repeat, schema-53 evening migration).
- Verify existing v1.0 through v2.0.1 historical hashes are **preserved in documentation**, but do not claim the new v2.1 site is byte-equivalent to old standalone releases.
- Confirm GitHub Actions checks pass before publishing and verify the GitHub Pages site loads the version label and assets after merge.

The local runner does not have a working Playwright Chromium binary; an attempted download produced an unusable archive. Chromium results therefore require the configured GitHub Actions runner or a machine with Playwright browsers installed; do not mark the browser suite passed merely because the fast suite passed.

## Implementation references

- [`../src/assets/js/workshop-tools.js`](../src/assets/js/workshop-tools.js): URL share/preview/apply.
- [`../src/assets/js/planning-shopping.js`](../src/assets/js/planning-shopping.js): shopping computation and controls.
- [`../src/assets/js/evening-planning.js`](../src/assets/js/evening-planning.js): favorites and template repetition.
- [`../src/assets/js/persistence-bootstrap.js`](../src/assets/js/persistence-bootstrap.js): schema 54 and validated migration.
- [`../tests/browser/v21.spec.js`](../tests/browser/v21.spec.js): real-browser scenarios.
- [`PRODUCT_GUARDRAILS.md`](PRODUCT_GUARDRAILS.md): authorized scope, unchanged numerical contract and candidate hashes.
