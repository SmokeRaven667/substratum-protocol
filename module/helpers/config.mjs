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
  teamDefaults: { stressCapacity: 4 },

  // Flag scope used to tag the world-level deck/discard Cards documents and
  // each actor's personal hand, so they can be found again instead of
  // relying on (renameable) document names.
  cardFlagScope: 'substratum-protocol',

  // Standard 52-card deck, no jokers. Ace low (1) through King (13), per
  // the Skill Check rule (01-rulebook-digest.md).
  cardSuits: [
    { key: 'spades', label: 'SUBSTRATUM.SuitSpades' },
    { key: 'hearts', label: 'SUBSTRATUM.SuitHearts' },
    { key: 'diamonds', label: 'SUBSTRATUM.SuitDiamonds' },
    { key: 'clubs', label: 'SUBSTRATUM.SuitClubs' }
  ],
  cardRanks: [
    { value: 1, label: 'SUBSTRATUM.RankAce' },
    { value: 2, label: 'SUBSTRATUM.Rank2' },
    { value: 3, label: 'SUBSTRATUM.Rank3' },
    { value: 4, label: 'SUBSTRATUM.Rank4' },
    { value: 5, label: 'SUBSTRATUM.Rank5' },
    { value: 6, label: 'SUBSTRATUM.Rank6' },
    { value: 7, label: 'SUBSTRATUM.Rank7' },
    { value: 8, label: 'SUBSTRATUM.Rank8' },
    { value: 9, label: 'SUBSTRATUM.Rank9' },
    { value: 10, label: 'SUBSTRATUM.Rank10' },
    { value: 11, label: 'SUBSTRATUM.RankJack' },
    { value: 12, label: 'SUBSTRATUM.RankQueen' },
    { value: 13, label: 'SUBSTRATUM.RankKing' }
  ]
};
