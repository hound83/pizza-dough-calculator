# Application architecture

## Design goals

This architecture makes golden v1.0.0 easier to maintain without changing product behavior. It therefore has five hard constraints:

1. Tag `v1.0.0` remains the immutable functional reference; `main` may advance through behavior-equivalent architecture and documentation changes.
2. The calculator core requires no framework, package dependency, transpiler, backend, or production build at runtime. Anonymous feedback is an optional online capability and is never required for calculations or offline use.
3. GitHub Pages serves the generated standalone root `index.html` directly.
4. Maintainable sources live under `src/`; twelve classic browser scripts load there in a fixed order.
5. Historical v1.0.0 hashes remain immutable evidence. Approved feature versions may change the current bundle with focused regression coverage and an explicit migration path.

Classic scripts are a deliberate intermediate architecture. They preserve the existing inline HTML handlers and shared global lexical runtime without rewriting hundreds of calls at once. Fixed load order and ownership tests make this shared runtime explicit instead of merely implicit.

## Distribution model

`src/` is the source of truth for application code. `tools/bundle.js` reads `src/index.html`, inlines the stylesheet and the twelve scripts without changing their bytes, and writes the standalone root `index.html`. The generated root file is committed so GitHub Pages and downloaded offline use require no build step.

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
| 11 | `feedback.js` | isolated anonymous-feedback UI, opt-in safe diagnostics, lazy Turnstile loading, and the online API client |
| 12 | `persistence-bootstrap.js` | schema-51 persistence/migration, calculator event registration, and the sole `DOMContentLoaded` bootstrap |

The order is a contract: later modules may use functions and state from earlier modules. Function declarations may also call later-loaded functions after user interaction, because all twelve scripts have loaded before the user can operate the application.

## Ownership rules

- Only `persistence-bootstrap.js` owns `SAVE_KEY`, `SAVE_VERSION`, migration, and `DOMContentLoaded`.
- Only `foundation.js` owns `APP_VERSION`, language state, and generic DOM/numeric helpers; dictionary data and the translation engine have separate owners.
- Recipe and ingredient data belong in `catalog.js`; picker interaction belongs in `pizza-picker.js`.
- `dough-fermentation.js` contains dough and fermentation calculations **and** their form orchestration. Extracting a DOM-independent calculation core is a separate architecture step; this refactor only relocates existing code.
- `src/index.html` owns structure and script order only; presentation belongs in `src/assets/css/app.css`.
- `navigation-logbook.js` owns the independent Basic/Full display state. This state controls visibility only and must never rewrite recipe values.
- `feedback.js` owns every feedback interaction and payload field. Feedback controls are excluded from calculator event wiring, are never persisted, and may not read recipe inputs, the dough log, or browser storage.
- Remaining inline handlers form the existing public browser API. New interactions should use `addEventListener` in the owning module.

## Optional anonymous-feedback service

The generated calculator remains a self-contained HTML file. Its `pizza-feedback-api` meta value is the only production connection point. When that value is blank, the feedback modal explains that submission is not configured and the rest of the application remains fully operational. A downloaded `file://` copy never attempts to load Turnstile and links to the live calculator instead.

When configured, opening the feedback modal performs the first network request. `feedback.js` fetches a public Turnstile site key from the Worker, lazily loads Cloudflare Turnstile, and sends the bounded form payload only after a challenge token is available. The browser never receives a GitHub credential or Turnstile secret.

```text
optional user action
      │
      ▼
feedback.js ── Turnstile token ──► feedback-worker/
                                      │  server-side Siteverify
                                      │  exact origin + schema checks
                                      ▼
                           GitHub Issues API (public issue)
```

The Worker accepts Bug, Idea, Calculation/recipe, and Translation feedback. It has no contact field, rejects recognizable literal email addresses after Unicode normalization, removes Unicode format controls, neutralizes accidental GitHub mentions, renders user text inside adaptive inert Markdown fences, caps request and field sizes, and silently drops honeypot submissions. A generous per-client limiter runs before Siteverify to bound validation floods; a separate tighter origin-keyed quota runs after successful Turnstile validation and before GitHub, so invalid tokens cannot consume the issue quota. The Cloudflare request IP is used only as an ephemeral limiter key and never enters GitHub or application storage. Diagnostics are off by default and allowlist only app version, language, display mode, output mode, wizard page, and viewport. `feedback-worker/src/index.js` discards every other diagnostic key.

Production secrets are configured as Cloudflare Worker secrets. `GITHUB_TOKEN` must be restricted to Issues write access on the target repository; `TURNSTILE_SECRET_KEY` is used only for mandatory server-side Siteverify. The non-secret repository, allowed origin, expected hostname, and public site key are deployment variables. See `feedback-worker/README.md` for setup.

## Behavioral equivalence

`tests/test_refactor_structure.js` keeps three historical golden hashes documented as immutable v1.0.0 release evidence:

| Artefact | SHA-256 |
|---|---|
| v1.0.0 single-file source | `7045421500a5497ca403699a2297c2ad8fa3e53f81f053300e8abdd84630cf3f` |
| v1.0.0 CSS | `262e12b5356f5a50c63aa7cd7249b3c5c8b101d8954f076de1360efbc222b896` |
| v1.0.0 JavaScript | `2897bfe7eda16d93c872d49f4dc8256f99549defe1927688903009f2a98483e7` |

The current feature bundle is no longer expected to equal the historical hashes. The 15-test structure suite reconstructs the current standalone file exactly from `src/`, preserves every released baseline through v1.2.1, pins the integrated v1.3.0 baseline separately, and validates JavaScript parsing, module order, unique HTML IDs, inline-handler contracts, exclusive persistence/bootstrap ownership, feedback's forbidden data dependencies and control markers, and the committed bundle.

`tests/test_v50.js` runs all 90 functional regressions against both the modular source and the standalone bundle. Mixer-specific and v1.2 coverage protect the complete staged DDT model, its normal-kitchen matrix, water-handling boundaries, routes, and bilingual guidance. The v1.2.1 patch coverage protects the 30 cm / 220 g default, percentage grids, bilingual grammar and flour copy, shared dough-ball formatting, Marinara's distinct sauce and 5 g finishing-EVOO layers, and the complete grouped sauce-choice partition. The v1.3 regression proves feedback diagnostics are explicit opt-in, recipe-free, excluded from local storage, and compatible with unchanged schema 51.

`tests/browser/refactor.spec.js` runs 47 Chromium checks. The shared checks cover both the standalone bundle and modular source at 320, 390, 430, 760, 1024, and 1280 px, including initialization, horizontal fit, Basic/Full behavior, persistence, practical input controls, staged water guidance, the phone picker, and click-versus-hover behavior. v1.2.1 coverage protects both collapsed sauce-disclosure surfaces and their keyboard operation. Feedback coverage opens the 320 px modal in English, submits through a mocked challenge and API, checks the exact privacy-safe payload, verifies the disabled/unconfigured path, and preserves a draft across backend failure for both publication forms.

`tests/feedback-worker.test.mjs` runs 16 dependency-free service tests. They protect exact CORS origins, disabled configuration including the mandatory hostname and both limiter bindings, preflight, fail-closed request and issue limits in their required order, field and body limits, honeypot behavior, normalized literal-email rejection, Unicode format-control removal, adaptive inert Markdown fencing, diagnostic allowlisting, production Turnstile action/hostname validation, the explicit dummy-key test override, GitHub issue formatting, mention neutralization, and secret-safe failure responses. Tests inject both remote services and never call Cloudflare or GitHub.

Playwright is a development-only dependency. Wrangler is isolated under `feedback-worker/` and is required only to run or deploy that optional service. Neither tool is bundled into `index.html` or required by offline users. Cloudflare Turnstile is loaded lazily only after a user opens a configured online feedback form.

## Change workflow

1. Identify the module that owns the behavior.
2. Add a focused regression test before fixing a bug or adding a feature.
3. Edit source files under `src/` and run `npm run bundle`.
4. Run `npm test`; use `npm run test:fast` only when intentionally skipping the local browser layer during intermediate work.
5. Do not automatically update golden hashes after an intentional behavioral change; first document why the branch is no longer behavior-neutral and establish the reviewed new baseline.
6. Test layout, keyboard behavior, and native browser signals in Chromium at the relevant viewports.

## Deliberate follow-ups

ES modules, removal of the remaining inline handlers, and extraction of a DOM-independent calculation core may be valuable later, but each is a separate architecture step. They change name resolution, coupling, or the public browser API and must not be hidden in unrelated feature work. The remaining low-severity accessibility improvement from the golden audit is also a separate follow-up.

Claude's first v1.2.1 audit also reproduced a pre-existing unguarded `deadlineRecommendation()` path for a bake time roughly 48 hours ahead. The same behavior exists in released v1.2.0 and is outside this localization/recipe/UI patch. It must be handled as a separate planning fix with its own functional matrix rather than being folded silently into v1.2.1.
