import { SUBSTRATUM } from '../helpers/config.mjs';
import { skillsSchema } from './shared.mjs';

const fields = foundry.data.fields;

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
      // Team hitting max Stress = a member dies; after the 3rd death the
      // Team is wiped.
      deaths: new fields.NumberField({ required: true, integer: true, min: 0, max: 3, initial: 0 }),
      // The Team can Deep Breath only once per session — GM/player resets
      // this manually at session start.
      deepBreathUsed: new fields.BooleanField({ required: true, initial: false })
    };
  }
}
