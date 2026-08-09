# Substratum Protocol — Foundry System: Planning

Working doc for continuity across sessions. Update as decisions get made or
steps complete — don't let this go stale. See `CLAUDE.md` for coding
conventions, `README.md` for dev reference links.

## Status

**Phase 0 — done.** Rulebook digested into `01-rulebook-digest.md`
(structured reference: core Skill Check mechanic, Stress/Anomaly Influence,
Actions table, exosuit abilities, chargen, Anomaly Skill/endgame, Depth
Sectors, bestiary, solo modes, hazards). Consult that file instead of the
PDF for all mechanic/data-model questions going forward. Still no code
exists yet — Phase 1 (MVP scope) is next.

Poppler note (resolved differently than expected): the Read tool's PDF
page-image rendering (`pdftoppm`) still isn't visible to the Claude Code
process itself — a fresh shell picks up the updated PATH but the running
Node process doesn't, so **a full app restart (not just a new session) is
still needed** if page-image rendering is ever required. Worked around it
for Phase 0 by extracting text directly via `pdftotext -layout`
(also poppler, but reachable from Bash/PowerShell already) into the
scratchpad and reading that — no image rendering needed. Good enough for
all rules text; would still need the restart if we ever need to see art/
diagrams/table layouts (e.g. the Personnel Folio questionnaire prompts,
which didn't extract as text — see digest's open-items list).

## High-level phases

### 0. Digest the rulebook
Extract the actual game mechanics from the PDF into a structured reference
we can build against: core resolution mechanic (dice pool? d20? 2d6?),
attributes/stats, skills, character creation rules, combat flow, equipment/
item categories, conditions/status effects, advancement/leveling, NPC/
monster stat structure. This drives every data model decision below —
nothing in Phase 2+ should be guessed instead of pulled from this.
*Blocker: need poppler-utils installed (for PDF page rendering) or another
way to get the text/pages out of the PDF.*

### 1. Define MVP scope
Decide what "playable" means for v1 — likely: one actor type (character),
core stat block, the primary roll mechanic + chat card, basic equipment as
items. Explicitly defer: NPC/monster sheets, active effects/automation,
compendium content, advancement automation, anything nice-to-have.

### 2. Project scaffolding
- `system.json` manifest (id, title, version, compatibility for v13,
  esmodules, styles, languages).
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
game-defining piece of code in the system.

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

## Open decisions (need user input — rulebook is now digested, see below)

Resolved by the Phase 0 digest (`01-rulebook-digest.md`):
- Core mechanic: two-Skill dice-pool sum vs. two drawn playing cards
  (Good/OK/Bad), plus a step-down die chain. No traditional attributes —
  just 6 Skills + Stress.
- Item taxonomy: storage-unit gear only (die-rated like Skills). No
  weapons/armor as distinct categories in the rulebook.
- No Active Effects / buffs system in the source material — Anomaly
  Influence is a derived tier off current Stress, not a stackable
  effects list. Likely doesn't need Foundry Active Effects for MVP.

Still genuinely open (need user input, not in the book):
- Actor types: "scientist" only, or also a "team" actor for solo-mode
  play? Bestiary confirmed to need **no** stat-bearing NPC actor type at
  all (creatures are flavor text, not opponents with dice pools).
- Card-deck mechanic: use Foundry v13's native `Cards` document
  (deck/hand/pile) to model the draw/discard/hand economy instead of a
  custom tracker? (Recommended — needs a docs check in Phase 2/4.)
- Public release intended, or personal/private table use only?

## Next step

Phase 1 — nail down MVP scope using the digest above (ask the user the
still-open decisions listed there), then move to Phase 2 project
scaffolding (`system.json`, local Foundry dev symlink).
