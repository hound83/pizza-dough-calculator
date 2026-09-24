# v2.0.1 kitchen workbench review

## User request

The v2 Kitchen screen compressed useful individual steps into one phase block and hid the familiar checklist. Michael asked to restore separately checkable steps, retain Plan/Kitchen, and use the more polished visual language of the mode chooser and recipe picker. This candidate starts from released v2.0.0 / `2028e4083ecf77eada29081dbe5bb3d62d96d09b`. It has not been published.

## Changes

- Plan/Kitchen become paired navigation cards with a small icon, clear purpose and restrained active accent.
- Kitchen opens with a compact session overview, followed immediately by the full checklist. No disclosure is needed to reach the steps.
- Existing steps retain their own number, checkbox, quantities, instructions and stable identity. Three section headings and jump links help users scan a long recipe without forcing a wizard. The first unchecked step has a warm accent; completed steps remain readable and can be unchecked.
- Timeline, oven guidance and optional reference tools sit beside the checklist on desktop and below it on phones. Ingredients and timing/logbook tools have their own disclosures.
- The duplicated all-in-one mixing programme is removed. The original post-knead reading stays at its proper place after kneading; Basic collapses it and Full exposes it.

## Preserved contracts

No recipe, model constant, yeast recommendation, ingredient allocation, phase duration, storage schema or migration changes. Existing progress belongs to its original mixer run and survives reload and language changes. Checkboxes retain their existing semantics: ticking one does not invent an actual checkpoint. Existing explicit phase transitions continue to update the associated checklist progress as in v2.0.0. This patch adds no forced steps.

## Verification

Run `npm test`. Added browser scenarios verify that separate steps are immediately accessible, independent, reversible and retained across navigation, reload and language changes, and remain separate between mixer runs. Existing input-to-action, keyboard, migration, Basic/Full and six-width NL/EN coverage are retained and adapted to the single post-knead field. The expected browser count is 143, with zero retries. Record actual run results in the PR; a listed test is not execution evidence.

Physical iPhone/Android, wake lock and device suspension remain manual follow-ups. Live remains v2.0.0 until Michael approves the reviewed result for publication.
