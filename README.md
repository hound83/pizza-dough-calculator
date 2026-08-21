# 🍕 Pizza Dough Calculator

[English](README.md) | [Nederlands](README.nl.md)

[![Version](https://img.shields.io/badge/version-v1.0.0_release-76c990)](https://github.com/hound83/pizza-dough-calculator/releases/tag/v1.0.0)
[![Tests](https://img.shields.io/badge/regression_tests-64%2F64_passing-76c990)](tests/test_v50.js)
[![App](https://img.shields.io/badge/refactor-static_HTML%2FCSS%2FJS-f0b45a)](docs/ARCHITECTURE.md)
[![Languages](https://img.shields.io/badge/interface-NL_%7C_EN-7eaadc)](#language-privacy-and-storage)

A comprehensive Dutch and English calculator for pizza dough, fermentation, sauce, toppings, and a complete practical workflow.

The official v1.0.0 release remains one self-contained `index.html`. This refactor branch keeps the maintainable HTML, CSS, and JavaScript sources under `src/` and generates the same standalone root `index.html` for GitHub Pages and offline use without runtime dependencies.

**[Open the live calculator](https://hound83.github.io/pizza-dough-calculator/)** · [View the v1.0.0 release](https://github.com/hound83/pizza-dough-calculator/releases/tag/v1.0.0)

> **v1.0.0** is the first golden release and remains unchanged on `main`. This branch changes only the source structure. The recombined CSS and JavaScript are byte-for-byte identical to the release; storage and migration schema 50 are unchanged as well.

## Features

The app currently offers three usage modes:

| Mode | Includes |
|---|---|
| **Dough only** | Dough calculation, fermentation, yeast advice, kneading, and baking advice |
| **Dough + sauce** | Everything in Dough only, plus a separate sauce calculator |
| **Complete pizzas** | Dough, sauce, one recipe per dough ball, toppings, shopping list, and complete workflow |

Highlights:

- calculate from pizza diameter or target dough-ball weight;
- up to 24 pizzas between 20 and 40 cm;
- seven dough presets plus fully custom settings;
- five dough styles: Neapolitan, AVPN midpoint profile, Canotto, New York, and thin/crispy;
- hydration, salt, oil, and IDY, ADY, or fresh yeast;
- hybrid, cold, or all-room-temperature fermentation;
- room, refrigerator, and final dough temperatures;
- practical water-temperature and DDT guidance for hand kneading, KitchenAid, Kenwood, and spiral mixers;
- flour selection with known or manually entered W value;
- 92 pizza recipes, seven sauce variants, and search/filtering by name or ingredient;
- an individual recipe, sauce, pizza style, and topping customization for every dough ball;
- topping quantities scaled automatically by pizza surface area;
- combined sauce batches, ingredient summaries, and shopping quantities;
- backward planning from a desired baking day and time;
- checkable steps, print layout, and copyable recipes;
- optional live temperature measurements and a local dough log;
- complete Dutch and English interface.

## Usage

1. Choose how much of the calculator you need on the start screen.
2. Select a preset or enter your own dough values.
3. Choose diameter or dough-ball weight as the leading measurement.
4. Configure fermentation, temperatures, and optionally a target baking time.
5. In Complete pizzas mode, assign a recipe to each dough ball.
6. Follow the generated workflow from mixing through baking.

All calculations update immediately. Values and progress are stored locally in the browser, so refreshing the page does not discard the recipe.

## Scientifically informed, practically oriented

The calculator combines baker's percentages, time, temperature, yeast type, dough mass, and flour strength in one practical home model. The AVPN preset uses published AVPN constraints for dough, time, and yeast range. Other parts use evidence-informed relationships from dough and yeast literature, supplemented by clearly identifiable practical home-baking calibrations.

This is intentionally **not a validated laboratory model** or an official AVPN calculator. Treat its advice as a well-informed starting point and always assess the actual dough: volume, tension, aeration, temperature, and maturity matter more than the clock alone.

## Language, privacy, and storage

- The interface switches immediately between Dutch and English.
- No account or server is required.
- Recipe settings, progress, and the dough log are stored only in the browser through `localStorage`.
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

Node.js 18 or newer is required for development. The current structural and functional suite uses only Node.js and requires no installed packages:

```bash
npm test
```

Current result:

```text
11 refactor-structure tests passed
64 bundle regression tests passed
64 source regression tests passed
```

The suite covers, among other things:

- recipe calculations and numeric boundaries;
- more than 1,500 fermentation and solver combinations;
- per-keystroke input, empty fields, and browser-like focus/blur semantics;
- migration and storage of older calculator versions;
- preservation of recipes and checked steps when the pizza count changes;
- all 92 pizza recipes in Dutch and English;
- picker selection, search, filters, customizations, and explicit commit behavior;
- AVPN warnings and the complete bilingual AVPN information block;
- sauce aggregation, shopping quantities, and copyable output;
- render smoke tests across languages, modes, and dough styles.

The structure suite also checks the eleven fixed module boundaries, script order, unique HTML IDs, inline-handler contracts, sole ownership of persistence/bootstrap, bundle freshness, and exact reconstruction of the golden single-file source.

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
| **v2.0.0** | Reserved for a genuinely breaking change |

Historic working versions such as v50 remain where technically necessary in storage migrations, test names, and audit documents. They are no longer used as public product versions.

## Project structure

| Path | Purpose |
|---|---|
| [`index.html`](index.html) | Generated standalone publication for Pages and offline use |
| [`src/index.html`](src/index.html) | Semantic source HTML and fixed asset-loading order |
| [`src/assets/css/app.css`](src/assets/css/app.css) | Complete presentation and responsive layout |
| [`src/assets/js/`](src/assets/js/) | Eleven ordered responsibility-based modules |
| [`tools/bundle.js`](tools/bundle.js) | Dependency-free standalone bundler and drift check |
| [`tests/test_v50.js`](tests/test_v50.js) | Fast Node/VM functional regression suite |
| [`tests/test_refactor_structure.js`](tests/test_refactor_structure.js) | Architecture, integrity, and golden-equivalence tests |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Module boundaries, dependencies, and change rules |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Quality rules and review checklist |
| [`README.nl.md`](README.nl.md) | Complete Dutch project documentation |
| [`docs/`](docs/) | Audit handoffs, rationale, and test instructions |

The standalone root `index.html` remains the downloadable and directly published calculator. The modular `src/` gives developers smaller files, explicit ownership, and automatic protection against a stale bundle or accidental behavioral drift.

## Status and roadmap

- **Release:** golden v1.0.0 remains frozen on `main` and tag `v1.0.0`.
- **This branch:** behavior-neutral refactor to static HTML, CSS, and eleven JavaScript modules, ready for independent comparison with `main`.
- **Small follow-up:** the remaining non-blocking accessibility improvement for seven extended field labels stays outside this behavior-neutral refactor.
- **v1.1.0:** a clear **Basic/Full** toggle without creating two separate calculation models.

## Background

This started as a simple personal dough calculator and, as good pizza projects apparently do, got slightly out of hand. 😄

Developed by Michael through iterative collaboration with GPT/Codex and independent cross-checks by Claude.
