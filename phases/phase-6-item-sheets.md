# Phase 6 — Item Sheets

## Intended

A sheet for the `gear` Item type — the only item category the rulebook
defines. Phase 5 left gear items falling back to Foundry's core default
Item sheet, which has no knowledge of the `gear` DataModel's
`dieRating`/`narrativeOnly`/`broken`/`description` fields, so an item's die
rating couldn't be changed from the UI at all.

## What actually happened

- **Live-docs check done first.** Confirmed `foundry.applications.sheets`
  ships a dedicated `ItemSheetV2` (extends `DocumentSheetV2`, same as
  `ActorSheetV2` from Phase 5) with an `item` getter — used that instead of
  raw `DocumentSheetV2`. Confirmed the registration API mirrors
  `Actors`: `Items.registerSheet(scope, sheetClass, {types, makeDefault})`
  / `Items.unregisterSheet('core', foundry.appv1.sheets.ItemSheet)`.
- **`module/sheets/item-sheet-gear.mjs`** — `GearSheet`:
  - Single `PARTS` entry (no tabs needed — the form is small): die rating,
    two checkboxes, and a description editor all fit on one screen.
  - `dieChainOptions` built the same `{die: die}`-dictionary way Phase 5
    landed on for `dieRating`'s `<select>` — deliberately reused that
    pattern rather than re-discovering the `selectOptions`-plain-array
    bug from scratch.
  - `editImage` action (portrait → `FilePicker.implementation`), same
    pattern as the actor sheet's portrait picker.
  - HTML description field: confirmed v14 ships a `<prose-mirror>` custom
    element (`foundry.applications.elements.HTMLProseMirrorElement`) that
    binds directly to an `HTMLField` via `name`/`value` attributes inside
    an `ApplicationV2` form — no need for the old `TextEditor.enrichHTML`
    + manual editor-toggle dance from v1 sheets.
- **`templates/item/gear-sheet.hbs`**: header (portrait + name),
  die rating dropdown, Narrative Only / Broken checkboxes, description
  editor.
- Registered in the `init` hook alongside the actor sheet registration;
  `lang/en.json` gained `DieRating`/`Description` (the checkbox labels
  were already added in Phase 5); minor CSS for the sheet layout.
- **Live-verified in a running Foundry world** (user-driven this time —
  browser automation was available but the user preferred to test
  manually). Confirmed working on the first pass, no bugs found: portrait
  click/file-picker, name edit, die rating dropdown (the field this whole
  phase existed to fix), both checkboxes, and the ProseMirror description
  editor all save correctly.

## Deferred, not built in this phase

- **`team` actor sheet** — still no sheet registered for the `team` type;
  remains open from Phase 5.
- Anything that *uses* an item's die rating in play (substituting a gear
  item's die for a Skill on a Check, item breaking on a d4 use, Repair &
  Heal restoring an item to max) — this phase only makes the data
  editable, not consumed. Still noted as future work from
  `phases/phase-4-core-roll.md`.
