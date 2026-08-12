# Phase 10 — Packaging & Release

## Intended

Finalize `system.json` versioning/compatibility and decide distribution
(GitHub releases + manifest URL vs. private use only).

## What actually happened

- **Scope decided with the user first**: hold off on actually cutting a
  public GitHub Release (Team actor sheet, exosuit abilities, and
  Overclock/Deep Breath UI are all still unbuilt — see Deferred below),
  but still do the packaging plumbing now so it's ready whenever a
  release is wanted. Version bumped `0.1.0` → **0.2.0** (both
  `system.json` and `package.json`) — semver pre-1.0, honestly reflecting
  "real functionality, not yet feature-complete."
- **`scripts/build-release.mjs`** (`npm run build:release`, chains
  `build:packs` first): assembles the actual shippable file set —
  `system.json`, `LICENSE`, `module/`, `templates/`, `lang/`, `styles/`,
  and the *compiled* `packs/<name>/` directories (skipping
  `packs/_source/` and, within each compiled pack, LevelDB's runtime-only
  `LOCK`/`LOG`/`LOG.old` files) — into `system.zip` at the repo root.
  Everything else in the repo (docs, the rulebook PDF, `node_modules/`,
  `phases/`, dev tooling) is deliberately excluded.
- **Two real bugs hit while building this, both fixed**:
  1. `archiver`'s installed version (8.0.0) turned out to be a breaking
     rewrite from the API remembered/assumed — no more `archiver('zip',
     opts)` factory function; it's now `new ZipArchive(opts)` as a named
     export, confirmed by reading the installed package's actual source
     (`node_modules/archiver/lib/core.js`) rather than continuing to
     guess after the first `import archiver from 'archiver'` failed.
  2. Running `npm run build:packs` (needed before zipping) failed with a
     LevelDB `LOCK` error while Foundry was running — same root cause as
     the earlier Phase 9 LOCK issue, but now clearly understood: the
     repo's `packs/` directory *is* the live system's `packs/` directory
     (via the Phase 2 dev junction), so any pack rebuild genuinely
     conflicts with a running Foundry that has that system loaded. Not a
     bug to fix in code — just an operational requirement (close Foundry
     before rebuilding packs for release), documented here for future
     reference.
- **`.gitignore`**: `system.zip` added (build artifact, not committed).
- **Live-verified the actual zip, not just its file listing**: extracted
  `system.zip` into an independent `Data/systems/` folder (distinct from
  the dev junction) with a distinct manifest `id`, and let Foundry's own
  package scanner judge it — the strongest available verification short
  of a real end-user install. First attempt logged `Invalid system
  "substratum-protocol-test" detected in directory
  "substratum-protocol-release-test"` — briefly alarming, but turned out
  to be an artifact of the *test setup*, not the zip: Foundry requires
  the containing directory name to match the manifest's `id` (confirmed
  by comparing against two pre-existing, genuinely-stale system copies
  in the same log showing the identical error pattern — both are
  old/backup folders whose directory name doesn't match their `id`).
  Renamed the test folder to match its `id` and Foundry's scan came back
  completely clean on retry — no errors, no warnings, same as every
  other valid installed system. This confirms `system.zip`'s contents
  are structurally correct; the earlier "Invalid" was purely about how
  the test folder was named, not the package. (This is a non-issue for
  real users: Foundry's own "Install System" UI always names the folder
  from the manifest's `id` automatically when installing from a manifest
  URL — it only bit this manual verification method.)

## Deferred, not built in this phase

- **No GitHub Release cut.** Per the user's explicit call, this phase
  stops at "the packaging tooling exists and is verified," not "there's
  a public release." `system.json`'s `download`/`manifest` URLs still
  point at release paths (`v0.2.0`) that don't exist yet — the
  "No system manifest found" warning seen in every phase's live-testing
  log since Phase 2 will keep appearing until an actual release is cut.
- When a release *is* wanted: run `npm run build:release` (with Foundry
  closed), create a GitHub Release tagged `v0.2.0`, and attach both
  `system.zip` and a standalone `system.json` as release assets (the
  manifest URL resolves via `releases/latest/download/system.json`,
  which needs `system.json` uploaded as its own asset, not just present
  inside the zip).
- Team actor sheet, exosuit abilities (Repair & Heal, Boost Actions, 3D
  Printer, Radio the Fracture Observatory, Sensor Deployment, Flashback,
  Systems Upgrade), Overclock, and the Simplified Solo resolution
  variant — all still unbuilt, per every prior phase doc's deferred
  list. These are the actual reasons a public release was held off this
  phase, not a packaging concern.
