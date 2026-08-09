/**
 * Shared game constants for Substratum Protocol.
 * Values are pulled from 01-rulebook-digest.md — do not hardcode these
 * elsewhere (data models, sheets, dice logic all reference this object).
 */
export const SUBSTRATUM = {
  skills: {
    make: { label: 'SUBSTRATUM.SkillMake' },
    break: { label: 'SUBSTRATUM.SkillBreak' },
    dash: { label: 'SUBSTRATUM.SkillDash' },
    evade: { label: 'SUBSTRATUM.SkillEvade' },
    think: { label: 'SUBSTRATUM.SkillThink' },
    sway: { label: 'SUBSTRATUM.SkillSway' }
  },

  // Normal Skill die step chain (both max and current dice live on this).
  dieChain: ['d4', 'd6', 'd8', 'd10', 'd12'],

  // Sub-chain only reachable by current dice at the "Beyond the Horizon"
  // Anomaly Influence tier (8+ Stress) — d4 -> d2 -> d0.
  dieChainBeyondHorizon: ['d0', 'd2'],

  // Anomaly Influence tiers, derived from current Stress. Not stored on the
  // actor directly — computed in ScientistData#prepareDerivedData().
  anomalyInfluenceTiers: [
    { min: 0, max: 2, key: 'resistant', label: 'SUBSTRATUM.AnomalyResistant', skillPenalty: 0 },
    { min: 3, max: 4, key: 'thrumming', label: 'SUBSTRATUM.AnomalyThrumming', skillPenalty: -1 },
    { min: 5, max: 7, key: 'fragile', label: 'SUBSTRATUM.AnomalyFragile', skillPenalty: -2 },
    { min: 8, max: Infinity, key: 'beyond', label: 'SUBSTRATUM.AnomalyBeyond', skillPenalty: -2 }
  ],

  storageUnitSlots: 3,

  scientistDefaults: { stressCapacity: 8 },
  teamDefaults: { stressCapacity: 4 }
};
