# First Release

## Intended

Actually cut the GitHub Release Phase 10 built the tooling for but
deliberately held off on — tag a version, publish `system.zip` and a
standalone `system.json` as release assets, and make the
`manifest`/`download` URLs already baked into `system.json` resolve to
something real for the first time.

## What actually happened

- **Version bumped `0.2.0` → `0.3.0`** (`system.json`, `package.json`).
  0.2.0 was set during Phase 10's packaging-plumbing-only pass, before
  the Team sheet, death automation, all 7 Exosuit abilities, and
  Overclock/Deep Breath existed — asked the user rather than guess,
  since a wrong version means a second release just to fix it. Landed on
  a minor bump (not `1.0.0`) to keep the established pre-1.0 convention:
  substantial real functionality, but no full end-to-end campaign played
  yet, only piecemeal per-phase manual verification.
- **`system.json`'s `download` URL updated** to point at the `v0.3.0`
  tag path; `manifest` was already tag-agnostic
  (`releases/latest/download/system.json`) so it didn't need a change.
- **Foundry was already closed** this session (confirmed via
  `Get-NetTCPConnection`/`Get-Process` before touching anything) so
  `npm run build:release` could rebuild the compendium packs without
  hitting the LevelDB `LOCK` conflict Phase 10 documented.
- **Verified the built `system.zip` directly** (no live Foundry
  reinstall this time, unlike Phase 10's — same confidence from
  unzipping and checking): embedded `system.json` reports `0.3.0` and
  the correct `v0.3.0` download URL, all 13 `.mjs` files present
  including `helpers/exosuit.mjs` and `helpers/team.mjs` (new since
  0.2.0), both compendium packs compiled clean, and no stray LevelDB
  `LOCK`/`LOG.old` runtime files leaked into the archive.
- **Merge/publish authority confirmed with the user up front**: every
  prior PR this session was merged by the user themselves after review;
  asked explicitly whether this one should follow the same path or
  whether the agent should merge and carry straight through to
  publishing the release. User chose the latter — agent merged this
  PR and published the release in the same pass.
- **Tagged `v0.3.0` and published the GitHub Release** with `system.zip`
  and a standalone `system.json` attached as release assets (the
  manifest URL needs `system.json` as its own asset, not just present
  inside the zip, per Phase 10's note).

## Deferred, not built in this phase

- **Simplified Solo** resolution variant remains unbuilt by explicit
  user decision — documented as a known limitation in `README.md`
  rather than being a gap in this release.
- No actual multi-session campaign has been played through this system
  end-to-end yet — every phase's verification has been manual,
  piecemeal exercise of one feature at a time (or, this session, direct
  user playtesting without the agent able to drive a browser). Worth
  keeping in mind before calling this `1.0.0`.
