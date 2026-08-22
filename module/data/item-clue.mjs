const fields = foundry.data.fields;

/**
 * DataModel for the `clue` Item type — an Anomaly Clue
 * (01-rulebook-digest.md p.113/115), gained on a STUDY Good outcome and
 * resolved via the UNDERSTAND Action. A narrative token, not gear: no die
 * rating, no Storage Unit slot. Picture/title are the Item's native
 * `img`/`name`, matching how GearData doesn't re-declare them either.
 */
export default class ClueData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      understood: new fields.BooleanField({ required: true, initial: false }),
      description: new fields.HTMLField({ required: false, blank: true, initial: '' })
    };
  }
}
