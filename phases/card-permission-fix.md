# Card Stack Permission Fix

## Intended

Fix a real bug the user hit live: a Player (not the GM) clicked Roll on a
Skill Check and got a "lacks permission to delete Card" error.

### Root cause

`ensureDeckEconomy()`/`ensureActorHand()` (`module/helpers/cards.mjs`)
create the shared draw deck, shared discard pile, and each actor's
personal hand via `Cards.create({...})` with no `ownership` field. Per
Foundry's Document model, a world-level document created this way
defaults to `ownership.default: NONE` for every non-GM user. Drawing
cards (`hand.draw(deck, ...)`) and discarding
(`hand.pass(discard, [card.id])`) both update/delete embedded Card
documents on these stacks — embedded documents inherit permission from
their parent (confirmed against the live Foundry API docs and a relevant
core GitHub issue, not assumed), so a Player with `NONE` on the parent
stack can't do either, even for a Skill Check on their own owned actor.
GM testing never surfaced this because GMs bypass all permission checks
entirely.

## Fix

`module/helpers/cards.mjs`: all three `Cards.create()` calls (deck,
discard, each actor's hand) now pass
`ownership: { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER }`, so every
player gets Owner-level access from creation. Confirmed against the live
API reference that `OWNER` is value `3` and that embedded-document
deletion for *individual* cards (not a bulk `deleteAll`) is exactly the
kind of operation Owner-level permission is meant to allow — the
`deleteAll`-specific restriction some other Foundry bug reports describe
doesn't apply here, since `pass()`/`draw()` target explicit card IDs.

## Migration for the user's existing world

This fix only affects **newly created** deck/discard/hand stacks — it
can't retroactively change ownership on Cards documents this specific
world already created before the fix shipped (that's exactly what
triggered the bug report). Two ways to actually get the current world
un-stuck, either works:

1. **Fix ownership on the existing stacks directly** (GM-only): open the
   Cards sidebar tab, and for **"Substratum Draw Deck"**, **"Substratum
   Discard Pile"**, and every existing **"‹Actor Name›'s Hand"**,
   right-click → Configure Ownership (or the lock icon on the stack's own
   sheet) → set Default permission to **Owner**.
2. **Delete and let them regenerate**: delete those same 3+ Cards
   documents from the Cards sidebar (GM-only) — `ensureDeckEconomy()`/
   `ensureActorHand()` recreate them on the next Skill Check with the
   fixed ownership baked in. Loses whatever cards were currently held/
   discarded, which is a non-issue this early in testing.

## Progress

- **Fix — done, live-verified.** User applied the manual ownership fix to
  the existing world's Cards documents and confirmed a Player can now
  successfully roll a Skill Check without the permission error.

## Deferred / open questions

- No self-healing code path added (e.g. auto-upgrading ownership on an
  already-found stack) — updating a document's `ownership` field is
  itself GM-only, so a Player hitting the bug couldn't self-heal it
  anyway, and adding GM-only self-heal logic for a one-time historical
  migration wasn't worth the complexity versus just fixing it once via
  the Cards sidebar.
