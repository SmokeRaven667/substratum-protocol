# Phase 1 — Define MVP Scope

## Intended

Decide what "playable" means for v1 — likely: one actor type (character),
core stat block, the primary roll mechanic + chat card, basic equipment as
items. Explicitly defer: NPC/monster sheets, active effects/automation,
compendium content, advancement automation, anything nice-to-have.

## What actually happened

Resolved directly by the Phase 0 digest, no user input needed:

- Core mechanic confirmed: two-Skill dice-pool sum compared against two
  drawn playing cards (Good/OK/Bad), plus a step-down die chain. No
  traditional attributes — just 6 Skills + Stress.
- Item taxonomy: storage-unit gear only, die-rated like Skills. The
  rulebook has no separate weapons/armor categories.
- No Active Effects/buffs system needed — Anomaly Influence is a derived
  tier off current Stress, not a stackable effects list.

Resolved by user decision (2026-08-09):

- **Actor types**: two — `scientist` (PC) and `team` (solo-mode combined
  party). No NPC/monster actor type — the bestiary is pure flavor text with
  zero numeric stats (confirmed from the digest), so it's a JournalEntry/
  flavor-Item concern, not a stat-bearing Actor, even post-MVP.
- **Card deck**: build on Foundry's native `Cards` document (deck/hand/
  pile) for the draw/discard/hand economy instead of a custom tracker.
  (Noted at the time as needing a live-docs check against v13's API shape —
  later corrected in Phase 2 to target v14 instead, so that check still
  needs to happen against the v14 `Cards` API when Phase 4 gets there.)
- **Release scope**: public release intended, not personal/private table
  use only. `system.json` needs a real license file, versioning discipline,
  and a public manifest URL (GitHub releases) in mind from the start.

Final MVP definition settled:

- Actor types: `scientist`, `team`.
- Item types: single `gear` type (die-rated storage-unit item).
- Core roll mechanic + Foundry `Cards`-backed deck economy.
- Explicitly out of scope for MVP: NPC actor type, Active Effects,
  compendium content.
