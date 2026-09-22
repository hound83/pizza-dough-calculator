# Claude repository instructions

Before proposing or making changes, read these files completely:

1. `docs/PRODUCT_GUARDRAILS.md`
2. `docs/ARCHITECTURE.md`
3. `CONTRIBUTING.md`

Treat `docs/PRODUCT_GUARDRAILS.md` as the canonical source for non-negotiable product behavior. Maintainable application sources live under `src/`; root `index.html` is generated with `npm run bundle` and must not be edited directly. Run `npm test` before declaring work complete, and never change the golden hashes without an explicitly approved functional baseline change.

## v2.0.0 review: current candidate

Read [the response to your PR #16 crosscheck](docs/V2_0_0_CLAUDE_FOLLOWUP.md) for the three corrections and Michael’s authorized Basic/Full refinement. The original [crosscheck](docs/Claude_v2.0.0_PR16_crosscheck.md) is preserved.

Review [the implementation, acceptance map and verification](docs/V2_0_0_IMPLEMENTATION_REVIEW.md) first, then [the complete accepted design](docs/V2_0_0_ACCEPTED_DESIGN.md). Compare `feature/v2.0-kitchen-workflow` against released v1.4.1 / main `0674eed`. All six later workflow proposals are explicitly authorized for this single v2 candidate. Schema 53 and eighteen modules are intentional. The three additional numerical investigations remain separate research; app development and feedback remain parked. Main stays at 1.4.1 pending review.

Prioritize state ownership and migration, rounded parent/child mass conservation, actual versus unknown chronology, undo dependencies, availability conflicts, stable pizza identities and first-launch linkage, transfer privacy, keyboard/mobile flow and retained numerical guardrails. Report current reproducible issues against the final branch HEAD; historical candidate findings below are context. Do not use the old six-proposals exclusion for this authorized candidate.

## v1.4.0 release review

Start with [the release response and verification](docs/V1_4_0_RELEASE_REVIEW.md), then read [Claude's original PR #14 crosscheck](docs/Claude_v1.4.0_PR14_crosscheck.md). All eight findings are addressed. Historical candidate handoffs below describe their original snapshots; the release has a separate baseline. The six later workflow proposals and app development are outside this release.

## Current recovery verification

Read [the recovery verification](docs/V1_4_0_RECOVERY_VERIFICATION.md), then the implementation handoff below. Claude's original crosscheck and the response are both retained on this branch.

## v1.4.0 implementation: start here

The user asked to implement all seven additional recommendations. Read [the v1.4 implementation and reviewer handoff](docs/V1_4_0_IMPLEMENTATION_REVIEW.md) first. This branch is `feature/v1.4.0-batch-workflow`, based on the v1.3 candidate. Review its feature diff against `feature/v1.3.0-planning-review`; retain the full original scientific review below as context. Storage schema 52 is an intentional, tested migration. Do not apply the historical schema-51 or no-profile exclusions to this explicitly authorized version.

## v1.3.0 review: start here

The review documents are committed to this branch; no chat attachments are required.

1. Read [the current candidate decisions, implementation status and code roadmap](docs/V1_3_0_REVIEW_AND_ROADMAP.md).
2. Read [the complete original review, including Claude-comment assessment, scientific sources and the professional recipe](docs/Pizza_Calculator_Volledige_Review_2026-09-21.md).
3. Review the current branch against released `v1.2.1`; the original review predates the implementation, so verify each finding against the current code before reporting it as unresolved.

The user's later clarification takes precedence over the original shorter-rest proposal: aim for roughly two hours until cold fermentation, shorten only when equivalent quality is supported, and do not shorten mixing times. A replacement spiral hook still uses the KitchenAid method; sufficient gluten development and physical temperature-model accuracy remain unvalidated for the exact setup. Feedback/Cloudflare PR #12 remains parked; this candidate is PR #13 on `feature/v1.3.0-planning-review`.

## Claude crosscheck completion

Read [the original crosscheck](docs/Claude_v1.3.0_PR13_crosscheck.md) and [the response with corrections and regression evidence](docs/V1_3_0_CLAUDE_FOLLOWUP.md). The original review is preserved; its six follow-up findings are addressed in the current candidate.
