# Exosuit Abilities

## Intended

Build the 7 universal Exosuit abilities deferred since Phase 4 (Repair &
Heal, Boost Actions, 3D Printer, Radio the Fracture Observatory, Sensor
Deployment, Flashback, Systems Upgrade) — fixed sheet actions that spend
cards collected from beaten Skill Check draws (01-rulebook-digest.md
p.29-31).

## What actually happened

- **Session picked up mid-work**: the previous session was interrupted
  before this phase's playtest pass. On resuming, code review found all 7
  abilities already implemented (`module/helpers/exosuit.mjs`, a new
  Exosuit tab on both actor sheets, `templates/chat/exosuit-action.hbs`)
  and internally consistent — every helper call resolved, every
  localization key present, `node --check` clean on all touched files —
  but genuinely unverified against a live world. Confirmed the user's
  local Foundry (port 30000) was already running the world and handed
  back a manual test script rather than claim it worked, since this
  session had no browser-automation tool available (unlike Phase 8's
  Chrome extension, also since gone).
- **Gear item max/current split** (`module/data/item-gear.mjs`): manual
  testing surfaced that Repair & Heal's "repair an item to max die"
  (p.29) had nothing to repair *to* — `dieRating` was a single flat
  field, so the original code repaired every item straight to the global
  ceiling (d12) regardless of what the item actually started at. Fixed by
  giving gear the same `{max, current}` `SchemaField` shape Skills
  already use (`data/shared.mjs`'s `skillsSchema`) instead of inventing a
  separate pattern — item sheet gained a second "Max Die Rating"
  dropdown, inventory list shows `current / max` when they differ. This
  changed the Item DataModel schema, so the `packs/_source/starter-gear/`
  compendium sources were updated to match; any gear already created in
  the live test world under the old schema needed to be deleted and
  recreated (no migration written — nothing worth preserving yet, agreed
  with the user up front).
- **Boost Actions banking** (`system.boostBonus` on both actor types):
  originally Boost Actions just posted a chat card with the bonus,
  requiring the player to manually type it into a "Bonus" field on their
  next roll. User asked for it to auto-apply. Now `boostActions()` adds
  the bonus onto the *target* actor's `system.boostBonus`, and
  `rollSkillCheck()` reads and zeroes it in the same `actor.update()`
  that already handles the skill step-down — applied exactly once, on
  whichever Skill Check comes next. Sheet shows a read-only "Boost
  Actions Available" line when a banked bonus is pending, and the chat
  card breaks it out alongside Stress Spend/Bonus/Anomaly Penalty so it's
  visible when it fires.
- **Skill1/Skill2 dropdown retention**: rolling a Skill Check re-renders
  the sheet (to reflect the die step-down), which reset both Skill
  pickers back to the first option ("Make") every time — annoying when
  chain-rolling the same pair. Fixed with a `lastRollSkills` property on
  each sheet instance (UI state only, not persisted to the actor) read
  back into `_prepareContext` to mark the right `<option selected>`.
- **Tab-stacking bug found and fixed, not specific to Exosuit**: while
  testing, the user noticed sheet content overflowing badly and needing
  constant manual window resizing. Root cause: Foundry's core CSS only
  auto-hides inactive `.tab` panels for its own built-in dialogs (scene
  config, module config, etc.) — custom system sheets have to supply
  that themselves, and this system never had. Every tab's content
  (Skills, Inventory, Members, and now Exosuit) had been rendering
  stacked simultaneously since Phase 5, just invisibly clipped by the
  window's `overflow: hidden` — Exosuit's several fieldsets were simply
  what finally pushed the stack far enough to be obvious. Fixed with a
  proper `.tab { display: none }` / `.tab.active { display: block }`
  pair, plus the active tab (not the whole window) owning the scrollbar
  so the header and tab nav stay pinned while the body scrolls.
- **Live-verified by the user directly** in the running Foundry world
  after the fixes above — confirmed both the tab/scroll fix and all 7
  Exosuit abilities working ("exosuit functions are great").

## Deferred, not built in this phase

- No migration path for pre-existing gear items created before the
  `dieRating` schema change — fine for this still-unreleased, actively-
  testing world, but worth a real migration if this ever matters for a
  released version with live player data.
- Items don't yet step down through use the way Skills do
  (01-rulebook-digest.md p.98: "Items step down the same way Skills do;
  an item used as a d4 item breaks after that use") — gear's `current`
  only ever moves via Repair & Heal (up) and the 3D Printer (creation).
  Wiring items into `rollSkillCheck()` as an alternate Skill source is
  still open, same as noted since Phase 4.
- Overclock and Deep Breath sheet buttons — next up per the user.
