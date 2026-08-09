# Phase 5 — Character Sheet

## Intended

`ApplicationV2` + `HandlebarsApplicationMixin` sheet for the `scientist`
actor type: display Skills/Stress/Anomaly Influence, roll buttons wired to
Phase 4's `rollSkillCheck()` (needs a UI for picking the 2 Skills, and for
the advantage/disadvantage/tiebreak/Stress-spend inputs that
`rollSkillCheck` already accepts as parameters), and an inventory list for
`gear` items. Register the sheet in the `init` hook. A live-docs check on
the v14 `ApplicationV2` lifecycle methods was flagged as warranted before
writing it, same as Phase 4's Cards check.

## What actually happened

- **Live-docs check done first**, per `CLAUDE.md`. Fetched the v14 API
  reference rather than trusting a remembered shape, and it caught a real
  mistake: the base class isn't plain `ApplicationV2` — Foundry ships a
  dedicated `foundry.applications.sheets.ActorSheetV2` (extends
  `DocumentSheetV2`) purpose-built for Actor sheets, with an `actor` getter
  and built-in drag/drop item handling. Used that instead of hand-rolling
  `DocumentSheetV2` directly. Confirmed lifecycle order
  (`_canRender` → `_configureRenderOptions` → `_prepareContext` →
  `_preparePartContext` per `PARTS` entry → `_renderHTML` → `_onRender` →
  ...), the `static PARTS`/`static TABS`/`static DEFAULT_OPTIONS.actions`
  shapes, and the sheet-registration API: `Actors.registerSheet(scope,
  sheetClass, {types, makeDefault})` / `Actors.unregisterSheet('core',
  foundry.appv1.sheets.ActorSheet)` (the core v1 default lives at that
  namespaced path in v14, not a bare global).
- **`module/sheets/actor-sheet-scientist.mjs`** — `ScientistSheet`:
  - `PARTS`: `header`, `tabs` (nav), `skills`, `inventory` — each its own
    `.hbs` under `templates/actor/`.
  - `TABS.primary`: `skills` (initial) / `inventory`, tab records built via
    the base class's own `_prepareTabs('primary')` (no need to hand-roll
    tab-record shape).
  - `_prepareContext()` adds `actor`, `system`, `isEditable`, `tabs`, a
    flattened `skills` array (key/label/max/current per Skill), gear
    `items` + storage-slot counts, and — critically — `dieChainOptions`
    / `fullDieChainOptions` as `{die: die}` dictionaries rather than plain
    arrays (see bug below).
  - Declarative `actions`: `rollSkillCheck`, `createItem`, `editItem`,
    `deleteItem`, `editImage` (portrait → `FilePicker.implementation`).
  - The roll-control inputs (2 Skill pickers, advantage/disadvantage,
    Stress spend, tiebreak radios) are deliberately **not** document-bound
    fields (`name="system..."`) — they're ephemeral UI state read straight
    out of the DOM by `#onRollSkillCheck` and passed to `rollSkillCheck()`,
    since they don't correspond to persisted actor data.
- **Templates**: `scientist-header.hbs` (portrait/name/specialty/pronouns/
  stress/Anomaly Influence display), `tab-navigation.hbs` (shared nav
  partial), `scientist-skills.hbs` (skill die dropdowns + roll panel),
  `scientist-inventory.hbs` (gear list + add/edit/delete).
- Registered in the `init` hook; `lang/en.json` and
  `styles/substratum-protocol.css` extended for all new sheet strings/
  layout.
- **Live-verified in a running Foundry world** (user-driven — Chrome
  browser automation wasn't connected in this environment) and three real
  bugs surfaced and got fixed in the process:
  1. **Tab content never appeared.** `_prepareTabs()` puts a `cssClass`
     field (`"active"` / `""`) on each tab record; that was captured into
     `context.tab` but never actually applied to the tab `<section>`
     elements' `class` attribute. Foundry's core CSS hides any `.tab`
     without `.active`, so both panels rendered with real content but
     stayed invisible. Fixed by adding `{{tab.cssClass}}` to both
     `scientist-skills.hbs` and `scientist-inventory.hbs`'s root section.
  2. **Clicking the Inventory tab did nothing.** The nav `<a>` elements
     were missing `data-action="tab"` — the reserved action name
     Foundry's click-delegation uses internally to route to
     `changeTab()`. Without it, nav links have no attached behavior at
     all. (Skills *looked* like it worked before this fix only because
     it's the default-active tab, not because clicking did anything.)
  3. **Editing Stress silently failed and Anomaly Influence never
     updated** — turned out to be caused by bug 4 below, not a separate
     issue: the whole `actor.update()` call was being rejected by schema
     validation because of invalid skill-die values in the same form
     submission, so nothing in the update (including Stress) was ever
     applied.
  4. **Root cause of #3, and the most important lesson of this phase:**
     `{{selectOptions dieChain selected=...}}` with a **plain array**
     (`['d4','d6','d8','d10','d12']`) submits the array **index** as the
     option value, not the string — Foundry validation then rejected every
     skill's `max`/`current` with `"0" is not a valid choice`. This
     directly contradicted an earlier live-docs fetch that (wrongly)
     "confirmed" arrays work as both value and label — that answer came
     from an AI-summarized doc fetch, not verified against real behavior,
     and it was wrong. Fixed by passing `{die: die}` dictionaries instead
     of bare arrays, so the die string itself is both the submitted value
     and the label. **Takeaway:** even a live-docs fetch is a paraphrase,
     not ground truth — for anything a validation error can catch, prefer
     testing the actual behavior over trusting a fetched summary.
  - After all four fixes: portrait click opens the file picker and updates
    the actor's image, both tabs switch and show content, Stress edits
    save and Anomaly Influence updates live, and skill die dropdowns save
    correctly.

## Deferred, not built in this phase

- **Gear item sheet (Phase 6).** Clicking a gear item currently opens
  Foundry's core default Item sheet, which has no knowledge of the
  `gear` DataModel's `dieRating`/`narrativeOnly`/`broken`/`description`
  fields — so an item's die rating can't be changed from the UI yet.
  Explicitly left for Phase 6 rather than patched in here.
- **`team` actor sheet.** Only `scientist` got a sheet this phase, per the
  original phase-5 scope; `team` actors currently fall back to whatever
  Foundry does with no registered sheet for that type.
- Deep Breath / Overclock buttons, exosuit abilities that spend hand
  cards, and item-die substitution for a Skill Check — all still noted as
  future work in `phases/phase-4-core-roll.md`; nothing new here changes
  that.
