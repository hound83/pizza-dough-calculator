# v2.0.0 release

Michael authorized publication after Claude’s two reviews and the final keyboard-focus correction. [PR #16](https://github.com/hound83/pizza-dough-calculator/pull/16) promotes the reviewed application to `main`, which GitHub Pages publishes at [the existing calculator URL](https://hound83.github.io/pizza-dough-calculator/).

## Included

- Connected Plan and Kitchen workspaces, chronological checkpoints, unknown times, undo, optional timers and calendar export.
- Availability constraints with explicit whole-plan alternatives.
- Independent mixer runs with whole-ball allocation and reconciled ingredient quantities.
- Stable pizza identities, toppings and a one-slot oven queue with actual in/out times.
- Contextual dough guidance alongside the current kitchen task.
- Reusable evening templates, a preview of shared data, private backups and schema-52 to schema-53 migration.

Basic keeps optional temperature readings collapsed; Full exposes them. No measurement is required to proceed. Switching preserves the recipe, measurements and progress. Dynamic local weekdays, Dutch/English and the visible version are retained.

## Review outcome

The [first crosscheck](Claude_v2.0.0_PR16_crosscheck.md), [second crosscheck](Claude_v2.0.0_PR16_crosscheck_followup.md) and [response](V2_0_0_CLAUDE_FOLLOWUP.md) remain available. Input-to-action handling, startup ownership, unknown-checkpoint ordering and final keyboard focus are corrected. An intermittent Edge/Windows download cancellation did not demonstrate an application defect; download implementation and tests remain unchanged.

## Verification and release identity

The final application commit is `d43910f56143d20425d0ee37fac98e7753b93898`. The release preparation changes documentation only; application files and the generated bundle are identical to that commit. Full `npm test` passed: 15 structure checks, 31 pure-core tests, 106 bundle regressions, 106 source regressions and 139 Chromium browser cases, with zero retries. [Complete verification run](https://github.com/hound83/pizza-dough-calculator/actions/runs/35848049987).

| Artifact | SHA-256 |
|---|---|
| Standalone `index.html` | `830c2fddd81b0a9baf88cc1c488e69874bf745048f6e207627b0a1fe090990db` |
| CSS | `5a6f1dcb860ab8dece22b7a088ba1727fb4a7f6a472f4ddd2b47b7b4c96129c9` |
| Combined JavaScript | `c3293b9fb0447187e4f43d323177ae2ba93eca2ca823d2ee9393978b2a69a23c` |

The existing `tests/baselines/v2.0.0-candidate.json` pins these identical bytes and is retained without renaming. Earlier candidate and release records remain historical evidence. GitHub Pages deployment status and the merged PR identify the publication commit; the site does not depend on creating a GitHub Release or tag.

## Limits and deferred work

One person, one bowl and one oven slot. Physical calculation constants, mixing/rest durations and recipe catalogue values are unchanged. Actual iPhone/Safari/Android behavior, physical wake lock, device suspension, cross-zone transfer and 200% text zoom remain manual follow-ups; Chromium viewport checks are not physical-device tests. Native-app packaging, feedback/Cloudflare and physical-model research remain separate work.
