import { SUBSTRATUM } from '../helpers/config.mjs';
import { skillsSchema } from './shared.mjs';

const fields = foundry.data.fields;

function memberSchema() {
  return new fields.SchemaField({
    name: new fields.StringField({ required: true, blank: true, initial: '' }),
    dead: new fields.BooleanField({ required: true, initial: false })
  });
}

/**
 * DataModel for the `team` Actor type — the combined party used in solo
 * play modes. Anomaly Influence does not apply to the Team (01-rulebook-digest.md),
 * so unlike ScientistData there's no derived Anomaly tier here.
 */
export default class TeamData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      stress: new fields.SchemaField({
        value: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
        max: new fields.NumberField({
          required: true,
          integer: true,
          min: 1,
          initial: SUBSTRATUM.teamDefaults.stressCapacity
        })
      }),
      skills: skillsSchema(),
      // Free-text roster for the other 3 Team members (Team Folio, source
      // rulebook) — the lead Scientist is Member 01 and is tracked as their
      // own `scientist` actor, not part of this list. Each member also
      // tracks whether they've died.
      members: new fields.SchemaField({
        member2: memberSchema(),
        member3: memberSchema(),
        member4: memberSchema()
      }),
      // The Team can Deep Breath only once per session — GM/player resets
      // this manually at session start.
      deepBreathUsed: new fields.BooleanField({ required: true, initial: false }),
      // Boost Actions (helpers/exosuit.mjs) banks a +N here when spent on
      // someone else (or oneself) rather than applying immediately; the
      // next Skill Check this actor rolls consumes it automatically.
      boostBonus: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 })
    };
  }

  /**
   * Deaths is derived from which members are marked dead, not a value set
   * directly — this keeps the manual per-member "Dead" checkbox and the
   * automatic Record Death button structurally in sync with no separate
   * counter to drift (01-rulebook-digest.md: Team hitting max Stress = a
   * member dies; after the 3rd, the Team is wiped).
   */
  prepareDerivedData() {
    const memberKeys = ['member2', 'member3', 'member4'];
    this.deaths = memberKeys.filter((key) => this.members[key].dead).length;
  }
}
