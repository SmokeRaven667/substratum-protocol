# Substratum Protocol — Foundry System: Planning

Working doc for continuity across sessions. Update as decisions get made or
steps complete — don't let this go stale. See `CLAUDE.md` for coding
conventions, `README.md` for dev reference links.

## Status

**Phase 0 — done.** Rulebook digested into `01-rulebook-digest.md`
(structured reference: core Skill Check mechanic, Stress/Anomaly Influence,
Actions table, exosuit abilities, chargen, Anomaly Skill/endgame, Depth
Sectors, bestiary, solo modes, hazards). Consult that file instead of the
PDF for all mechanic/data-model questions going forward.

**Phase 1 — done.** MVP scope settled (see Open decisions below).

**Phase 2 — done.** Scaffolding in place:
- `system.json` (id `substratum-protocol`, MIT-licensed code, targeting
  Foundry **v14** (see below), author SmokeRaven667, repo
  https://github.com/SmokeRaven667/substratum-protocol).
- `LICENSE` (MIT for code; notes rulebook content stays under Pandion Games'
  ORC License separately).
- Directory skeleton: `module/`, `styles/`, `lang/`, `templates/{actor,item,chat}/`,
  `packs/`.
- Minimal working stub: `module/substratum-protocol.mjs` (just a Hooks.once('init')
  console log), empty `styles/substratum-protocol.css`, minimal `lang/en.json`.
  No build step — plain ESM/Handlebars/CSS needs none, per CLAUDE.md.
- **Local dev loop — verified working.** The real Foundry user data directory
  is `C:\u\FoundryVTT` (NOT `C:\Users\smoke\AppData\Local\FoundryVTT` — that
  path exists too but is a stale/unused install; don't symlink there again).
  `Data\systems\substratum-protocol` is a **directory junction** (`mklink /J`,
  not a symlink — see below for why) pointing at this repo. Confirmed by
  actually creating a test world (`Data\worlds\substratum-protocol`) bound to
  the system, which loaded `system.json` correctly (`systemVersion: "0.1.0"`
  recorded in `world.json`), and by a clean log scan with zero errors for
  `substratum-protocol` across three restarts (only two pre-existing, unrelated
  broken folders — `forbidden-lands-bkup-2024-05-23`,
  `morkborg - original working before fixes` — log "Invalid system" errors,
  not ours).
  - Foundry only scans `Data/systems` at **boot**, not live — after linking or
    changing the folder, the app process must be restarted (kill + relaunch),
    not just have the setup page refreshed.
  - Junction vs. symlink: started with a symlink, which appeared to fail
    silently (no log entry at all, not even an error) after one restart, so
    switched to a junction on the theory that Node's `fs.readdir` reports
    Windows symlinks-to-directories as `isSymbolicLink()`-only (not
    `isDirectory()`), which a naive directory-type filter would skip, while
    junctions report as real directories. **Caveat: inconclusive** — in
    hindsight the plain symlink may have actually been working too (a restart
    right before the junction swap did successfully surface the system and
    let a world get created on the symlink). Kept the junction since it's
    already in place, tested working, and is the theoretically safer choice
    either way — no need to revisit unless the junction itself ever causes
    problems.
  - This local instance runs **Foundry v14 Build 363**. Decided (2026-08-09):
    **target v14, not v13** — `system.json` now declares
    `compatibility: {minimum: "14", verified: "14.363"}`, and `CLAUDE.md`'s
    Stack section / API-drift note were updated from v13 to v14 throughout so
    future sessions build against the right API surface from the start.
- Git: repo initialized (`git init`, default branch renamed `master` → `main`
  to match GitHub's default and the `system.json`/README links), `origin`
  remote set to `https://github.com/SmokeRaven667/substratum-protocol.git`.
  History is split one branch per phase (`phase-0-rulebook-digest` →
  `phase-1-mvp-scope` → `phase-2-scaffolding`) so branches correlate to the
  numbered phases in this doc; `main` fast-forwards to the latest phase
  branch as phases complete. Nothing pushed to the remote yet.

**Phase 3 — done.** DataModel schemas in place:
- `module/helpers/config.mjs` — `SUBSTRATUM` constants: the 6-Skill list,
  normal die chain (`d4`-`d12`), the "Beyond the Horizon" sub-chain
  (`d0`/`d2`), Anomaly Influence tier thresholds, storage-unit slot count
  (3), Stress capacity defaults (Scientist 8, Team 4).
- `module/data/shared.mjs` — `skillsSchema()` helper (the 6-Skill
  max/current SchemaField block), reused by both actor types.
- `module/data/actor-scientist.mjs` — `ScientistData`: specialty, pronouns,
  stress {value, max}, skills. `prepareDerivedData()` computes
  `anomalyInfluence` (tier/label/skillPenalty) from current Stress — not a
  stored field, per the digest ("derived tier, not something a player
  sets").
- `module/data/actor-team.mjs` — `TeamData`: stress {value, max}, skills,
  `deaths` (0-3, team wipe tracking), `deepBreathUsed` (once-per-session
  flag, manually reset). No Anomaly Influence — explicitly doesn't apply to
  the Team.
- `module/data/item-gear.mjs` — `GearData`: description, dieRating,
  narrativeOnly (free items don't consume a storage slot), broken
  (d4 items break after use).
- `system.json` — added `documentTypes` (the v14 mechanism; confirmed via
  live docs fetch that `template.json` is not needed — `documentTypes` +
  `CONFIG.Actor/Item.dataModels` is the current approach, superseding the
  older template.json-only pattern).
- `module/substratum-protocol.mjs` — registers the three DataModels via
  `CONFIG.Actor.dataModels` / `CONFIG.Item.dataModels` in the init hook.
- `lang/en.json` — Skill labels, Anomaly Influence tier labels, and the
  `TYPES.Actor.*` / `TYPES.Item.*` keys Foundry uses to label sub-types in
  the Create dialogs.
- **Verified live**: reloaded the `substratum-protocol` test world, created
  one Actor of each type (Scientist, Team) and one Item (Gear) via the
  Create dialogs — correct type names offered, zero console errors on
  init or create.
- **Scoped out deliberately**: the shared, party-wide **Anomaly Skill**
  (Last Hypothesis endgame mechanic, d0-d20+ chain) doesn't cleanly belong
  to either actor type — non-solo games have multiple Scientists and no
  unifying Team actor to hold shared state on. It's also not part of the
  resolved MVP scope (core roll + basic equipment). Deferred rather than
  guessed; needs a real decision (world-scoped `game.settings`? a
  dedicated small actor/journal?) if/when the endgame mechanic gets built.
  No custom `documents/actor.mjs` / `documents/item.mjs` Document
  subclasses yet either — nothing needs overriding yet (no `getRollData()`
  etc.); add them in Phase 4 if the roll mechanic needs one.

Phase 4 (core roll mechanic) is next.

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

Resolved by user decision (2026-08-09):
- **Actor types**: two — `scientist` (PC) and `team` (solo-mode combined
  party). No NPC/monster actor type — bestiary stays as flavor
  text/journal content, not stat-bearing actors.
- **Card deck**: build on Foundry v13's native `Cards` document
  (deck/hand/pile) for the draw/discard/hand economy instead of a custom
  tracker. Needs a live-docs check on the `Cards`/`CardStack`/`Cardsv13`
  API shape when Phase 2/4 gets there — don't assume training-data API
  shape given CLAUDE.md's v13-drift warning.
- **Release scope**: public release intended. `system.json` needs a real
  license file, versioning discipline, and a public manifest URL
  (GitHub releases) in mind from the start; Phase 10 isn't just "personal
  cleanup."

## Next step

Phase 1 MVP scope is now effectively settled by the decisions above:
- Actor types: `scientist`, `team`.
- Item types: single `gear` type (die-rated storage-unit item, per the
  digest — no separate weapons/armor categories).
- Core roll mechanic + Foundry `Cards`-backed deck economy.
- No NPC actor type, no Active Effects, no compendium content for MVP.

Move to **Phase 2 — project scaffolding**: `system.json` manifest (id,
title, version, v13 compatibility, esmodules/styles/lang entries, `packs`
left empty for now), decide on a license file (public release), and set up
the local Foundry `Data/systems/` dev symlink so changes are testable live.
