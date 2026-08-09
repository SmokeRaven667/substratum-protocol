# Substratum Protocol — Foundry System: Planning

Working doc for continuity across sessions — the current state and what's
next. Update as decisions get made or steps complete; don't let this go
stale. See `CLAUDE.md` for coding conventions, `README.md` for dev
reference links.

Detailed phase-by-phase history (what was intended vs. what actually
happened, including dead ends and gotchas) lives in `phases/` — one file
per phase, named to match its git branch. This doc stays short and
forward-looking; `phases/` is the archive.

## Status

- **Phase 0 — done.** Rulebook digested. See `phases/phase-0-rulebook-digest.md`.
  Reference output: `01-rulebook-digest.md` — consult that file instead of
  the PDF for all mechanic/data-model questions going forward.
- **Phase 1 — done.** MVP scope settled. See `phases/phase-1-mvp-scope.md`
  (summary also in Open Decisions below).
- **Phase 2 — done.** Project scaffolding, local dev loop, git/branch setup.
  See `phases/phase-2-scaffolding.md`.
- **Phase 3 — done.** DataModel schemas for `scientist`/`team` actors and
  the `gear` item type. See `phases/phase-3-data-models.md`.
- **Phase 4 — done.** Core roll mechanic (`helpers/dice.mjs`) plus the
  Cards-document-backed deck economy (`helpers/cards.mjs`): draw/compare/
  discard/step-down, chat card, verified live. See
  `phases/phase-4-core-roll.md`.
- **Phase 5 — done.** `ScientistSheet` (`ApplicationV2`/`ActorSheetV2` +
  `HandlebarsApplicationMixin`): header, Skills tab with roll controls
  wired to `rollSkillCheck()`, Inventory tab (gear create/edit/delete),
  portrait image picker. Live-verified in a running Foundry world. See
  `phases/phase-5-character-sheet.md`.

**Phase 6 (item sheets) is next** — a `gear` item sheet is now the
blocker for editing an item's die rating from the UI at all.

## High-level phases

### 0. Digest the rulebook
Extract the actual game mechanics from the PDF into a structured reference
we can build against: core resolution mechanic (dice pool? d20? 2d6?),
attributes/stats, skills, character creation rules, combat flow, equipment/
item categories, conditions/status effects, advancement/leveling, NPC/
monster stat structure. This drives every data model decision below —
nothing in Phase 2+ should be guessed instead of pulled from this.

### 1. Define MVP scope
Decide what "playable" means for v1 — likely: one actor type (character),
core stat block, the primary roll mechanic + chat card, basic equipment as
items. Explicitly defer: NPC/monster sheets, active effects/automation,
compendium content, advancement automation, anything nice-to-have.

### 2. Project scaffolding
- `system.json` manifest (id, title, version, compatibility, esmodules,
  styles, languages).
- Local dev loop: symlink (or copy) this repo into a local Foundry
  `Data/systems/` folder so changes are testable in a live world.
- Decide if any build step is needed at all (plain JS/Handlebars/CSS may
  need none) vs. just a CSS preprocessor if wanted.

### 3. Data models
Define `DataModel` schemas for actor type(s) and item type(s) based on
Phase 0's findings (attributes, resources, equipment slots, etc.).

### 4. Core roll mechanic
Implement the game's dice resolution as a reusable helper (`helpers/dice.mjs`)
producing a `Roll` and a chat card — this is the single most
game-defining piece of code in the system. Needs a live-docs check on the
v14 `Cards`/`CardStack` API shape before wiring up the deck economy (see
Open Decisions below — this was flagged against v13 in Phase 1, before the
v14 correction in Phase 2, so don't trust that shape from memory).

### 5. Character sheet
`ApplicationV2` + Handlebars sheet for the primary actor type: display
stats, roll buttons wired to Phase 4, inventory list.

### 6. Item sheets
Sheet(s) for whatever item types Phase 0/3 defined (weapons/gear/abilities).

### 7. Localization
All sheet/template strings routed through `lang/en.json` from the start
(cheaper to do as-you-go than to retrofit).

### 8. Manual playtest pass
Run a real session (or solo walkthrough) in a live Foundry world exercising
character creation, the core roll, and basic combat/inventory flow. Fix
what breaks.

### 9. Content & polish
Compendium packs (starter items/NPCs), active effects/conditions if the
system uses them, styling pass, icons/art.

### 10. Packaging & release
Finalize `system.json` versioning/compatibility, decide distribution
(GitHub releases + manifest URL vs. private use only).

## Open decisions (settled, kept here as quick reference)

Resolved by the Phase 0 digest (`01-rulebook-digest.md`):
- Core mechanic: two-Skill dice-pool sum vs. two drawn playing cards
  (Good/OK/Bad), plus a step-down die chain. No traditional attributes —
  just 6 Skills + Stress.
- Item taxonomy: storage-unit gear only (die-rated like Skills). No
  weapons/armor as distinct categories in the rulebook.
- No Active Effects / buffs system in the source material — Anomaly
  Influence is a derived tier off current Stress, not a stackable
  effects list. Likely doesn't need Foundry Active Effects for MVP.

Resolved by user decision (2026-08-09):
- **Actor types**: two — `scientist` (PC) and `team` (solo-mode combined
  party). No NPC/monster actor type — bestiary stays as flavor
  text/journal content, not stat-bearing actors.
- **Card deck**: built on Foundry's native `Cards` document (deck/hand/
  pile) for the draw/discard/hand economy instead of a custom tracker.
  Live-docs-checked against v14 and implemented in Phase 4 — see
  `phases/phase-4-core-roll.md` for the confirmed API shape
  (`draw`/`deal`/`pass`/`shuffle`/`recall`, `CONST.CARD_DRAW_MODES`).
- **Release scope**: public release intended. `system.json` needs a real
  license file, versioning discipline, and a public manifest URL
  (GitHub releases) in mind from the start; Phase 10 isn't just "personal
  cleanup."
- **Foundry version target**: v14 (Build 363 locally), not v13 — see
  `phases/phase-2-scaffolding.md`.

Deferred, not yet resolved (see `phases/phase-3-data-models.md`):
- Where the shared, party-wide **Anomaly Skill** (Last Hypothesis endgame
  die) lives — doesn't cleanly fit the current `scientist`/`team` actor
  split, and is outside MVP scope for now.

## Next step

Move to **Phase 6 — item sheets**: an `ApplicationV2`/`DocumentSheetV2` +
`HandlebarsApplicationMixin` sheet for the `gear` Item type — currently
the only way to see/edit a gear item's `dieRating`, `narrativeOnly`, and
`broken` fields is Foundry's core default Item sheet, which doesn't know
about them. Register it the same way `phases/phase-5-character-sheet.md`
registered the scientist actor sheet (`Items.registerSheet`/
`Items.unregisterSheet('core', foundry.appv1.sheets.ItemSheet)`). Reuse
the same live-docs-first discipline from Phase 5 — and note Phase 5's
biggest lesson: even a fetched doc summary can be wrong (the
`selectOptions`-with-a-plain-array bug), so verify anything
validation-sensitive against actual behavior in a live world, not just
the docs.
