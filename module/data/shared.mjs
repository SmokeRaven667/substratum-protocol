import { SUBSTRATUM } from '../helpers/config.mjs';

const fields = foundry.data.fields;

/**
 * The six-Skill block shared by both actor types: each Skill tracks a max
 * die (chargen ceiling) and a current die (steps down per Skill Check,
 * resets on Deep Breath).
 */
export function skillsSchema() {
  const schema = {};
  for (const key of Object.keys(SUBSTRATUM.skills)) {
    schema[key] = new fields.SchemaField({
      max: new fields.StringField({
        required: true,
        choices: SUBSTRATUM.dieChain,
        initial: 'd4'
      }),
      current: new fields.StringField({
        required: true,
        choices: [...SUBSTRATUM.dieChainBeyondHorizon, ...SUBSTRATUM.dieChain],
        initial: 'd4'
      })
    });
  }
  return new fields.SchemaField(schema);
}
