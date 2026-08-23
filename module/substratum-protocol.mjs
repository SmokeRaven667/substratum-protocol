/**
 * Substratum Protocol system entry point.
 * Document classes, DataModels, and sheets are registered here as they're built.
 */
import ScientistData from './data/actor-scientist.mjs';
import TeamData from './data/actor-team.mjs';
import HazardData from './data/actor-hazard.mjs';
import GearData from './data/item-gear.mjs';
import ClueData from './data/item-clue.mjs';
import ScientistSheet from './sheets/actor-sheet-scientist.mjs';
import TeamSheet from './sheets/actor-sheet-team.mjs';
import HazardSheet from './sheets/actor-sheet-hazard.mjs';
import GearSheet from './sheets/item-sheet-gear.mjs';
import ClueSheet from './sheets/item-sheet-clue.mjs';

Hooks.once('init', () => {
  console.log('Substratum Protocol | Initializing system');

  CONFIG.Actor.dataModels = {
    scientist: ScientistData,
    team: TeamData,
    hazard: HazardData
  };
  CONFIG.Item.dataModels = {
    gear: GearData,
    clue: ClueData
  };

  const { Actors, Items } = foundry.documents.collections;
  Actors.unregisterSheet('core', foundry.appv1.sheets.ActorSheet);
  Actors.registerSheet('substratum-protocol', ScientistSheet, {
    types: ['scientist'],
    makeDefault: true
  });
  Actors.registerSheet('substratum-protocol', TeamSheet, {
    types: ['team'],
    makeDefault: true
  });
  Actors.registerSheet('substratum-protocol', HazardSheet, {
    types: ['hazard'],
    makeDefault: true
  });

  Items.unregisterSheet('core', foundry.appv1.sheets.ItemSheet);
  Items.registerSheet('substratum-protocol', GearSheet, {
    types: ['gear'],
    makeDefault: true
  });
  Items.registerSheet('substratum-protocol', ClueSheet, {
    types: ['clue'],
    makeDefault: true
  });
});
