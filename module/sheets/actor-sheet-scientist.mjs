import { SUBSTRATUM } from '../helpers/config.mjs';
import { rollSkillCheck, deepBreath } from '../helpers/dice.mjs';
import { getActorHandCards } from '../helpers/cards.mjs';
import {
  repairAndHeal,
  boostActions,
  printItem,
  radioObservatory,
  radioObservatorySolo,
  sensorDeployment,
  flashback,
  systemsUpgrade
} from '../helpers/exosuit.mjs';

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
      editImage: ScientistSheet.#onEditImage,
      deepBreath: ScientistSheet.#onDeepBreath,
      repairHeal: ScientistSheet.#onRepairHeal,
      boostActions: ScientistSheet.#onBoostActions,
      printItem: ScientistSheet.#onPrintItem,
      radioObservatory: ScientistSheet.#onRadioObservatory,
      sensorDeployment: ScientistSheet.#onSensorDeployment,
      flashback: ScientistSheet.#onFlashback,
      systemsUpgrade: ScientistSheet.#onSystemsUpgrade
    }
  };

  static PARTS = {
    header: { template: 'systems/substratum-protocol/templates/actor/scientist-header.hbs' },
    tabs: { template: 'systems/substratum-protocol/templates/actor/tab-navigation.hbs' },
    skills: { template: 'systems/substratum-protocol/templates/actor/actor-skills.hbs' },
    inventory: { template: 'systems/substratum-protocol/templates/actor/actor-inventory.hbs' },
    exosuit: { template: 'systems/substratum-protocol/templates/actor/actor-exosuit.hbs' }
  };

  static TABS = {
    primary: {
      tabs: [
        { id: 'skills', label: 'SUBSTRATUM.TabSkills', icon: 'fas fa-dice' },
        { id: 'inventory', label: 'SUBSTRATUM.TabInventory', icon: 'fas fa-suitcase' },
        { id: 'exosuit', label: 'SUBSTRATUM.TabExosuit', icon: 'fas fa-user-astronaut' }
      ],
      initial: 'skills',
      labelPrefix: 'SUBSTRATUM'
    }
  };

  /** Last-picked roll Skills, kept across re-render (UI state, not actor data). */
  lastRollSkills = null;

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

    context.boostBonus = actor.system.boostBonus;
    context.overclockAvailable = actor.system.overclockAvailable;
    context.lastRollSkills = this.lastRollSkills;
    // Usable in place of a Skill on a Check (01-rulebook-digest.md p.98) —
    // narrative-only items aren't die-rated for mechanical use, and a
    // broken item obviously can't stand in for anything.
    context.usableItems = context.items
      .filter((item) => !item.system.narrativeOnly && !item.system.broken)
      .map((item) => ({ id: item.id, name: item.name, die: item.system.dieRating.current }));

    context.hand = await getActorHandCards(actor);
    const otherActors = game.actors.filter((a) => a.id !== actor.id && ['scientist', 'team'].includes(a.type));
    context.boostTargets = [
      { id: actor.id, name: game.i18n.format('SUBSTRATUM.ExosuitBoostSelf', { name: actor.name }) },
      ...otherActors.map((a) => ({ id: a.id, name: a.name }))
    ];

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
    const bonus = Number(panel.querySelector('[data-role="roll-bonus"]').value) || 0;
    const overclock1 = panel.querySelector('[data-role="roll-overclock-1"]').checked;
    const overclock2 = panel.querySelector('[data-role="roll-overclock-2"]').checked;
    const item1 = panel.querySelector('[data-role="roll-item-1"]').value || null;
    const item2 = panel.querySelector('[data-role="roll-item-2"]').value || null;
    const tiebreakChecked = panel.querySelector('[data-role="roll-tiebreak"]:checked');
    const tiebreakSkill =
      tiebreakChecked && [skill1, skill2].includes(tiebreakChecked.value) ? tiebreakChecked.value : null;
    return { skill1, skill2, advantageMode, stressSpend, bonus, overclock1, overclock2, item1, item2, tiebreakSkill };
  }

  #readSelectedCardIds() {
    return Array.from(this.element.querySelectorAll('[data-role="hand-card"]:checked')).map((el) => el.value);
  }

  #readSelectedCardSuits() {
    return Array.from(this.element.querySelectorAll('[data-role="hand-card"]:checked')).map((el) => el.dataset.suit);
  }

  static async #onRollSkillCheck(event, target) {
    const { skill1, skill2, advantageMode, stressSpend, bonus, overclock1, overclock2, item1, item2, tiebreakSkill } =
      this.#readRollControls(target);
    // A slot with an item substituted has its Skill picker locked (see
    // _onRender's #wireItemSubstitutionToggles) rather than required to
    // differ from the other slot's Skill — only the actual Skill-vs-Skill
    // case needs two distinct picks.
    if (skill1 === skill2 && !item1 && !item2) {
      ui.notifications.warn(game.i18n.localize('SUBSTRATUM.WarnPickTwoSkills'));
      return;
    }
    if (overclock1 && overclock2) {
      ui.notifications.warn(game.i18n.localize('SUBSTRATUM.WarnOverclockBothSkills'));
      return;
    }
    if ((overclock1 && item1) || (overclock2 && item2)) {
      ui.notifications.warn(game.i18n.localize('SUBSTRATUM.WarnItemOverclockConflict'));
      return;
    }
    const overclockSlot = overclock1 ? 0 : overclock2 ? 1 : null;
    if (overclockSlot !== null && !this.actor.system.overclockAvailable) {
      ui.notifications.warn(game.i18n.localize('SUBSTRATUM.WarnOverclockUnavailable'));
      return;
    }
    this.lastRollSkills = { skill1, skill2 };
    await rollSkillCheck({
      actor: this.actor,
      skills: [skill1, skill2],
      stressSpend,
      bonus,
      advantage: advantageMode === 'advantage',
      disadvantage: advantageMode === 'disadvantage',
      tiebreakSkill,
      overclockSlot,
      itemForSlot: [item1, item2]
    });
    await this.render();
  }

  /**
   * Enforce the "Use Item Instead" business rules live, not just on
   * submit: picking an item for a slot locks that slot's Skill picker
   * (its value no longer needs to differ from the other slot's — see the
   * itemForSlot doc on rollSkillCheck) and forces the *other* slot's item
   * picker back to "— Skill —" and locked, since only one slot can be
   * item-substituted per Check. Reverting either item picker to
   * "— Skill —" re-enables both the matching Skill picker and the other
   * item picker.
   */
  #wireItemSubstitutionToggles() {
    const panel = this.element.querySelector('.substratum-roll-controls');
    const skill1 = panel?.querySelector('[data-role="roll-skill-1"]');
    const skill2 = panel?.querySelector('[data-role="roll-skill-2"]');
    const item1 = panel?.querySelector('[data-role="roll-item-1"]');
    const item2 = panel?.querySelector('[data-role="roll-item-2"]');
    if (!skill1 || !skill2 || !item1 || !item2) return;

    item1.addEventListener('change', () => {
      skill1.disabled = !!item1.value;
      if (item1.value) item2.value = '';
      item2.disabled = !!item1.value;
    });
    item2.addEventListener('change', () => {
      skill2.disabled = !!item2.value;
      if (item2.value) item1.value = '';
      item1.disabled = !!item2.value;
    });
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    this.#wireItemSubstitutionToggles();
  }

  static async #onDeepBreath() {
    await deepBreath(this.actor);
    await this.render();
  }

  static async #onRepairHeal(event, target) {
    const cardIds = this.#readSelectedCardIds();
    if (cardIds.length !== 2) {
      ui.notifications.warn(game.i18n.localize('SUBSTRATUM.WarnPickTwoCards'));
      return;
    }
    const repairTarget = this.element.querySelector('[data-role="repair-target"]').value;
    await repairAndHeal(this.actor, { cardIds, target: repairTarget });
    await this.render();
  }

  static async #onBoostActions(event, target) {
    const cardIds = this.#readSelectedCardIds();
    const suits = new Set(this.#readSelectedCardSuits());
    if (cardIds.length < 2 || cardIds.length % 2 !== 0) {
      ui.notifications.warn(game.i18n.localize('SUBSTRATUM.WarnPickEvenCards'));
      return;
    }
    if (suits.size > 1) {
      ui.notifications.warn(game.i18n.localize('SUBSTRATUM.WarnPickSameSuit'));
      return;
    }
    const targetActorId = this.element.querySelector('[data-role="boost-target"]').value;
    await boostActions(this.actor, { cardIds, targetActorId });
    await this.render();
  }

  static async #onPrintItem(event, target) {
    const cardIds = this.#readSelectedCardIds();
    if (cardIds.length < 1) {
      ui.notifications.warn(game.i18n.localize('SUBSTRATUM.WarnPickAtLeastOneCard'));
      return;
    }
    await printItem(this.actor, { cardIds });
    await this.render();
  }

  static async #onRadioObservatory(event, target) {
    const solo = this.element.querySelector('[data-role="radio-solo"]').checked;
    if (solo) {
      await radioObservatorySolo(this.actor);
      await this.render();
      return;
    }
    const cardIds = this.#readSelectedCardIds();
    if (cardIds.length !== 1) {
      ui.notifications.warn(game.i18n.localize('SUBSTRATUM.WarnPickOneCard'));
      return;
    }
    await radioObservatory(this.actor, { cardId: cardIds[0] });
    await this.render();
  }

  static async #onSensorDeployment(event, target) {
    const cardIds = this.#readSelectedCardIds();
    if (cardIds.length !== 1) {
      ui.notifications.warn(game.i18n.localize('SUBSTRATUM.WarnPickOneCard'));
      return;
    }
    await sensorDeployment(this.actor, { cardId: cardIds[0] });
    await this.render();
  }

  static async #onFlashback(event, target) {
    const cardIds = this.#readSelectedCardIds();
    if (cardIds.length !== 1) {
      ui.notifications.warn(game.i18n.localize('SUBSTRATUM.WarnPickOneCard'));
      return;
    }
    await flashback(this.actor, { cardId: cardIds[0] });
    await this.render();
  }

  static async #onSystemsUpgrade(event, target) {
    const cardIds = this.#readSelectedCardIds();
    if (cardIds.length !== 8) {
      ui.notifications.warn(game.i18n.localize('SUBSTRATUM.WarnPickEightCards'));
      return;
    }
    const skillKey = this.element.querySelector('[data-role="upgrade-skill"]').value;
    await systemsUpgrade(this.actor, { cardIds, skillKey });
    await this.render();
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
