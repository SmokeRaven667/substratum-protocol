# Clue Items & Clues Tab (Scientist Sheet)

## Intended

Add a new `clue` Item type (01-rulebook-digest.md p.113/115 — Anomaly
Clues, gained on a STUDY Good outcome, resolved via the UNDERSTAND Action)
and a **Clues** tab on `ScientistSheet` to hold them, modeled on the
existing Gear item / Inventory tab pattern but simpler:

- **Clue item**: picture and title are the Item's native `img`/`name` (no
  schema duplication, matching how Gear doesn't re-declare them either),
  plus a schema with just an **Understood** checkbox and a **description**
  rich-text area. No die rating, no `narrativeOnly`/`broken` flags, no
  Storage Unit slot — Clues aren't gear per the rulebook, they're
  narrative tokens.
- **Clues tab**: a list of the actor's Clue items (create/edit/delete),
  showing name/picture and Understood status, same interaction shape as
  the Inventory tab. Placed immediately after Inventory, before Exosuit —
  both are item-list tabs, so grouping them keeps the tab order sensible
  (Actions, Skills, Inventory, Clues, Exosuit, Notes).

## Steps

1. **Data model** — new `module/data/item-clue.mjs`: `ClueData extends
   foundry.abstract.TypeDataModel`, schema =
   `{ understood: fields.BooleanField({ required: true, initial: false }),
   description: fields.HTMLField({ required: false, blank: true, initial: '' }) }`
   (same `description` field shape as `GearData`).
2. **Register the type** — `module/substratum-protocol.mjs`: add
   `clue: ClueData` to `CONFIG.Item.dataModels`, register a new
   `ClueSheet` for `types: ['clue']` the same way `GearSheet` is
   registered. `system.json`: add `"clue": { "htmlFields": ["description"] }`
   under `documentTypes.Item`.
3. **Clue sheet** — new `module/sheets/item-sheet-clue.mjs` +
   `templates/item/clue-sheet.hbs`, mirroring `GearSheet`/`gear-sheet.hbs`
   minus the die-rating/`narrativeOnly`/`broken` fields, plus the
   Understood checkbox. Reuse the exact `enrichHTML` pattern from
   `item-sheet-gear.mjs` for the description `<prose-mirror>` editor —
   that bug (value attribute vs. inner content) was already found and
   fixed once for Gear and Notes; implement Clue's correctly from the
   start rather than reintroducing it.
4. **Localization** — `lang/en.json`: `SUBSTRATUM.TabClues`,
   `SUBSTRATUM.Understood`, `SUBSTRATUM.AddClue`, `SUBSTRATUM.DeleteClue`,
   `SUBSTRATUM.NoClues`, `SUBSTRATUM.NewClueName`, plus whatever key
   Foundry needs for the Item type's display label. `Description` already
   exists and is reused as-is.
5. **Clues tab template** — new `templates/actor/actor-clues.hbs`: item
   list (image, name via `editItem`, Understood checkbox/badge, delete
   button), modeled on `templates/actor/actor-inventory.hbs` but without
   the storage-slot header (Clues don't consume Storage Unit slots).
6. **Wire into `ScientistSheet`** (`module/sheets/actor-sheet-scientist.mjs`):
   - Add `clues` to `PARTS` and to `TABS.primary.tabs`, positioned after
     `inventory` and before `exosuit`.
   - Add `context.clues = actor.items.filter((item) => item.type ===
     'clue')` alongside the existing `context.items` (gear) filter —
     `context.items`'s existing `.filter(item => item.type === 'gear')`
     already excludes Clues automatically, so Storage Unit slot counting
     on the Inventory tab needs no change.
   - `#onCreateItem` currently hardcodes `type: 'gear'` — it needs to
     become type-aware (e.g. read a `data-item-type` attribute off the
     clicked button, or add a small `#onCreateClue` sibling handler) so
     the Clues tab's Add button creates a `clue` instead of a `gear` item.
     `#onEditItem`/`#onDeleteItem` are already generic over `data-item-id`
     and should work unchanged for either type.
7. **Styling** — extend `styles/substratum-protocol.css` for the Clues
   tab's list layout and the Understood checkbox/badge state, matching
   Inventory's list conventions and the tab icon/active-tab-underline
   conventions from Phase 9.
8. **Live verification** — in a running Foundry world: open a scientist,
   confirm the Clues tab renders in the right position, add a Clue, set
   its picture/title/description/Understood state, confirm it persists
   across a sheet close/reopen, drag an Item onto the description editor
   to confirm content-link enrichment works, delete a Clue, and confirm
   Clues never appear in or affect the Inventory tab's Storage Unit count.

## Progress

- **Steps 1-7 — built, not yet live-verified.**
  - `module/data/item-clue.mjs`: `ClueData` schema (`understood`,
    `description`), matching `GearData`'s `description` field shape.
  - Registered in `module/substratum-protocol.mjs`
    (`CONFIG.Item.dataModels.clue`, `ClueSheet` for `types: ['clue']`) and
    `system.json` (`documentTypes.Item.clue`).
  - `module/sheets/item-sheet-clue.mjs` + `templates/item/clue-sheet.hbs`:
    mirrors `GearSheet`/`gear-sheet.hbs` minus die-rating/narrativeOnly/
    broken, plus the Understood checkbox; reuses the exact `enrichHTML`
    pattern for the description `<prose-mirror>` editor.
  - `templates/actor/actor-clues.hbs`: item list modeled on
    `actor-inventory.hbs`, but Understood renders as a read-only
    `item-flag` badge (matching how Narrative Only/Broken are shown on
    Gear) rather than an inline-editable checkbox — embedded Item fields
    aren't part of the actor sheet's own form the way Team's per-member
    Dead checkbox is (that's actor-level data); toggling Understood still
    requires opening the Clue's own sheet, consistent with every other
    per-item flag in the codebase.
  - `ScientistSheet`: `clues` added to `PARTS`/`TABS.primary.tabs`
    (positioned after `inventory`, before `exosuit`, icon
    `fa-magnifying-glass`); `context.clues` filters `actor.items` by
    `type === 'clue'`; new `#onCreateClue` handler (`createClue` action)
    creates a `clue` Item, parallel to `#onCreateItem`'s `gear` creation.
    `#onEditItem`/`#onDeleteItem` needed no changes — already generic over
    `data-item-id` regardless of item type.
  - `lang/en.json`: `TabClues`, `AddClue`, `NewClueName`, `Understood`,
    `DeleteClue`, `NoClues`, plus the `TYPES.Item.clue` display label.
  - CSS: `.item.clue` sheet rules mirroring `.item.gear`'s, and
    `.item-flag.understood` (green accent, matching the Anomaly
    Resistant tier color) alongside the existing flag styles. No new
    tab-visibility CSS needed — `clues-tab` falls under the same generic
    `.tab`/`.tab.active` rule Inventory already uses.
- **Step 8 (live verification) — done.** User confirmed in a running
  Foundry world: the Clues tab renders in the right position, a Clue can
  be created/edited (picture/title/description/Understood) and persists
  across sheet close/reopen, and it doesn't affect the Inventory tab's
  Storage Unit count.

## Deferred / open questions

- Scope is Scientist-only per the Actions/Notes precedent — `TeamSheet`
  does not get a Clues tab unless asked for separately.
- **Decided against**: UNDERSTAND's Beyond-the-Horizon auto-success
  (`phases/beyond-the-horizon-audit.md`) does **not** prompt for or
  auto-flip a Clue's Understood checkbox. User explicitly ruled this out.
  Understood stays a manual checkbox the player sets themselves, with no
  automation tying it to the UNDERSTAND Action.
- Whether "Understood" should have any mechanical effect (e.g. contribute
  toward Anomaly Knowledge / the Last Hypothesis die, per
  01-rulebook-digest.md lines 161-163) is out of scope here — this phase
  is just the checkbox and its persistence, not Anomaly Knowledge
  tracking, which doesn't exist anywhere in the data model yet.
