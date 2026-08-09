import { SUBSTRATUM } from '../helpers/config.mjs';
import { skillsSchema } from './shared.mjs';

const fields = foundry.data.fields;

/** DataModel for the `scientist` Actor type — the primary PC. */
export default class ScientistData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      specialty: new fields.StringField({ required: true, blank: true, initial: '' }),
      pronouns: new fields.StringField({ required: true, blank: true, initial: '' }),
      stress: new fields.SchemaField({
        value: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
        max: new fields.NumberField({
          required: true,
          integer: true,
          min: 1,
          initial: SUBSTRATUM.scientistDefaults.stressCapacity
        })
      }),
      skills: skillsSchema()
    };
  }

  /**
   * Anomaly Influence is a derived tier off current Stress (01-rulebook-digest.md),
   * not a value the player/GM sets directly.
   */
  prepareDerivedData() {
    const tier = SUBSTRATUM.anomalyInfluenceTiers.find(
      (t) => this.stress.value >= t.min && this.stress.value <= t.max
    );
    this.anomalyInfluence = {
      key: tier.key,
      label: tier.label,
      skillPenalty: tier.skillPenalty
    };
  }
}
