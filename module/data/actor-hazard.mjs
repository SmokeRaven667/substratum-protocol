const fields = foundry.data.fields;

/**
 * DataModel for the `hazard` Actor type: a simple environmental/narrative
 * token — image, title, and a description field — meant to be dragged
 * onto the canvas as-is. Deliberately has no card-deck participation (no
 * hand, no Skill Check involvement) and no other actor-level mechanics.
 */
export default class HazardData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      description: new fields.HTMLField({ required: false, blank: true, initial: '' })
    };
  }
}
