# Actions & Notes Tabs (Scientist Sheet)

## Intended

Add two tabs to `ScientistSheet`, bracketing the existing Skills/Inventory/
Exosuit tabs:

- **Actions** (new leftmost/first tab): a reference + shortcut panel for the
  7 core Actions (01-rulebook-digest.md p.103-118 — CONFRONT, AVOID,
  CONVINCE, PREPARE, STUDY, TRAVEL, UNDERSTAND). Each Action has a fixed
  first Skill (e.g. CONFRONT = Break) and a player-chosen second Skill, and
  Good/OK/Bad outcome text. Each Action gets a **Use** button that jumps the
  user to the Skills tab with **Skill 1** pre-set to that Action's fixed
  Skill (leaving Skill 2 for the player to choose, matching the rulebook's
  "fixed Skill + player choice" structure).
- **Notes** (new rightmost/last tab): a single actor-level rich-text field
  for freeform play notes, using Foundry's native editor.

## Steps

1. **Data model** — add `notes` to `ScientistData.defineSchema()`
   (`module/data/actor-scientist.mjs`) as a `fields.HTMLField()` (Foundry's
   rich-text-capable field type — confirm exact field class name against the
   v14 `foundry.data.fields` docs per CLAUDE.md rather than assuming from an
   older version).
2. **Actions config** — add a `SUBSTRATUM.actions` array to
   `module/helpers/config.mjs`, one entry per Action from the digest table
   (p.109-115): `key`, `label`, `fixedSkill` (a `SUBSTRATUM.skills` key),
   `rollLabel` (e.g. "Break + Skill"), and `good`/`ok`/`bad` outcome text —
   all as `lang/en.json` keys, not hardcoded strings, matching every other
   config table in the file (`anomalyInfluenceTiers`, `radioAnswerTable`).
3. **Localization** — add the new `SUBSTRATUM.Tab*`, `SUBSTRATUM.Action*`
   (name/roll/good/ok/bad per Action), and `SUBSTRATUM.Notes*` keys to
   `lang/en.json`.
4. **Actions tab template** — `templates/actor/actor-actions.hbs`: one
   row/card per Action (name, roll formula, Good/OK/Bad outcomes, Use
   button with `data-action="useAction" data-action-key="{{this.key}}"`).
5. **Notes tab template** — `templates/actor/actor-notes.hbs`: a single
   `<prose-mirror name="system.notes" value="{{system.notes}}">` element,
   matching the existing pattern in `templates/item/gear-sheet.hbs`
   (Foundry v14 ships ProseMirror, not TinyMCE — no TinyMCE dependency
   exists in this codebase or in core Foundry v14, so ProseMirror is the
   real target for "rich text with drag-to-link items"; flag this
   substitution to the user explicitly since they asked for TinyMCE by
   name).
6. **Wire into `ScientistSheet`** (`module/sheets/actor-sheet-scientist.mjs`):
   - Add `actions` and `notes` to `PARTS`, and to `TABS.primary.tabs` in the
     correct order (`actions` first, existing three, `notes` last).
   - Add a `useAction` entry to `DEFAULT_OPTIONS.actions` and a
     `#onUseAction(event, target)` static handler that reads the clicked
     Action's `fixedSkill`, reuses the existing `lastRollSkills` state
     (currently `{ skill1, skill2 }`, read by the Skills tab template to
     preselect the dropdowns — see `actor-skills.hbs` line 49) to set
     `skill1` to the fixed Skill while preserving whatever `skill2` was
     already picked, then switches the active tab to `skills`.
   - Confirm the exact v14 `ApplicationV2` tab-switching mechanism
     (`this.tabGroups`, `changeTab()`, or equivalent) against the live docs
     before implementing, per CLAUDE.md — don't assume the v1
     `Application#activateTab` shape. Note that Phase "Exosuit abilities"
     found all tab PARTS render simultaneously in the DOM (hidden via CSS,
     not skipped), which is why re-selecting Skill 1 via `lastRollSkills` +
     `this.render()` will reach the already-present Skills tab markup.
7. **Styling** — extend `styles/substratum-protocol.css` for the Actions
   tab's per-Action layout and the Notes tab's editor sizing, matching the
   tab icon / active-tab-underline conventions from Phase 9.
8. **Live verification** — in a running Foundry world: open a scientist,
   confirm all 5 tabs render with Actions first and Notes last, click each
   Action's Use button and confirm it lands on Skills with Skill 1 correctly
   pre-set and Skill 2 untouched, type/format text and drag an item onto the
   Notes editor to confirm linking works, and confirm `system.notes`
   persists across a sheet close/reopen.

## Progress

- **Steps 2, 3, 4, 6 (Actions half only), 7 (Actions half only) — built,
  not yet live-verified.** `SUBSTRATUM.actions` added to `config.mjs`;
  outcome/label strings added to `lang/en.json`; new
  `templates/actor/actor-actions.hbs`; `ScientistSheet` gained the
  `actions` PARTS/TABS entry (leftmost, `initial` tab left as `skills` —
  not changed to `actions` since that wasn't asked for) and the
  `useAction` handler, confirmed against the live v14 API
  (`ApplicationV2#changeTab(tab, group, options)` /
  `this.tabGroups[group]`) rather than assumed. CSS added for the
  Actions tab layout and Good/OK/Bad color coding (reusing the existing
  `#2e7d32`/`#b8860b`/`#c62828` palette from the Skill Check chat card).
- **Step 8 (live verification) — done for the Actions half.** User
  confirmed working in a live Foundry world.
- **Steps 1, 5, 6 (Notes half), 7 (Notes half) — built, not yet
  live-verified.** `notes` added to `ScientistData.defineSchema()` as a
  `fields.HTMLField()` (confirmed against the live v14 field docs, matches
  the same field type Gear's `description` already uses); new
  `templates/actor/actor-notes.hbs` with a single `<prose-mirror>` element
  bound to `system.notes`; `ScientistSheet` gained the `notes` PARTS/TABS
  entry as the rightmost tab; CSS sizes the editor to fill the tab.
- **Step 8 (Notes half) — done.** User confirmed working in a live Foundry
  world: Notes tab renders last, typing/formatting works, dragging an Item
  onto the editor creates a working content-link pill, and `system.notes`
  persists across a sheet close/reopen.
- **Real bug found and fixed**: dragging an Item onto the Notes editor
  inserted the literal `@UUID[Item.xxxx]{Name}` text instead of a rendered
  content-link pill. Root cause — `<prose-mirror>` renders whatever HTML is
  given as its *inner content*, not its `value` attribute (that's only the
  raw source used while actively editing); we were only ever setting
  `value`, so the element had nothing enriched to display. Confirmed
  against a real working example in the community ApplicationV2
  Conversion Guide (ProseMirror isn't documented in Foundry's own API
  reference beyond class shape) before fixing, per CLAUDE.md. Fix: both
  `ScientistSheet` and `GearSheet` now call
  `foundry.applications.ux.TextEditor.implementation.enrichHTML()` in
  `_prepareContext` and feed the result as the element's children
  (`{{{notesHTML}}}` / `{{{descriptionHTML}}}`), with `button`/`editable`/
  `toggled` attributes added and an `{{#if isEditable}}` split (editor vs.
  a plain enriched `<div>`) matching the documented pattern. **This was a
  latent bug in Gear's description field too** (shipped in Phase 6, just
  never exercised with a dropped item until now) — fixed alongside Notes
  since it's the exact same root cause, not scope creep on a new feature.

## Deferred / open questions

- Scope is Scientist-only per the user's request — `TeamSheet` does not get
  these tabs unless asked for separately.
- Whether Notes should be per-actor only or also make sense on `TeamData` is
  out of scope until requested.
