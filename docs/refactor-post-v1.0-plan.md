# Behavior-neutral refactor after v1.0.0

## Goal

The released v1.0.0 remains one self-contained `index.html`. This branch keeps maintainable sources under `src/` and generates the same standalone root publication without changing features, formulas, persistence, or user behavior.

After a successful audit, the public product version became **v1.0.0**. The historic v50 name remains only where technically required for audits, tests, and backward-compatible `localStorage` migration.

## Why a separate branch?

Functional release changes and architecture changes are deliberately separated. Every comparison can therefore show whether a difference comes from product logic or file structure alone. The v1.0.0 single-file source and its three golden hashes are the fixed reference for this branch.

## Implemented structure

```text
src/index.html                     semantic HTML and fixed script order
src/assets/css/app.css             exactly extracted stylesheet
src/assets/js/                     eleven responsibility-based scripts
index.html                         generated standalone publication
tools/bundle.js                    dependency-free bundler and drift check
tests/test_refactor_structure.js   architecture and golden-equivalence tests
tests/test_v50.js                  64 functional regression tests
docs/ARCHITECTURE.md               ownership and change rules
package.json                       reproducible development commands
```

## Commands

Build or verify the standalone publication:

```bash
npm run bundle
npm run check:bundle
```

Run every architecture and functional test:

```bash
npm test
```

## Completed phases

1. Split the original inline stylesheet and script into maintainable source files while preserving their bytes and load order.
2. Move the modular source under `src/` and restore the standalone root publication with automatic drift detection.
3. Standardize active developer documentation in English, retain a complete Dutch README, and preserve historic Dutch audit evidence.

## Processing new feedback

When a new v1.0.0 finding appears:

1. analyze and repair it first on a dedicated bug-fix branch from `main`;
2. test and commit the unsplit fix there;
3. merge or cherry-pick it into `refactor/post-v1.0-prep` within the owning module;
4. regenerate the root bundle and run the complete suite;
5. repeat the focused browser test against both source and distribution.

A functional fix on `main` must be distributed across the relevant refactor modules. The golden-hash test should fail until the new functional baseline and its rationale are explicitly recorded.

## Next architecture steps

1. Add reproducible Chromium layout coverage for the standalone bundle and modular source.
2. Ask Claude to compare the completed refactor directly with `main`.
3. Resolve any loading, hosting, browser, or maintainability findings on this branch.
4. Keep product version 1.0.0 while behavior remains fully equivalent.
5. Consider ES modules, removal of inline handlers, and a DOM-independent calculation core only in separately audited architecture work.
6. Build Basic/Full as new **v1.1.0** functionality after the refactor is accepted.

Module responsibilities and change rules are documented in `docs/ARCHITECTURE.md`. The independent audit scope is in `docs/Claude_refactor_handoff_v1.0.0.md`.
