import { SUBSTRATUM } from '../helpers/config.mjs';
import { rollSkillCheck } from '../helpers/dice.mjs';

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

/** ApplicationV2 sheet for the `scientist` Actor type. */
export default class ScientistSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ['substratum-protocol', 'sheet', 'actor', 'scientist'],
    position: { width: 620, height: 680 },
    window: { resizable: true },
    form: { submitOnChange: true },
    actions: {
      rollSkillCheck: ScientistSheet.#onRollSkillCheck,
      createItem: ScientistSheet.#onCreateItem,
      editItem: ScientistSheet.#onEditItem,
      deleteItem: ScientistSheet.#onDeleteItem,
      editImage: ScientistSheet.#onEditImage
    }
  };

  static PARTS = {
    header: { template: 'systems/substratum-protocol/templates/actor/scientist-header.hbs' },
    tabs: { template: 'systems/substratum-protocol/templates/actor/tab-navigation.hbs' },
    skills: { template: 'systems/substratum-protocol/templates/actor/scientist-skills.hbs' },
    inventory: { template: 'systems/substratum-protocol/templates/actor/scientist-inventory.hbs' }
  };

  static TABS = {
    primary: {
      tabs: [
        { id: 'skills', label: 'SUBSTRATUM.TabSkills', icon: 'fas fa-dice' },
        { id: 'inventory', label: 'SUBSTRATUM.TabInventory', icon: 'fas fa-suitcase' }
      ],
      initial: 'skills',
      labelPrefix: 'SUBSTRATUM'
    }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const actor = this.actor;

    context.actor = actor;
    context.system = actor.system;
    context.isEditable = this.isEditable;
    context.tabs = this._prepareTabs('primary');

    context.skills = Object.entries(SUBSTRATUM.skills).map(([key, { label }]) => ({
      key,
      label,
      max: actor.system.skills[key].max,
      current: actor.system.skills[key].current
    }));
    // selectOptions treats a plain array's *indices* as option values, so
    // build {die: die} dicts to get the die strings themselves submitted.
    context.dieChainOptions = Object.fromEntries(SUBSTRATUM.dieChain.map((die) => [die, die]));
    const fullDieChain = [...SUBSTRATUM.dieChainBeyondHorizon, ...SUBSTRATUM.dieChain];
    context.fullDieChainOptions = Object.fromEntries(fullDieChain.map((die) => [die, die]));

    context.items = actor.items.filter((item) => item.type === 'gear');
    context.storageSlotsUsed = context.items.filter((item) => !item.system.narrativeOnly).length;
    context.storageSlotsMax = SUBSTRATUM.storageUnitSlots;

    return context;
  }

  async _preparePartContext(partId, context, options) {
    context = await super._preparePartContext(partId, context, options);
    if (context.tabs[partId]) context.tab = context.tabs[partId];
    return context;
  }

  /** Read the ad-hoc (non-document-bound) roll controls out of the DOM. */
  #readRollControls(target) {
    const panel = target.closest('.substratum-roll-controls');
    const skill1 = panel.querySelector('[data-role="roll-skill-1"]').value;
    const skill2 = panel.querySelector('[data-role="roll-skill-2"]').value;
    const advantageMode = panel.querySelector('[data-role="roll-advantage"]').value;
    const stressSpend = Number(panel.querySelector('[data-role="roll-stress-spend"]').value) || 0;
    const tiebreakChecked = panel.querySelector('[data-role="roll-tiebreak"]:checked');
    const tiebreakSkill =
      tiebreakChecked && [skill1, skill2].includes(tiebreakChecked.value) ? tiebreakChecked.value : null;
    return { skill1, skill2, advantageMode, stressSpend, tiebreakSkill };
  }

  static async #onRollSkillCheck(event, target) {
    const { skill1, skill2, advantageMode, stressSpend, tiebreakSkill } = this.#readRollControls(target);
    if (skill1 === skill2) {
      ui.notifications.warn(game.i18n.localize('SUBSTRATUM.WarnPickTwoSkills'));
      return;
    }
    await rollSkillCheck({
      actor: this.actor,
      skills: [skill1, skill2],
      stressSpend,
      advantage: advantageMode === 'advantage',
      disadvantage: advantageMode === 'disadvantage',
      tiebreakSkill
    });
  }

  static async #onCreateItem() {
    await this.actor.createEmbeddedDocuments('Item', [
      { name: game.i18n.localize('SUBSTRATUM.NewGearName'), type: 'gear' }
    ]);
  }

  static async #onEditItem(event, target) {
    const itemId = target.closest('[data-item-id]')?.dataset.itemId;
    this.actor.items.get(itemId)?.sheet.render(true);
  }

  static async #onDeleteItem(event, target) {
    const itemId = target.closest('[data-item-id]')?.dataset.itemId;
    if (itemId) await this.actor.deleteEmbeddedDocuments('Item', [itemId]);
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
