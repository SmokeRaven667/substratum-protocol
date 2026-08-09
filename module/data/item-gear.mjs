import { SUBSTRATUM } from '../helpers/config.mjs';

const fields = foundry.data.fields;

/**
 * DataModel for the `gear` Item type — the only item category the
 * rulebook defines (die-rated storage-unit gear; no separate weapons/armor).
 */
export default class GearData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      description: new fields.HTMLField({ required: false, blank: true, initial: '' }),
      dieRating: new fields.StringField({
        required: true,
        choices: SUBSTRATUM.dieChain,
        initial: 'd4'
      }),
      // Narrative-only items are free-form and don't consume a storage slot.
      narrativeOnly: new fields.BooleanField({ required: true, initial: false }),
      // An item used as a d4 item breaks after that use regardless of outcome.
      broken: new fields.BooleanField({ required: true, initial: false })
    };
  }
}
