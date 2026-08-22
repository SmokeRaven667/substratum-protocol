const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

/**
 * ApplicationV2 sheet for the `hazard` Actor type — image picker, title,
 * and description only. No tabs, no card-deck hooks: intentionally the
 * simplest actor sheet in the system.
 */
export default class HazardSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ['substratum-protocol', 'sheet', 'actor', 'hazard'],
    position: { width: 480, height: 420 },
    window: { resizable: true },
    form: { submitOnChange: true },
    actions: {
      editImage: HazardSheet.#onEditImage
    }
  };

  static PARTS = {
    form: { template: 'systems/substratum-protocol/templates/actor/hazard-sheet.hbs' }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const actor = this.actor;
    context.actor = actor;
    context.system = actor.system;
    context.isEditable = this.isEditable;
    // The <prose-mirror> element renders whatever's given as its inner
    // content, not its `value` attribute (that's only the raw source used
    // while actively editing) — see item-sheet-gear.mjs, same fix.
    const TextEditorImpl = foundry.applications.ux.TextEditor.implementation;
    context.descriptionHTML = await TextEditorImpl.enrichHTML(actor.system.description, {
      relativeTo: actor,
      secrets: actor.isOwner
    });
    return context;
  }

  static #onEditImage() {
    const FilePickerImpl = foundry.applications.apps.FilePicker.implementation;
    new FilePickerImpl({
      type: 'image',
      current: this.actor.img,
      callback: (path) => this.actor.update({ img: path })
    }).render(true);
  }
}
