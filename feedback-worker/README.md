# Anonymous feedback Worker

This optional Cloudflare Worker validates anonymous calculator feedback and creates a GitHub issue without exposing a GitHub token to the browser. The calculator itself stays static, self-contained, and usable offline; only feedback submission needs this service and an internet connection.

## Security and privacy contract

- `GITHUB_TOKEN` and `TURNSTILE_SECRET_KEY` are Worker secrets and must never be committed or sent to the browser.
- The public Turnstile site key is returned by `GET /config` only when all required production bindings exist.
- `POST /feedback` accepts only four categories and strictly bounded text fields.
- Cloudflare Turnstile is verified server-side with the fixed `pizza_feedback` action and a mandatory configured hostname. The service remains disabled if that hostname is blank.
- The browser form has no contact field. The Worker rejects recognizable literal email addresses after Unicode normalization because issues in the configured repository are public; the form warning remains the primary protection against obfuscated contact details.
- Unicode format controls are removed and submitted message text is placed inside an adaptive Markdown text fence, so links, images, HTML, and nested fences remain inert in the public issue.
- Opt-in diagnostics are allowlisted. Recipe values, dough-log entries, local storage, and unexpected diagnostic keys are discarded.
- The Worker does not add the visitor's IP address to GitHub or application storage. Cloudflare processes the request and Turnstile check under its own privacy policy, which is linked directly in the modal.
- Allowed browser origins are exact matches from `ALLOWED_ORIGINS`.
- A generous native limiter permits at most 10 syntactically valid submissions per minute per Cloudflare request IP before Siteverify, protecting the validation service without storing that IP in GitHub or application data. After a valid Turnstile result, a separate shared binding limits issue creation to 3 attempts per minute per Cloudflare location before GitHub is called. Invalid tokens cannot consume the tighter shared issue quota.

## One-time production setup

1. Create a Cloudflare Turnstile widget for `hound83.github.io` and copy its public site key and secret key.
2. Create a fine-grained GitHub token restricted to `hound83/pizza-dough-calculator`, with **Issues: Read and write** and no broader repository permission. A GitHub App installation token with the same permission is also supported.
3. Replace the empty `TURNSTILE_SITE_KEY` value in `wrangler.jsonc` with the public site key.
   The committed rate-limit namespaces `1200` and `1201` must each be unique within the Cloudflare account; change only an identifier that already belongs to another binding.
4. Install and authenticate Wrangler:

   ```bash
   cd feedback-worker
   npm install
   npx wrangler login
   ```

5. Add both secrets interactively; never pass their values on the command line or commit them:

   ```bash
   npx wrangler secret put GITHUB_TOKEN
   npx wrangler secret put TURNSTILE_SECRET_KEY
   ```

6. Deploy and verify the health endpoint:

   ```bash
   npm run deploy
   curl https://<worker-url>/health
   ```

7. Put the resulting HTTPS Worker base URL in the `pizza-feedback-api` meta tag in `src/index.html`, regenerate the root bundle, and run the full suite before release.

Production is deliberately considered incomplete while either the public site key or the application endpoint is blank.

## Local development

Copy `.dev.vars.example` to the ignored `.dev.vars` file and replace only local values. Cloudflare's documented test keys are suitable for automated browser testing, but must not be used for production. Their validation response deliberately reports action `test`; the example therefore overrides `TURNSTILE_EXPECTED_ACTION` locally while committed production configuration remains fixed to `pizza_feedback`.

```bash
npm run dev
```

The root project runs the Worker unit suite without contacting Cloudflare or GitHub:

```bash
npm run test:worker
```

## Official references

- [Cloudflare Worker secrets](https://developers.cloudflare.com/workers/configuration/secrets/)
- [Cloudflare Turnstile server-side validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)
- [Cloudflare Turnstile test keys](https://developers.cloudflare.com/turnstile/troubleshooting/testing/)
- [Cloudflare Workers Rate Limiting binding](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/)
- [GitHub REST API: create an issue](https://docs.github.com/en/rest/issues/issues#create-an-issue)
