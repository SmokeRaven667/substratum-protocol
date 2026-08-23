# Scientist Specialty Dropdown

## Intended

Turn the Scientist header's free-text Specialty field into a dropdown
constrained to a fixed, alphabetized list of scientific disciplines the
user supplied (not from the rulebook — a house list):

Aerologist, Anthropologist, Astrophysicist, Biologist, Chemist, Engineer,
Geochronologist, Geologist, Hydrologist, Linguist, Mathematician,
Microbiologist, Nanotechnologist, Physicist, Radiologist, Seismologist,
Survival Specialist, Thermologist, Xenobiologist, Zoologist.

(User's message listed them out of order but asked for alphabetical
order in the dropdown — sorted before implementing.)

## Steps / What actually happened

1. **Config** — `SUBSTRATUM.specialties` added to `module/helpers/config.mjs`
   as a plain array of the 20 raw display strings, already alphabetized.
   Deliberately **not** routed through `lang/en.json` per-entry (unlike
   `skills`/`actions`) — these are proper/technical nouns with no
   rulebook-mechanical text, so they follow `dieChain`'s pattern (raw
   values, no localization-key indirection) rather than
   `skills`/`actions`' pattern. This also matters for backward
   compatibility: using the same raw string as before as both the
   `<option>` value and label means any already-typed free-text Specialty
   that happens to match one of these 20 words keeps working unchanged.
2. **Sheet context** — `actor-sheet-scientist.mjs`: added
   `context.specialtyOptions = Object.fromEntries(SUBSTRATUM.specialties.map(s => [s, s]))`,
   matching the exact pattern `dieChainOptions` already uses (a plain
   array's *indices* would otherwise become the option values via
   `selectOptions`, not the strings themselves).
3. **Template** — `scientist-header.hbs`: replaced the `<input type="text">`
   with a `<select>` using
   `{{selectOptions specialtyOptions selected=system.specialty blank=(localize "SUBSTRATUM.SpecialtyNone")}}`
   — confirmed `selectOptions`'s `blank` parameter against the live v14
   API docs before using it (adds an empty-value placeholder option with
   the given label, rather than assuming the syntax).
4. **Localization** — added `SUBSTRATUM.SpecialtyNone: "— Specialty —"`,
   matching the existing `"— Skill —"` placeholder convention
   (`UseItemNone`).
5. **Data model left unconstrained on purpose** — `ScientistData`'s
   `specialty` field stays a plain `StringField` with no `choices`
   restriction added. Adding `choices` would make Foundry's schema
   validation reject/clean any already-set Specialty value that isn't
   exactly one of these 20 strings on the next data preparation —
   real risk of silently discarding an existing character's Specialty
   (this system has live-tested Scientist actors already). The
   `<select>` UI only lets new picks come from the list; an
   already-set custom value just won't match any `<option>` until the
   player explicitly picks one from the dropdown, which is non-destructive.

## Deferred / open questions

- If the user later wants schema-level enforcement too (rejecting any
  value outside the list, not just steering new picks via the UI), that's
  a small follow-up — but it should be a deliberate ask, not bundled in
  here, given the data-loss risk for whatever's already set on the user's
  live-tested Scientist actor.
