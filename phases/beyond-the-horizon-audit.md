# Beyond the Horizon Audit (Anomaly Influence 8+)

## Intended

Audit the "Beyond the Horizon" Anomaly Influence tier (8+ Stress,
01-rulebook-digest.md p.86) against the actual code, checking the three
rules the user flagged:

- Any Action collects **both** drawn cards regardless of outcome
  (Good/OK/Bad still applies narratively).
- A Skill's current die can be reduced all the way to **d0**
  (`d4→d2→d0`, a sub-chain only reachable at this tier).
- **Deep Breath only restores Skills by 1 step** at this tier, not a full
  reset.

Plus one more found while reading the same rules table
(01-rulebook-digest.md line 86) that isn't in the user's list but belongs
in the same audit: **Auto-succeed UNDERSTAND**.

### Findings from reading the code (pre-verification)

- **Card collection — real bug.** `rollSkillCheck()`
  (`module/helpers/dice.mjs`) discards any unbeaten card unconditionally:
  `if (!beaten[i]) await discardCard(...)`. There's no check for the
  `beyond` Anomaly Influence tier, so at 8+ Stress the actor still loses
  unbeaten cards instead of collecting both regardless of outcome.
- **d0 step-down — already correct.** `stepDownDie()` takes a
  `beyondHorizon` flag and floors at `d0` via
  `SUBSTRATUM.dieChainBeyondHorizon` (`['d0', 'd2']`) instead of `d4` when
  set; `rollSkillCheck()` passes `beyondHorizon = actor.system
  .anomalyInfluence?.key === 'beyond'` through correctly. Needs live
  confirmation, not a code fix.
- **Deep Breath partial restore — already correct.** `deepBreath()` checks
  the same `beyond` key and calls `stepUpDie(current, { ceiling: max })`
  (1 step) instead of jumping straight to `max` when set. Needs live
  confirmation, not a code fix.
- **Auto-succeed UNDERSTAND — missing entirely.** Nothing in
  `actor-sheet-scientist.mjs`, `dice.mjs`, or `config.mjs` special-cases
  the `understand` Action at the `beyond` tier. Today, clicking Use on
  UNDERSTAND always jumps to the Skills tab for a normal two-card Skill
  Check like every other Action, even at 8+ Stress.

## Steps

1. **Confirm findings live** — before touching code, push a scientist's
   Stress to 8+ in a running Foundry world, run a normal Skill Check, and
   confirm today's behavior actually discards unbeaten cards. Separately
   confirm current d0 step-down and Deep Breath's partial restore already
   behave correctly (per the code read above) — this step is verification
   only, not expected to produce code changes for those two.
2. **Fix card collection** — `module/helpers/dice.mjs`, in
   `rollSkillCheck()`: skip `discardCard` for unbeaten cards when
   `actor.system.anomalyInfluence?.key === 'beyond'` (both drawn cards stay
   in the actor's hand regardless of `beaten`). Good/OK/Bad still gets
   computed and shown on the chat card exactly as before — this only
   changes which cards end up discarded vs. kept.
3. **Implement Auto-succeed UNDERSTAND** — add a `beyond`-tier branch to
   the UNDERSTAND Use button. When the actor is at the `beyond` tier and
   the clicked Action is `understand`, skip the normal
   Skills-tab-roll-flow entirely (no cards drawn, no dice rolled) and post
   a dedicated auto-success chat card instead, reusing
   `SUBSTRATUM.ActionUnderstandGood` for the outcome text. Likely lands as
   a new branch in `#onUseAction` (`actor-sheet-scientist.mjs`) plus a
   small helper alongside `deepBreath()`/`rollSkillCheck()` in `dice.mjs`
   for the chat card, matching those functions' pattern (render a
   dedicated template, `ChatMessage.create`).
4. **Localization** — add any new `lang/en.json` keys the auto-succeed
   chat card needs (e.g. a "Beyond the Horizon" auto-success message
   distinct from the normal Good outcome line, since no roll happened).
5. **Live verification** — in a running Foundry world, at 8+ Stress:
   confirm unbeaten cards stay in the actor's hand after a Skill Check,
   and confirm clicking Use on UNDERSTAND auto-succeeds with a chat card
   and no roll.

## Deferred / open questions

- **Decided against**: UNDERSTAND's auto-success does **not** auto-flip a
  Clue's Understood checkbox. User explicitly ruled this out — the
  auto-success chat card stands alone with no side effect on any Clue
  item, now or after `phases/clue-items.md` lands. Do not revisit this
  without the user asking first.
