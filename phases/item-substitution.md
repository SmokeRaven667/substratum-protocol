# Item Substitution

## Intended

Build the last unbuilt piece of core Skill Check mechanics
(01-rulebook-digest.md p.98): an unbroken, non-narrative-only gear item
can stand in for either chosen Skill's die on a Check. Flagged as
deferred in every phase doc since Phase 4, and specifically caught by
the user asking "don't we have a way to do this?" after the item
max/current split (Exosuit Abilities phase) made it obviously buildable.

## What actually happened

- **Roll panel gained a "Use Item Instead" dropdown per Skill slot**,
  listing only items where `!narrativeOnly && !broken`. Picking one rolls
  that item's `dieRating.current` instead of the Skill's die for that
  slot. `rollSkillCheck()` gained `itemForSlot` alongside the existing
  `overclockSlot` — both positional (slot 0/1), not keyed by Skill.
- **Item takes the step-down consequence instead of the Skill** when its
  slot is the one that wins the step-down: steps down the same way a
  Skill would, but *breaks outright* if it was already at d4 rather than
  stepping past it (items have no Beyond Horizon sub-chain) — a
  `item.update()` alongside the actor's own update, not folded into it,
  since it's a different document.
- **Real bug found during user testing**: selecting an item for a slot
  still produced "Pick two different Skills before rolling" even though
  a real Skill was picked for the other slot. Root cause was more than
  cosmetic — `rollSkillCheck()`'s entire internal implementation indexed
  its working state (`dice`, `dieResults`, the update payload) *by Skill
  key*. Once a slot's Skill picker could legitimately show the same Skill
  as the other slot (which is exactly what "lock this slot's picker,
  it's item-substituted now" implies), two slots sharing a key would
  silently clobber each other's roll data — not just a validation
  false-positive, a real correctness bug waiting to happen. Fixed by
  restructuring the whole function around slot *position* (0/1) instead
  of Skill key: `dice` became an array, `determineStepDownSkill` became
  `determineStepDownSlot`, and `overclockSkill`/`itemForSkill` became
  `overclockSlot`/`itemForSlot`. Ties without an explicit Tiebreak default
  to slot 0, same behavior as before, just no longer ambiguous when both
  slots share a Skill.
- **Three live UI business rules added** per the user's explicit spec,
  wired via a `change` listener on the item dropdowns (`_onRender`
  override — confirmed the exact ApplicationV2 lifecycle hook name/
  signature against the live API docs rather than assume, per CLAUDE.md):
  1. Picking an item for a slot disables that slot's Skill picker.
  2. Only one slot can be item-substituted at a time — picking an item
     for one slot resets and disables the other slot's item picker.
  3. Reverting a slot's item picker to "— Skill —" re-enables both that
     slot's Skill picker and the other slot's item picker.
- **`README.md` gained two sections** from user follow-up questions
  during testing, not just this feature's own scope:
  - "Skill Check tiebreaks" — documents that an unresolved tie defaults
    to Skill 1 (slot 0), including the item-substitution interaction
    (the item takes the consequence on a defaulted tie the same as an
    explicit tiebreak pick would).
  - (Already present from the prior release: Simplified Solo's Known
    Limitations note.)

## Deferred, not built in this phase

- Nothing new surfaced. This closes the last item-related gap noted
  since Phase 4 (item-die-as-Skill-substitute); items still don't
  spontaneously step down outside of being used this way, which matches
  the rulebook (items only step down *through use*, same trigger as
  Skills).
