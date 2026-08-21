# Claude audit handoff — behavior-neutral v1.0.0 refactor

## Comparison target

- Reference: `main` and tag `v1.0.0`
- Reference commit: `c8438febbf48efad00c09b883b6930a3eb4c0f70`
- Branch under audit: `refactor/post-v1.0-prep`
- Scope: source structure and maintainability only; no new product functionality

## What changed?

The original inline stylesheet moved to `src/assets/css/app.css`. The original inline script was split, in its original byte order, into eleven files with recognizable responsibilities. Dictionary data and the translation engine were separated from the general foundation as well. `src/index.html` loads these source assets directly; the dependency-free `tools/bundle.js` reconstructs the standalone root `index.html` served by GitHub Pages.

The earlier generated `split-preview/` and temporary `assets/js/app.js` are not part of the branch. `src/` is the maintainable source and root `index.html` is the committed standalone distribution.

Active developer documentation is now English. `README.md` is canonical and `README.nl.md` provides the same project guidance in Dutch. Historic Dutch audit and changelog documents remain unchanged as evidence. Existing Dutch JavaScript comments also remain unchanged because translating them would invalidate the golden JavaScript hash during a behavior-neutral refactor.

## Strongest equivalence evidence

The eleven JavaScript files concatenate without inserted characters to this exact v1.0.0 hash:

```text
2897bfe7eda16d93c872d49f4dc8256f99549defe1927688903009f2a98483e7
```

The CSS remains exactly:

```text
262e12b5356f5a50c63aa7cd7249b3c5c8b101d8954f076de1360efbc222b896
```

Inlining those source assets produces the golden v1.0.0 single-file source byte-for-byte:

```text
7045421500a5497ca403699a2297c2ad8fa3e53f81f053300e8abdd84630cf3f
```

`tests/test_refactor_structure.js` enforces all three values and verifies that the committed root bundle is current.

## Automated evidence before browser coverage

```text
11 refactor-structure tests passed
64 bundle regression tests passed
64 source regression tests passed
```

The structure suite additionally checks:

- exactly eleven source scripts in the fixed order;
- no inline CSS or JavaScript in the modular source;
- a completely self-contained root publication;
- no legacy all-in-one `app.js`;
- parseable recombined JavaScript;
- one explicit owner for persistence and bootstrap;
- 154 unique static HTML IDs;
- all 50 inline handlers resolve to application or browser functions.

## Requested independent browser comparison

Compare this branch directly with `main` and verify at least:

1. no 404, MIME, or load-order errors for the source assets;
2. no console or page errors during initialization;
3. existing v1.0.0 `localStorage` state still loads and saves under schema 50;
4. NL ↔ EN, reset, wizard navigation, and reload;
5. explicit click selection in the pizza picker; hover/focus must not change the commit target;
6. 24 → 20 and 4 → 8 → 4 through real input/blur events;
7. AVPN sets 405 °C while other presets preserve the selected stone temperature;
8. deadline planning, live temperature measurements, sauce aggregation, ingredients modal, copy, and print;
9. 320, 390, 430, 760, 1024, and 1280 px without new overflow or overlap;
10. maintainability of module boundaries, naming, documentation, and test contracts.

## Deliberately unchanged

- calculations, recipes, catalogue data, translations, and visible text;
- `APP_VERSION='1.0.0'`;
- `SAVE_KEY='pizzaCalcV50'` and `SAVE_VERSION=50`;
- AVPN product rules;
- the remaining low-severity accessibility finding concerning seven long labels;
- `main`, the tag, and the published v1.0.0 release.

## Audit question

Is this branch functionally equivalent to `main`, do both the standalone distribution and modular source load reliably in a real browser, and are its module boundaries, publication model, developer-language policy, and test contracts clear and maintainable enough for later v1.1.0 work?
