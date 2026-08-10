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
