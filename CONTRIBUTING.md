# Contributing to the calculator

## Before you start

- Read `docs/PRODUCT_GUARDRAILS.md` and `docs/ARCHITECTURE.md`, then identify the module that owns the behavior.
- Keep functional changes, architecture changes, and data changes in separate commits.
- Change the storage key or schema only with an explicit migration path and regression test.
- Use `addEventListener` for new interactions; do not add new inline handlers.
- Keep feedback controls isolated from calculator event wiring and persistence.

## Language policy

- Use English for identifiers, developer documentation, commit messages, tests, and new code comments.
- Keep all user-facing interface text available in both Dutch and English through the existing i18n system.
- `README.md` is the canonical English project guide; keep `README.nl.md` equivalent in scope and meaning.
- Keep the heading-level sequence and language-navigation links aligned; `npm run test:structure` enforces this structural contract.
- Historic Dutch audit and changelog files are preserved as project evidence and do not need translation.
- Existing Dutch comments in the golden JavaScript remain untouched during the behavior-neutral refactor because changing them would break the verified JavaScript hash. Translate them only in a separately reviewed, deliberately non-golden cleanup.

## Quality rules

- For a bug, first add a test that reproduces the problem.
- Keep calculations deterministic and separate from visible formatting where practical.
- Normalize input only at the existing commit boundary; do not rewrite an active numeric field while the user is typing.
- Add new translation data to `translations.js` and dynamic bilingual text through the existing i18n helpers.
- Put new catalogue data in `catalog.js` and validate references with an invariant test.
- Document every intentional deviation from the v1.0.0 golden hashes.
- Treat generated root `index.html` as a distribution artefact: edit `src/`, run `npm run bundle`, and commit both source and bundle.
- Never commit `.dev.vars`, GitHub tokens, Turnstile secrets, or copied production responses. Public Worker variables still require review before deployment.
- Treat public feedback as untrusted input. Preserve the server-side category allowlist, body limits, email rejection, mention neutralization, exact CORS origins, and Turnstile action/hostname validation.

## Required checks

```bash
npm test
```

Changes to layout, focus, native events, persistence, or asset loading also require a real browser test. For responsive changes, verify at least 320, 390, 430, 760, 1024, and 1280 px.

Feedback changes additionally require `npm run test:worker`. A v1.2 production release also requires a real submission through the deployed Worker and Turnstile widget; mocked browser tests alone do not prove secret or hostname configuration.

## Review checklist

- [ ] The change is located in the owning module.
- [ ] A focused regression test covers the new or repaired behavior.
- [ ] The committed root bundle is current.
- [ ] All architecture and functional tests pass.
- [ ] Storage compatibility and AVPN rules remain intact or are explicitly migrated.
- [ ] Dutch and English have both been checked.
- [ ] Relevant keyboard and mobile scenarios have been tested in a real browser.
- [ ] Feedback changes send no recipe/log/storage data and expose no credential.
- [ ] Production feedback setup has passed a disposable end-to-end issue submission before release.
- [ ] README, architecture documentation, or audit handoff was updated when the structure changed.
