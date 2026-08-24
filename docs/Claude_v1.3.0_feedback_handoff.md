# Claude audit handoff — v1.3.0 anonymous feedback candidate

## Audit target

- Released comparison baseline: `f85c1d2ce274a9c68e04916d55f630ce4d5c6fef` (`main`, released v1.1.1)
- Candidate branch: `feature/v1.3.0-feedback`
- Base calculation commit: `9a9742a` (`feature/v1.2.0-calculation-model`)
- Comparison after publication: <https://github.com/hound83/pizza-dough-calculator/compare/main...feature/v1.3.0-feedback>
- Public version in the candidate: `1.3.0`
- Persistence remains: `pizzaCalcV51` / schema `51`

This is a feature audit, not a behavior-neutral refactor audit. The intended new behavior is a Dutch/English in-app feedback form that does not require a GitHub account. The staged v1.2.0 calculation model at `9a9742a` is the direct functional baseline; all pizza, dough, fermentation, mixer, picker, Basic/Full, AVPN, and persistence behavior outside feedback must remain unchanged from that commit.

## Product decision

GitHub Pages cannot safely write anonymous text to a repository. Direct GitHub API calls would expose a repository credential in the browser, while ordinary GitHub issue forms require the submitter to sign in. The candidate therefore adds an optional Cloudflare Worker adapter:

```text
static calculator → Turnstile token → secured Worker → public GitHub issue
```

The calculator remains self-contained and offline-capable. Feedback is the only online feature, begins only when the user opens its modal, and degrades to an explicit unavailable/offline state without affecting the app.

## User-facing contract

- A compact **Feedback** button is available beside Reset and the language switch.
- The modal supports Bug/technical problem, Idea/improvement, Calculation/recipe, and Language/translation.
- Category, short summary, and message are required; reproduction steps are optional.
- There is no email, name, account, or contact field.
- The form explicitly says that feedback becomes a public GitHub issue and warns against personal information.
- The modal explicitly discloses that Cloudflare Turnstile is loaded for the anti-bot check and links to Cloudflare's privacy policy.
- Safe diagnostics are unchecked by default. Opting in includes only app version, language, Basic/Full mode, output mode, wizard page, and viewport.
- A downloaded `file://` calculator never tries to load Turnstile and points to the live calculator for submission.
- Unconfigured, offline, captcha, rate-limit, validation, backend-failure, and success states are localized.
- A failed request preserves the draft and provides a fresh challenge; a successful request links to the created issue.

## Data and storage boundary

`feedback.js` does not read calculator input fields, pizza selections, ingredient amounts, fermentation data, live measurements, dough-log entries, or local storage. Feedback controls carry `data-feedback-control` and are skipped by calculator event wiring. `saveState()` remains unchanged and writes schema 51 without feedback fields.

Diagnostics are a new object built from six existing non-recipe UI variables. The Worker independently allowlists those same six keys and discards all unexpected keys. The form sends no user-agent string.

## Backend controls to audit

The dependency-free module is `feedback-worker/src/index.js`; deployment configuration is `feedback-worker/wrangler.jsonc`.

1. `ALLOWED_ORIGINS` is an exact origin allowlist; rejected origins receive no CORS grant.
2. A native Cloudflare rate-limit binding fails closed after successful Turnstile validation and before GitHub. Invalid tokens cannot consume the shared issue quota; the limiter keys the approved application origin, not an IP address shared by mobile users.
3. The body is JSON-only and capped at 16 KiB; individual fields and categories are bounded again after parsing.
4. Honeypot submissions receive a quiet success but never call either remote service.
5. Email addresses are rejected before public storage.
6. Turnstile Siteverify is mandatory and checks success, action `pizza_feedback`, and the configured production hostname. Tokens remain server-side validated and single-use.
7. GitHub mentions are neutralized and user text is block-quoted in the generated issue.
8. `GITHUB_TOKEN` and `TURNSTILE_SECRET_KEY` exist only as Worker secrets. Errors expose neither upstream response bodies nor credentials.
9. The GitHub token is documented as fine-grained and restricted to Issues write on `hound83/pizza-dough-calculator`.
10. GitHub issue URLs returned to the browser are accepted only when they match the configured repository; the client additionally accepts only HTTPS `github.com/.../issues/<number>` links.

## Distribution and architecture

- `feedback.js` is the twelfth classic browser module and loads immediately before the sole persistence/bootstrap owner.
- New interactions use `addEventListener`; no new inline handler was added.
- Root `index.html` remains generated from `src/` and contains no external stylesheet or script reference.
- Turnstile's external script is injected lazily only after a configured online feedback modal opens.
- Wrangler is isolated in `feedback-worker/package.json` and never enters the calculator bundle.

Current candidate bundle evidence before production endpoint configuration:

| Artefact | SHA-256 |
|---|---|
| standalone `index.html` | `e61ba35b31976b37ef3edf2ea81e3f395597ae3da39a21932f405494fd394b8b` |
| CSS | `dae8b7731125c3540d3070b0940290052cc93d1d86db17d398643b215b5c5f7e` |
| combined JavaScript | `119b40d3e858240dbe6e336f2701962efa764f208e82b07c8b3c6fc9948c355d` |

These are candidate reconstruction evidence, not a released baseline. The immutable v1.0.0, v1.1.0, and v1.1.1 release hashes remain documented unchanged.

## Automated evidence

Local completed gates:

```text
15/15 structure and bundle-integrity checks
13/13 feedback Worker security tests
86/86 standalone functional regressions
86/86 modular-source functional regressions
```

Playwright discovers 41 Chromium checks: the v1.2.0 suite plus six feedback cases across standalone and source. The new browser coverage verifies a 320 px English success flow with an exact opt-in payload, the localized unconfigured path, and draft preservation after a backend failure for both publications.

This Codex sandbox has no Chromium executable, so local launch stops before application code runs. GitHub Actions must run all 41 checks with its installed Chromium before this candidate can advance.

## Intentional pre-release blanks

Two values are deliberately blank and must not be treated as finished production configuration:

- `feedback-worker/wrangler.jsonc` has an empty public `TURNSTILE_SITE_KEY`;
- `src/index.html` has an empty `pizza-feedback-api` meta value.

No secret is missing from source: secrets must never be committed. After code audit, production setup requires a Cloudflare Turnstile widget, the two Worker secrets, Worker deployment, the resulting HTTPS base URL in `src/index.html`, a fresh bundle, the complete test suite, and one disposable real issue submission. `docs/PRODUCT_GUARDRAILS.md` explicitly blocks a v1.3.0 tag until that end-to-end check succeeds.

## Requested audit verdict

Please compare the candidate with released v1.1.1 and answer:

1. Is all existing calculator behavior preserved outside the explicitly added feedback feature?
2. Can feedback, diagnostics, calculator event wiring, or persistence leak recipe/log/storage data?
3. Is the feedback modal usable, localized, keyboard-contained, and horizontally safe at the covered mobile widths?
4. Does the offline and unconfigured design preserve the standalone product promise honestly?
5. Are the Worker validation, CORS, native rate limit, Turnstile verification, GitHub request, Markdown formatting, and error responses safe enough for anonymous public input?
6. Are any credentials, personal data, upstream details, or unsafe issue links exposed?
7. Do the tests cover the meaningful success, privacy, abuse, and failure boundaries?
8. Is this a coherent backward-compatible v1.3.0 feature candidate on top of the accepted v1.2.0 calculation model, subject only to the explicitly deferred production configuration and real end-to-end check?

Classify findings by severity and separate release blockers from optional follow-ups.
