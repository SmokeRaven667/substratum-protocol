# Phase 3 — Data Models

## Intended

Define `DataModel` schemas for actor type(s) and item type(s) based on
Phase 0's findings (attributes, resources, equipment slots, etc.).

## What actually happened

- Before writing any schema, fetched the live Foundry v14 docs
  (`system-development` article + the `TypeDataModel` API reference) per
  `CLAUDE.md`'s API-drift warning, rather than assuming a remembered shape.
  Confirmed two things that mattered for how this phase was built:
  - v14 declares Actor/Item sub-types via a **`documentTypes`** key in
    `system.json`, not `template.json` — pairs with `DataModel`
    registration in code, and the `template.json` fallback CLAUDE.md
    flagged as "only if needed for legacy compat" turned out not to be
    needed at all.
  - `TypeDataModel` subclasses get their own lifecycle hooks
    (`prepareBaseData()`, `prepareDerivedData()`, etc.), so derived-only
    values like Anomaly Influence don't need a separate custom Document
    subclass — they can live directly on the DataModel.
- `module/helpers/config.mjs` — new `SUBSTRATUM` constants object: the
  6-Skill list, the normal die chain (`d4`-`d12`), the "Beyond the Horizon"
  sub-chain (`d0`/`d2`, only reachable by current dice at 8+ Stress),
  Anomaly Influence tier thresholds, the storage-unit slot count (3), and
  Stress capacity defaults (Scientist 8, Team 4).
- `module/data/shared.mjs` — a `skillsSchema()` helper producing the
  6-Skill max/current `SchemaField` block, reused by both actor types
  instead of duplicating the 12-field structure twice.
- `module/data/actor-scientist.mjs` — `ScientistData`: `specialty`,
  `pronouns`, `stress` (`value`/`max`), `skills`. Its
  `prepareDerivedData()` computes `anomalyInfluence`
  (`key`/`label`/`skillPenalty`) from current Stress at runtime — matches
  the digest's framing of Anomaly Influence as "a derived tier off current
  Stress, not something a player sets," so it's deliberately **not** a
  stored schema field.
- `module/data/actor-team.mjs` — `TeamData`: `stress`, `skills`, `deaths`
  (0-3, tracks the team-wipe rule), `deepBreathUsed` (the Team's
  once-per-session Deep Breath limit — a flag the GM/player resets
  manually, since Foundry has no built-in session-boundary concept to hook
  it to). No `anomalyInfluence` here — the rulebook is explicit that
  Anomaly Influence doesn't apply to the Team.
- `module/data/item-gear.mjs` — `GearData`: `description`, `dieRating`,
  `narrativeOnly` (free-form items that don't consume a storage slot),
  `broken` (a d4 item breaks after use regardless of Check outcome).
- `system.json` — added the `documentTypes` block for `Actor.scientist`,
  `Actor.team`, and `Item.gear`.
- `module/substratum-protocol.mjs` — registers all three DataModels via
  `CONFIG.Actor.dataModels` / `CONFIG.Item.dataModels` in the `init` hook.
- `lang/en.json` — added Skill labels, Anomaly Influence tier labels, and
  the `TYPES.Actor.*` / `TYPES.Item.*` keys Foundry uses to label sub-types
  in the Create Actor/Item dialogs (so the dropdown shows "Scientist"/
  "Team"/"Gear" instead of raw type keys).
- **Verified live**: with the Chrome extension unavailable for automated
  browser driving, the user manually hard-refreshed the running
  `substratum-protocol` test world, watched the console, and created one
  Actor of each type (Scientist, Team) plus one Gear Item via the Create
  dialogs. Confirmed: correct type names offered in both dropdowns, zero
  console errors on init or on any of the three creates.
- **Scoped out deliberately, not by oversight**: the shared, party-wide
  **Anomaly Skill** (the Last Hypothesis endgame mechanic, with its own
  `d0`→`d20`+ die chain) doesn't cleanly belong to either actor type as
  currently defined — non-solo games can have multiple Scientists and no
  `team` actor to hold shared state on. It's also outside the MVP scope
  Phase 1 settled on (core roll + basic equipment). Left unbuilt rather
  than guessed at; whoever picks up the endgame mechanic later needs to
  actually decide where that shared die lives — a world-scoped
  `game.settings` value and a dedicated small actor/journal are both
  plausible, untested options.
  - Also didn't add `module/documents/actor.mjs` / `documents/item.mjs`
    custom Document subclasses (present in `CLAUDE.md`'s target layout) —
    nothing needs overriding yet (no `getRollData()` or similar). Add them
    in Phase 4 if/when the roll mechanic needs one.
