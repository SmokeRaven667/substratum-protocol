/**
 * The Team's on-death consequence (01-rulebook-digest.md): hitting max
 * Stress means a member dies — step down one Team max Skill by 1 (floor
 * d4, current follows down too if it was above the new max), clear all
 * Team Stress, and mark the next living member dead. `TeamData.deaths` is
 * derived from how many members are marked dead (see actor-team.mjs), so
 * this and a manual per-member "Dead" checkbox toggle always stay in sync.
 */
import { SUBSTRATUM } from './config.mjs';
import { stepDownDie, dieFaces } from './dice.mjs';

const MEMBER_KEYS = ['member2', 'member3', 'member4'];

/** First Team member not yet marked dead, or null if all 3 already are. */
export function pickUndeadMember(system) {
  return MEMBER_KEYS.find((key) => !system.members[key].dead) ?? null;
}

/** Pure computation, decoupled from `actor`/`game` so it's independently testable. */
export function computeTeamDeath(system, skillKey) {
  const skill = system.skills[skillKey];
  const newMax = stepDownDie(skill.max);
  const newCurrent = dieFaces(skill.current) > dieFaces(newMax) ? newMax : skill.current;
  const memberKey = pickUndeadMember(system);
  return { skillKey, fromMax: skill.max, newMax, fromCurrent: skill.current, newCurrent, memberKey };
}

/**
 * Apply a Team death to `actor` and post a chat message announcing it.
 * No-ops if every member is already marked dead (Team already wiped).
 */
export async function recordTeamDeath(actor, skillKey) {
  const result = computeTeamDeath(actor.system, skillKey);
  if (!result.memberKey) return null;

  await actor.update({
    [`system.skills.${skillKey}.max`]: result.newMax,
    [`system.skills.${skillKey}.current`]: result.newCurrent,
    'system.stress.value': 0,
    [`system.members.${result.memberKey}.dead`]: true
  });

  const { renderTemplate } = foundry.applications.handlebars;
  const content = await renderTemplate('systems/substratum-protocol/templates/chat/team-death.hbs', {
    actor,
    skillLabel: SUBSTRATUM.skills[skillKey].label,
    fromMax: result.fromMax,
    newMax: result.newMax,
    deaths: actor.system.deaths,
    wiped: actor.system.deaths >= 3
  });

  await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content });

  return result;
}
