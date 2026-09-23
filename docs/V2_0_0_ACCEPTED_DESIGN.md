# Pizza calculator — next-version product and workflow design

**Status:** preparation only; no implementation or release approval.  
**Prepared:** 22 September 2026 for Michael.  
**Sequence:** await Claude’s review, finish and publish 1.4, then implement the agreed next-version scope. Version number remains provisional.  
**Scope:** all six accepted workflow proposals, plus investigation plans for the three calculation proposals. Android/iPhone apps, PWA installation and cloud synchronization remain parked.

## 1. Product direction

Make the calculator easier to use while cooking, without turning ordinary cooking into an endless questionnaire. Expect a capable user. Provide the right quantities, timing and choices at the point of use; explain unfamiliar or consequential details on demand.

The proposed experience has **two workspaces: Plan and Kitchen**. Baking is a context within Kitchen. Saved recipes and previous evenings are available from Plan and a secondary collection menu. These are freely accessible views of the same evening, not gates that must be completed in sequence.

The ordinary path is: choose or reuse a recipe, set pizza count and an optional bake time, inspect the plan, start cooking. Availability, mixer splitting and detailed measurements are optional extensions. A user who only wants ingredient quantities can stop at Plan without starting a tracked batch.

### Decisions already made versus proposals

| Confirmed by Michael | Proposed in this document |
|---|---|
| Include all six workflow improvements in a version after 1.4 | Two workspaces and the exact information hierarchy |
| Emphasize usability and kitchen workflow | Interaction budgets, checkpoint behavior and screen copy |
| Avoid excessive steps and patronizing instruction | Defaults for availability, split batches and baking order |
| Prepare now; do not change code | Storage model, implementation order and acceptance cases |
| Park the app project | Research gates for possible calculation changes |

## 2. Verified starting point

Inspected GitHub branch `feature/v1.4.0-batch-workflow` and its matching local source at [commit 4530a90f74bef667440e126873e5e950396e2622](https://github.com/hound83/pizza-dough-calculator/commit/4530a90f74bef667440e126873e5e950396e2622). At this inspection, PR #14 had no submitted review records or inline review threads. This does not establish the status of Claude work outside that PR. The branch has not advanced since the recovery work described in the conversation.

Read the repository’s guardrails, architecture and contribution instructions, and inspected the relevant UI, calculation, workflow and persistence modules. No source, generated bundle, baseline, branch, PR or release was changed for this design.

| Area | Already in 1.4 | Actual next-version addition |
|---|---|---|
| Planning | Recipe inputs, deadline planning, phase timeline, active preparation estimate and total baking-session estimate | Availability constraints and a clearer common planning surface |
| Kitchen | Detailed bilingual steps, progress checkboxes, measurements and batch checkpoints | One contextual workspace; connect a physical transition to its timestamp and progress |
| Dough assessment | Windowpane instructions, readiness cues and stage/symptom help | Surface the relevant existing guidance at the decision point |
| Mixer | Profiles and practical capacity advice | Ingredient allocation and separate timing for multiple mixer runs |
| Baking | Oven advice, individual topping instructions, before/after-bake toppings and duration range | A usable queue with stable pizza identities and actual baking events |
| Saved data | Named dough recipes, recipe exchange, local pizza choices, batches and logs | Complete evening templates and a private full backup/transfer |
| Measurements | Latest dough/fridge values and timestamped readings | Explicit measurement meaning and phase-aware use, subject to separate model review |

Important existing distinctions:

- Basic/Full is a **detail preference**. Dough only / Dough + sauce / Complete pizzas is an **output scope**. Keep these independent; do not add another overlapping “expert mode.”
- Checkboxes currently record task progress, while separate batch controls record actual timestamps. Stable semantic step IDs already exist.
- A running batch freezes its dough recipe, method and desired absolute bake time. Pizza selections/customizations are currently stored outside that frozen batch snapshot.
- Saved dough-recipe exchange deliberately excludes toppings, dates and private observations. It is not a full backup.
- The fermentation simulator starts from the post-kneading dough temperature. Timestamped reading history is not currently consumed as a sequence of thermal anchors.
- The water model explicitly assumes flour is at room temperature.

## 3. Information architecture and interaction rules

### Plan workspace

Use one editable overview with three compact groups. Existing recipe selection and customization can remain in their focused picker; they must not require a new series of setup pages.

| Group | Visible by default | Expanded only when useful |
|---|---|---|
| What | Recipe/preset, pizza count, diameter or ball-weight mode; chosen output scope | Per-pizza choices, guest names, sauce overrides and technical percentages |
| When | Optional calendar date and “First pizza in the oven”; start, fridge transitions and expected session finish | “Fit around my availability”, explicit buffer and alternative proposals |
| How | Selected kneading method/profile, relevant temperatures and concise ingredient totals | Scale details, refrigerator layout, mixer capacity and split-run settings |

Put the mixing method here because it affects preparation time and water advice. Show its current choice in Kitchen; do not ask for it again. Show a saved profile’s name without making profile creation compulsory.

When Complete pizzas is selected, a compact pizza list sits in What. Default one recipe for all pizzas; individual overrides stay possible. Dough-only users never need to name people, choose toppings or manage sauces.

Keep the result visible while editing. Desktop can use a summary column; mobile uses a short summary and jump links. Avoid an endlessly tall stack of expanded tools. A normal draft autosaves; “Save as recipe/evening” is for reuse, not for keeping the current form alive.

**Date semantics:** retain dynamic local weekday shortcuts. A dated saved evening must show its absolute date and stay on that date; a reusable template has no date. Starting cooking retains the existing fixed absolute target. “First pizza in the oven” matches 1.4’s event meaning. Show the estimated first pizza ready and last pizza finished separately; do not imply everyone is served simultaneously.

### Kitchen workspace

| Order | Content | Purpose |
|---|---|---|
| 1 | Compact evening header: pizza count, fixed target, actual phase | Orientation without repeating setup |
| 2 | Current action and relevant quantities | Work without returning to the calculator |
| 3 | One main transition action; timer or measurement beside it when relevant | Record the meaningful event once |
| 4 | Next action, expected time and passive waiting time | Let the user leave the screen confidently |
| 5 | Compact full timeline and directly accessible instructions | Preserve overview and free navigation |
| 6 | Contextual “Dough behaving differently?” and history/correction controls | Handle exceptions without cluttering the normal path |

During waiting, the current panel should say, for example, “Cold fermentation · next: out of the fridge around 16:30.” It should not demand interaction to keep waiting. During mixing, show the entire relevant mixing sequence together, including amounts and speeds. Do not make each addition a separate screen.

“All instructions” remains accessible without starting a batch or recording anything. Do not hide method-critical instructions or important warnings behind an optional explanation link.

### Example screen content

These are copy/layout sketches, not calculated schedules or an implemented prototype. Times below are illustrative.

| Context | Main content | Main action | Quiet secondary content |
|---|---|---|---|
| Plan | “6 pizza’s · zaterdag 18:30 · eerste pizza in oven”; recipe, amounts and schedule together | “Start deeg” | “Aanpassen”, “Beschikbaarheid”, saved recipes |
| Mixing | Current run’s complete mixing sequence with ingredient amounts and speeds; measurement field immediately after kneading | Relevant real transition, when performed | Optional rest timer and development guidance |
| Cold waiting | “Koude fermentatie · volgende handeling rond 16:30” | “Deeg uit koelkast” when it actually happens | Timeline, actual fridge-in time, “Tijd aanpassen” |
| Baking | “In oven: pizza 2 · Margherita”; next pizza’s toppings below | “Uit oven” | Remaining queue and expected session finish |

The page does not require the user to acknowledge a waiting screen, open each ingredient instruction separately, or leave Kitchen to find the next pizza’s toppings.

### Interaction budget

These are design acceptance targets, not measurements of an implemented interface.

| Task | Budget |
|---|---|
| Use a familiar recipe | No forced tour, equipment questionnaire, profile name or availability entry |
| Start a valid plan | One main Start action; no routine second confirmation |
| Record an actual transition | One action updates the timestamp and associated phase progress |
| Read the full current mixing programme | No repeated Next buttons between ingredient additions |
| Record a temperature | One inline field; no separate page or mandatory comment |
| Track a pizza in the oven | Two actions per pizza: In oven and Out of oven |
| Correct the latest accidental action | Direct Undo; permanent correction remains available after the notice disappears |
| Finish the evening | One close action; rating and notes optional |

The cold-balls route has five principal events through first launch: start, preparation/finishing complete, shaped and refrigerated, fridge out, first pizza in. The room route has start, preparation complete, shaped, first pizza in. Cold-bulk dough also needs shaping after removal; if that actual moment is recorded separately, it is a sixth meaningful event. It may stay unrecorded in simplified tracking, but must never be invented from fridge-out. Timer controls and optional measurements are additional, not required micro-checklists. Zero-duration transitions may share one explicitly recorded action when they actually happen together.

## 4. Proposal 1 — kitchen mode and linked progress

### Normal behavior

Reuse the established recipe and timing sources. The Kitchen view is a presentation of the running evening, not an independent copy of its state.

- “Start dough” freezes the agreed dough plan, as in 1.4. Offer retrospective entry through a secondary “Already started?” control.
- “Finishing complete · start bulk” records the real start of bulk. Do not equate the end of machine kneading with the end of the existing finish/recovery sequence.
- “Into the fridge” and “Out of the fridge” record their actual moments and update the phase summary together. They do not silently tick unrelated measuring or quality-check tasks.
- Correctly distinguish bulk refrigeration from refrigerated balls. A grouped action may include shaping only if its label explicitly describes that physical action.
- The first pizza’s In oven action records the evening’s bake-start event as well. For each child run, its own first pizza records that run’s bake-start event. Never ask for the same event twice.
- Ordinary substeps remain readable instructions. Optional task checkmarks can remain in the complete overview, but cannot create or delete actual phase timestamps independently.

### Unknown and corrected history

If the user forgot a checkpoint, show one compact catch-up panel with all missing moments. Allow a real past time, or “Done, time unknown.” Unknown is distinct from not done; never copy the forecast into actual history.

Known moments must remain chronological. A later known event can coexist with an explicitly unknown earlier event, but calculations requiring the missing duration must report insufficient history. This is an intentional extension to 1.4’s strict predecessor requirement and needs its own tests and documented contract.

Undo of the latest transition must restore its previous state without erasing measurements. If later dependent events already exist, use a correction view instead of silently removing them. Double taps must not create duplicate events. Opening another tab must not let an old view overwrite newer checkpoints; coordinate writes, reject stale revisions and show a concise reload/update notice. A read-then-write check alone must not be assumed to make cross-tab writes atomic.

For cold-bulk dough, fridge-out and completion of shaping are different physical moments. Preserve 1.4’s timing interpretation until a reviewed change explicitly replaces it: a new observation must not accidentally add shaping time twice or silently alter the fermentation equations.

### Timers and reminders

Timers are optional conveniences. Start a rest timer from an actual rest-start action, or let the user start it explicitly. A timer reaching zero suggests the next action; it never marks dough ready or advances the phase.

Persist the intended end instant and compute remaining time again after reload or returning to the page. Do not count browser ticks as elapsed time. Background tabs can delay callbacks, so the web page must not promise an alarm while closed or suspended. Offer a downloadable calendar reminder for long waits, clearly showing which planned events it contains. A later plan change requires a new export; an exported calendar is not live synchronization. [MDN: timer throttling](https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout#timeouts_in_inactive_tabs)

“Keep screen awake” is an optional Kitchen control when supported. Show its actual active/inactive state and release it when leaving the activity. Screen wake lock can be refused or released by the system; it must not be a dependency of the workflow. [MDN: Screen Wake Lock](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API)

## 5. Proposal 2 — planning around availability

### Inputs and output

Default: no availability constraints. The optional panel accepts **earliest start** and **unavailable intervals** on actual dates. This is enough for “Friday after 19:00; Saturday away 10:00–14:00; first pizza in the oven 18:30.” Do not require connecting a calendar or entering an entire weekly schedule.

The result highlights active work blocks, passive waits and any conflict. Keep one recommended candidate visible and at most two alternatives under “Other options.” Each changed recipe or timing proposal shows what changes before one explicit Apply action.

### Scheduling contract

- Respect preparation, mixing, resting, shaping, refrigerator moves, sauce preparation and oven preparation as distinct kinds of work.
- Use the existing 0.9 h autolyse, 0.6 h direct-machine and 0.75 h direct-hand preparation allowances as compatibility anchors. Decomposing these into active/passive segments must reconcile with their totals and existing instructions.
- Do not add the existing active-work estimate on top of the same preparation interval. Additional setup/cleanup buffer must represent explicitly extra work, not double counting. Cleanup affects the user’s availability; it is not fermentation time automatically added to the dough.
- Model one user and one mixer by default. Active tasks cannot occupy the same person or mixer simultaneously. Passive rest may overlap compatible tasks; operating an oven must never imply it can be left unattended while the user is away.
- Keep preheating parallel with final proof where feasible, as already intended in 1.4. Reserve the user’s setup/checking actions and respect oven instructions. Do not count preheat twice in the critical path.
- Fit the unchanged recipe first. If it cannot fit, say which active event conflicts. An alternative that changes cold/proof duration is a recipe/timing proposal, not a neutral rearrangement.
- Retain mixing durations, the 30-minute refrigerated autolyse and 20-minute direct hydration rest. Never shorten them to make a calendar green.
- Before mixing, any alternative yeast dose is explicitly applied and labelled custom where appropriate. During a running batch, yeast and recorded history stay fixed; proposals affect only supported future actions.
- A similar modeled fermentation integral does not prove equivalent flavor or gluten development. Do not rank a merely feasible schedule as a quality-equivalent recipe without evidence.
- No feasible result is an acceptable outcome: explain the conflict and offer another start/bake time or deliberate recipe choice.

**Example, for interaction design only:** if fridge-out is predicted at 13:30 during the user’s absence, show that exact conflict. Do not silently move it to 14:00. A proposed later fridge-out must show the changed cold duration and resulting final-proof/bake forecast. Any displayed numerical candidate must come from the real solver, not this illustrative example.

## 6. Proposal 3 — multiple mixer runs

Keep this optional and collapsed when a recipe fits. Open it from capacity advice or “Divide over mixer runs.” Ask for an explicitly known capacity in grams of flour or total dough; clearly label the unit. A generic brand threshold is guidance, not a verified specification for an exact model.

The proposal shows the number of runs, dough-ball allocation and a compact ingredient table for each run. Default to the smallest feasible number of reasonably balanced runs using whole dough-ball allocations. If one ball already exceeds the entered limit, explain the conflict instead of silently exceeding it.

### Arithmetic and kitchen contract

- One evening owns several child batches. Each child has its ingredient allocation, start, checkpoints and measurements. Do not repeatedly overwrite the existing single active batch to simulate splitting.
- Calculate the whole recipe once, allocate ingredients proportionally and reconcile rounding globally. At the displayed precision, child flour, water, salt, yeast and oil sum exactly to the displayed parent totals.
- Within each child, main water plus reserve water equals its total water; reserve-water additions also reconcile. Use deterministic remainder allocation, then recheck capacities and actual percentages.
- Preserve internal precision and show any material deviation caused by displayed rounding. Scale resolution remains advice: a smaller per-run yeast dose may be harder to weigh. Do not silently round it to zero or change the parent recipe.
- A capacity check must hold after allocation and display rounding. An allocation that cannot satisfy the entered capacity is rejected or repartitioned.
- Show instructions and quantities for the selected run, with a persistent “Run 1 of 2” identifier. Shopping totals remain totals for the evening.
- Default to sequential runs with one bowl. Do not assume a spare bowl or overlap passive rests unless the user explicitly selects a supported overlap arrangement. Preserve existing kneading time per run.
- Runs can finish at different times and need separate fridge-in/out observations. Link each dough ball to its run so baking forecasts can use the correct history.
- Keep the runs separate through fermentation in the first implementation. Recombining partially fermented runs needs a separate design; do not imply one shared thermal history.
- Use existing temperature-model limitations per run. No new batch-size exponent, cooling coefficient or mixer calibration is inferred from splitting.

**Acceptance examples:** 8 identical balls can split 4 + 4 when capacity permits; 7 can split 4 + 3 only if the larger run fits. These illustrate allocation, not a universal mixer limit. A single-run evening follows the same model without exposing child-batch administration.

## 7. Proposal 4 — guide the whole baking session

Build on the existing pizza choices and oven advice. Create stable pizza IDs independent of list position. Each pizza can carry an optional person/name, its toppings and sauce overrides, assigned dough run and queue position. Renaming or reordering must never attach the wrong customization to another pizza.

### Baking view

Show the pizza currently in the oven, the next pizza and a compact remaining queue. Expand the selected pizza’s required amounts automatically. Keep toppings applied after baking visibly separate from toppings applied before baking, using the existing recipe definitions.

Default statuses: **Queued → In oven → Out of oven**. Optional Preparing/Ready labels can help a larger evening, but must not be mandatory taps. Here “Ready” means assembled for baking, not a claim about fermentation readiness. Use numbered pizzas when no names are supplied.

- “In oven” records the actual launch and starts an optional timer. The first launch records the evening bake-start event; the first launch from each dough run records that run’s bake-start.
- “Out of oven” records removal, counts one baked pizza and displays the finishing toppings. It does not claim the pizza has been garnished or served.
- Suggest the next pizza without automatically recording its launch. Allow moving an unbaked pizza earlier through buttons as well as dragging.
- After-bake instructions for the last removed pizza must remain visible while the next pizza is being prepared; moving the queue must not erase the current finishing task.
- Default to one pizza in the oven. Multiple ovens and concurrent oven slots are outside this first scope.
- Retain manual timing and the current oven/baking ranges when the user does not record each pizza. No stopwatch requirement to use the recipes.

### Forecasts

Show expected first pizza ready and expected final pizza finished. Use the existing baking range until actual observations are available. Actual bake duration and the gap between pizzas are separate: a chat break must not become an inferred oven-recovery requirement.

For the current evening, offer an updated estimate from recorded cycles or the user’s chosen cadence. Show the basis and retain a manual override. This updates a scheduling estimate, not the heat model, yeast dose or future recipe calibration. Neither elapsed time nor a timer proves the stone has recovered; keep the existing stone-temperature advice.

Names, order and toppings of unbaked pizzas can still change after dough mixing. Frozen dough composition and completed pizza events cannot be silently rewritten. Ingredient totals update visibly after an unbaked topping change; a completed pizza retains its actual choice.

“Finish evening” archives the session even if some pizzas were not baked; mark those as unbaked. Do not invent completion. Offer a short optional result and note using the existing logbook, with already recorded values prefilled.

## 8. Proposal 5 — readiness checks at useful moments

Make existing advice contextual. The user should not have to find a diagnosis panel, select the phase that the app already knows, and then repeat the observation elsewhere.

| Moment | Show directly | Optional interaction |
|---|---|---|
| Immediately after kneading | Post-knead temperature field and its purpose | Enter a measurement now; preserve the distinction from later cold-core readings |
| After the existing short finish/rest | Cohesion, elasticity and rested windowpane cues | “Still weak”, “Strong but tight” or “Looks good” |
| Before fridge-in | Route, quantity to store and practical container information | Relevant dough observation or corrected transition time |
| After fridge-out / before opening | Warmth, aeration and relaxation cues | “Still cold”, “Rebounds strongly”, “Very slack” or another existing symptom |
| During baking | Current stone advice and appearance-based judgment | Adjust current-session timing; record an observation |

“Looks good” is never a compulsory question. An omitted check stays unrecorded; completing a phase does not claim a successful windowpane. If a symptom is selected, default the help to the current phase while allowing correction.

Keep the approved recovery path: rest and reassess; use the established gentle manual recovery only when appropriate. Do not add machine minutes, folds or warm waiting automatically. Preserve the distinction between weak and strong-but-tight dough. Reaching target temperature alone is not proof of development.

If the user chooses an additional rest, show a timer and its predicted timing effect together. Count the extra physical time once, in the correct stage. A paused screen/timer does not pause fermentation. Any schedule change still uses an explicit Apply action; the fixed bake target stays visible.

### Refrigerator capacity wording

The current box calculation is based on balls per box even when bulk refrigeration is selected. In the next design, use balls-per-box only for a balls route. For bulk, ask for a user-verified dough capacity/container allocation or state that capacity has not been assessed. Do not claim “fits” from a ball count for an unmeasured bulk container. Keep thermal limitations separate: fitting physically is not proof of sufficient cooling.

## 9. Proposal 6 — complete evenings, reuse and transfer

Provide clear actions with distinct meanings. Autosaving current work remains automatic.

| Action | What is kept | What happens on use |
|---|---|---|
| Save dough recipe | Existing dough settings and method | Existing reusable recipe behavior remains compatible |
| Save evening template | Dough, output scope, pizza customizations, sauces, order and useful equipment/storage settings; names optional | Opens a new draft; no actual dates, readings, progress or bake history copied |
| Make this evening again | A reusable copy of a previous evening’s setup | Asks for a new optional date; clears all actual events and timers |
| Download private backup | Current draft/active evening, all child runs, recipes/templates, profiles, logs, settings, measurements and actual events | A separate Restore action can continue the saved state on another device |
| Export an evening to share | A validated portable template | Names, private notes, readings and actual dates excluded by default; preview the shared content |

An evening with six pizzas needs six stable pizza records, not separate unlinked arrays whose positions can drift. Stored snapshots should preserve custom ingredient choices and before/after-bake meaning. Preserve provenance for built-in presets; imported labels alone can never grant official AVPN identity.

### Import and restore

- Retain support for the existing `pizza-dough-recipe` version-1 files and their 50 kB limit. Use separately versioned formats for an evening and a full backup; do not pretend one is another.
- Validate a complete candidate in memory before changing current data. Reject unsupported future formats without destroying the current state. Reject invalid critical recipe or active-session data instead of inventing replacement ingredients/times.
- For missing catalogue references, preserve a valid embedded custom snapshot where supported, otherwise flag the unresolved item and require a choice. Do not silently turn an unknown pizza into the default pizza.
- Sharing/importing an evening template adds a new template. Restore of a full backup is an explicit replacement of local data, with a concise contents preview, the active-evening conflict and an option to download the current backup first.
- Use a single review screen and one restore confirmation because replacing current work is consequential. This is not part of normal cooking.
- A cancelled import, failed validation or failed storage write leaves the previous persisted state intact. Show whether changes were actually saved; do not announce success merely because in-memory state changed.
- Select explicit limits for new formats based on bounded text-only contents before implementation; do not reuse the 50 kB dough-file limit blindly. Retain the existing collection limits unless a reviewed product decision changes them. No photos or attachments in this scope.
- Imported notes/names are plain text. Do not evaluate imported strings or treat file keys as DOM element IDs.

### Transfer semantics

File transfer is a snapshot, not synchronization. On the second device, restoring preserves absolute event times and timer end instants; elapsed time is recalculated at opening. It cannot guarantee a closed-page alarm. Show the backup creation time so the user can recognize an old file.

The source device is not remotely deactivated. Show one concise handoff instruction to continue on one device. A newer file replaces an older local snapshot only through explicit restore; automatic merging of competing histories is outside scope.

If a backup is opened in another time zone, preserve the instants and display the original zone alongside the local rendering when needed. A template’s availability intervals and date are cleared for the new evening; an active evening’s times are not shifted to fit the importing device’s clock.

## 10. Calculation proposals — prepare separately from UI changes

All three earlier calculation proposals are included in this preparation. They are investigations and specifications, not permission to quietly recalibrate the next release. Existing numerical behavior remains the comparison baseline. Software parity is not empirical validation.

### C1. Distinguish measurements and apply them to the right phase

**Verified issue:** 1.4 stores reading history, but the tracked final-proof proposal uses the latest post-knead dough/fridge values in a simulation of the full schedule. It does not reconstruct a phase-specific measurement history. Its dough field correctly means post-kneading temperature; it must not be relabelled as generic current temperature.

Prepare a typed observation model: what was measured, value/unit, actual measurement time if known, entry time, child batch, physical location and provenance. Distinguish at least post-knead dough, dough core at fridge-out, fridge air and room air. A cold-core measurement needs its own validated input range; it must not inherit the current post-knead field’s 10 °C minimum.

Proposed future model behavior:

1. Establish history from actual checkpoints; label unknown portions instead of substituting certainty.
2. Integrate the model piecewise through the applicable phases and ambient conditions.
3. At an eligible dough-core observation, anchor the modeled dough temperature from that point onward. A later ambient reading is not a measurement of earlier ambient conditions.
4. Compare the remaining trajectory with the original frozen model target. Report model estimates and uncertainty; a single core measurement does not measure all thermal gradients or gas retention.
5. Offer a future-only timing proposal. Keep yeast, actual checkpoints, elapsed time and the desired bake instant unchanged.

A correction to a past observation can revise modeled estimates explicitly; retain the previous observation/correction provenance. It must not rewrite the actual event log. Legacy readings retain their original meaning; their entry timestamp must not be promoted to an exact measurement timestamp if that was never captured.

**Evidence gate:** known synthetic phase trajectories; endpoint continuity; exact preservation of past events; ambient versus dough distinction; unknown-history handling; inclusive ±1 °C room deadband where applicable; before/after scenarios with explained numerical differences. Collect actual bake observations before claiming better physical accuracy. Without sufficient input, use a clearly labelled legacy estimate or decline a phase-aware proposal.

### C2. Optional measured flour temperature

**Verified issue:** `predictFinalDoughTemp` uses `c.room` for flour. This is a reasonable default assumption, but cannot represent flour stored in a colder or warmer place. Flour temperature is independently relevant to final dough temperature. [King Arthur Baking: desired dough temperature](https://www.kingarthurbaking.com/blog/2018/05/29/desired-dough-temperature)

Propose a compact disclosure near water advice: “Flour at room temperature” by default; expand to enter a measured value. Do not add a required input. Store whether it was assumed or measured.

Use the measured value only for flour in the existing heat-capacity model. Preserve rest environments, reserve-water temperature, stage order and current mixing constants. Do not replace the staged model with a simple three-factor formula. Once mixing has happened, this becomes an observation for evaluation, not an instruction to change water already used.

**Evidence gate:** blank input or flour equal to room reproduces the previous result; warmer flour produces lower advised main-water temperature with other inputs fixed; bounds and unattainable-target handling remain honest; reserve-water assumptions do not change; proposed temperature bounds are validated separately from room-temperature bounds. Preserve existing whole-degree presentation.

### C3. Investigate fermentation during the direct hydration rest

**Verified observation:** the direct route adds yeast before the 20-minute hydration rest, while the fermentation simulation begins with post-kneading temperature and subsequent bulk/cold/ball phases. The autolyse route’s initial flour-water rest contains no yeast. This identifies a possible modeling omission, not a quantified error yet.

Compare a preparation-aware model with the current model across direct/autolyse routes, short/long schedules, warm/cool kitchens, yeast types and methods. Account for when yeast is actually added, the changing dough temperature during preparation and the actual preparation chronology. Do not simply add 20 minutes at the final dough temperature.

Assess whether existing empirical constants already absorb some preparation activity. Evaluate predicted gas integral, recommended yeast dose and final-proof advice separately; record whether a difference changes a practically weighable dose or only internal decimals. Equal gas integral is not equal flavor or gluten development.

**Evidence gate:** isolate the candidate model, document assumptions and sensitivity, compare with the existing baseline, and gather relevant actual observations. Only then propose a reviewed model revision. If evidence is weak or effects are small compared with uncertainty, retaining the current model with clearer explanation is a valid result.

## 11. Implementation preparation

### Suggested state boundaries

This is a design sketch, not a finalized storage schema.

| Entity | Owns | Must not implicitly change |
|---|---|---|
| Evening draft | Output scope, recipe, date/availability, pizza choices and resource settings | Another running evening’s frozen dough |
| Evening template | Reusable setup without actual history | Dates, events or measurements of a new session |
| Running evening | Fixed target, linked child runs, pizza queue and session events | The original target when midnight passes |
| Dough run | Frozen allocation, method, checkpoints and typed observations | Sibling-run events or incorporated yeast |
| Pizza | Stable identity, toppings, run assignment, queue position and bake events | Another pizza when reordered |
| Timer | Purpose, owner, actual start and planned end | Fermentation completion or physical readiness |
| Proposal | Original revision, explicit changes and expected consequences | State before the user applies it |

Use immutable snapshots for facts and recomputable views for forecasts. A stale proposal must be recalculated if the underlying plan or actual events changed before Apply. No separate “truth” in the Kitchen UI, checkbox map and timeline.

Preserve existing stable step IDs where meanings match. If a grouped view replaces a set of legacy checkmarks, keep that progress without inferring actual timestamps or a passed quality check. Saved display preferences must never alter recipe values.

### Existing ownership to build on

| Existing module | Intended responsibility in the next design |
|---|---|
| `calculation-core.js` | Ingredient and thermal/fermentation arithmetic; reviewed model changes only |
| `workflow-core.js` | Pure allocation, chronology, proposal validation and format validation |
| `planning-shopping.js` | Availability presentation, planning timeline and shopping aggregation |
| `batch-workflow.js` | Running-evening lifecycle and actual event interaction |
| `fermentation-live.js` / `sauce-recipes.js` | Existing method instructions and contextual measurement/readiness adapters |
| `pizza-picker.js` | Recipe choice/customization mapped to stable pizza identity |
| `workshop-tools.js` | Reuse, profiles, optional resource settings and comparison tools |
| `navigation-logbook.js` | Workspace navigation and existing observation/log access |
| `persistence-bootstrap.js` | Sole owner of persistence, migration and bootstrap |
| `translations.js` / `i18n.js` | Dutch/English copy and formatting |

Split large responsibilities into new narrowly owned modules only if needed; do not turn the workflow core into a monolith or introduce a framework as a prerequisite. Preserve source-first development and the self-contained generated HTML distribution. Installation/PWA work is not part of this plan.

### Migration preparation

Take the actual released 1.4 state as the implementation baseline after Claude’s review, rather than assuming today’s candidate will be identical. Reserve the next schema number at that point, not now.

- Migrate one legacy active batch to one running evening with one child run, preserving IDs where possible, exact dough values, dates, real events, observations and progress.
- Preserve legacy derived phase labels as derived. In particular, a cold-bulk fridge-out timestamp does not prove that shaping was completed at that instant.
- The current top-level pizza choices can populate the migrated active evening with explicit legacy provenance. They cannot reconstruct a historical batch’s unknown toppings. Keep those historical fields unknown.
- Preserve all existing dough recipes, profiles and bake logs. Do not silently turn every dough recipe into a complete evening with default toppings.
- Distinguish dated drafts, relative calculator choices and timeless templates during migration. Do not invent an old absolute date from an unrecorded relative choice.
- Write the validated migrated state successfully before removing any old key. Quota failure leaves the old version intact. Report malformed recoverable records instead of claiming full restoration.
- Import formats and internal storage schemas have separate versions. An old shared recipe remains importable after an internal migration.
- Support one active evening with multiple child runs initially. General management of multiple independent active evenings is outside this agreed scope.

## 12. Usability, language and validation plan

### Copy and visual behavior

Use concise verb labels and familiar cooking terms. Keep “windowpane” as required by the existing product contract. Avoid celebrating routine taps, gamified percentages and repeated explanations that measurements do not change yeast; place that explanation where a user might otherwise expect the dose to change.

| Dutch draft | English draft | Meaning |
|---|---|---|
| Plan | Plan | Editable plan or summary of frozen dough |
| Keuken | Kitchen | Current cooking activity |
| Eerste pizza in de oven | First pizza in the oven | Fixed target, not first serving time |
| Rekening houden met mijn agenda | Fit around my availability | Optional manual availability entry |
| Verdelen over mixerbeurten | Split into mixer runs | Explicit ingredient allocation |
| Deeg in koelkast | Dough into the fridge | Actual transition; route-specific label can add shaping |
| Deeg uit koelkast | Dough out of the fridge | Actual removal, not automatic completion of shaping |
| Deeg al uit de koelkast? | Already taken the dough out? | Check overdue history without assuming the event occurred |
| Ongedaan maken | Undo | Revert the most recent eligible action |
| Tijd aanpassen | Correct time | Edit a recorded moment |
| Gedaan, tijd onbekend | Done, time unknown | Known action without invented timestamp |
| In oven / Uit oven | In oven / Out of oven | Actual pizza events |
| Opnieuw maken | Make again | New evening without actual history |
| Back-up downloaden / herstellen | Download / restore backup | Private snapshot transfer |

Use 44–48 CSS pixel targets for primary Kitchen actions as a project comfort target. This deliberately exceeds WCAG 2.2’s 24-by-24 CSS pixel minimum criterion, which has stated exceptions; do not label 44 pixels as that minimum requirement. [W3C: target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)

On mobile, allow labels to wrap, keep amounts with units, preserve visible focus and avoid a sticky action covering inputs or the keyboard. Do not autofocus recipe search. Reordering must work with buttons/keyboard, not dragging alone. Status changes need text in addition to color. A rerender must not reset the user’s scroll, current input or selected child run.

### Concrete acceptance scenarios

These are proposed future checks; they have not been executed for this design-only task.

| ID | Scenario | Required outcome |
|---|---|---|
| UX1 | Returning user, saved dough recipe, 4 pizzas | No required availability, naming or equipment setup; quantities available immediately |
| UX2 | Dough-only versus Complete pizzas | No irrelevant topping/sauce tasks in dough-only; Basic/Full keeps identical values |
| UX3 | Ordinary tracked cold route | One action per true phase transition; no duplicated checkbox/timestamp registration |
| UX4 | User ignores all timers and quality inputs | Full instructions and manual event recording remain usable; no fake observations |
| UX5 | Transition accidentally tapped twice, then Undo | One event; reversible latest action; no lost measurements |
| UX6 | Missed fridge-in; actual fridge-out known | Compact catch-up, explicit unknown history, no invented actual time or false precise duration |
| UX7 | Two tabs open; older tab submits a change | Stale state cannot overwrite the newer event revision |
| UX8 | Dutch and English at 320/390/430/760/1024/1280 px | Main controls visible, no page-level overflow or hidden action, keyboard and focus work |
| UX9 | Long translated labels, 200% text zoom and mobile keyboard | Current action and input remain operable; no forced horizontal page scrolling |
| PL1 | Friday 19:00 start constraint, Saturday absence | No active task scheduled in unavailable time; actual recipe changes presented explicitly |
| PL2 | No feasible schedule | Conflict explained; no shortened kneading/rests or fabricated feasibility |
| PL3 | Additional cleanup and preheat | No double-counted preparation or fermentation; preheat overlap handled explicitly |
| PL4 | Midnight, year boundary, spring-forward and repeated autumn hour | Dynamic labels correct; dated/running target fixed; ambiguous input resolved explicitly |
| SP1 | 1, 7, 8 and 24 balls with differing capacities | Valid whole-ball allocation; exact displayed ingredient sums and capacity respected |
| SP2 | Tiny yeast dose after splitting; coarse scale | Honest per-run weighing warning; no silent recipe rounding or zeroing |
| SP3 | Two runs start/fridge-in at different times | Independent histories and measurements; correct dough-ball assignments |
| BK1 | Names/reordering/custom sauce/extra toppings | Stable association through reorder, reload and language switch |
| BK2 | First pizza launched | One action records queue and dough bake-start; no duplicate checkpoint |
| BK3 | Pizza removed; after-bake topping required | Finishing instruction stays visible; “served” is not invented |
| BK4 | Long social pause between pizzas | Session forecast distinguishes waiting gap from bake duration and model calibration |
| BK5 | Close with two unbaked pizzas | Archive accurately preserves baked/unbaked state |
| RD1 | Post-knead measurement then recovery rest | Measurement belongs to the correct moment; extra rest counted once |
| RD2 | Strong-tight versus weak dough | Existing appropriate advice surfaced; no automatic extra kneading |
| SV1 | Reuse evening template versus restore active backup | Template clears actual history; restore preserves it exactly |
| SV2 | Old dough file, missing catalogue item, future format | Old file accepted; unknown item explicit; unsupported format rejected without current-data loss |
| SV3 | Schema migration with quota failure or malformed record | Old persisted state survives; partial recovery accurately reported |
| SV4 | Share evening then private backup | Shared file excludes private fields by default; private backup includes necessary continuity data |
| SV5 | Open transferred running evening in another time zone | Absolute events/target unchanged; local/original display unambiguous |
| TM1 | Timer, reload, tab suspension and wake-lock refusal | Correct elapsed time on return; no completion/alarm guarantee inferred |
| C1 | Typed phase readings and legacy readings | Semantic distinctions preserved; past actual events unchanged; unsupported precision declined |
| C2 | Measured flour equals room; warmer flour | Exact baseline at equality; lower water advice when flour is warmer, all else equal |
| C3 | Preparation-fermentation sensitivity study | Differences quantified and explained; no automatic production recalibration |

Use a short task-based walkthrough before implementation: plan a familiar evening; resolve one availability conflict; record fridge-in; recover a missed checkpoint; bake two differently topped pizzas; continue via a backup. Count administrative actions and note where the user has to remember information from another view. Revise the design if the interface adds more bookkeeping than it removes.

Real browser checks should later cover the current Chromium matrix and targeted Safari/iPhone and Android behavior for timers, file exchange and touch. Do not report Android/iPhone usability as verified solely from desktop Chromium viewport emulation.

## 13. Delivery order after 1.4

All six features remain in the desired next-version scope. The sequence below is for small, reviewable implementation slices, not a requirement that the user navigate six stages.

| Slice | Deliverable | Dependency/review focus |
|---|---|---|
| A | Confirm post-review baseline; finalize evening/run/pizza identities and migration contract | Preserve real 1.4 data; no historical reconstruction from absent facts |
| B | Plan/Kitchen flow, common events, linked progress and contextual readiness | Proposals 1 and 5; prove the ordinary single-run path stays simple |
| C | Complete evening templates and private backup | Proposal 6; explicit reuse versus continuation, safe migration/import |
| D | Mixer allocation and child-run execution | Proposal 3; conservation, capacity and separate chronology |
| E | Availability-aware planning | Proposal 2; use real single/multiple-run tasks and explicit alternatives |
| F | Baking queue and session estimates | Proposal 4; stable pizza ownership, minimal recording and finishing instructions |
| G | Bilingual/mobile walkthrough, migration gate and review documentation | Full `npm test` when implemented; source/bundle agreement; actual browser evidence |

Calculation investigations C1–C3 can proceed as separate evidence work. Their production changes need their own reviewed numerical contract and baseline; they must not be hidden in the UI slices. C1’s observation semantics can be prepared before its new estimator is enabled.

Before implementation, reconcile this document with Claude’s final 1.4 review and the released commit. Confirm any remaining product choices through a concrete design review, especially the availability alternatives and the handling of unknown history. No further questionnaire is needed to continue preparation now.

### Out of scope for this preparation

App-store packaging, PWA installation, accounts, live cloud sync, multi-oven orchestration, simultaneous unrelated active evenings, automatic learning/calibration, photo storage, recipe-catalogue expansion and the parked feedback/Cloudflare work. None is required to deliver the six accepted improvements.

## Source map

The repository links below are pinned to the inspected commit so a later review can distinguish source facts from proposals:

- [Product guardrails](https://github.com/hound83/pizza-dough-calculator/blob/4530a90f74bef667440e126873e5e950396e2622/docs/PRODUCT_GUARDRAILS.md), [architecture](https://github.com/hound83/pizza-dough-calculator/blob/4530a90f74bef667440e126873e5e950396e2622/docs/ARCHITECTURE.md), [contribution rules](https://github.com/hound83/pizza-dough-calculator/blob/4530a90f74bef667440e126873e5e950396e2622/CONTRIBUTING.md).
- [1.4 implementation/reviewer handoff](https://github.com/hound83/pizza-dough-calculator/blob/4530a90f74bef667440e126873e5e950396e2622/docs/V1_4_0_IMPLEMENTATION_REVIEW.md) and [recovery verification](https://github.com/hound83/pizza-dough-calculator/blob/4530a90f74bef667440e126873e5e950396e2622/docs/V1_4_0_RECOVERY_VERIFICATION.md).
- [Batch lifecycle](https://github.com/hound83/pizza-dough-calculator/blob/4530a90f74bef667440e126873e5e950396e2622/src/assets/js/batch-workflow.js): `startBatch`, `recordBatchEvent`, `batchProposal`, `renderBatchTimeline`.
- [Pure workflow](https://github.com/hound83/pizza-dough-calculator/blob/4530a90f74bef667440e126873e5e950396e2622/src/assets/js/workflow-core.js): `capacity`, `recordEvent`, `finalProofProposal`, `exportRecipe`, `importRecipe`.
- [Kitchen/thermal adapters](https://github.com/hound83/pizza-dough-calculator/blob/4530a90f74bef667440e126873e5e950396e2622/src/assets/js/fermentation-live.js): `predictFinalDoughTemp`, `step`, `buildSteps`.
- [Calculation core](https://github.com/hound83/pizza-dough-calculator/blob/4530a90f74bef667440e126873e5e950396e2622/src/assets/js/calculation-core.js): `simulateFermentation`, `doughQuantities`.
- [Planning and shopping](https://github.com/hound83/pizza-dough-calculator/blob/4530a90f74bef667440e126873e5e950396e2622/src/assets/js/planning-shopping.js): `activePrepMinutes`, `bakeSessionRange`, `scheduleView`.
- [Saved recipes/profiles/help](https://github.com/hound83/pizza-dough-calculator/blob/4530a90f74bef667440e126873e5e950396e2622/src/assets/js/workshop-tools.js) and [persistence](https://github.com/hound83/pizza-dough-calculator/blob/4530a90f74bef667440e126873e5e950396e2622/src/assets/js/persistence-bootstrap.js).

This document is a reviewable design and implementation handoff. It is not an implemented prototype, a passed usability study, a new calculation baseline or a release record.
