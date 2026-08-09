/**
 * Foundry v14 Cards-document-backed deck economy for the Skill Check
 * (01-rulebook-digest.md: shared 52-card deck, no jokers; drawn cards a
 * player beats stay in their hand for exosuit abilities, unbeaten cards go
 * to a shared discard pile; deck reshuffles when it runs low).
 *
 * API shape (draw/pass/shuffle/recall, CONST.CARD_DRAW_MODES, the Card
 * document's built-in `suit`/`value` fields) confirmed against the live
 * v14 API reference before writing this — see phases/phase-4-core-roll.md.
 */
import { SUBSTRATUM } from './config.mjs';

/** Build the 52 Card creation payloads for a fresh standard deck (no jokers). */
export function buildStandardDeckCards() {
  const cards = [];
  for (const suit of SUBSTRATUM.cardSuits) {
    for (const rank of SUBSTRATUM.cardRanks) {
      const name = `${game.i18n.localize(rank.label)} ${game.i18n.localize('SUBSTRATUM.OfSuit')} ${game.i18n.localize(suit.label)}`;
      cards.push({
        name,
        suit: suit.key,
        value: rank.value,
        faces: [{ name }],
        face: 0,
        back: { name: game.i18n.localize('SUBSTRATUM.SystemName') }
      });
    }
  }
  return cards;
}

function findWorldStack(flagKey) {
  return game.cards.find((stack) => stack.getFlag(SUBSTRATUM.cardFlagScope, flagKey) === true);
}

/** Get (or create) the shared world-level draw deck and discard pile. */
export async function ensureDeckEconomy() {
  let deck = findWorldStack('deck');
  if (!deck) {
    deck = await Cards.create({
      name: game.i18n.localize('SUBSTRATUM.DrawDeckName'),
      type: 'deck',
      cards: buildStandardDeckCards(),
      flags: { [SUBSTRATUM.cardFlagScope]: { deck: true } }
    });
  }

  let discard = findWorldStack('discard');
  if (!discard) {
    discard = await Cards.create({
      name: game.i18n.localize('SUBSTRATUM.DiscardPileName'),
      type: 'pile',
      flags: { [SUBSTRATUM.cardFlagScope]: { discard: true } }
    });
  }

  return { deck, discard };
}

/** Get (or create) the given actor's personal hand, used to hold beaten cards. */
export async function ensureActorHand(actor) {
  let hand = game.cards.find(
    (stack) => stack.getFlag(SUBSTRATUM.cardFlagScope, 'handOwner') === actor.id
  );
  if (!hand) {
    hand = await Cards.create({
      name: game.i18n.format('SUBSTRATUM.ActorHandName', { name: actor.name }),
      type: 'hand',
      flags: { [SUBSTRATUM.cardFlagScope]: { handOwner: actor.id } }
    });
  }
  return hand;
}

/**
 * Reshuffle in two stages, matching the rulebook: first fold the discard
 * pile back into the deck; only if that's still not enough (every card is
 * out in players' hands) reclaim from wherever the rest are via recall().
 */
async function ensureDrawable(deck, discard, needed) {
  if (deck.availableCards.length >= needed) return;

  if (discard.cards.size > 0) {
    await discard.pass(deck, discard.cards.map((c) => c.id));
    await deck.shuffle();
  }

  if (deck.availableCards.length >= needed) return;

  await deck.recall();
  await deck.shuffle();
}

/**
 * Draw the 2 cards for a Skill Check directly into the acting actor's hand.
 * Cards that end up not being beaten get moved to the discard pile by the
 * caller once the outcome is known (dice.mjs).
 */
export async function drawSkillCheckCards(actor) {
  const { deck, discard } = await ensureDeckEconomy();
  await ensureDrawable(deck, discard, 2);

  const hand = await ensureActorHand(actor);
  const [card1, card2] = await hand.draw(deck, 2, { how: CONST.CARD_DRAW_MODES.RANDOM });
  return { deck, discard, hand, card1, card2 };
}

/** Move a card that wasn't beaten from an actor's hand to the discard pile. */
export async function discardCard(hand, discard, card) {
  await hand.pass(discard, [card.id]);
}
