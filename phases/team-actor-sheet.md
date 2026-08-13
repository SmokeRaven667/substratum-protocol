# Team Actor Sheet

## Intended

Build an `ApplicationV2`/`ActorSheetV2` sheet for the `team` Actor type
(Phase 3's `TeamData` has had no sheet since Phase 5 explicitly scoped it
out) — the picked-up item from `00-planning.md`'s "Next step" list.

## What actually happened

- **`module/sheets/actor-sheet-team.mjs`** — `TeamSheet`, structured the
  same way as `ScientistSheet`: header, Skills tab (roll controls wired to
  the existing `rollSkillCheck()`), Inventory tab (Team's 3-slot storage
  unit). `rollSkillCheck()` and the Cards-based deck economy
  (`helpers/cards.mjs`) were already written generically per-actor (no
  `scientist`-specific assumptions), so neither needed any changes to work
  for `team` actors.
- **Header differs from Scientist's**: no `specialty`/`pronouns`/Anomaly
  Influence (none of those apply to the Team per the rulebook digest).
  Instead: Stress (value/max, same as Scientist), Deaths (0-3, plain
  editable field — no automation of the death mechanic itself), and a
  Deep Breath Used checkbox (the Team's once-per-session flag from
  `TeamData`). Deliberately **not** built: automating "hitting max Stress
  = a member dies" (step down a max Skill, clear Stress, wipe at 3
  deaths) — left as a manual GM/player-tracked field for now, same
  treatment as the still-unbuilt Deep Breath/Overclock buttons on the
  Scientist sheet.
- **Reused, not duplicated, the Skills/Inventory tab templates.** Both
  `scientist-skills.hbs` and `scientist-inventory.hbs` turned out to
  already be fully actor-type-agnostic (no scientist-specific context
  needed) — renamed them to `actor-skills.hbs`/`actor-inventory.hbs` and
  pointed both `ScientistSheet` and `TeamSheet` at the same files instead
  of forking a copy that would drift. Same treatment for their CSS:
  generalized selectors from `.substratum-protocol.actor.scientist` to
  `.substratum-protocol.actor` for every rule that wasn't Anomaly-Influence-
  specific (those stayed scientist-scoped, since only the Scientist header
  has that markup).
- **Members tab added after initial review**, once the user pointed out
  the physical Team Folio has a roster section for the other 3 team
  members (`members.jpg`, cropped from the source rulebook) — the lead
  Scientist is Member 01 and is tracked as their own separate `scientist`
  actor, so the Team only needs 3 free-text slots (Member 02-04, each
  "Name, Pronouns, Scientific Specialty" as one line, not broken into
  separate fields). Added `TeamData.members` (`member2`/`member3`/
  `member4` `StringField`s) and a `team-members.hbs` tab, positioned
  leftmost and set as the default-open tab (`TABS.primary.initial`),
  ahead of Skills/Inventory.
- No shared base class introduced for `ScientistSheet`/`TeamSheet` despite
  ~90% code overlap (identical `_prepareContext`/`_preparePartContext`/
  action-handler logic, only `PARTS`/`TABS`/header content differ) —
  deliberately kept as two standalone classes, matching this codebase's
  existing precedent (no sheet base class exists yet). Foundry's
  `ApplicationV2` static-property inheritance-merge behavior
  (`DEFAULT_OPTIONS`/`PARTS`/`TABS` across a class hierarchy) wasn't
  something this session could live-verify (no browser connection), and
  Phase 5's own history is a direct warning against trusting an
  unverified API shape — safer to duplicate ~30 lines of already-proven
  code than introduce an unverified abstraction.
- **Live-verified by the user** in a running Foundry world (browser
  automation wasn't connected in this session, so this phase's
  implementation work was done blind and confirmed after the fact,
  unlike Phases 3-9 where the agent verified live directly): Team actor
  creation, sheet opens with all three tabs, Members/Skills/Inventory all
  render and save correctly. No bugs reported back.

## Deferred, not built in this phase

- **Team death automation** — `deaths` is a plain number field; stepping
  down a Team max Skill and clearing Stress on death still needs a
  human to do by hand.
- Deep Breath / Overclock buttons and the Simplified Solo resolution
  variant — unchanged from prior phases' deferred lists, still open
  items in `00-planning.md`.
