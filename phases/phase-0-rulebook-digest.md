# Phase 0 — Digest the Rulebook

## Intended

Extract the actual game mechanics from the PDF into a structured reference
to build against: core resolution mechanic (dice pool? d20? 2d6?),
attributes/skills, character creation rules, combat flow, equipment/item
categories, conditions/status effects, advancement/leveling, NPC/monster
stat structure. This drives every data model decision in later phases —
nothing should be guessed instead of pulled from this.

## What actually happened

- Blocker hit immediately: page-image rendering (`pdftoppm`, via the Read
  tool) wasn't visible to the running Claude Code process even after
  installing poppler and updating PATH — a fresh shell picks up the new
  PATH, but the already-running Node process doesn't. A full app restart
  would have been needed to use image rendering.
- Worked around it: extracted text directly via `pdftotext -layout` (also
  poppler, but reachable from Bash/PowerShell already) into the scratchpad
  and read that instead — no image rendering needed for rules text.
- Produced `01-rulebook-digest.md`: the structured reference now used
  instead of the PDF for all mechanic/data-model questions. Covers the core
  Skill Check mechanic, Stress/Anomaly Influence, the Actions table, exosuit
  abilities, character creation, the Anomaly Skill/endgame, Depth Sectors,
  the bestiary, solo play modes, and optional hazards.
- Determined the genre going in: a Breathless/Firelights-derived narrative
  TTRPG (Fari RPGs lineage — step-down dice + card-draw resolution),
  explicitly solo-friendly, low-prep, low-crunch. **Not** a traditional
  attribute/HP/combat-stats game — this shaped every later scoping
  decision, especially the call that monsters don't need a stat-bearing
  Actor type at all.
- Flagged open items that couldn't be resolved from the PDF text alone (fed
  into Phase 1's decisions): actor types, card deck implementation, and the
  Personnel/Team Folio questionnaire text (pages 74-81), which didn't
  extract as body text — likely graphic/table content, would need a
  page-image render to recover if ever needed verbatim.
