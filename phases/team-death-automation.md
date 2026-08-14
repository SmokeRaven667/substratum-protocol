# Team Death Automation

## Intended

Automate the Team's on-death consequence (01-rulebook-digest.md: hitting
max Stress means a member dies — step down one Team max Skill by 1, clear
Stress, wipe the Team after the 3rd death) — the item left open by
`phases/team-actor-sheet.md`, where `deaths` was just a plain tracked
field with no mechanical consequence behind it.

## What actually happened

- **Design question resolved with the user up front**: Stress can reach
  max either through a Skill Check's Stress spend or a plain manual edit
  to the Stress field, so an auto-fire-on-Stress-max hook risked
  misfiring on a manual correction and still needed a Skill choice from
  somewhere. Went with a manual **Record Death** control instead (Skill
  picker + button in the Team header, same pattern as Roll Skill Check)
  — the player/GM presses it once they've decided the death happened.
- **`module/helpers/team.mjs`** — pure computation
  (`computeSkillStepDown`, reusing `dice.mjs`'s `stepDownDie`/`dieFaces`)
  plus `applyMemberDeath(actor, memberKey, skillKey)`: steps the chosen
  Skill's max down one (floors d4; current follows down too if it was
  above the new max — this is the Team-death-specific mechanic, distinct
  from a normal Skill Check's current-only step-down, and is meant to be
  a permanent injury rather than a recoverable depletion), clears Stress
  to 0, marks the member dead, posts a chat card.
- **User follow-up added a Members-tab requirement mid-phase**: the
  physical Team Folio marks which of the 3 members has died, not just a
  count, so `TeamData.members` was restructured from plain free-text
  strings to a `{name, dead}` `SchemaField` per member, and each Members
  tab row got a "Dead" checkbox.
- **`deaths` made a *derived* value** (`TeamData#prepareDerivedData`,
  same pattern as `ScientistData#anomalyInfluence`) — computed as the
  count of members with `dead: true`, instead of a separately-stored
  counter incremented by two different code paths. This was a deliberate
  choice over manually keeping two numbers in sync: with derivation
  there's only one source of truth (each member's flag), so the button
  and the checkbox can't drift apart by construction. The header's
  Deaths display became read-only (`X / 3`), same treatment as
  Scientist's Anomaly Influence.
- **Record Death button**: `recordTeamDeath(actor, skillKey)` auto-picks
  the first living member (`pickUndeadMember`) and calls
  `applyMemberDeath`. No-ops if all 3 are already dead.
- **Manual Dead checkbox, round 1 (bug)**: initially just a plain
  document-bound field — toggling it flipped `dead` but didn't clear
  Stress. User caught this: "manually marking Member dead with checkbox
  does not clear stress the same way Record Death button does."
- **Manual Dead checkbox, round 2 (still incomplete)**: fixed to clear
  Stress via a `data-action` handler bundling the update, but still
  skipped the Skill step-down entirely — user asked for the checkbox to
  post "the same rich chat message" Record Death does, which meant it
  needed to produce the same full consequence, not just Stress. Extracted
  `applyMemberDeath` as the single shared path both the button and the
  checkbox funnel through — the checkbox reads whichever Skill is
  currently selected in the header's "Skill to Step Down" control
  (visible across all 3 tabs, so it's always available even from the
  Members tab) and calls the exact same function the button does.
  Unchecking (reviving a member) stays a plain flag flip — no consequence,
  no chat card, since reviving isn't a death.
- **User-reported "steps down all the way to d4" — investigated, not a
  bug.** `stepDownDie()` only steps one notch per call; the button and
  checkbox each call it exactly once per death. Root cause: the user had
  manually set a Skill's `current` higher than its `max` (an inconsistent
  state normal play can't produce — current only ever decreases via Skill
  Checks or resets to max via Deep Breath) before testing, so "current
  follows if needed" pulled current all the way down to match the newly-
  lowered max in one jump. Confirmed this matches the rulebook exactly —
  Team death permanently drops max (an injury), unlike a normal Skill
  Check which only touches current (a recoverable depletion) — and left
  the behavior as-is per the user's confirmation.
- **Not live-verified by the agent** (no browser connection this
  session, consistent with every phase since Phase 9) — verified
  interactively by the user across several rounds of back-and-forth
  bug reports during this phase itself, which is a stronger signal than
  a single pass would have been.

## Deferred, not built in this phase

- The sheet doesn't stop `current` from being set higher than `max` via
  the header dropdowns — the inconsistent state that caused the "steps
  all the way to d4" question above. Left alone since it only came up
  from manual testing edits, not normal play, and the user didn't ask
  for a constraint.
- Re-marking an already-dead member (uncheck then recheck) re-applies
  the full consequence again (another Skill step-down, Stress clear, and
  chat card) rather than being a no-op — flagged to the user as a
  possible gap during this phase but not confirmed as unwanted, so left
  unchanged. Worth revisiting if it causes confusion in actual play.
