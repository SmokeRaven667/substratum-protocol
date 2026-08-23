# Hazard Actor Type

## Intended

Add a new `hazard` Actor type: a simple environmental/narrative token —
image picker, title, description field, nothing else — meant to be
dragged onto the canvas as-is. Deliberately excluded from the card-deck
economy entirely: no hand, no Skill Check involvement, no Deep
Breath/Overclock/Exosuit mechanics. The simplest actor sheet in the
system, structured like an item sheet (single form, no tabs) rather than
the multi-tab `ScientistSheet`/`TeamSheet` pattern.

## Steps

1. **Data model** — `module/data/actor-hazard.mjs`: `HazardData extends
   foundry.abstract.TypeDataModel`, schema = just `description`
   (`fields.HTMLField`, same shape as Gear/Clue's). Title/picture are the
   Actor's native `name`/`img`, no schema duplication.
2. **Register the type** — `module/substratum-protocol.mjs`: add
   `hazard: HazardData` to `CONFIG.Actor.dataModels`, register
   `HazardSheet` for `types: ['hazard']`. `system.json`:
   `documentTypes.Actor.hazard: {}` (matching `scientist`/`team`'s empty
   entries — Actor types don't declare `htmlFields` in this manifest,
   only Item types do, per existing precedent). `lang/en.json`:
   `TYPES.Actor.hazard: "Hazard"`.
3. **Hazard sheet** — `module/sheets/actor-sheet-hazard.mjs` +
   `templates/actor/hazard-sheet.hbs`: single `PARTS.form`, no `TABS`.
   Header mirrors `scientist-header.hbs`'s image-picker/name pattern
   (`.profile-img`, generic `.substratum-protocol.actor .sheet-header`
   CSS already covers both). Description mirrors the Notes tab / Clue
   sheet's `<prose-mirror>` + `enrichHTML` pattern.
4. **No card-deck participation, by construction, not by exclusion** —
   `HazardSheet` never calls `getActorHandCards`/`rollSkillCheck`/
   `deepBreath`/any exosuit helper, so a Hazard actor simply never enters
   the deck economy. Confirmed the two existing `game.actors.filter(...)`
   cross-actor lookups (`otherActors` for Boost Actions targets, in both
   `ScientistSheet` and `TeamSheet`) already scope to
   `['scientist', 'team']`, so Hazards are automatically excluded from
   Boost Actions targeting too — no code changes needed there.
5. **Styling** — `styles/substratum-protocol.css`: `.actor.hazard`
   layout/description rules mirroring `.item.gear`/`.item.clue`'s; reuses
   the already-generic `.substratum-protocol.actor .sheet-header`/
   `.profile-img` rules rather than duplicating them.
6. **Live verification** — in a running Foundry world: create a Hazard
   actor via the core Create Actor dialog, confirm the sheet shows only
   image/title/description with no tabs, set all three, confirm they
   persist across sheet close/reopen, and confirm a Hazard actor can be
   dragged onto the canvas as a token.

## Progress

- **Steps 1-5 — built, not yet live-verified.** All files created/wired
  as described above.
- **Description area full-height fix** — the user asked for the
  description field and its scrollbar to fill the sheet's full height.
  Initial CSS set `flex: 1` on `.hazard-description`/`prose-mirror` but
  was missing `min-height: 0` (a flex item's default `min-height: auto`
  stops it from shrinking below its content size, which breaks the
  overflow-scroll chain) and had no explicit `overflow-y: auto`, and
  `.hazard-sheet-body` itself wasn't set to `flex: 1; min-height: 0` to
  fill `.window-content` in the first place — `HazardSheet` has no `.tab`
  wrapper (unlike the Notes tab) to inherit that from generically. Fixed
  by mirroring the Notes tab's flex chain (`.tab.notes-tab.active` →
  `prose-mirror`) manually down through `.hazard-sheet-body` →
  `.hazard-description` → `prose-mirror`/`.substratum-richtext-readonly`.
- **Step 6 (live verification) — not done.** Needs a running Foundry
  world.

## Deferred / open questions

- None currently — scope was fully specified by the user up front.
