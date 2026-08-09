/**
 * Substratum Protocol system entry point.
 * Document classes, DataModels, and sheets are registered here as they're built.
 */
import ScientistData from './data/actor-scientist.mjs';
import TeamData from './data/actor-team.mjs';
import GearData from './data/item-gear.mjs';
import ScientistSheet from './sheets/actor-sheet-scientist.mjs';

Hooks.once('init', () => {
  console.log('Substratum Protocol | Initializing system');

  CONFIG.Actor.dataModels = {
    scientist: ScientistData,
    team: TeamData
  };
  CONFIG.Item.dataModels = {
    gear: GearData
  };

  const { Actors } = foundry.documents.collections;
  Actors.unregisterSheet('core', foundry.appv1.sheets.ActorSheet);
  Actors.registerSheet('substratum-protocol', ScientistSheet, {
    types: ['scientist'],
    makeDefault: true
  });
});
