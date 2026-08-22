# Repair & Heal Target Validation

## Intended

Repair & Heal (01-rulebook-digest.md p.29-31, `module/helpers/exosuit.mjs`
`repairAndHeal()`) lets a player discard 2 cards to either clear 1 Stress
or repair a broken/stepped-down item back to its max die. Today the
`repair-target` dropdown (`templates/actor/actor-exosuit.hbs` line 25-28)
unconditionally lists a "Stress" option plus every gear item, with no
filtering — so a player can pick Stress when it's already 0, or pick an
item that's already at its max die, and the ability fires anyway for no
effect (silently wasting 2 real cards for nothing).

User's call, agreed: fix this in two layers, not just one —
1. **Filter the dropdown** so ineligible options (Stress at 0, items
   already at max die) don't show up to be picked in the first place —
   the primary UX fix.
2. **Also validate in the handler** (`repairAndHeal()` itself) so an
   invalid target is rejected regardless of whether it reached the
   function via the dropdown, a stale render, or any future caller —
   belt-and-suspenders, matching the existing pattern elsewhere in the
   sheet of validating in code even when the UI also constrains input
   (e.g. `#onRollSkillCheck`'s overclock/item-conflict checks in
   `actor-sheet-scientist.mjs`).

## Steps

1. **Filter the dropdown context** — `actor-sheet-scientist.mjs`
   `_prepareContext()`: build a `repairTargets` (or similar) list instead
   of feeding `context.items` directly — Stress included only if
   `actor.system.stress.value > 0`, each gear item included only if
   `item.system.dieRating.current !== item.system.dieRating.max` (this
   also naturally covers broken items, since a broken item's current die
   is below max). Update `actor-exosuit.hbs` to render from this new list.
2. **Handle the empty-list case** — if neither Stress nor any item
   qualifies, the dropdown/fieldset should make that visually clear
   (e.g. a disabled placeholder option or a "nothing to repair" message)
   rather than silently rendering an empty `<select>`.
3. **Validate in `repairAndHeal()`** (`module/helpers/exosuit.mjs`): before
   discarding cards, re-check the same eligibility rule server-side —
   `target === 'stress'` requires `actor.system.stress.value > 0`; an item
   target requires `item.system.dieRating.current !== item.system.dieRating.max`.
   On failure, warn (`ui.notifications.warn`, new `lang/en.json` key) and
   return without discarding the 2 cards — the cost must not be paid for
   an ability that can't do anything.
4. **Localization** — add the new warning key plus any "nothing to
   repair" placeholder text.
5. **Live verification** — in a running Foundry world: confirm Stress
   disappears from the dropdown at 0 Stress and reappears after taking
   damage; confirm an item disappears once repaired to max and reappears
   once it steps down again; confirm the ability can't be fired at all
   when nothing qualifies (or is properly blocked with cards NOT spent).

## Deferred / open questions

- None currently — this is a self-contained validation fix, no design
  ambiguity.
