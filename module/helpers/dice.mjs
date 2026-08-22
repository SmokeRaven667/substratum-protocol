/**
 * Core resolution mechanic: the Skill Check (01-rulebook-digest.md).
 *
 * Roll the current die of two chosen Skills, sum them (+ Stress spend +
 * Anomaly Influence penalty), compare independently against 2 drawn cards,
 * step down whichever Skill die showed the higher face, and report
 * Good/OK/Bad. The card draw/discard side of this lives in cards.mjs. Also
 * covers the Skill-die mechanics that hang directly off a Skill Check —
 * Overclock (a d12 substitution) and Deep Breath (the Skill reset that
 * refreshes it).
 */
import { SUBSTRATUM } from './config.mjs';
import { drawSkillCheckCards, discardCard } from './cards.mjs';

const FULL_DIE_CHAIN = [...SUBSTRATUM.dieChainBeyondHorizon, ...SUBSTRATUM.dieChain];

/** 'd8' -> 8, 'd0' -> 0. */
export function dieFaces(dieKey) {
  return Number(dieKey.slice(1));
}

/**
 * Step a die down one notch. Floors at d4 under normal play; only the
 * "Beyond the Horizon" Anomaly Influence tier (8+ Stress) can push a Skill
 * on down through the d2/d0 sub-chain (01-rulebook-digest.md).
 */
export function stepDownDie(currentDie, { beyondHorizon = false } = {}) {
  const floorIndex = beyondHorizon ? 0 : FULL_DIE_CHAIN.indexOf('d4');
  const currentIndex = FULL_DIE_CHAIN.indexOf(currentDie);
  const nextIndex = Math.max(floorIndex, currentIndex - 1);
  return FULL_DIE_CHAIN[nextIndex];
}

/**
 * Step a die up one notch, capped at `ceiling` (defaults to the top of the
 * normal chain, d12 — Systems Upgrade's use, raising a Skill's *max* die).
 * Deep Breath's partial (Beyond the Horizon) restore passes the Skill's own
 * max as the ceiling instead, so current can't step past it.
 */
export function stepUpDie(currentDie, { ceiling = SUBSTRATUM.dieChain.at(-1) } = {}) {
  const ceilIndex = FULL_DIE_CHAIN.indexOf(ceiling);
  const currentIndex = FULL_DIE_CHAIN.indexOf(currentDie);
  const nextIndex = Math.min(ceilIndex, currentIndex + 1);
  return FULL_DIE_CHAIN[nextIndex];
}

/** Compare a Skill Check sum against 2 drawn card values. Pure/testable. */
export function resolveSkillCheck(sum, cardValues) {
  const beaten = cardValues.map((value) => sum >= value);
  const beatenCount = beaten.filter(Boolean).length;
  const outcome = beatenCount === 2 ? 'good' : beatenCount === 1 ? 'ok' : 'bad';
  return { outcome, beaten };
}

/**
 * Which rolled slot (0 or 1) steps down: whichever showed the higher
 * face. Ties are the player's call (01-rulebook-digest.md) — resolved by
 * matching `tiebreakSkill` against a slot's Skill, defaulting to slot 0
 * when ambiguous (both slots share the same Skill because one is
 * item-substituted — see `itemForSlot` on `rollSkillCheck`).
 */
export function determineStepDownSlot(dice, tiebreakSkill) {
  const [slot0, slot1] = dice;
  if (slot0.result !== slot1.result) return slot0.result > slot1.result ? 0 : 1;
  return tiebreakSkill && slot1.skillKey === tiebreakSkill && slot0.skillKey !== tiebreakSkill ? 1 : 0;
}

async function rollSkillDie(faces) {
  if (faces === 0) return { roll: null, result: 0 };
  const roll = await new Roll(`1d${faces}`).evaluate();
  return { roll, result: roll.total };
}

/**
 * Run a full Skill Check for `actor` using the two given Skill keys (as
 * `skills[0]`/`skills[1]` — "slot 0"/"slot 1" below): rolls both dice (+
 * optional advantage/disadvantage reroll), draws 2 cards into the actor's
 * hand, resolves Good/OK/Bad, discards unbeaten cards, steps down the
 * winning die, applies any Stress spend, and posts a chat card.
 *
 * `itemForSlot` (01-rulebook-digest.md p.98: `[itemId|null, itemId|null]`,
 * positional per slot) lets an unbroken, non-narrative-only gear item
 * stand in for that slot's Skill die — the item steps down instead of the
 * Skill if it's the slot that wins the step-down, breaking outright if it
 * was already at d4 rather than stepping further. `overclockSlot` (0 or 1)
 * is likewise positional, not keyed by Skill, since both let the caller
 * legitimately pick the *same* Skill for both slots (the sheet locks a
 * slot's Skill picker once that slot has an item substituted, which would
 * otherwise collide with the other slot's Skill) — tracking by slot index
 * throughout keeps that case from colliding internally.
 *
 * Returns a summary object for callers that want it (e.g. a future sheet
 * listener).
 */
export async function rollSkillCheck({
  actor,
  skills,
  stressSpend = 0,
  bonus = 0,
  advantage = false,
  disadvantage = false,
  tiebreakSkill = null,
  overclockSlot = null,
  itemForSlot = [null, null]
}) {
  const dice = [];
  for (let i = 0; i < 2; i++) {
    const skillKey = skills[i];
    const overclocked = i === overclockSlot;
    const item = itemForSlot[i] ? actor.items.get(itemForSlot[i]) : null;
    const currentDie = item ? item.system.dieRating.current : actor.system.skills[skillKey].current;
    const rollDie = overclocked ? SUBSTRATUM.dieChain.at(-1) : currentDie;
    dice.push({
      skillKey,
      itemId: item?.id ?? null,
      itemName: item?.name ?? null,
      overclocked,
      die: rollDie,
      ...(await rollSkillDie(dieFaces(rollDie)))
    });
  }

  if ((advantage || disadvantage) && dice[0].roll && dice[1].roll) {
    const lowerIdx = dice[0].result <= dice[1].result ? 0 : 1;
    const higherIdx = lowerIdx === 0 ? 1 : 0;
    let targetIdx = advantage ? lowerIdx : higherIdx;
    if (dice[0].result === dice[1].result) {
      targetIdx = tiebreakSkill && dice[1].skillKey === tiebreakSkill && dice[0].skillKey !== tiebreakSkill ? 1 : 0;
    }

    const reroll = await rollSkillDie(dieFaces(dice[targetIdx].die));
    dice[targetIdx].original = dice[targetIdx].result;
    dice[targetIdx].roll = reroll.roll;
    dice[targetIdx].result = reroll.result;
  }

  const anomalyPenalty = actor.system.anomalyInfluence?.skillPenalty ?? 0;
  const boostBonus = actor.system.boostBonus ?? 0;
  const sum = dice[0].result + dice[1].result + stressSpend + bonus + boostBonus + anomalyPenalty;
  const beyondHorizon = actor.system.anomalyInfluence?.key === 'beyond';

  const { discard, hand, card1, card2 } = await drawSkillCheckCards(actor);
  const cards = [card1, card2];
  const { outcome, beaten } = resolveSkillCheck(sum, cards.map((c) => c.value));

  // Beyond the Horizon (01-rulebook-digest.md p.86): "Always collect both
  // cards on every Check" — Good/OK/Bad still applies narratively, but
  // unbeaten cards are no longer discarded at this tier.
  for (let i = 0; i < cards.length; i++) {
    if (!beaten[i] && !beyondHorizon) await discardCard(hand, discard, cards[i]);
  }

  const stepDownIndex = determineStepDownSlot(dice, tiebreakSkill);
  const stepDownSlot = dice[stepDownIndex];

  // If the step-down slot was an item standing in for its Skill
  // (01-rulebook-digest.md p.98), the item takes the consequence instead
  // of the Skill: it steps down the same way, but breaks outright on use
  // rather than stepping past d4 (items have no Beyond Horizon sub-chain).
  const stepDownItem = stepDownSlot.itemId ? actor.items.get(stepDownSlot.itemId) : null;
  const fromDie = stepDownItem
    ? stepDownItem.system.dieRating.current
    : actor.system.skills[stepDownSlot.skillKey].current;
  const itemBreaks = stepDownItem && fromDie === 'd4';
  const toDie = itemBreaks ? fromDie : stepDownDie(fromDie, { beyondHorizon: stepDownItem ? false : beyondHorizon });

  const updateData = stepDownItem ? {} : { [`system.skills.${stepDownSlot.skillKey}.current`]: toDie };
  if (stressSpend > 0) {
    updateData['system.stress.value'] = Math.min(
      actor.system.stress.max,
      actor.system.stress.value + stressSpend
    );
  }
  if (boostBonus > 0) updateData['system.boostBonus'] = 0;

  // Overclock (01-rulebook-digest.md p.93): substituting a d12 costs the
  // banked use regardless of outcome; an OK/Bad result on top of that also
  // steps the overclocked Skill's *max* down one (current follows if the
  // normal step-down above already left it higher than the new max), or
  // marks 2 Stress instead if that max was already floored at d4.
  let overclock = null;
  if (overclockSlot !== null) {
    const overclockSkill = dice[overclockSlot].skillKey;
    overclock = { skillLabel: SUBSTRATUM.skills[overclockSkill].label };
    updateData['system.overclockAvailable'] = false;
    if (outcome !== 'good') {
      const overclockMax = actor.system.skills[overclockSkill].max;
      if (overclockMax === 'd4') {
        const stressAfterSpend = updateData['system.stress.value'] ?? actor.system.stress.value;
        updateData['system.stress.value'] = Math.min(actor.system.stress.max, stressAfterSpend + 2);
        overclock.stressMarked = 2;
      } else {
        const newMax = stepDownDie(overclockMax);
        const pendingCurrent =
          updateData[`system.skills.${overclockSkill}.current`] ?? actor.system.skills[overclockSkill].current;
        const newCurrent = dieFaces(pendingCurrent) > dieFaces(newMax) ? newMax : pendingCurrent;
        updateData[`system.skills.${overclockSkill}.max`] = newMax;
        updateData[`system.skills.${overclockSkill}.current`] = newCurrent;
        overclock.fromMax = overclockMax;
        overclock.newMax = newMax;
      }
    }
  }

  await actor.update(updateData);
  if (stepDownItem) {
    await stepDownItem.update(itemBreaks ? { 'system.broken': true } : { 'system.dieRating.current': toDie });
  }

  const rolls = [dice[0].roll, dice[1].roll].filter(Boolean);

  const { renderTemplate } = foundry.applications.handlebars;
  const content = await renderTemplate(
    'systems/substratum-protocol/templates/chat/skill-check.hbs',
    {
      actor,
      skills: dice.map((slot) => ({
        label: SUBSTRATUM.skills[slot.skillKey].label,
        itemName: slot.itemName,
        die: slot.die,
        result: slot.result,
        original: slot.original ?? null
      })),
      stressSpend,
      bonus,
      boostBonus,
      overclock,
      anomalyPenalty,
      sum,
      cards: cards.map((card, i) => ({ name: card.name, value: card.value, suit: card.suit, beaten: beaten[i] })),
      outcome,
      outcomeLabel: `SUBSTRATUM.Outcome${outcome.charAt(0).toUpperCase()}${outcome.slice(1)}`,
      stepDown: stepDownItem
        ? { itemName: stepDownItem.name, from: fromDie, to: toDie, broken: itemBreaks }
        : { skillLabel: SUBSTRATUM.skills[stepDownSlot.skillKey].label, from: fromDie, to: toDie }
    }
  );

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    rolls,
    content
  });

  return {
    outcome,
    sum,
    cards,
    beaten,
    stepDown: {
      skill: stepDownItem ? null : stepDownSlot.skillKey,
      item: stepDownItem?.id ?? null,
      from: fromDie,
      to: toDie,
      broken: itemBreaks
    },
    overclock
  };
}

/**
 * Deep Breath (01-rulebook-digest.md p.88): reset every Skill's current
 * die to its max, and refresh this actor's banked Overclock use. At 8+
 * Stress (Beyond the Horizon), only steps current up by 1 instead of a
 * full reset — Team never has an Anomaly Influence tier, so it always
 * gets the full reset. For a Team specifically, also flips the
 * once-per-session `deepBreathUsed` flag (p.212) — the sheet's own
 * checkbox stays there for the GM/player to manually reset at session
 * start, or override, but taking the action itself always marks it used.
 */
export async function deepBreath(actor) {
  const beyondHorizon = actor.system.anomalyInfluence?.key === 'beyond';
  const updateData = { 'system.overclockAvailable': true };
  if (actor.type === 'team') updateData['system.deepBreathUsed'] = true;
  const changes = [];
  for (const key of Object.keys(SUBSTRATUM.skills)) {
    const { max, current } = actor.system.skills[key];
    const newCurrent = beyondHorizon ? stepUpDie(current, { ceiling: max }) : max;
    if (newCurrent !== current) {
      updateData[`system.skills.${key}.current`] = newCurrent;
      changes.push({ skillLabel: SUBSTRATUM.skills[key].label, from: current, to: newCurrent });
    }
  }
  await actor.update(updateData);

  const { renderTemplate } = foundry.applications.handlebars;
  const content = await renderTemplate('systems/substratum-protocol/templates/chat/deep-breath.hbs', {
    actor,
    partial: beyondHorizon,
    changes
  });
  await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content });

  return { partial: beyondHorizon, changes };
}

/**
 * Auto-succeed UNDERSTAND (01-rulebook-digest.md p.86): at the "Beyond the
 * Horizon" Anomaly Influence tier (8+ Stress), the UNDERSTAND Action always
 * succeeds outright — no dice rolled, no cards drawn, no Skill die stepped
 * down. Just posts a dedicated chat card. Deliberately does not touch any
 * Clue item's Understood checkbox or otherwise auto-apply the Good outcome
 * (01-rulebook-digest.md p.115) — that stays a manual step for the player,
 * per explicit user decision.
 */
export async function autoSucceedUnderstand(actor) {
  const { renderTemplate } = foundry.applications.handlebars;
  const content = await renderTemplate('systems/substratum-protocol/templates/chat/understand-auto-success.hbs', {
    actor
  });
  await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content });
}
