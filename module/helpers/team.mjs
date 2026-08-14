/**
 * The Team's on-death consequence (01-rulebook-digest.md): hitting max
 * Stress means a member dies — step down one Team max Skill by 1 (floor
 * d4, current follows down too if it was above the new max), clear all
 * Team Stress, and mark a member dead. `TeamData.deaths` is derived from
 * how many members are marked dead (see actor-team.mjs), so the Record
 * Death button and a manual per-member "Dead" checkbox toggle always stay
 * in sync — both funnel through `applyMemberDeath` below and post the same
 * chat card.
 */
import { SUBSTRATUM } from './config.mjs';
import { stepDownDie, dieFaces } from './dice.mjs';

const MEMBER_KEYS = ['member2', 'member3', 'member4'];

/** First Team member not yet marked dead, or null if all 3 already are. */
export function pickUndeadMember(system) {
  return MEMBER_KEYS.find((key) => !system.members[key].dead) ?? null;
}

/** Pure computation for the Skill step-down half of a Team death. */
export function computeSkillStepDown(system, skillKey) {
  const skill = system.skills[skillKey];
  const newMax = stepDownDie(skill.max);
  const newCurrent = dieFaces(skill.current) > dieFaces(newMax) ? newMax : skill.current;
  return { skillKey, fromMax: skill.max, newMax, fromCurrent: skill.current, newCurrent };
}

/**
 * Apply a specific Team member's death to `actor`: step the chosen Skill's
 * max down one, clear Stress, mark `memberKey` dead, and post a chat card.
 * The single place both death paths (button and checkbox) go through, so
 * they always produce the identical consequence and chat message.
 */
export async function applyMemberDeath(actor, memberKey, skillKey) {
  const stepDown = computeSkillStepDown(actor.system, skillKey);

  await actor.update({
    [`system.skills.${skillKey}.max`]: stepDown.newMax,
    [`system.skills.${skillKey}.current`]: stepDown.newCurrent,
    'system.stress.value': 0,
    [`system.members.${memberKey}.dead`]: true
  });

  const { renderTemplate } = foundry.applications.handlebars;
  const content = await renderTemplate('systems/substratum-protocol/templates/chat/team-death.hbs', {
    actor,
    skillLabel: SUBSTRATUM.skills[skillKey].label,
    fromMax: stepDown.fromMax,
    newMax: stepDown.newMax,
    deaths: actor.system.deaths,
    wiped: actor.system.deaths >= 3
  });

  await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content });

  return stepDown;
}

/**
 * Record Death button: auto-picks the next living member and applies their
 * death. No-ops if every member is already marked dead (Team already wiped).
 */
export async function recordTeamDeath(actor, skillKey) {
  const memberKey = pickUndeadMember(actor.system);
  if (!memberKey) return null;
  return applyMemberDeath(actor, memberKey, skillKey);
}
