# Product guardrails

## Purpose

These rules record deliberate product decisions in golden v1.0.0. They are not incidental implementation details and must not change during refactoring, cleanup, translation, or test work. A functional change requires explicit approval, a versioning decision, updated regression coverage, and a documented new baseline.

## Invariants

### 1. Yeast is fixed after mixing

The yeast quantity is calculated and chosen before the dough is mixed. A measured dough or refrigerator temperature entered later may adjust advice for the **remaining fermentation phases**, but must never rewrite or retroactively recommend changing the yeast already incorporated into the dough.

### 2. The dough log does not learn automatically

Saved bake results are reference data for the user. They do not automatically modify DDT assumptions, water-temperature guidance, yeast curves, fermentation times, presets, or future recipes. Any future learning feature requires an explicit product decision and transparent user control.

### 3. Room-temperature correction has an inclusive ±1 °C deadband

When measured post-kneading dough temperature differs from the planned final dough temperature by no more than 1 °C, the room-temperature fermentation plan remains unchanged. The deadband prevents false precision and unnecessary schedule churn.

### 4. Product bounds are 24 pizzas and 40 cm

The calculator supports at most 24 pizzas and diameters from 20 through 40 cm. Transient typing must not prematurely prune per-ball recipes or checked steps; normalization happens at the established commit boundary.

### 5. Toppings scale by surface area from 32 cm

Recipe quantities are authored for a 32 cm reference pizza. For diameter `d`, topping and default sauce quantities scale by:

```text
(d / 32)²
```

They do not scale linearly with diameter.

### 6. AVPN rules take precedence inside the AVPN preset

The AVPN midpoint preset is a distinct product contract. Its AVPN-derived dough, time, temperature, and yeast constraints take precedence over generic home-model heuristics. In particular:

- selecting the AVPN preset sets stone temperature to 405 °C;
- selecting a non-AVPN preset preserves the user's current stone temperature;
- the displayed official fresh-yeast range remains distinct from the calculator's practical model advice;
- practical midpoint or phase-split choices must be labelled as such and not presented as exact AVPN prescriptions.

## Golden behavior baseline

The behavior-neutral refactor protects these v1.0.0 hashes:

| Artefact | SHA-256 |
|---|---|
| standalone `index.html` | `7045421500a5497ca403699a2297c2ad8fa3e53f81f053300e8abdd84630cf3f` |
| CSS | `262e12b5356f5a50c63aa7cd7249b3c5c8b101d8954f076de1360efbc222b896` |
| combined JavaScript | `2897bfe7eda16d93c872d49f4dc8256f99549defe1927688903009f2a98483e7` |

When behavior is intentionally changed, do not silently replace these values. First document the approved product change, update or add focused tests, select the correct semantic version, and record the reviewed replacement baseline.

## Change checklist

Before changing a rule above:

1. explain the user-visible reason and affected scenarios;
2. identify whether the change is a patch, feature, or breaking change;
3. add a regression test that demonstrates the old and intended behavior;
4. verify Dutch and English output;
5. verify persistence and migration impact;
6. obtain explicit approval before implementation;
7. update this document and the audit handoff.
