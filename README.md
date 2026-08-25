# 🍕 Pizza Dough Calculator

[English](README.md) | [Nederlands](README.nl.md)

[![Version](https://img.shields.io/badge/version-v1.3.0_candidate-f0b45a)](docs/Claude_v1.3.0_feedback_handoff.md)
[![Tests](https://img.shields.io/badge/regression_tests-90%2F90_passing-76c990)](tests/test_v50.js)
[![App](https://img.shields.io/badge/refactor-static_HTML%2FCSS%2FJS-f0b45a)](docs/ARCHITECTURE.md)
[![Languages](https://img.shields.io/badge/interface-NL_%7C_EN-7eaadc)](#language-privacy-and-storage)

A comprehensive Dutch and English calculator for pizza dough, fermentation, sauce, toppings, and a complete practical workflow.

The downloadable application remains one self-contained `index.html`. The repository keeps maintainable HTML, CSS, and JavaScript sources under `src/` and generates the standalone root `index.html` for GitHub Pages and offline use. The calculator core has no runtime dependency; v1.3 feedback is an optional online action that loads its anti-bot check only when opened.

**[Open the live calculator](https://hound83.github.io/pizza-dough-calculator/)** · [View the v1.2.1 release](https://github.com/hound83/pizza-dough-calculator/releases/tag/v1.2.1)

> Tag **v1.0.0** remains the immutable golden behavior baseline. v1.2.1 is the current public release; this branch builds the backward-compatible v1.3.0 anonymous-feedback candidate on top of that complete release without changing storage schema 51.

## Features

The app currently offers three usage modes:

| Mode | Includes |
|---|---|
| **Dough only** | Dough calculation, fermentation, yeast advice, kneading, and baking advice |
| **Dough + sauce** | Everything in Dough only, plus a separate sauce calculator |
| **Complete pizzas** | Dough, sauce, one recipe per dough ball, toppings, shopping list, and complete workflow |

Independently of those output modes, the start screen offers **Basic** and **Full** display modes. Basic keeps the practical inputs and results visible while presets manage technical dough values. Full exposes every existing setting. Switching is lossless; existing v1.0 users migrate to Full and new users start in Basic.

Highlights:

- calculate from pizza diameter or target dough-ball weight;
- up to 24 pizzas between 20 and 40 cm;
- seven dough presets plus fully custom settings;
- five dough styles: Neapolitan, AVPN midpoint profile, Canotto, New York, and thin/crispy;
- hydration, salt, oil, and IDY, ADY, or fresh yeast;
- hybrid, cold, or all-room-temperature fermentation;
- room, refrigerator, and final dough temperatures;
- staged, heat-capacity-weighted main-water guidance for hand kneading, KitchenAid, Kenwood, and spiral mixers, with refrigerated autolyse and direct hydration rest modelled separately;
- flour selection with known or manually entered W value;
- 92 pizza recipes, seven sauce variants, and search/filtering by name or ingredient;
- an individual recipe, sauce, pizza style, and topping customization for every dough ball;
- topping quantities scaled automatically by pizza surface area;
- combined sauce batches, ingredient summaries, and shopping quantities;
- backward planning from a desired baking day and time;
- checkable steps, print layout, and copyable recipes;
- optional live temperature measurements and a local dough log;
- optional in-app feedback without a GitHub account, stored transparently as a public GitHub issue;
- complete Dutch and English interface.

## Usage

1. Choose Basic or Full, then choose how much of the calculator you need.
2. Select a preset or enter your own dough values.
3. Choose diameter or dough-ball weight as the leading measurement.
4. Configure fermentation, temperatures, and optionally a target baking time.
5. In Complete pizzas mode, assign a recipe to each dough ball.
6. Follow the generated workflow from mixing through baking.
7. Optionally use **Feedback** to report a bug or idea without signing in to GitHub.

All calculations update immediately. Values and progress are stored locally in the browser, so refreshing the page does not discard the recipe.

## Scientifically informed, practically oriented

The calculator combines baker's percentages, time, temperature, yeast type, dough mass, and flour strength in one practical home model. v1.2 models the actual thermal workflow: main water and flour first, mixing heat, a refrigerated autolyse or room-temperature hydration rest, room-temperature reserved water and later ingredients, then route-specific kneading heat. It solves the required main-water temperature inside a practical 1–45 °C interval and reports targets that cannot be reached inside that interval. The calibrated core focuses on ordinary kitchens at 15–30 °C; the wider 10–35 °C input range remains available with a confidence warning.

The AVPN preset uses published AVPN constraints for dough, time, and yeast range. Other parts use evidence-informed relationships from dough and yeast literature, supplemented by explicitly documented practical home-baking calibrations. The effective mixer constants are reference-batch model terms, not universal measurements for every machine.

This is intentionally **not a validated laboratory model** or an official AVPN calculator. Treat its advice as a well-informed starting point and always assess the actual dough: volume, tension, aeration, temperature, and maturity matter more than the clock alone.

## Language, privacy, and storage

- The interface switches immediately between Dutch and English.
- No account, server, or network is required for calculations, recipes, storage, or the dough log.
- Recipe settings, progress, and the dough log are stored only in the browser through `localStorage`.
- Feedback submission is a separate, explicit online action. It never sends recipe values, dough-log data, or browser storage.
- Safe technical context is off by default and contains only app version, language, modes, wizard page, and viewport when selected.
- Feedback text is stored as a public GitHub issue. The form has no contact field and warns against personal information.
- Opening a configured feedback form loads Cloudflare Turnstile for the anti-bot check; the modal discloses this and links to Cloudflare's privacy policy.
- `Reset` removes the locally stored calculator state but preserves the language choice.

## Running locally

The simplest option is to download `index.html` and open it directly in a modern browser. All calculator functions work this way; the feedback form directs offline copies to the live calculator because Cloudflare Turnstile does not support `file://` pages.

You can also clone the repository:

```bash
git clone https://github.com/hound83/pizza-dough-calculator.git
cd pizza-dough-calculator
```

Then open `index.html`, or preferably start a small local web server:

```bash
python -m http.server 8000
```

Open `http://localhost:8000`.

## Publishing with GitHub Pages

Because the complete distributable app is already named `index.html`, no production build configuration is required:

1. open **Settings → Pages** in GitHub;
2. choose **Deploy from a branch**;
3. select `main` and `/ (root)`;
4. save the setting.

The site will normally be available at:

```text
https://<username>.github.io/<repository-name>/
```

GitHub Pages cannot securely create anonymous issues by itself. The optional v1.3 feedback button therefore uses the separate adapter under [`feedback-worker/`](feedback-worker/). Its one-time Cloudflare, Turnstile, and repository-scoped GitHub setup is documented in [`feedback-worker/README.md`](feedback-worker/README.md). The calculator stays fully usable when this adapter is absent.

## Development and tests

The calculator core has no runtime dependencies. Development requires Node.js 20 or newer; Playwright provides real Chromium coverage. The optional feedback adapter keeps its pinned Wrangler tooling in a separate package so it never enters the standalone calculator bundle.

Install the reproducible development environment once:

```bash
npm ci
npx playwright install chromium
```

Then run the complete suite:

```bash
npm test
```

Candidate test inventory:

```text
15 refactor-structure tests passed
16 feedback Worker security tests passed
90 bundle regression tests passed
90 source regression tests passed
47 Chromium browser/layout tests passed
```

The suite covers, among other things:

- recipe calculations and numeric boundaries;
- more than 1,500 fermentation-schedule combinations and a separate 1,920-case normal-kitchen DDT matrix;
- per-keystroke input, empty fields, and browser-like focus/blur semantics;
- migration and storage of older calculator versions;
- preservation of recipes and checked steps when the pizza count changes;
- all 92 pizza recipes in Dutch and English;
- picker selection, search, filters, customizations, and explicit commit behavior;
- AVPN warnings and the complete bilingual AVPN information block;
- sauce aggregation, shopping quantities, and copyable output;
- render smoke tests across languages, modes, and dough styles.

The structure suite also checks the twelve fixed module boundaries, script order, unique HTML IDs, inline-handler contracts, sole ownership of persistence/bootstrap, bundle freshness, exact reconstruction of the current feature bundle, every released baseline through v1.2.1, and the integrated v1.3.0 candidate. Playwright opens both publications at 320, 390, 430, 760, 1024, and 1280 px and verifies error-free loading and horizontal fit. Focused checks protect staged water guidance, the v1.2.1 translation and sauce-choice repairs, and the feedback modal's success, unconfigured, privacy, payload, and retry paths. Phone coverage protects the full-height picker and click-versus-hover contract. The Worker suite injects Turnstile and GitHub responses and verifies that secrets and recipe data cannot cross the API boundary.

Use the following commands when working on the modular sources:

```bash
npm run bundle        # regenerate root index.html from src/
npm run check:bundle  # fail if the committed bundle is stale
```

## Versioning

The project uses semantic versioning from the first golden release onward:

| Example | Meaning |
|---|---|
| **v1.0.0** | First golden functional release |
| **v1.0.1** | Backward-compatible bug fix after v1.0.0 |
| **v1.1.0** | New backward-compatible functionality, such as Basic/Full |
| **v1.1.1** | Backward-compatible usability correction after v1.1.0 |
| **v1.2.0** | Staged, route-aware main-water and final-dough-temperature calculation |
| **v1.2.1** | Backward-compatible localization, recipe-data, and sauce-choice cleanup |
| **v1.3.0** | Optional anonymous-feedback functionality on top of v1.2.1 |
| **v2.0.0** | Reserved for a genuinely breaking change |

Historic working versions such as v50 remain where technically necessary in storage migrations, test names, and audit documents. They are no longer used as public product versions.

## Project structure

| Path | Purpose |
|---|---|
| [`index.html`](index.html) | Generated standalone publication for Pages and offline use |
| [`src/index.html`](src/index.html) | Semantic source HTML and fixed asset-loading order |
| [`src/assets/css/app.css`](src/assets/css/app.css) | Complete presentation and responsive layout |
| [`src/assets/js/`](src/assets/js/) | Twelve ordered responsibility-based modules |
| [`feedback-worker/`](feedback-worker/) | Optional secured adapter from anonymous feedback to GitHub Issues |
| [`tools/bundle.js`](tools/bundle.js) | Dependency-free standalone bundler and drift check |
| [`tests/test_v50.js`](tests/test_v50.js) | Fast Node/VM functional regression suite |
| [`tests/test_refactor_structure.js`](tests/test_refactor_structure.js) | Architecture, integrity, and golden-equivalence tests |
| [`tests/browser/refactor.spec.js`](tests/browser/refactor.spec.js) | Chromium loading, responsive layout, and picker interaction tests |
| [`tests/feedback-worker.test.mjs`](tests/feedback-worker.test.mjs) | CORS, privacy, Turnstile, and GitHub-adapter security tests |
| [`playwright.config.js`](playwright.config.js) | Reproducible local and CI browser-test configuration |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Module boundaries, dependencies, and change rules |
| [`docs/PRODUCT_GUARDRAILS.md`](docs/PRODUCT_GUARDRAILS.md) | Non-negotiable product behavior and change protocol |
| [`docs/V1.2.0_CALCULATION_MODEL.md`](docs/V1.2.0_CALCULATION_MODEL.md) | Approved v1.2 calculation boundary, constants, outputs, and tests |
| [`docs/Claude_v1.2.1_patch_handoff.md`](docs/Claude_v1.2.1_patch_handoff.md) | Independent audit record and evidence for the v1.2.1 release |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Quality rules and review checklist |
| [`README.nl.md`](README.nl.md) | Complete Dutch project documentation |
| [`docs/`](docs/) | Audit handoffs, rationale, and test instructions |

The standalone root `index.html` remains the downloadable and directly published calculator. The modular `src/` gives developers smaller files, explicit ownership, and automatic protection against a stale bundle or accidental behavioral drift.

## Status and roadmap

- **Release:** v1.2.1 is current; v1.3.0 is the integrated feedback candidate. Tag v1.0.0 remains the immutable historical golden baseline.
- **Current architecture:** static source HTML, CSS, and twelve JavaScript modules generate the standalone publication; a separate optional Worker owns anonymous issue creation.
- **Audit:** v1.2.0, v1.2.1, and the feedback candidate passed independent Claude crosschecks before integration.
- **Small follow-up:** a non-blocking accessibility improvement remains possible for seven extended field labels.
- **v1.1.0:** a clear **Basic/Full** toggle without creating two separate calculation models.
- **v1.1.1:** a 30 cm personal default, practical percentage controls, corrected bilingual count grammar, and consistent dough-ball-weight display.
- **v1.2.0:** a heat-capacity-weighted staged DDT model, separate autolyse/direct routes, explicit main versus reserved water, honest attainability reporting, and normal-kitchen guidance.
- **v1.2.1:** repaired NL/EN copy, corrected Marinara layers, and a cleaner collapsed sauce override retaining all seven sauce types.
- **v1.3.0 candidate:** account-free feedback with explicit public-storage notice, opt-in safe diagnostics, server-side anti-bot validation, and no calculator-state migration.

## Background

This started as a simple personal dough calculator and, as good pizza projects apparently do, got slightly out of hand. 😄

Developed by Michael through iterative collaboration with GPT/Codex and independent cross-checks by Claude.
