/**
 * Core resolution mechanic: the Skill Check (01-rulebook-digest.md).
 *
 * Roll the current die of two chosen Skills, sum them (+ Stress spend +
 * Anomaly Influence penalty), compare independently against 2 drawn cards,
 * step down whichever Skill die showed the higher face, and report
 * Good/OK/Bad. The card draw/discard side of this lives in cards.mjs.
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
 * Step a die up one notch, capped at the top of the normal chain (d12) —
 * used by Systems Upgrade, which only ever raises a Skill's *max* die and
 * never touches the Beyond Horizon sub-chain.
 */
export function stepUpDie(currentDie) {
  const ceilIndex = FULL_DIE_CHAIN.indexOf(SUBSTRATUM.dieChain.at(-1));
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
 * Which Skill steps down: whichever rolled die showed the higher face
 * value. Ties are the player's call (01-rulebook-digest.md) — resolved by
 * `tiebreakSkill` if given, else defaults to the first listed Skill.
 */
export function determineStepDownSkill(skillKeys, dieResults, tiebreakSkill) {
  const [key1, key2] = skillKeys;
  const result1 = dieResults[key1];
  const result2 = dieResults[key2];
  if (result1 === result2) return tiebreakSkill ?? key1;
  return result1 > result2 ? key1 : key2;
}

async function rollSkillDie(faces) {
  if (faces === 0) return { roll: null, result: 0 };
  const roll = await new Roll(`1d${faces}`).evaluate();
  return { roll, result: roll.total };
}

/**
 * Run a full Skill Check for `actor` using the two given Skill keys:
 * rolls both Skill dice (+ optional advantage/disadvantage reroll), draws
 * 2 cards into the actor's hand, resolves Good/OK/Bad, discards unbeaten
 * cards, steps down the winning die, applies any Stress spend, and posts
 * a chat card. Returns a summary object for callers that want it (e.g. a
 * future sheet listener).
 */
export async function rollSkillCheck({
  actor,
  skills,
  stressSpend = 0,
  bonus = 0,
  advantage = false,
  disadvantage = false,
  tiebreakSkill = null
}) {
  const [key1, key2] = skills;
  const dice = {};
  for (const key of [key1, key2]) {
    const currentDie = actor.system.skills[key].current;
    dice[key] = { die: currentDie, ...(await rollSkillDie(dieFaces(currentDie))) };
  }

  if ((advantage || disadvantage) && dice[key1].roll && dice[key2].roll) {
    const lower = dice[key1].result <= dice[key2].result ? key1 : key2;
    const higher = lower === key1 ? key2 : key1;
    let target = advantage ? lower : higher;
    if (dice[key1].result === dice[key2].result) target = tiebreakSkill ?? key1;

    const reroll = await rollSkillDie(dieFaces(dice[target].die));
    dice[target].original = dice[target].result;
    dice[target].roll = reroll.roll;
    dice[target].result = reroll.result;
  }

  const anomalyPenalty = actor.system.anomalyInfluence?.skillPenalty ?? 0;
  const boostBonus = actor.system.boostBonus ?? 0;
  const sum = dice[key1].result + dice[key2].result + stressSpend + bonus + boostBonus + anomalyPenalty;

  const { discard, hand, card1, card2 } = await drawSkillCheckCards(actor);
  const cards = [card1, card2];
  const { outcome, beaten } = resolveSkillCheck(sum, cards.map((c) => c.value));

  for (let i = 0; i < cards.length; i++) {
    if (!beaten[i]) await discardCard(hand, discard, cards[i]);
  }

  const dieResults = { [key1]: dice[key1].result, [key2]: dice[key2].result };
  const stepDownKey = determineStepDownSkill(skills, dieResults, tiebreakSkill);
  const beyondHorizon = actor.system.anomalyInfluence?.key === 'beyond';
  const fromDie = actor.system.skills[stepDownKey].current;
  const toDie = stepDownDie(fromDie, { beyondHorizon });

  const updateData = { [`system.skills.${stepDownKey}.current`]: toDie };
  if (stressSpend > 0) {
    updateData['system.stress.value'] = Math.min(
      actor.system.stress.max,
      actor.system.stress.value + stressSpend
    );
  }
  if (boostBonus > 0) updateData['system.boostBonus'] = 0;
  await actor.update(updateData);

  const rolls = [dice[key1].roll, dice[key2].roll].filter(Boolean);

  const { renderTemplate } = foundry.applications.handlebars;
  const content = await renderTemplate(
    'systems/substratum-protocol/templates/chat/skill-check.hbs',
    {
      actor,
      skills: skills.map((key) => ({
        key,
        label: SUBSTRATUM.skills[key].label,
        die: dice[key].die,
        result: dice[key].result,
        original: dice[key].original ?? null
      })),
      stressSpend,
      bonus,
      boostBonus,
      anomalyPenalty,
      sum,
      cards: cards.map((card, i) => ({ name: card.name, value: card.value, suit: card.suit, beaten: beaten[i] })),
      outcome,
      outcomeLabel: `SUBSTRATUM.Outcome${outcome.charAt(0).toUpperCase()}${outcome.slice(1)}`,
      stepDown: {
        skillLabel: SUBSTRATUM.skills[stepDownKey].label,
        from: fromDie,
        to: toDie
      }
    }
  );

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    rolls,
    content
  });

  return { outcome, sum, cards, beaten, stepDown: { skill: stepDownKey, from: fromDie, to: toDie } };
}
