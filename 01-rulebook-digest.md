# Substratum Protocol — Rulebook Digest (Phase 0)

Structured extraction from `848511358-Substratum-Protocol.pdf` (88 pages, via
`pdftotext -layout`). This is the reference for all data-model and mechanic
decisions in Phases 1+ — nothing below should need to be re-derived from the
PDF again; update this file if a later close-read finds something wrong.

Genre note: this is a **Breathless/Firelights-derived narrative TTRPG**
(Fari RPGs lineage — step-down dice + card-draw resolution), explicitly
solo-friendly ("Solo+ Mystery"), low-prep, low-crunch. It is NOT a
traditional attribute/HP/combat-stats game. Combat and monsters are resolved
entirely through the generic Action framework below — there is no separate
combat subsystem or monster stat block anywhere in the book.

## Core resolution: the Skill Check

Every risky action or formal Action (see below) is a **Skill Check**:

1. Pick the two Skills that apply (one is often fixed by the Action, the
   other chosen by the player).
2. Draw 2 cards from a standard 52-card deck (no jokers), shuffled.
3. Roll the *current* die of each of the two chosen Skills, sum the results.
4. Compare that sum to each drawn card's value independently
   (Ace=1 ... King=13).
5. Outcome:
   - **Good** — sum ≥ both cards.
   - **OK** — sum ≥ one card only. Complication.
   - **Bad** — sum ≥ neither card. Severe complication.
6. Collect every card you beat into your hand (spent later on exosuit
   abilities, see below).
7. **Always**, after the roll: step down the *current* die of whichever of
   the two rolled Skills showed the **higher face value** by one step
   (`d12→d10→d8→d6→d4`, floor d4 under normal play). On a tie between the
   two dice, the player chooses which one steps down.

Cards work as a shared, depleting/reshuffling resource: when the draw deck
runs out, shuffle the discard pile into a new deck; if there's nothing left
at all (draw + discard both empty because it's all in players' hands),
discard all held cards and reshuffle those into a new deck.

### Advantage / Disadvantage
Reroll the lowest of the two Skill dice (advantage) or the highest
(disadvantage). Comes from Flashbacks or MC narrative judgment.

## Skills

Six skills, no other attributes. Each has a **max die** and a **current
die** (current resets to max on a Deep Breath; steps down per the rule
above; can be pushed to d0 only under max Anomaly Influence — see below).

| Skill | Covers |
|---|---|
| MAKE  | trap, repair, build |
| BREAK | pummel, wreck, destroy |
| DASH  | run, jump, flee |
| EVADE | hide, shield, obscure |
| THINK | observe, hypothesize, analyze |
| SWAY  | charm, manipulate, intimidate |

Die step chain (both max and current live on this chain):
`d4 → d6 → d8 → d10 → d12` (d0 only reachable via max Anomaly Influence, see
below — treat as "cannot roll/auto-0" for that Skill).

## Stress

- A single pool per scientist (also doubles as "the exosuit's health" per
  the quick reference — there's no separate HP stat).
- Starts at capacity 8 (see chargen).
- Marking Stress is both a **voluntary spend** (mark N Stress to add +N to
  a roll's result) and a **forced consequence** of many Bad/OK Action
  outcomes.
- At max Stress, the scientist is **Vulnerable**: failing an AVOID or
  CONFRONT Action means suit failure or death.
- Cleared via the Repair & Heal exosuit ability, or a Good/OK TRAVEL
  Action.

### Anomaly Influence (tied directly to current Stress, not a separate track)
Effects stack as Stress rises — this is a derived/computed tier, not
something a player sets:

| Stress | Tier | Effect |
|---|---|---|
| 0–2 | Anomaly Resistant | none |
| 3–4 | Thrumming Whispers | once/Deep Breath: change one detail of a complication. **−1 to all Skill Checks.** |
| 5–7 | Fragile Laws | once/Deep Breath: change one aspect of an element/primordial force. **−1 to all Skill Checks** (stacks with above → −2 total). |
| 8+  | Beyond the Horizon | Deep Breath only restores Skills by 1 step (not full reset). Skills can be reduced to **d0** (`d4→d2→d0`, a special sub-chain only reachable here — note this deviates from the normal d4→d6→d8→d10→d12 chain). Auto-succeed UNDERSTAND. Always collect both cards on every Check (Good/OK/Bad still applies narratively). |

## Deep Breath / Overclock / Storage Unit

- **Deep Breath**: reset all current Skill dice to max. Can be taken any
  time, even mid-fight. MC introduces a new complication when taken. (At
  8+ Stress, only restores 1 step instead of a full reset.)
- **Overclock**: once per Deep Breath, substitute a d12 for one Skill's
  current die on a Check. If the outcome is OK or Bad, step down that
  Skill's **max** die by one step (not just current); if already at d4 max,
  mark 2 Stress instead.
- **Storage Unit**: 3 item slots (narrative-only items are free, don't
  consume a slot). Each item has a die rating like a Skill and can be used
  in place of any chosen Skill on a Check. Items step down the same way
  Skills do; an item used as a d4 item **breaks after that use** regardless
  of outcome. Repaired via Repair & Heal.

## Actions

Each Action has a fixed first Skill + a player-chosen second Skill.

| Action | Roll | Good | OK | Bad |
|---|---|---|---|---|
| **CONFRONT** | Break + Skill | success | succeed w/ complication | forced AVOID |
| **AVOID** | Evade + Skill | avoid danger | mark 1 Stress | mark 2 Stress |
| **CONVINCE** | Sway + Skill | success | hesitant help + complication | opposite/hostile reaction → CONFRONT or AVOID |
| **PREPARE** | Make + Skill | works as intended | flaw/delay complication | fails catastrophically → CONFRONT or AVOID |
| **STUDY** | Think + Skill | learn something + gain 1 Anomaly Clue | learn info with gaps (MC may twist later) | confusion + complication |
| **TRAVEL** | Dash + Skill | reach next sector, everyone clears 2 Stress + full Skill reset | arrive but hard, clear 1 Stress, complication on arrival | treacherous, mark 1 Stress, new complication |
| **UNDERSTAND** | Think + Skill | convert an Anomaly Clue into permanent Anomaly Knowledge (answer a Knowledge-table question) | close but not quite — Flashback + reroll, or mark 1 Stress if no card/2nd attempt | discard the clue, or mark 2 Stress to give it to someone else |

TRAVEL narrates a ~26-day montage to the next Depth Sector (see below).
UNDERSTAND can only be attempted once per scientist per Deep Breath, and
only when holding an unresolved Anomaly Clue.

## Exosuit abilities (spend collected cards)

Universal to every scientist — not per-character customization, so these
don't need to be Items; they're fixed sheet actions/macros.

| Ability | Cost | Effect |
|---|---|---|
| Repair & Heal | discard 2 cards | clear 1 Stress OR repair an item to max die |
| Boost Actions | discard 2 same-suit cards | +1 to any scientist's Check result; stacks per extra 2 cards |
| 3D Printer | lay down cards vs MC (up to hand max) | each won card = stronger item: 0 wins→d4+complication, 1→d6, 2→d8, 3→d10, 4→d12. Narrative-only items are free-form with MC. |
| Radio the Fracture Observatory | lay 1 card vs MC | win → real answer/conversation; lose → garbled fragment. **Solo:** roll 2d6 on a yes/no-with-modifier table instead. |
| Sensor Deployment | lay 1 card vs MC | your answer to MC's question becomes canon; win adds "and…", lose adds "but…" |
| Flashback | lay 1 card vs MC | win → describe flashback, advantage next Check; lose → negative flashback, disadvantage next Check |
| Systems Upgrade | discard 8 cards | clear all Stress, +1 Stress capacity, reset all Skills to max, +1 step to one Skill's max die (cap d12) |

"Lay down a card vs MC" = compare your played card to MC's top-decked card;
≥ wins; both go to discard regardless.

**Systems Upgrade is the only advancement mechanic in the game** — gated by
card economy, not XP/levels.

## Character creation (Scientist Registration)

1. Name + pronouns, freeform Scientific Specialty.
2. Stress capacity = 8.
3. Assign Skill dice: d10, d8, d6 to three Skills of choice; the other
   three start at d4 max.
4. Optional, chargen-only: trade −2 Stress capacity for +1 step to another
   Skill's max die.
5. Choose/invent one starting item at d10, placed in storage unit.
6. Answer 3 questions from each questionnaire (questionnaire text lives on
   the printed Personnel Folio pages, not extracted as body text by
   `pdftotext` — likely graphic/table content; re-check via page-image
   render if the actual question text is needed later).

## The Anomaly Skill & endgame (Last Hypothesis)

- A single **shared, party-wide** Skill, starting at **d0** — separate die
  chain from normal Skills: `d0 → d2 → d4 → d6 → d8 → d10 → d12 → d20 →
  (d20 + 1 per extra step beyond)`.
- Each piece of **Anomaly Knowledge** (converted from a Clue via
  UNDERSTAND) spent when formulating the Last Hypothesis increases this
  die one step.
- The Last Hypothesis can only be declared once, while in the Anomaly's
  sector; declaring it locks out gathering further Clues and starts the
  end-game montage.
- Resolution: draw 2 cards per player (or a pair for solo leader+team),
  pair them up freely, each pair = a Skill Check rolling the Anomaly Skill
  die (Stress/card modifiers still apply). Good/OK/Bad per Action-like
  table (Bad also permanently reduces the Anomaly Skill die by 1 for the
  rest of the sequence). If the party beats over half the cards
  collectively, the plan succeeds; otherwise it unravels dramatically.
  Fast-forward 6 months narration either way.

## Depth Sectors (dungeon-level progression, not character levels)

10 fixed sectors, each with an encounter table and narrative hooks (pages
53–73 of the PDF): Fracture Opening (0km) → Civilization Ruins (637km) →
Liquefying Crystals (1274km) → Super-Heated Lake (1991km) → Caustic Pools
(2548km) → Gravity Inversion Zone (3185km) → Alpha Particle Grove (3822km)
→ Barrier Event Horizon (4459km) → The Inner Core (5096km) → The Anomaly
(5734km). TRAVEL moves between adjacent sectors.

## Bestiary — important data-model implication

The Field Notes Bestiary (20 entries, rolled via d20) is **pure flavor
text with zero numeric stats** — no attack dice, no HP, no defense values.
Creatures exist to "cause complications to overcome," resolved through the
standard Action/Skill Check framework against the *scientist's* dice, not
through any creature-side roll. **This means an NPC/monster Actor type
with combat stats is not just deferred scope — it may not be needed at
all**, even post-MVP. A Bestiary entry is closer to a JournalEntry or a
flavor-text Item than a stat-bearing Actor. Confirm this read with the user
before building anything monster-shaped.

## Deadly Hazards (optional, grittier module)

Environmental hazard templates (Caustic Squalls, Foompatpatpat Nests,
Dense Radiation Pockets, Exosuit Tears, Catastrophic Survival) that tick
Stress/card loss/item step-down. Notably keyed to **real-world session
clock time** ("every 5 minutes of real time"), not in-fiction turns — an
automation-unfriendly mechanic; if automated at all, it'd need a
GM-triggered timer/macro rather than a data-driven rule.

## Solo play modes

**Standard solo** — player runs a lead Scientist (Personnel Folio) plus a
combined "Team" of the other 3 members (Team Folio):
- Team Skills: d12/d10/d8 on three of choice, rest d6 (higher baseline
  than a normal PC).
- Team has its own 3-slot storage unit but starts with no items.
- Team can Deep Breath only once per session.
- Team Stress capacity 4; Anomaly Influence does **not** apply to the Team.
- Team hitting max Stress = a member dies: step down one Team max Skill by
  1 (min d4, current follows if needed), clear all Team Stress. After the
  3rd death the Team is wiped and the player is alone.
- Before each roll, the solo player declares whether the lead Scientist or
  the Team is taking the Action.

**Simplified Solo** — even lighter: single standard character (no Team),
visit each sector once, roll/pick one event per sector, resolve with a
**single** Skill Check (no two-card comparison — just Good/OK/Bad tied
directly to Stress-marking and Clue gain). This mode replaces the
card-vs-two-Skills system entirely, so it's a distinct resolution path the
system may or may not need to support digitally.

## Open items still needing user/design decisions (not answerable from the PDF)

- **Actor types**: PC ("scientist") only, or also a "team" actor type for
  solo mode? (Bestiary confirmed NOT to need actor stats — see above.)
- **Card deck implementation**: Foundry v13 has a native `Cards` document
  type (decks/hands/piles) that maps almost exactly onto this game's
  draw/discard/hand economy — worth using instead of hand-rolling a card
  tracker. Needs a docs check when we get to Phase 2/4.
- Chargen questionnaire text (Personnel/Team Folio, pg. 74–81) wasn't
  extractable as text — only needed if the sheet is meant to surface those
  prompts verbatim; otherwise skip.
- Public release intended, or personal/private table use only?
