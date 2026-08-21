import { SUBSTRATUM } from '../helpers/config.mjs';

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;

/** ApplicationV2 sheet for the `gear` Item type. */
export default class GearSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ['substratum-protocol', 'sheet', 'item', 'gear'],
    position: { width: 480, height: 420 },
    window: { resizable: true },
    form: { submitOnChange: true },
    actions: {
      editImage: GearSheet.#onEditImage
    }
  };

  static PARTS = {
    form: { template: 'systems/substratum-protocol/templates/item/gear-sheet.hbs' }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.item = this.item;
    context.system = this.item.system;
    context.isEditable = this.isEditable;
    context.dieChainOptions = Object.fromEntries(SUBSTRATUM.dieChain.map((die) => [die, die]));
    // The <prose-mirror> element renders whatever's given as its inner
    // content, not its `value` attribute (that's only the raw source used
    // while actively editing) — without pre-enriched HTML here, @UUID[...]
    // content links show as literal text instead of a clickable pill.
    const TextEditorImpl = foundry.applications.ux.TextEditor.implementation;
    context.descriptionHTML = await TextEditorImpl.enrichHTML(this.item.system.description, {
      relativeTo: this.item,
      secrets: this.item.isOwner
    });
    return context;
  }

  static #onEditImage() {
    const FilePickerImpl = foundry.applications.apps.FilePicker.implementation;
    new FilePickerImpl({
      type: 'image',
      current: this.item.img,
      callback: (path) => this.item.update({ img: path })
    }).render(true);
  }
}
