# Phase 8 — Manual Playtest Pass

## Intended

Run a real session (or solo walkthrough) in a live Foundry world
exercising character creation, the core roll, and basic combat/inventory
flow. Fix what breaks.

## What actually happened

- Browser automation (Chrome extension) was available at the start of
  this phase but disconnected mid-session before driving any actual
  interaction — same intermittent unavailability noted in Phase 5. Rather
  than keep retrying, the user ran the playtest manually against the
  already-running local Foundry v14 world, following a script covering:
  1. **Character creation** — new `scientist` actor; name/pronouns/
     specialty; Skill dice assigned per the chargen rule (d10/d8/d6 to
     three chosen Skills, the other three left at the d4 default);
     Current dice matched to Max.
  2. **Inventory** — added a gear item, set its die rating to d10 (the
     chargen starting-item rule), confirmed it saved via the Phase 6
     item sheet.
  3. **Skill Check** — rolled via the sheet's roll controls; confirmed
     the chat card (both dice, drawn cards, Good/OK/Bad outcome,
     step-down line) and that the rolled Skill's Current die actually
     decreased on the sheet.
  4. **Stress / Anomaly Influence** — raised Stress to 5, confirmed the
     tier updated to "Fragile Laws" with a −2 penalty shown, then ran a
     second Skill Check and confirmed the penalty was actually applied
     to the displayed sum.
  5. **Inventory again** — edited the same gear item's die rating from
     its own sheet and confirmed it saved; deleted it and confirmed
     removal from the actor's list.
- **Result: everything worked.** No bugs found, no code changes needed
  this phase — this is the first pass exercising the whole system
  end-to-end (chargen → roll → Stress/Anomaly → inventory) rather than
  one layer at a time, and it held together.

## Deferred, not built in this phase

- Combat flow specifically wasn't exercised beyond the generic Skill
  Check, since (per `01-rulebook-digest.md`) Substratum Protocol has no
  separate combat subsystem — CONFRONT/AVOID Actions route through the
  same Skill Check already tested here, so this isn't considered a gap.
- Multi-actor/party play (the `team` actor type, which still has no
  registered sheet — open since Phase 5/6), the full chargen
  questionnaire step, and exosuit abilities that spend hand cards all
  remain untested/unbuilt, per the same deferrals noted in earlier phase
  docs.
