# 🍕 Pizza Dough Calculator

[English](README.md) | [Nederlands](README.nl.md)

[![Version](https://img.shields.io/badge/version-v2.0.0--candidate-f0b45a)](docs/V2_0_0_IMPLEMENTATION_REVIEW.md)
[![Tests](https://img.shields.io/badge/regression_tests-106_cases-76c990)](tests/test_v50.js)
[![App](https://img.shields.io/badge/refactor-static_HTML%2FCSS%2FJS-f0b45a)](docs/ARCHITECTURE.md)
[![Languages](https://img.shields.io/badge/interface-NL_%7C_EN-7eaadc)](#language-privacy-and-storage)

A comprehensive Dutch and English calculator for pizza dough, fermentation, sauce, toppings, and a complete practical workflow.

The downloadable application remains one self-contained `index.html`. The repository keeps maintainable HTML, CSS, and JavaScript sources under `src/` and generates the standalone root `index.html` for GitHub Pages and offline use without runtime dependencies.

**[Open the live calculator](https://hound83.github.io/pizza-dough-calculator/)** · [Read the v1.4.0 release notes](docs/V1_4_0_RELEASE_REVIEW.md)

> **v2.0.0 review candidate.** The live page remains at v1.4.1 until review is addressed. Tag v1.0.0 and all earlier baselines are preserved. Schema 53 migrates existing schema-52 data.

**New in v2:** freely switch between Plan and Kitchen, plan around availability, split dough into independent mixer runs, follow a queue with actual oven-in/out times, get contextual dough help, and reuse complete evening templates or transfer private backups. The visible version, dynamic weekdays and previous improvements remain intact. [Implementation and review](docs/V2_0_0_IMPLEMENTATION_REVIEW.md).

**For Claude/reviewers:** [start here](CLAUDE.md#v200-review-current-candidate). The [full original review](docs/Pizza_Calculator_Volledige_Review_2026-09-21.md) and current implementation roadmap are stored in this branch; separate attachments are unnecessary.

## Features

The app currently offers three usage modes:

| Mode | Includes |
|---|---|
| **Dough only** | Dough calculation, fermentation, yeast advice, kneading, and baking advice |
| **Dough + sauce** | Everything in Dough only, plus a separate sauce calculator |
| **Complete pizzas** | Dough, sauce, one recipe per dough ball, toppings, shopping list, and complete workflow |

Independently of those output modes, Plan offers **Basic** and **Full** display modes. Basic keeps the practical inputs and results visible while presets manage technical dough values. Full exposes every existing setting. In Basic, temperature readings are optional and collapsed; Full shows them directly. No reading is required to continue, and switching preserves existing measurements. Switching is lossless; existing v1.0 users migrate to Full and new users start in Basic.

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
- save a running batch with actual checkpoints, resume it later, and adjust the oven without changing its dough recipe;
- save, compare and exchange your own dough recipes through JSON;
- check scale precision and refrigerator capacity and record mixer observations;
- complete Dutch and English interface.

## Usage

1. Start in Plan. Choose what you are making; Basic/Full remains available through the display choices.
2. Select a preset or enter your own dough values.
3. Choose diameter or dough-ball weight as the leading measurement.
4. Configure fermentation, temperatures, and optionally a target baking time.
5. In Complete pizzas mode, assign a recipe to each dough ball.
6. Open Kitchen for instructions, or use Start dough to track actual checkpoints, mixer runs and the oven queue.

All calculations update immediately. Values and progress are stored locally in the browser, so refreshing the page does not discard the recipe.

## Scientifically informed, practically oriented

The calculator combines baker's percentages, time, temperature, yeast type, dough mass, and flour strength in one practical home model. v1.2 models the actual thermal workflow: main water and flour first, mixing heat, a refrigerated autolyse or room-temperature hydration rest, room-temperature reserved water and later ingredients, then route-specific kneading heat. It solves the required main-water temperature inside a practical 1–45 °C interval and reports targets that cannot be reached inside that interval. The calibrated core focuses on ordinary kitchens at 15–30 °C; the wider 10–35 °C input range remains available with a confidence warning.

The AVPN preset uses published AVPN constraints for dough, time, and yeast range. Other parts use evidence-informed relationships from dough and yeast literature, supplemented by explicitly documented practical home-baking calibrations. The effective mixer constants are reference-batch model terms, not universal measurements for every machine.

This is intentionally **not a validated laboratory model** or an official AVPN calculator. Treat its advice as a well-informed starting point and always assess the actual dough: volume, tension, aeration, temperature, and maturity matter more than the clock alone.

## Language, privacy, and storage

- The interface switches immediately between Dutch and English.
- No account or server is required.
- Recipes, evenings, progress and the dough log stay in your browser. One tab can write at a time; close it and reload another to take over. If locking or storage is unavailable, the app reports that it cannot save.
- Shareable evening templates omit private names and actual history. Private backups include them and require confirmation before replacing local data; they are snapshots, not synchronization.
- The app sends no recipe or log data to a backend.
- `Reset` removes the locally stored calculator state but preserves the language choice.

## Running locally

The simplest option is to download `index.html` and open it directly in a modern browser.

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

## Development and tests

The published application has no runtime dependencies. Development requires Node.js 20 or newer; Playwright is the single development dependency used for real Chromium coverage.

Install the reproducible development environment once:

```bash
npm ci
npx playwright install chromium
```

Then run the complete suite:

```bash
npm test
```

Release verification suite (see the PR Actions result for execution status):

```text
15 refactor-structure tests
31 pure-core tests
106 bundle regression tests
106 source regression tests
139 Chromium browser/layout tests
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

The structure suite also checks the eighteen fixed module boundaries, script order, unique HTML IDs, inline-handler contracts, sole ownership of persistence/bootstrap, bundle freshness, exact reconstruction of the current feature bundle, the immutable historical release hashes, the historical v1.3.0 and v1.4.0 candidate baselines, and the separate v1.4.0/v1.4.1 release baselines. Playwright opens both publications at 320, 390, 430, 760, 1024, and 1280 px and verifies error-free loading and horizontal fit. Focused browser checks also protect bilingual main/reserved-water wording, cold-tap versus ice-water guidance, route-correct hot-water warnings, both collapsed grouped sauce-override surfaces, and keyboard activation. Phone coverage protects the full-height single-pane recipe catalogue, deliberate search focus, filter scrolling, catalogue-to-customization navigation, and the click-versus-hover selection contract. Chromium also exercises the practical percentage-field ArrowUp/ArrowDown increments.

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
| **v1.4.0** | Batch tracking, recipe profiles, kitchen guidance and the improved 1.3 planning |
| **v2.0.0** | Reserved for a genuinely breaking change |

Historic working versions such as v50 remain where technically necessary in storage migrations, test names, and audit documents. They are no longer used as public product versions.

## Project structure

| Path | Purpose |
|---|---|
| [`index.html`](index.html) | Generated standalone publication for Pages and offline use |
| [`src/index.html`](src/index.html) | Semantic source HTML and fixed asset-loading order |
| [`src/assets/css/app.css`](src/assets/css/app.css) | Complete presentation and responsive layout |
| [`src/assets/js/`](src/assets/js/) | Fifteen ordered responsibility-based modules |
| [`tools/bundle.js`](tools/bundle.js) | Dependency-free standalone bundler and drift check |
| [`tests/test_v50.js`](tests/test_v50.js) | Fast Node/VM functional regression suite |
| [`tests/test_refactor_structure.js`](tests/test_refactor_structure.js) | Architecture, integrity, and golden-equivalence tests |
| [`tests/browser/refactor.spec.js`](tests/browser/refactor.spec.js) | Chromium loading, responsive layout, and picker interaction tests |
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

- **Review candidate:** v2.0.0; live remains v1.4.1; tag v1.0.0 and all earlier baselines remain preserved.
- **Architecture:** static HTML, CSS and eighteen JavaScript modules generate the standalone publication for GitHub Pages.
- **Review:** Claude's independent 1.4 crosscheck and the response to all eight findings are recorded in [the release review](docs/V1_4_0_RELEASE_REVIEW.md).
- **Included:** all six evening workflow improvements, schema-53 migration, dynamic weekdays and the existing workshop/calculation contracts.
- **Deferred:** app development and the three proposed physical-model investigations.
- **Feedback:** anonymous feedback/Cloudflare remains separate work; PR #12 is not included in this release.

## Background

This started as a simple personal dough calculator and, as good pizza projects apparently do, got slightly out of hand. 😄

Developed by Michael through iterative collaboration with GPT/Codex and independent cross-checks by Claude.
