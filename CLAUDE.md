# Substratum Protocol — Foundry VTT System

This repository is a **Foundry VTT game system** implementing the tabletop RPG
"Substratum Protocol" (source rulebook: `848511358-Substratum-Protocol.pdf` in
the repo root — consult it for game mechanics, terminology, stats, and rules
text before implementing anything rules-related).

The codebase is currently greenfield (no source files exist yet beyond this
guide). Follow the conventions below when scaffolding and building it out.

## Reference docs

`README.md` lists the official Foundry VTT development docs (intro,
module-development, system-development, API reference). Foundry's APIs
change meaningfully between major versions — when implementing anything
where the exact v13 API shape matters (ApplicationV2 lifecycle methods,
DataModel field types, `system.json` schema fields, Hooks signatures),
fetch the relevant page from that list rather than relying on possibly
outdated training knowledge. Treat the live docs as authoritative over
assumptions.

## Stack

- **Language:** JavaScript (ESM), no TypeScript, no build-step type checking.
- **Target platform:** Foundry VTT **v13**. Use v13 APIs — `ApplicationV2`,
  `foundry.abstract.DataModel` / `TypeDataModel`, the `foundry.applications.*`
  and `foundry.documents.*` namespaces — not the deprecated v1 `Application`/
  `FormApplication` classes or legacy global shortcuts where a namespaced
  equivalent exists.
- **UI:** Handlebars templates via `HandlebarsApplicationMixin(ApplicationV2)`.
  No frontend framework (Svelte/Vue/React) — keep sheets as plain
  Handlebars + DOM.
- **Compendium packs:** built as LevelDB packs (Foundry's native pack format),
  not raw JSON, for anything shipped in `system.json`'s `packs` field.

## Repository layout (target)

```
system.json           # System manifest — id, version, compatibility, esmodules, styles, packs, languages
template.json          # Only if needed for legacy compat; prefer DataModel classes over this
module/
  substratum-protocol.mjs   # Entry point — registers Hooks.once('init', ...), document classes, sheets
  documents/
    actor.mjs             # Actor document subclass
    item.mjs               # Item document subclass
  data/
    actor-*.mjs            # DataModel schemas per actor type (foundry.data.fields)
    item-*.mjs              # DataModel schemas per item type
  sheets/
    actor-sheet.mjs         # ApplicationV2 + HandlebarsApplicationMixin sheets
    item-sheet.mjs
  helpers/
    dice.mjs                # Roll formula construction / chat card helpers
    config.mjs               # SUBSTRATUM.* constant config object (ability names, etc.)
templates/
  actor/                  # Handlebars partials for actor sheets
  item/
  chat/                    # Roll/chat card templates
lang/
  en.json                  # All user-facing strings — never hardcode text in templates or JS
styles/
  substratum-protocol.css (or .less/.scss if a preprocessor is added)
packs/                     # Compendium source (if using a build step to compile to LevelDB)
```

## Core conventions

- **No hardcoded UI strings.** Every user-facing string goes in `lang/en.json`
  and is referenced via `game.i18n.localize()` / `format()`, including in
  Handlebars templates (`{{localize "SUBSTRATUM.Key"}}`).
- **Data lives in DataModel schemas**, not ad-hoc object literals. Define
  actor/item types with `foundry.data.fields` (`SchemaField`, `NumberField`,
  `StringField`, etc.) and register them via `CONFIG.Actor.dataModels` /
  `CONFIG.Item.dataModels` in the init hook.
- **Register document/sheet classes in the `init` hook**, not `ready`. Use
  `Actor.registerSheet` / `Items.registerSheet` (or the DocumentSheetConfig
  v13 equivalent) to attach custom sheets, and unregister the core default
  sheet for this system.
- **No jQuery in new code.** ApplicationV2 passes plain `HTMLElement`s to
  render/action handlers — use native DOM APIs (`querySelector`,
  `addEventListener`) and ApplicationV2's declarative `actions` for click
  handlers instead of manual jQuery event binding.
- **Game constants** (ability score names, roll tables, condition lists, etc.
  pulled from the rulebook) belong in a single `SUBSTRATUM` config object in
  `module/helpers/config.mjs`, referenced everywhere instead of duplicated
  magic strings.
- **Rolls** go through Foundry's `Roll` class and produce chat messages via
  `ChatMessage.create` with a dedicated chat card template — don't hand-roll
  dice math outside of `Roll`.
- **Manifest hygiene:** keep `system.json`'s `compatibility.minimum` /
  `verified` fields accurate to the Foundry version actually tested, and bump
  `version` on every release-worthy change.

## Style

- Use `.mjs` extensions for ES modules (Foundry convention).
- Prefer small, per-document-type files over one giant monolith (one
  DataModel per actor/item type, one sheet class per type or shared base
  class with type-specific partials).
- JSDoc on exported classes/functions where the purpose isn't obvious from
  the name — skip it where it would just restate the signature.
- Match whatever ESLint/Prettier config gets added; if none exists yet,
  default to 2-space indent, semicolons, single quotes (matches Foundry core
  and most community systems).

## Testing

Foundry systems have no fully headless unit-test story for anything touching
Documents/Applications. Split logic accordingly:

- **Pure logic** (dice formula construction, modifier math, data
  transforms) — keep it in plain functions decoupled from `game`/`CONFIG`
  globals so it can be unit tested with a standard JS test runner (Vitest,
  once one is added).
- **Integration behavior** (sheets rendering, actor data prep, actual rolls)
  — verify manually in a running Foundry world, or via the **Quench** module
  if/when it's added as a dev dependency for in-Foundry test suites.

Do not claim a change "works" without either running it in a live Foundry
world or writing/running a test that actually exercises it — type-correct
JS is not the same as correct game behavior.
