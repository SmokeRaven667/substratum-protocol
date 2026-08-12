# Phase 9 — Content & Polish

## Intended

Compendium packs (starter items/NPCs), active effects/conditions if the
system uses them, styling pass, icons/art. Per the Phase 0 digest this
was already known to be narrower than the original template implies — no
Active Effects system and no NPC/monster actor type exist in the source
material. Scoped with the user down to three concrete pieces: a standard
card deck compendium pack, a starter gear compendium pack, and a styling/
icons pass on the Phase 5/6 sheets.

## What actually happened

- **Compendium build tooling.** Per `CLAUDE.md`, packs ship as LevelDB,
  not raw JSON. Added `package.json` + `@foundryvtt/foundryvtt-cli`
  (Foundry's official pack compiler) as a dev dependency, plus
  `scripts/build-packs.mjs` (`npm run build:packs`/`clean:packs`) that
  compiles every directory under `packs/_source/<name>/` into
  `packs/<name>/`. This is the system's first build step — deliberately
  scoped to pack compilation only, not a general bundler, consistent with
  Phase 2's "no build step needed for plain JS/Handlebars/CSS" decision.
- **Schema correctness via real Foundry output, not guessing.** Rather
  than hand-guess the `Cards`/`Card`/`Item` document envelope shape (the
  exact risk `CLAUDE.md` flags repeatedly), used the CLI's own
  `extractPack`/`unpack` against **real, already-created documents**:
  - The standard-deck pack source is the *actual* 52-card deck built by
    `cards.mjs` in the live world (from Phase 4 testing), pulled straight
    out of the world's own LevelDB (`Data/worlds/substratum-protocol/data/
    cards`) and cleaned of world-specific fields (per-user `ownership`,
    `_stats` timestamps/`lastModifiedBy`). The deck intentionally *keeps*
    its `flags.substratum-protocol.deck: true` marker, so a GM who drags
    this compendium's deck into their world gets it recognized directly
    by `cards.mjs`'s `findWorldStack()` instead of a duplicate being
    auto-created on first roll.
  - The starter-gear Item envelope shape (`_id`/`flags`/`effects: []`/
    `_stats`/`ownership`/`folder`/`sort`) was copied from an unpacked
    reference Item in an already-installed system's compendium (mausritter),
    then filled with our own confirmed `GearData` schema fields.
  - **Real bug caught by this process**: `compilePack` silently skips
    (no error, no log line) any source file missing a `_key` field —
    found at line 367 of the CLI's `package.mjs`. The deck source had one
    automatically (it came from a real exported document); the
    hand-authored gear items didn't, so the first compile produced an
    empty starter-gear pack with zero warnings. Fixed by adding
    `_key: "!items!<_id>"` to each item (confirmed pattern from the same
    reference Item). This is the same category of lesson as Phase 5's
    `selectOptions` bug: verify actual tool behavior, not just what a
    docs page or README claims it does.
  - Round-trip verified (`extractPack` the compiled output, diff against
    source) before trusting the build.
  - Compiled LevelDB output is **not committed** — `git add -A` failed
    outright on `packs/standard-deck/LOCK` (permission denied; the file
    was open by the running Foundry process), which surfaced that
    committing live LevelDB directories is fragile in general (lock
    files, binary diffs on every rebuild). Checked how `dnd5e` handles
    this: they gitignore `packs/*` except `packs/_source/` and compile
    packs as an explicit release step rather than committing the
    compiled output. Adopted the same pattern — `packs/*` is now
    gitignored (`!packs/_source/` carved back out), so
    `npm run build:packs` is a required step before packaging a release
    (captured in Phase 10's next-step note in `00-planning.md`), not a
    one-time thing already reflected in git.
- **`packs/_source/standard-deck/`**: one Cards `deck` document, 52
  embedded Cards, Ace(1)–King(13) × 4 suits, no jokers.
- **`packs/_source/starter-gear/`**: six pre-made gear items spanning the
  die chain (Multitool d10, Grapple Line d8, Field Radio d6, Trauma Kit
  d8, Anomaly Sensor d10, Signal Flare d4), each with flavor text fitting
  the setting.
- **`system.json`**: `packs` array now declares both (`name`, `label`,
  `system`, `path`, `type` — confirmed against
  `PackageCompendiumData`/real `dnd5e` examples rather than guessed).
- **Live-verified**: restarted Foundry (required for a `system.json`
  change, per Phase 2), confirmed via the server log that both
  `substratum-protocol.standard-deck` and `substratum-protocol.starter-gear`
  databases connected with zero errors during world launch, then the user
  visually confirmed both packs open with the right document counts (52
  cards, 6 items).
- **Icon choices for starter gear**: checked what our own system's items
  actually get with no custom `img` (`icons/svg/item-bag.svg` — confirmed
  by unpacking our own live world's `items` collection) before picking
  icons, so as not to "fix" something that was already Foundry's real
  default. Core's SVG icon set is thin on general sci-fi equipment, so
  only used a core icon where a genuine thematic fit existed (`anchor.svg`
  for Grapple Line, `heal.svg` for Trauma Kit, `eye.svg` for Anomaly
  Sensor, `sound.svg` for Field Radio, `light.svg` for Signal Flare);
  Multitool kept the honest default rather than force a bad match.
- **Styling/icons pass on the sheets**: tab nav icons (dice/suitcase) via
  the `ApplicationTab.icon` property (confirmed it exists on the same
  `_prepareTabs()` output used in Phase 5), icons on the Roll/Add Gear
  buttons, Anomaly Influence now color-coded per tier (green/amber/
  orange/red), an active-tab underline, skill-row hover highlight, and a
  die-rating badge style in the inventory list and item sheet. User
  confirmed the result looks good after reloading.

## Deferred, not built in this phase

- No NPC/monster compendium — confirmed out of scope again (Phase 0: the
  Bestiary is flavor text, not stat-bearing).
- No Active Effects/conditions compendium — confirmed out of scope again
  (Phase 0/3: Anomaly Influence is derived, not a stackable effects
  list).
- Custom artwork/icons — none were created; all icon choices this phase
  draw from Foundry's bundled core `icons/svg/` set. Real custom art is a
  distinct, larger undertaking than this phase's scope.
- A compendium `banner` image (optional `PackageCompendiumData` field,
  290×70px sidebar art) wasn't set for either pack — same "no custom art"
  reasoning.
