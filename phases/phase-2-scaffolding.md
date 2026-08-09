# Phase 2 — Project Scaffolding

## Intended

`system.json` manifest (id, title, version, compatibility, esmodules,
styles, languages). Local dev loop: link this repo into a local Foundry
`Data/systems/` folder so changes are testable in a live world. Decide if
any build step is needed at all (plain JS/Handlebars/CSS may need none) vs.
just a CSS preprocessor if wanted.

## What actually happened

- `system.json` created: id `substratum-protocol`, MIT-licensed code,
  author SmokeRaven667, repo `https://github.com/SmokeRaven667/substratum-protocol`.
- `LICENSE` added: MIT for code; the rulebook's setting/adventure/artwork
  content stays under Pandion Games' ORC License separately (called out in
  both `LICENSE` and the `system.json` description so the split is clear to
  anyone browsing the repo).
- Directory skeleton laid down: `module/`, `styles/`, `lang/`,
  `templates/{actor,item,chat}/`, `packs/`.
- Minimal working stub committed: `module/substratum-protocol.mjs` (just a
  `Hooks.once('init')` console log), empty `styles/substratum-protocol.css`,
  minimal `lang/en.json`. No build step added — plain ESM/Handlebars/CSS
  needs none, per `CLAUDE.md`.
- **Local dev loop — verified working.** This took real troubleshooting:
  - The real Foundry user data directory turned out to be `C:\u\FoundryVTT`
    — *not* `C:\Users\smoke\AppData\Local\FoundryVTT`, which exists but is a
    stale/unused install. Wasted a symlink attempt there before finding the
    right path.
  - `Data\systems\substratum-protocol` is a **directory junction**
    (`mklink /J`), not a symlink. A plain symlink appeared to fail silently
    (no log entry at all) after one restart, so switched to a junction on
    the theory that Node's `fs.readdir` reports Windows directory-symlinks
    as `isSymbolicLink()`-only (not `isDirectory()`), which a naive
    directory-type filter would skip, while junctions report as real
    directories. **Caveat: inconclusive** — a restart right before the
    junction swap had actually let the symlink work too, so the true cause
    was never nailed down. Kept the junction anyway since it's tested
    working and is the theoretically safer choice either way.
  - Confirmed working end-to-end by creating a real test world
    (`Data\worlds\substratum-protocol`) bound to the system — it loaded
    `system.json` correctly (`systemVersion: "0.1.0"` recorded in
    `world.json`), and a log scan came back clean across three restarts
    (the only "Invalid system" errors present belonged to two unrelated,
    already-broken folders — not this system).
  - Learned the hard way: Foundry only scans `Data/systems` at **boot**,
    not live — after linking or changing that folder, the app process
    itself needs to be killed and relaunched, a setup-page refresh isn't
    enough.
  - **Foundry version decision (2026-08-09)**: the local instance runs
    **v14 Build 363**. Decided to target v14, not the originally-assumed
    v13 — `system.json`'s `compatibility` was set to
    `{minimum: "14", verified: "14.363"}`, and `CLAUDE.md`'s Stack section
    and API-drift warning were updated from v13 to v14 throughout so future
    phases build against the right API surface from the start. (This is
    why Phase 1's `Cards`-document note still says "v13" — that predates
    this correction.)
- Git set up: repo initialized (`git init`), default branch renamed
  `master` → `main` to match GitHub's default and the `system.json`/README
  links. `origin` remote set to
  `https://github.com/SmokeRaven667/substratum-protocol.git`. History
  split one branch per phase (`phase-0-rulebook-digest` →
  `phase-1-mvp-scope` → `phase-2-scaffolding`), each merged into `main` via
  a GitHub PR (`#1`, `#2`) so `main` fast-forwards as phases complete.
