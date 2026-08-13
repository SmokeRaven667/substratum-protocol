/**
 * The Team's on-death consequence (01-rulebook-digest.md): hitting max
 * Stress means a member dies — step down one Team max Skill by 1 (floor
 * d4, current follows down too if it was above the new max), clear all
 * Team Stress, and record the death (capped at 3 — the 3rd wipes the Team).
 */
import { SUBSTRATUM } from './config.mjs';
import { stepDownDie, dieFaces } from './dice.mjs';

/** Pure computation, decoupled from `actor`/`game` so it's independently testable. */
export function computeTeamDeath(system, skillKey) {
  const skill = system.skills[skillKey];
  const newMax = stepDownDie(skill.max);
  const newCurrent = dieFaces(skill.current) > dieFaces(newMax) ? newMax : skill.current;
  const deaths = Math.min(3, system.deaths + 1);
  return { skillKey, fromMax: skill.max, newMax, fromCurrent: skill.current, newCurrent, deaths };
}

/** Apply a Team death to `actor` and post a chat message announcing it. */
export async function recordTeamDeath(actor, skillKey) {
  const result = computeTeamDeath(actor.system, skillKey);

  await actor.update({
    [`system.skills.${skillKey}.max`]: result.newMax,
    [`system.skills.${skillKey}.current`]: result.newCurrent,
    'system.stress.value': 0,
    'system.deaths': result.deaths
  });

  const { renderTemplate } = foundry.applications.handlebars;
  const content = await renderTemplate('systems/substratum-protocol/templates/chat/team-death.hbs', {
    actor,
    skillLabel: SUBSTRATUM.skills[skillKey].label,
    fromMax: result.fromMax,
    newMax: result.newMax,
    deaths: result.deaths,
    wiped: result.deaths >= 3
  });

  await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content });

  return result;
}
