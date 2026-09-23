# v2.0.0 review response

Michael requested implementation of all three findings in [Claude's crosscheck](Claude_v2.0.0_PR16_crosscheck.md), plus the Basic/Full proposal discussed afterwards. The starting HEAD was `cf1669a` (review document only); application code matched reviewed `81c06ec`. This remains the v2.0.0 candidate in PR #16. Main/live stays v1.4.1 until publication is requested.

| Finding | Correction | Verification |
|---|---|---|
| First activation after input disappears | Persist input immediately; hold panel replacement through the native activation, then render current state. Do not move an already positioned oven queue. Release holds on canceled input and restore keyboard focus. | Type temperature then click/tap the transition once; type a pizza name then launch once; reload and check both the reading/name and event. Tab/Enter and cancellation cases. |
| Startup races early input | Static Plan view with an inert application and loading status; writer defaults to false. Restore state only after ownership resolves, then enable UI and expose explicit readiness. | Delay lock resolution: no writes or legacy deletion before readiness. A delayed second tab remains unable to write after denial. Existing tests wait for readiness. |
| Unknown-time action offered too early | Offer it only for the next missing checkpoint; an out-of-order correction identifies the missing predecessor. | Walk all four checkpoints without measurements, one available unknown-time action at each point. |
| Basic still feels measurement-heavy | Move Basic/Full to Plan. Basic collapses optional reading fields; Full displays them directly. Reading controls are not separate numbered cooking steps. | Switch modes, language and reload while preserving the recipe, observations, events and progress. |

The suggested startup patch was deliberately not copied literally: removing `await` while leaving writer ownership initially true permits writes before the lock result. The existing revision comparison does not prevent that when the loaded and stored revisions match. Readiness gating preserves the established one-writer contract instead.

Temperature measurements retain their meaning: one post-knead reading per run, before recovery rest; a later dough-core reading is not a substitute. Refrigerator readings remain optional. Empty fields retain the original temperature assumptions; visual development and readiness cues and water/oven guidance remain available. Existing entered readings are preserved and summarized even in collapsed Basic disclosures. Display switching does not invoke calculation or mutate recipe/progress. Historical `s-doughtemp` check flags are retained as legacy data but not counted in today's cooking progress.

No thermal or yeast constants, ingredient allocation, recipe percentages, mixer/rest durations, saved schema or shared/private transfer formats change. The native app and separate physical-model research remain parked.

## Verification

The required suite is `npm test`: 15 structure checks, 31 pure-core cases, 106 regressions per publication and 139 browser cases. Both standalone and modular publications are covered, including six viewport widths and NL/EN. Browser retries are now zero, so a passing run cannot conceal a failed first attempt. See the current PR HEAD's Actions check for execution evidence.

Local Chromium installation again failed because the downloaded archive was unusable. Local fast checks and the complete GitHub Chromium suite are reported separately; installation failure is not a passing browser test. Actual iPhone/Android, physical wake lock, device suspension, cross-zone device transfer and 200% text zoom remain manual follow-ups.

## Final keyboard-focus correction

Claude's [second review](Claude_v2.0.0_PR16_crosscheck_followup.md) confirms the three original fixes and finds one minor keyboard issue: after Enter completes an action, its replacement no longer has the same dataset, leaving focus on the document. Michael authorized this correction only. Panel rendering now retains the same action when possible, otherwise focuses the next primary action in that panel, then its first available action as a fallback. It does not move focus when focus was outside the panel.

The existing keyboard/cancellation browser scenario now also asserts focus on `fridgeIn` after Enter and after a redraw without an action change, for both publications. The suite remains 139 browser cases with zero retries. The intermittently canceled Edge/Windows download test and the export implementation are intentionally unchanged; no application download defect has been demonstrated. This patch remains part of the unshipped v2.0.0 candidate.
