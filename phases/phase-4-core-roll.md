# Phase 4 — Core Roll Mechanic

## Intended

Implement the game's dice resolution as a reusable helper
(`helpers/dice.mjs`) producing a Foundry `Roll` and a chat card. Needs a
live-docs check on the v14 `Cards`/`CardStack` API shape before wiring up
the deck economy.

## What actually happened

- **Live-docs check done first**, per `CLAUDE.md`'s API-drift warning and
  the Phase 1/3 notes flagging this specifically. Fetched the v14 API
  reference (`foundryvtt.com/api/`, the URLs listed in `README.md`) rather
  than trusting a remembered shape. Confirmed:
  - `Cards` instance methods: `draw(from, number, {how, updateData})`,
    `deal(to[], number, options)`, `pass(to, ids, options)`,
    `shuffle(options)`, `recall()`, `reset()` — plus `*Dialog()` UI
    variants. `draw()` is called **on the destination** stack, pulling
    from a source stack passed as its first argument.
  - `CONST.CARD_DRAW_MODES`: `TOP`/`FIRST` = 0, `BOTTOM`/`LAST` = 1,
    `RANDOM` = 2.
  - `Card` (`BaseCard`) has built-in top-level `suit` (string) and `value`
    (number) fields — no need for a custom `system` schema on cards just
    to store rank/suit.
  - `recall()` on a **deck** reclaims every card that originated from it
    regardless of which stack currently holds it (hand, pile, wherever) —
    tracked via each Card's `origin` field. This matters: it's more
    aggressive than "reshuffle the discard pile," so it's only used as a
    second-stage fallback (see below), not the default low-deck behavior.
  - `foundry.applications.handlebars.renderTemplate(path, data)` is the
    v14-namespaced template renderer; its `localize` Handlebars helper
    supports hash-arg interpolation (`{{localize "KEY" foo=bar}}`), same
    as `Localization#format`.
  - Did **not** find a documented API for `CONFIG.Cards.presets`
    (`pokerDark`/`pokerLight`) beyond the preset picker in the "Create
    Cards Stack" UI dialog — no exposed method to load one programmatically
    into a Cards document at creation time. Rather than depend on that
    undocumented internal, the deck is built manually (see below), which
    also gives exact control over card `value` (Ace=1...King=13) and
    `suit`, both required by the rules for comparison and for the (not yet
    built) Boost Actions same-suit ability.
- **`module/helpers/cards.mjs`** — the Cards-document-backed deck economy:
  - `buildStandardDeckCards()`: pure builder for the 52 (no jokers) Card
    creation payloads, `value` 1–13, `suit` from `SUBSTRATUM.cardSuits`.
  - `ensureDeckEconomy()`: gets or creates the world-level shared "Draw
    Deck" (`type: 'deck'`) and "Discard Pile" (`type: 'pile'`) Cards
    documents. Found via a flag (`flags.substratum-protocol.deck === true`
    / `.discard === true`) rather than by name, so a GM renaming the stack
    doesn't break lookup.
  - `ensureActorHand(actor)`: gets or creates a per-actor personal hand
    (`type: 'hand'`), tagged with `flags.substratum-protocol.handOwner =
    actor.id`. Every scientist/team actor gets exactly one hand, created
    lazily on first roll.
  - `drawSkillCheckCards(actor)`: draws the 2 Skill Check cards **directly
    into the actor's hand** (`hand.draw(deck, 2, {how: RANDOM})`) rather
    than into a scratch stack. This sidesteps needing a temporary holding
    zone — per the rulebook, a beaten card is already supposed to end up
    in the player's hand, so drawing straight there means "beaten" cards
    need no further move; only unbeaten ones get passed out to discard
    after the outcome is known.
  - **Two-stage reshuffle**, matching the rulebook's actual wording rather
    than just calling `recall()` unconditionally: when the deck has fewer
    than 2 available cards, first fold the discard pile back in
    (`discard.pass(deck, ids)` + `shuffle()`); only if that's *still* not
    enough (deck + discard both empty, meaning every card is currently out
    in players' hands) fall back to `deck.recall()` (which reclaims from
    hands too) + `shuffle()`. Getting this right mattered — a naive
    `recall()`-always approach would strip players' already-won cards out
    of their hands just because the draw pile ran low, which isn't what
    the rule says.
- **`module/helpers/dice.mjs`** — the Skill Check itself:
  - Pure, unit-testable functions kept separate from the Foundry-coupled
    orchestration, per `CLAUDE.md`'s testing section: `dieFaces()`,
    `stepDownDie(currentDie, {beyondHorizon})` (floors at d4 normally; only
    steps into the `d2`/`d0` sub-chain when the actor's Anomaly Influence
    tier is `beyond`), `resolveSkillCheck(sum, cardValues)` (→
    Good/OK/Bad), `determineStepDownSkill(skillKeys, dieResults,
    tiebreakSkill)`.
  - `rollSkillCheck({actor, skills, stressSpend, advantage, disadvantage,
    tiebreakSkill})` orchestrates: rolls each chosen Skill's current die as
    its own separate `Roll` (a `d0` Skill contributes a fixed 0 with no
    actual roll, per the digest's "treat as cannot roll/auto-0"); applies
    advantage/disadvantage as a reroll of the lower/higher-valued die
    (skipped if either side has no real die to reroll, e.g. a `d0` Skill
    in the check); draws cards via `cards.mjs`; resolves the outcome;
    discards unbeaten cards; determines and applies the die step-down
    (compared on raw face value, ties broken by `tiebreakSkill` or
    defaulting to the first listed Skill — the rulebook makes this an
    explicit player choice that a headless function can't make on its own,
    so it's a parameter for the future sheet UI to supply); applies Stress
    spend to `system.stress.value` (clamped to max); posts a chat card.
  - Individual per-die `Roll`s (not one combined formula) are passed into
    `ChatMessage.create`'s `rolls` array, so each die still animates
    correctly (Dice So Nice-compatible) while the Stress/Anomaly modifiers
    and card comparison are computed in plain JS rather than folded into a
    single Roll formula string.
- **`templates/chat/skill-check.hbs`** + a chat-card CSS block in
  `styles/substratum-protocol.css`: shows both Skill dice (with
  strikethrough on a rerolled value), Stress/Anomaly modifiers, the sum,
  both drawn cards (unbeaten ones struck through), the Good/OK/Bad
  outcome, and the step-down line.
- `lang/en.json`: suit/rank labels, deck/discard/hand naming, outcome
  labels, modifier labels, and the `StepDown` interpolated string.
- **Verified live**: Chrome browser automation was unavailable again (same
  as Phase 3), so the user ran a console script against the already-running
  local Foundry instance (port 30000) directly:
  ```js
  let actor = game.actors.find(a => a.type === 'scientist') ?? await Actor.create({ name: 'Test Scientist', type: 'scientist' });
  const { rollSkillCheck } = await import('/systems/substratum-protocol/module/helpers/dice.mjs');
  const result = await rollSkillCheck({ actor, skills: ['make', 'break'] });
  console.log(result);
  ```
  First attempt hit `SUBSTRATUM.cardSuits is not iterable` — a stale
  browser-side ES module cache (the world tab had `config.mjs` imported at
  page load, before the `cardSuits`/`cardRanks` additions; editing the file
  on disk doesn't retroactively update an already-imported module in a live
  tab). A hard refresh of the world tab fixed it — this is a lighter-weight
  gotcha than Phase 2's "Foundry only scans `Data/systems` at boot" note:
  a full app restart is only needed for `system.json` changes, a page
  reload is enough for `.mjs`/template/CSS edits. Confirmed after refresh:
  no console errors, the chat card rendered correctly (both dice, drawn
  cards, outcome, step-down line), the Cards sidebar showed the Draw Deck
  (48 left), Discard Pile, and "Test Scientist's Hand" all present and
  correctly populated, and the console `result` object came back sane.

## Deferred, not built in this phase

- Exosuit abilities that *spend* hand cards (Repair & Heal, Boost Actions,
  3D Printer, Radio the Fracture Observatory, Sensor Deployment, Flashback,
  Systems Upgrade) — the digest notes these are "fixed sheet actions/macros,"
  which needs the character sheet (Phase 5) to have buttons to hang them
  off of. The deck economy they'll spend from (per-actor hand, shared
  discard) is already in place.
- Item (`gear`)-die substitution for a Skill on a Check — `rollSkillCheck`
  currently only reads `actor.system.skills[key].current`; wiring an item's
  `dieRating` in as an alternate "Skill" source is an item-sheet-adjacent
  concern for a later phase, not guessed at here.
- Overclock (substitute a d12, then possibly step down the Skill's *max*
  die) and the Simplified Solo single-Skill-Check variant — both distinct
  resolution paths from the two-Skill/two-card Check built here; left for
  whichever later phase actually wires up the actions that use them,
  rather than speculatively added now.
