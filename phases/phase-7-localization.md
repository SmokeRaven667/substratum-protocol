# Phase 7 — Localization

## Intended

All sheet/template strings routed through `lang/en.json` from the start
(cheaper to do as-you-go than to retrofit).

## What actually happened

This phase was an **audit, not a build** — the convention of routing every
user-facing string through `game.i18n.localize()`/`format()` in JS and
`{{localize}}` in Handlebars had already been followed since Phase 4's
chat card, and continued through Phases 5 and 6. Audited rather than
assumed:

- Read every `.hbs` template (`templates/actor/*.hbs`, `templates/chat/
  skill-check.hbs`, `templates/item/gear-sheet.hbs`) line by line: no
  hardcoded English text in visible labels, titles, or placeholders — the
  only un-localized characters are pure punctuation/symbols (`/` between
  Stress value and max, `&rarr;` in the reroll display), which don't need
  translation.
- Grepped `module/**/*.mjs` for `ui.notifications`/`game.i18n` call sites
  and for any quoted Title Case strings outside comments — every
  user-facing string (`ui.notifications.warn`, default names like "New
  Gear", deck/discard/hand names) already goes through
  `game.i18n.localize()`/`format()`.
- Cross-checked every `SUBSTRATUM.*` key referenced via `localize`/
  `format` against the keys actually defined in `lang/en.json`: no
  missing keys. The only reference the static grep couldn't resolve is
  `helpers/dice.mjs`'s dynamically-built
  `` `SUBSTRATUM.Outcome${outcome...}` `` — manually confirmed all three
  concrete keys (`OutcomeGood`/`OutcomeOk`/`OutcomeBad`) exist and are
  correct.
- Checked `system.json`'s `documentTypes` against `lang/en.json`'s
  `TYPES` block: `Actor.scientist`/`Actor.team`/`Item.gear` all have
  matching labels for Foundry's create-document dialogs.
- Checked `styles/substratum-protocol.css` for CSS `content:` properties
  (a common place for accidentally-hardcoded UI text) — none present.

No files changed this phase.

## Deferred, not built in this phase

- Actual translation into any language other than English — `system.json`
  only lists `en` in `languages`; adding a second language was never in
  scope and isn't blocked by anything here (the key/value structure is
  already translation-ready).
