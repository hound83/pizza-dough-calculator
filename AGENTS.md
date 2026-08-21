# Coding-agent repository instructions

Before proposing or making changes, read these files completely:

1. `docs/PRODUCT_GUARDRAILS.md`
2. `docs/ARCHITECTURE.md`
3. `CONTRIBUTING.md`

Treat `docs/PRODUCT_GUARDRAILS.md` as the canonical source for non-negotiable product behavior. Maintainable application sources live under `src/`; root `index.html` is generated with `npm run bundle` and must not be edited directly. Run `npm test` before declaring work complete, and never change the golden hashes without an explicitly approved functional baseline change.
