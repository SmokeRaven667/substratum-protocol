/**
 * Exosuit abilities (01-rulebook-digest.md; 848511358-Substratum-Protocol.pdf
 * pp.29-31): fixed sheet actions, universal to every scientist (and, since
 * Team draws into its own hand the same way, every Team), that spend cards
 * collected from beaten Skill Check draws. Each function here assumes its
 * input (card count/suit) was already validated by the calling sheet — same
 * division of responsibility as `helpers/team.mjs` — applies the state
 * change, and posts a chat card via the shared `exosuit-action.hbs` template.
 */
import { SUBSTRATUM } from './config.mjs';
import { stepUpDie } from './dice.mjs';
import { ensureDeckEconomy, ensureActorHand, discardCard, layCardVsMC } from './cards.mjs';

async function postExosuitChat(actor, data, rolls = []) {
  const { renderTemplate } = foundry.applications.handlebars;
  const content = await renderTemplate('systems/substratum-protocol/templates/chat/exosuit-action.hbs', {
    actor,
    ...data
  });
  await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), rolls, content });
}

/** Move the given hand card ids to the shared discard pile. */
async function discardCards(actor, cardIds) {
  const { discard } = await ensureDeckEconomy();
  const hand = await ensureActorHand(actor);
  for (const id of cardIds) {
    const card = hand.cards.get(id);
    if (card) await discardCard(hand, discard, card);
  }
}

function cardSummary(card) {
  return { name: card.name, value: card.value, suit: card.suit };
}

/** Repair & Heal: discard 2 cards, either clear 1 Stress or repair an item to max die. */
export async function repairAndHeal(actor, { cardIds, target }) {
  await discardCards(actor, cardIds);

  let summary;
  if (target === 'stress') {
    await actor.update({ 'system.stress.value': Math.max(0, actor.system.stress.value - 1) });
    summary = game.i18n.localize('SUBSTRATUM.ExosuitRepairStress');
  } else {
    const item = actor.items.get(target);
    const maxDie = item.system.dieRating.max;
    await item.update({ 'system.dieRating.current': maxDie, 'system.broken': false });
    summary = game.i18n.format('SUBSTRATUM.ExosuitRepairItem', { name: item.name, die: maxDie });
  }

  await postExosuitChat(actor, { abilityLabel: 'SUBSTRATUM.ExosuitRepairHeal', summary });
  return { target, summary };
}

/**
 * Boost Actions: discard N same-suit cards to bank +N/2 on a (possibly
 * other) scientist's `system.boostBonus`. Not applied immediately — the
 * target's next Skill Check (`rollSkillCheck` in helpers/dice.mjs) reads
 * and consumes the banked value automatically.
 */
export async function boostActions(actor, { cardIds, targetActorId }) {
  await discardCards(actor, cardIds);
  const bonus = cardIds.length / 2;
  const target = game.actors.get(targetActorId) ?? actor;
  await target.update({ 'system.boostBonus': target.system.boostBonus + bonus });

  await postExosuitChat(actor, {
    abilityLabel: 'SUBSTRATUM.ExosuitBoostActions',
    summary: game.i18n.format('SUBSTRATUM.ExosuitBoostSummary', { target: target.name, bonus })
  });
  return { bonus, target };
}

/** 3D Printer: lay each selected card vs MC; wins determine the printed item's die rating. */
export async function printItem(actor, { cardIds }) {
  const comparisons = [];
  let wins = 0;
  for (const cardId of cardIds) {
    const { playedCard, mcCard, win } = await layCardVsMC(actor, cardId);
    if (win) wins++;
    comparisons.push({ played: cardSummary(playedCard), mc: cardSummary(mcCard), win });
  }

  const dieRating = SUBSTRATUM.dieChain[Math.min(wins, SUBSTRATUM.dieChain.length - 1)];
  const [item] = await actor.createEmbeddedDocuments('Item', [
    {
      name: game.i18n.localize('SUBSTRATUM.ExosuitPrintedItemName'),
      type: 'gear',
      system: { dieRating: { max: dieRating, current: dieRating } }
    }
  ]);

  await postExosuitChat(actor, {
    abilityLabel: 'SUBSTRATUM.Exosuit3DPrinter',
    comparisons,
    summary: game.i18n.format('SUBSTRATUM.ExosuitPrintSummary', { wins, die: dieRating }),
    complication: wins === 0
  });
  return { wins, dieRating, item };
}

/** Radio the Fracture Observatory (card-lay path): 1 card vs MC. */
export async function radioObservatory(actor, { cardId }) {
  const { playedCard, mcCard, win } = await layCardVsMC(actor, cardId);

  await postExosuitChat(actor, {
    abilityLabel: 'SUBSTRATUM.ExosuitRadio',
    comparisons: [{ played: cardSummary(playedCard), mc: cardSummary(mcCard), win }],
    summary: game.i18n.localize(win ? 'SUBSTRATUM.RadioWin' : 'SUBSTRATUM.RadioLose')
  });
  return { win };
}

/** Radio the Fracture Observatory (Solo path): 2d6 vs the yes/no oracle table. */
export async function radioObservatorySolo(actor) {
  const roll = await new Roll('2d6').evaluate();
  const tier = SUBSTRATUM.radioAnswerTable.find((t) => roll.total >= t.min && roll.total <= t.max);

  await postExosuitChat(
    actor,
    { abilityLabel: 'SUBSTRATUM.ExosuitRadio', tableRoll: roll.total, summary: game.i18n.localize(tier.label) },
    [roll]
  );
  return { total: roll.total, label: tier.label };
}

/** Sensor Deployment: 1 card vs MC; your stated answer becomes canon, with an "and"/"but" twist. */
export async function sensorDeployment(actor, { cardId }) {
  const { playedCard, mcCard, win } = await layCardVsMC(actor, cardId);

  await postExosuitChat(actor, {
    abilityLabel: 'SUBSTRATUM.ExosuitSensorDeployment',
    comparisons: [{ played: cardSummary(playedCard), mc: cardSummary(mcCard), win }],
    summary: game.i18n.localize(win ? 'SUBSTRATUM.SensorWin' : 'SUBSTRATUM.SensorLose')
  });
  return { win };
}

/** Flashback: 1 card vs MC; win grants advantage, lose imposes disadvantage on your next Check. */
export async function flashback(actor, { cardId }) {
  const { playedCard, mcCard, win } = await layCardVsMC(actor, cardId);

  await postExosuitChat(actor, {
    abilityLabel: 'SUBSTRATUM.ExosuitFlashback',
    comparisons: [{ played: cardSummary(playedCard), mc: cardSummary(mcCard), win }],
    summary: game.i18n.localize(win ? 'SUBSTRATUM.FlashbackWin' : 'SUBSTRATUM.FlashbackLose')
  });
  return { win };
}

/**
 * Systems Upgrade: discard 8 cards to clear all Stress, raise Stress
 * capacity by 1, reset every Skill's current die to its max, and step one
 * chosen Skill's max die up (cap d12). The only advancement mechanic in
 * the game.
 */
export async function systemsUpgrade(actor, { cardIds, skillKey }) {
  await discardCards(actor, cardIds);

  const newMax = stepUpDie(actor.system.skills[skillKey].max);
  const updateData = {
    'system.stress.value': 0,
    'system.stress.max': actor.system.stress.max + 1,
    [`system.skills.${skillKey}.max`]: newMax,
    [`system.skills.${skillKey}.current`]: newMax
  };
  for (const key of Object.keys(SUBSTRATUM.skills)) {
    if (key === skillKey) continue;
    updateData[`system.skills.${key}.current`] = actor.system.skills[key].max;
  }
  await actor.update(updateData);

  await postExosuitChat(actor, {
    abilityLabel: 'SUBSTRATUM.ExosuitSystemsUpgrade',
    summary: game.i18n.format('SUBSTRATUM.ExosuitUpgradeSummary', {
      skill: game.i18n.localize(SUBSTRATUM.skills[skillKey].label),
      max: newMax
    })
  });
  return updateData;
}
