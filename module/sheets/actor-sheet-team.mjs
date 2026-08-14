import { SUBSTRATUM } from '../helpers/config.mjs';
import { rollSkillCheck } from '../helpers/dice.mjs';
import { recordTeamDeath, applyMemberDeath } from '../helpers/team.mjs';
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

/** ApplicationV2 sheet for the `team` Actor type — the solo-mode combined party. */
export default class TeamSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ['substratum-protocol', 'sheet', 'actor', 'team'],
    position: { width: 620, height: 680 },
    window: { resizable: true },
    form: { submitOnChange: true },
    actions: {
      rollSkillCheck: TeamSheet.#onRollSkillCheck,
      recordDeath: TeamSheet.#onRecordDeath,
      toggleMemberDead: TeamSheet.#onToggleMemberDead,
      createItem: TeamSheet.#onCreateItem,
      editItem: TeamSheet.#onEditItem,
      deleteItem: TeamSheet.#onDeleteItem,
      editImage: TeamSheet.#onEditImage,
      repairHeal: TeamSheet.#onRepairHeal,
      boostActions: TeamSheet.#onBoostActions,
      printItem: TeamSheet.#onPrintItem,
      radioObservatory: TeamSheet.#onRadioObservatory,
      sensorDeployment: TeamSheet.#onSensorDeployment,
      flashback: TeamSheet.#onFlashback,
      systemsUpgrade: TeamSheet.#onSystemsUpgrade
    }
  };

  static PARTS = {
    header: { template: 'systems/substratum-protocol/templates/actor/team-header.hbs' },
    tabs: { template: 'systems/substratum-protocol/templates/actor/tab-navigation.hbs' },
    members: { template: 'systems/substratum-protocol/templates/actor/team-members.hbs' },
    skills: { template: 'systems/substratum-protocol/templates/actor/actor-skills.hbs' },
    inventory: { template: 'systems/substratum-protocol/templates/actor/actor-inventory.hbs' },
    exosuit: { template: 'systems/substratum-protocol/templates/actor/actor-exosuit.hbs' }
  };

  static TABS = {
    primary: {
      tabs: [
        { id: 'members', label: 'SUBSTRATUM.TabMembers', icon: 'fas fa-users' },
        { id: 'skills', label: 'SUBSTRATUM.TabSkills', icon: 'fas fa-dice' },
        { id: 'inventory', label: 'SUBSTRATUM.TabInventory', icon: 'fas fa-suitcase' },
        { id: 'exosuit', label: 'SUBSTRATUM.TabExosuit', icon: 'fas fa-user-astronaut' }
      ],
      initial: 'members',
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

    context.members = ['member2', 'member3', 'member4'].map((key, index) => ({
      key,
      labelKey: `SUBSTRATUM.Member${index + 2}Label`,
      name: actor.system.members[key].name,
      dead: actor.system.members[key].dead
    }));

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

    context.teamWiped = actor.system.deaths >= 3;

    context.boostBonus = actor.system.boostBonus;
    context.lastRollSkills = this.lastRollSkills;

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
    const tiebreakChecked = panel.querySelector('[data-role="roll-tiebreak"]:checked');
    const tiebreakSkill =
      tiebreakChecked && [skill1, skill2].includes(tiebreakChecked.value) ? tiebreakChecked.value : null;
    return { skill1, skill2, advantageMode, stressSpend, bonus, tiebreakSkill };
  }

  #readSelectedCardIds() {
    return Array.from(this.element.querySelectorAll('[data-role="hand-card"]:checked')).map((el) => el.value);
  }

  #readSelectedCardSuits() {
    return Array.from(this.element.querySelectorAll('[data-role="hand-card"]:checked')).map((el) => el.dataset.suit);
  }

  static async #onRollSkillCheck(event, target) {
    const { skill1, skill2, advantageMode, stressSpend, bonus, tiebreakSkill } = this.#readRollControls(target);
    if (skill1 === skill2) {
      ui.notifications.warn(game.i18n.localize('SUBSTRATUM.WarnPickTwoSkills'));
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
      tiebreakSkill
    });
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

  static async #onRecordDeath(event, target) {
    const panel = target.closest('.substratum-death-controls');
    const skillKey = panel.querySelector('[data-role="death-skill"]').value;
    await recordTeamDeath(this.actor, skillKey);
  }

  /**
   * The Dead checkbox isn't a document-bound `name="..."` field (unlike the
   * rest of the sheet) so this can route through the same `applyMemberDeath`
   * helper Record Death uses — same Skill step-down, Stress clear, and chat
   * card, using whichever Skill is currently picked in the header's "Skill
   * to Step Down" control (shared across tabs, so it's always available
   * here even while the Members tab is active). Reviving a member
   * (unchecking) is just a flag flip — no consequence, no chat card.
   */
  static async #onToggleMemberDead(event, target) {
    const memberKey = target.dataset.memberKey;
    if (!target.checked) {
      await this.actor.update({ [`system.members.${memberKey}.dead`]: false });
      return;
    }
    const skillKey = this.element.querySelector('[data-role="death-skill"]').value;
    await applyMemberDeath(this.actor, memberKey, skillKey);
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
