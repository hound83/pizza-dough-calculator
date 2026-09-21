# v1.3.0 planning and scientific-review candidate

Status: candidate based on released v1.2.1; not a release or deployment. The user requested implementation following the full review and clarified that roughly two hours until refrigeration is a useful target, but shorter rests are only worthwhile if product quality is retained. Mixing times must not be shortened.

**Review documents:** this file records the current candidate's decisions and implementation. The [complete original review of 21 September 2026](Pizza_Calculator_Volledige_Review_2026-09-21.md) is preserved alongside it, including the assessment of earlier Claude comments, all recommendations, scientific sources and the professional DSP recipe. Read the original findings as pre-implementation evidence; use this file and the current source to establish which findings remain open. [CLAUDE.md](../CLAUDE.md) provides the review entry point.

This candidate is independent of the parked feedback/Cloudflare PR #12. It does not activate that work. The old feedback candidate must be rebased and assigned its eventual version separately before any future release.

## Decisions and product changes

Follow-up usability request: bake-day options now include the weekday using the device's local calendar, for example `Morgen – dinsdag`. They refresh on language changes, after local midnight and when returning to the page. Calendar arithmetic respects month/year changes and daylight-saving transitions. On narrow screens, day and time are stacked to give the longer labels room. Option values and stored relative offsets remain unchanged; this does not introduce a fixed-date running-batch mode.

| Review finding | Candidate behavior |
|---|---|
| Deadline advice could retain the AVPN identity while proposing a different schedule | A proposed deadline recipe carries explicit `presetKey: 'custom'`; generic advice belongs to that proposed recipe. The original AVPN preset retains its official range and arithmetic midpoint. |
| Deadline summaries assumed 30 minutes of preparation | Preparation is shared with the timeline: 54 minutes with autolyse; 36 minutes for direct machine mixing; 45 minutes for direct hand mixing. |
| Subgram herb quantities rounded to at least 1 g | Zero stays zero; positive subgram gram quantities retain 0.01 g resolution. Existing whole-gram practical rounding remains unchanged. |
| An entered target dough temperature was labelled measured | Planned targets and actual post-knead observations are distinct. |
| Measurement appeared after recovery rest | Measurement immediately follows the kneading step, before the manual finish and development check. |
| The yeast range was the main number and resembled quantified confidence | The main number is the actual recipe dose to weigh. A separate model starting point and heuristic band explain the limits. The official AVPN band is labelled separately. |
| Applying advice after mixing could change yeast retrospectively | Once an actual dough or fridge measurement is present, yeast-apply and deadline-recipe-apply actions cannot change the mixed recipe. Temperature measurements continue to adjust only the future schedule through the existing model. |
| Basic hid the schedule; fridge-out was implicit for bulk storage | Basic includes phase durations and time until refrigeration. The workflow timeline precedes the detailed steps. Both cold routes explicitly state fridge-in/out; relevant steps show dates/times or elapsed offsets when no bake time is selected. |
| Target temperature or glossy/sticky dough could be treated as sufficient development | Retain all mixing durations; distinguish heat/load pauses from proof of gluten development. Use cohesion and a rested windowpane together. |
| Primary-button contrast and checkbox names were weak | Dark text on the orange primary button; each step checkbox is named by its own heading; method buttons expose selected state. |

## Preparation and gluten development

The standard autolyse route remains approximately **54 minutes preparation + 60 minutes room bulk = 1 hour 54 minutes until the cold fermentation phase**. The initial 30-minute flour/water rest itself is already refrigerated. “Until refrigeration” in the schedule means entry into the subsequent cold fermentation phase, not first-ever contact with the refrigerator.

The 54 minutes are a planning allowance, not a measured prediction. Weighing, handling, checks, and the optional recovery route vary. Additional recovery rest can push the actual fridge-in later. There is no automatic truncation of a rest to force the two-hour target and no guarantee of equivalent dough after a shorter process.

Preserved programmes:

- KitchenAid with autolyse: 2 minutes speed 1; 30-minute refrigerated rest; 3 minutes speed 1 after yeast; 2 minutes speed 1 after salt/water; 2 minutes speed 2. Total machine time: 9 minutes.
- KitchenAid direct: 2 minutes speed 1; 20-minute hydration rest; 2 minutes speed 1; 2 minutes speed 2. Total machine time: 6 minutes.
- KitchenAid recovery: 5 minutes covered rest, assess; only if weak, 6–10 gentle push-fold-turn movements, then 5–10 minutes rest and reassess. No additional machine time is prescribed.
- Hand: initial 2–3 minutes and 8–12 minutes kneading after the rest.
- Kenwood: existing model-dependent staged durations remain intact; the exact model manual governs speed and load.

All machines still require an immediate pause for abnormal strain or excessive heating. A pause does not mean development is complete. The desired temperature is a process target, not a gluten test. Tight, elastic dough that resists stretching needs a different response from dough that tears immediately after relaxing. Progressive loss of cohesion under continued mixing warrants stopping rather than mechanically completing a timer.

KitchenAid's official yeast-dough guidance specifies speed 2. The staged speed-1 pizza programme is a deliberate existing product choice, not represented as the manufacturer's own programme. See [KitchenAid guidance](https://www.kitchenaid.co.uk/faq/fold-speed-for-kneading-dough).

### Follow-up: the user's replacement spiral hook

The user clarified that the Artisan uses a replacement spiral-shaped hook instead of its original hook. Prior context records easier apparent handling of about 900 g flour, but no measured development endpoint. An earlier Amazon link identified an aftermarket part; exact mixer model and verified attachment compatibility remain unresolved. A spiral-shaped attachment does not turn a planetary Artisan into a dedicated spiral mixer with a rotating bowl.

The professional recipe specifies 5–10 minutes before its rest and 10–15 minutes afterwards: 15–25 active minutes. The calculator's autolyse route totals 9 active minutes, of which 7 are speed 1 and 2 are speed 2. Neither difference proves equal development or proves that the shorter route is sufficient. Professional mixer type, speed and hook/bowl motion are not supplied.

Longer kneading may improve genuinely underdeveloped dough; it is not an unconditional quality improvement once the desired structure exists. The [mixing-energy study](https://cjfs.agriculturejournals.cz/pdfs/cjf/2010/02/02.pdf) supports considering mixing intensity, flour and machine geometry together, rather than converting minutes directly. The exact benefit of this user's hook is not established by that study.

KitchenAid's [general time/speed FAQ](https://www.kitchenaid.co.uk/faq/kneading-time-and-speed) recommends at most 2 minutes kneading on speed 2 and 4–6 minutes total. The existing 9-minute staged programme is therefore not manufacturer-approved merely because its speed-2 stage lasts two minutes. Preserve it as the user's existing candidate recipe, with the model-specific manual taking precedence; do not prescribe an arbitrary longer machine cycle or claim validated suitability for this replacement hook. Further personalised machine-time advice needs the exact model and observation of the dough after the current programme. The candidate is not a claim of physical validation for that programme.

## What the temperature and yeast models can support

**They are deterministic planning models, not validated predictions for the user's equipment.** Numerical tests establish implementation consistency and boundary behavior. They cannot establish physical accuracy or a measured error interval.

| Component | Retained assumption | Important limit |
|---|---|---|
| Fermentation cooling and warming | First-order exponential exchange; each phase starts at the previous phase's ending temperature | Treats dough as one effective temperature; no resolved surface/core gradient, refrigerator cycling, door openings, or fermentation heat. |
| Bulk thermal time constant | `2.40 × massKg^(1/3)` hours, bounded to 1.5–4.5 h | Batch geometry, depth, box material, air circulation and stacking are absent. The exponent and constants are not fitted to this user's measurements. |
| Covered balls | `1.10 × (ballWeight/250)^(1/3)` hours, bounded to 0.7–2 h | Assumes separate effective balls; tightly packed or stacked boxes need not cool like isolated balls. |
| Warm-up | Same type of first-order model and constants as cooling | Mathematical symmetry is convenient, not experimentally established for these containers and handling conditions. |
| Yeast curve | Fixed interpolated relative-activity points, normalised at 21 °C | Yeast brand, viability, substrate, salt, gas retention and biological adaptation are simplified. A gas index is not readiness, flavour or gluten quality. |
| Advice range | Existing heuristic margin of 20–34%, depending on model conditions | Not a confidence interval, measured distribution, or permission to choose either end without changing fermentation. |
| Water/DDT model | Staged heat-capacity balance, rest exchange and effective mixer temperature rises | Existing reference anchors preserve continuity; they are not calorimetric validation. Large batches, hand/autolyse and unspecified spiral programmes have lower confidence. |
| Live correction | Existing optimiser seeks comparable model gas development using future time adjustments | Matching model gas does not guarantee equivalent maturation or dough strength. No actual start-time tracking is added. |

No yeast-activity point, thermal time constant, mixer heat term, preset duration or baker's percentage is refitted in this candidate. Storage schema remains 51. The ±1 °C room-temperature deadband remains intact.

The apparent precision of a clock time is scheduling arithmetic. The underlying biological estimate remains approximate. When a bake time is selected, the calculator counts backwards from that target; it does not know when the user actually began. New temperature input can change the displayed plan, but cannot reconstruct historical handling events.

Two further limitations remain explicit: the direct hydration rest contains yeast but is not separately integrated into the fermentation gas calculation; handling and optional development recovery are planning allowances rather than separately simulated thermal/fermentation phases. Resolving those requires a deliberate new model version and validation, not silently modifying a constant.

## Scientific review and professional-recipe lessons

The [AVPN 2024 specification](https://www.pizzanapoletana.org/public/pdf/Disciplinare-2024-ENG.pdf) supports its own ingredient/process boundaries. It does not validate the household refrigerator curve or convert an arithmetic midpoint into a universal optimal dose. The unverified “2024/2026” source label is replaced by 2024.

The review also considered [Vidal et al. (2022)](https://pmc.ncbi.nlm.nih.gov/articles/PMC8963076/), [Muchová et al. (2010)](https://cjfs.agriculturejournals.cz/pdfs/cjf/2010/02/02.pdf), [Covino et al. (2023)](https://www.mdpi.com/2304-8158/12/7/1407), and [Di Stasio et al. (2025)](https://doi.org/10.3390/foods14081418). Their experimental conditions do not supply a universal bulk/ball refrigerator constant for this application. The newer [2026 flour-treatment study](https://ift.onlinelibrary.wiley.com/doi/10.1111/1750-3841.71076) is likewise not a basis for replacing this app's temperature curve.

Useful professional-recipe lessons are **process control**, not copying a commercial mixer timer into a domestic mixer: distinguish incorporation from development, measure the actual endpoint temperature at a defined moment, stage additions consistently, identify when shaping occurs, and assess the dough after relaxation. These support clearer instructions and logging without introducing a completely different recipe. A professional formula's flour, mixer, load and environment remain necessary context for judging its timing. No new professional preset or unverified claim of equivalent results is introduced.

## Validation plan for improved physical accuracy

Keep the same flour, hydration, salt, yeast batch, dough mass, containers and mixer programme during baseline observations. Record actual mix-end temperature/time and dough-core temperatures during refrigeration and warm-up, along with ambient/fridge observations. Record bulk and balls separately, including container depth, stacking and ball weight. Capture repeated batches before fitting parameters.

Fit cooling and warming separately only if repeatable observations justify it. Keep the observed temperature fit separate from yeast/proofing calibration: volume expansion reflects both gas production and retention, and matching it does not validate maturation. Evaluate fitted parameters on held-out batches and report the tested equipment range and residual error. Do not describe uncertainty as a confidence interval before such data exist.

This is a measurement protocol for a future model revision, not an extra workload imposed on an ordinary bake. Current users can continue with the existing planned route, the already available actual-temperature fields and dough checks.

## Code organisation and next steps

Completed here:

1. Extract a browser-independent `DoughCore` with explicit inputs for thermal exchange, phase simulation, generic yeast calculation, preparation and schedule offsets. Keep DOM access and translation in the application layer.
2. Give recipe calculations explicit style and preset identity so proposed recipes do not accidentally inherit unrelated visible controls.
3. Share schedule offsets between the timeline, Basic summary and workflow timestamps.
4. Add numerical invariant tests, targeted regression cases and responsive browser assertions; preserve all historical released hash records.

Follow-up work, kept out of this candidate:

1. Extract live schedule optimisation and DDT staging with explicit method/settings input and independently testable outputs.
2. Introduce a single validated recipe/plan object at input commit boundaries; avoid rewriting fields during typing.
3. Move remaining existing inline handlers to delegated listeners while retaining stable semantic step IDs and storage compatibility.
4. Gradually consolidate duplicate bilingual copy into translation keys; do not combine a full i18n migration with a numerical model change.
5. Separate measurements and planned timestamps from actual process events if an actual-start feature is later requested. That needs an explicit storage migration and recovery design.
6. Only after suitable measurements, propose a versioned physical-model revision with held-out validation, domain limits and comparison against the existing model.

## Verification and release boundary

The intended checks are the full `npm test` gate: standalone/source equality, historical baseline records, DOM-independent numerical invariants, regression suites for both publications, and Chromium tests at 320, 390, 430, 760, 1024 and 1280 px. Browser checks cover Basic planning, explicit fridge-out, timeline order, accessible checkbox names, method state, and overflow as well as the existing persistence, keyboard and recipe-picker suite.

The candidate's current hashes are recorded separately in `PRODUCT_GUARDRAILS.md`; released hashes are immutable. Test output and pull-request checks establish actual run status. A candidate is not released merely because tests pass. Merging, tagging, deployment and feedback infrastructure remain separate decisions.

## Additional product recommendations

These are recommendations requested by the user, not additional implemented features or claims that earlier reviewers never considered them.

| Priority | Recommendation | Problem it addresses |
|---|---|---|
| First | Explicit **Start this batch**, capturing an immutable recipe, concrete bake date and actual start time | The current app plans backwards from a target, but does not track what physically happened. Actual measurements only guard the yeast/deadline apply actions; they do not freeze all ingredient controls or establish an execution timeline. |
| First | Keep the bake date fixed for a running batch; track actual fridge-in, fridge-out and completed phases | Relative choices such as “tomorrow” are useful while planning, but their calendar date changes after midnight. A running batch should preserve its selected calendar target and never reschedule a completed phase. Dynamic weekday labels alone do not solve this. |
| Next | A compact **What if the dough differs?** guide | Current instructions include windowpane and visual checks, but little branching guidance. Distinguish immediate tearing after relaxation, strong recoil, cold dough and progressive loss of structure before suggesting an intervention; no single symptom proves a diagnosis. |
| Next | User scale resolution and realistic small-yeast dosing | The current app warns about practical 0.1 g rounding, but does not know whether the user's scale resolves 1 g, 0.1 g or 0.01 g. A dose should be assessed against the actual measuring tool. Any later dilution aid must account for added water and explain immediate, even mixing. |
| Later | Log a repeatable mixer/attachment/batch profile and compare actual temperatures across bakes | Brand name alone hides hook, load and programme differences. Start by recording observations; fit or automatically change model constants only after sufficient repeatable evidence and held-out validation. |
| Later | Explain feasible cold-storage choices and capacity | Batch mass alone does not describe dough depth, stacked boxes or refrigerator load. First expose the assumptions and practical container constraints; do not invent new cooling constants for unmeasured box profiles. |
| Optional | Named recipes and comparison of two saved plans without losing the active batch | The existing current-state persistence and bake log are not a full library of named alternatives. Saved comparisons can make deliberate iteration easier; exclude private notes from any future shareable recipe link by default. |

The running-batch boundary is the most important next functional step. Better temperature and yeast mathematics cannot compensate for an unknown actual start, an accidentally changed recipe or a moving calendar target. Implement it as a separately reviewed state/persistence change with tests for reload, midnight, language, time zones, and edits after mixing.
