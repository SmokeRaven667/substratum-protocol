# SUBSTRATUM PROTOCOL

### *A Foundry Virtual Tabletop System*

[![Foundry](https://img.shields.io/badge/foundry-v14-orange)](https://foundryvtt.com/)
[![Release](https://img.shields.io/github/v/release/SmokeRaven667/substratum-protocol?label=release)](https://github.com/SmokeRaven667/substratum-protocol/releases)
[![Code License](https://img.shields.io/badge/code%20license-MIT-blue)](LICENSE)

> `TRANSMISSION — FRACTURE OBSERVATORY RELAY`
> `SCIENTIST REGISTRATION CONFIRMED. EXOSUIT SYSTEMS NOMINAL.`
> `DEPTH SECTOR 00 — FRACTURE OPENING. DESCENT AUTHORIZED.`

An unofficial Foundry VTT system for **Substratum Protocol**, the
Solo+ Mystery TTRPG of apocalyptic descent and Anomaly investigation
published by [**Pandion Games**](https://pandiongames.com/). Built on
the step-down-dice, card-draw resolution of the Breathless/Firelights
lineage — low-prep, low-crunch, and designed to run solo.

This repository's code is unofficial fan work, provided under the MIT
License. Substratum Protocol's setting, rules text, and artwork remain
Licensed Material of Pandion Games under the ORC License — see
[`LICENSE`](LICENSE) for the exact split.

## What This System Covers

- **Scientist & Team sheets** — the lead Scientist (PC) and the
  Standard Solo mode's combined Team actor, each with Skills, Stress,
  Inventory, and Exosuit tabs.
- **Skill Check resolution** — roll two Skills (or substitute an
  unbroken item's die, or Overclock one to a d12) against two drawn
  cards, Good/OK/Bad, with the losing die stepping down automatically.
- **Stress & Anomaly Influence** — Stress-driven tiers with automatic
  Skill penalties, up through Beyond the Horizon.
- **Item substitution** — gear can stand in for a Skill's die on a
  Check, stepping down (or breaking outright, at d4) in the Skill's
  place.
- **Overclock & Deep Breath** — the d12 gamble and the Skill reset
  that refreshes it, including the Beyond-the-Horizon partial reset.
- **All 7 Exosuit abilities** — Repair & Heal, Boost Actions, 3D
  Printer, Radio the Fracture Observatory, Sensor Deployment,
  Flashback, and Systems Upgrade, each spending cards from a shared
  Cards-document hand/discard economy.
- **Team death automation** — Record Death and a per-member Dead
  checkbox both drive the same Skill step-down/Stress-clear
  consequence, with the Team wiped after the third death.
- **Compendium content** — a standard playing-card deck and starter
  gear, ready to drop into a world.
- **Full localization** — every user-facing string routed through
  `lang/en.json`.

## Skill Check Tiebreaks

A Skill Check rolls two dice (from your two chosen Skills, or a Skill
substituted with an item's die rating, or Overclock's d12) and steps down
whichever one showed the **higher** face. The rulebook leaves it to the
player when those two results tie; the sheet's roll panel has a Tiebreak
radio row for exactly that.

**If you roll a tie without picking a Tiebreak, Skill 1 (the first
dropdown) steps down by default.** This applies whether that first slot
is a plain Skill, an Overclocked Skill, or a Skill with an item
substituted in for it — in the item case, the item is what takes the
step-down (or breaks, if it was already at d4) on a defaulted tie, same
as it would if you'd explicitly picked it as the tiebreak. If you want a
specific outcome on a tie, pick a Tiebreak before rolling rather than
relying on the default.

## Known Limitations

- **Simplified Solo** — the rulebook's lighter solo-play variant (a
  single Skill Check per event, no two-card comparison, outcome tied
  directly to Stress-marking and Clue gain) is **not implemented**. This
  system only supports the standard two-Skill/two-card Check resolution,
  including the Standard Solo mode (lead Scientist + a combined Team
  actor). If your group wants to play Simplified Solo, you'll need to
  resolve those Checks by hand outside the system.

## Development

Official Foundry VTT docs referenced while building this system:

https://foundryvtt.com/article/intro-development/

https://foundryvtt.com/article/module-development/

https://foundryvtt.com/article/system-development/

https://foundryvtt.com/api/
